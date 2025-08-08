const PDFDocument = require('pdfkit');

// Try to load latex.js if available; proceed without if not installed
let latexjs = null;
try {
  // eslint-disable-next-line global-require
  latexjs = require('latex.js');
} catch (_) {
  // optional dependency
}

// Basic sanitization to block dangerous LaTeX commands
function isDangerousLatex(src) {
  const forbidden = [
    /\\write18/gi,
    /\\input\s*\{/gi,
    /\\include\s*\{/gi,
    /\\openout/gi,
    /\\read/gi,
    /\\immediate/gi,
  ];
  return forbidden.some((re) => re.test(src));
}

// Very simple LaTeX -> text-ish conversion as a safe fallback
function latexToText(src) {
  let s = src;
  // Remove preamble and environments that don't carry text meaning here
  s = s.replace(/\\usepackage\b[^\n]*\n/gi, '\n');
  s = s.replace(/\\documentclass\b[^\n]*\n/gi, '\n');
  s = s.replace(/\\begin\{document\}/gi, '');
  s = s.replace(/\\end\{document\}/gi, '');
  // Sections
  s = s.replace(/\\section\*?\{([^}]*)\}/g, '\n\n## $1\n');
  s = s.replace(/\\subsection\*?\{([^}]*)\}/g, '\n\n### $1\n');
  // Common inline formatting
  s = s.replace(/\\textbf\{([^}]*)\}/g, '$1');
  s = s.replace(/\\textit\{([^}]*)\}/g, '$1');
  // Itemize
  s = s.replace(/\\begin\{itemize\}/g, '');
  s = s.replace(/\\end\{itemize\}/g, '');
  s = s.replace(/\\item\s*/g, '\n• ');
  // Remove remaining commands
  s = s.replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1');
  s = s.replace(/\\[a-zA-Z@]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, '');
  // Unescape TeX specials
  s = s.replace(/\~\{\}/g, '');
  s = s.replace(/\\%/g, '%');
  // Normalize whitespace
  s = s.replace(/\r\n|\r/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

// Render a simple PDF with headings and bullets using pdfkit
function renderPdfFromText(res, text) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');

  const doc = new PDFDocument({ size: 'LETTER', margin: 56 }); // ~0.78in
  doc.pipe(res);

  doc.font('Helvetica');
  const lines = text.split('\n');
  lines.forEach((line) => {
    if (line.startsWith('## ')) {
      doc.moveDown(0.5).fontSize(18).font('Helvetica-Bold').fillColor('#222').text(line.substring(3));
      doc.moveDown(0.25).fontSize(11).font('Helvetica').fillColor('#000');
    } else if (line.startsWith('### ')) {
      doc.moveDown(0.3).fontSize(14).font('Helvetica-Bold').fillColor('#444').text(line.substring(4));
      doc.moveDown(0.15).fontSize(11).font('Helvetica').fillColor('#000');
    } else if (line.startsWith('• ')) {
      doc.circle(doc.x + 2, doc.y + 6, 1.5).fill('#555');
      doc.fillColor('#000').text('   ' + line.substring(2), { indent: 10, continued: false });
    } else if (line.trim() === '') {
      doc.moveDown(0.35);
    } else {
      doc.fillColor('#000').fontSize(11).text(line);
    }
  });

  doc.end();
}

async function generatePdf(req, res) {
  try {
    const { latexCode } = req.body || {};

    if (!latexCode || typeof latexCode !== 'string' || latexCode.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'latexCode is required' });
    }
    const byteLen = Buffer.byteLength(latexCode, 'utf8');
    if (byteLen > 200 * 1024) {
      return res.status(400).json({ success: false, error: 'LaTeX too large (max 200KB)' });
    }
    if (isDangerousLatex(latexCode)) {
      return res.status(400).json({ success: false, error: 'Blocked potentially dangerous LaTeX commands' });
    }

    // Try latex.js to parse into HTML; fallback to plain text mapping
    let plainText;
    if (latexjs && typeof latexjs.parse === 'function') {
      try {
        const generator = new latexjs.HtmlGenerator({ hyphenate: false });
        latexjs.parse(latexCode, { generator });
        const html = generator && generator.dom ? generator.dom.toString() : '';
        // Strip tags to a readable text; simple approach to keep within constraints
        plainText = html
          .replace(/<\/?(head|style|script)[^>]*>.*?<\/\1>/gis, '')
          .replace(/<\/?br\s*\/?>/gi, '\n')
          .replace(/<\/?p[^>]*>/gi, '\n')
          .replace(/<\/?h[1-6][^>]*>/gi, (m) => (m.startsWith('<\/') ? '\n' : '\n'))
          .replace(/<li[^>]*>/gi, '\n• ')
          .replace(/<\/?ul[^>]*>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      } catch (e) {
        // Fallback to naive mapping
        plainText = latexToText(latexCode);
      }
    } else {
      plainText = latexToText(latexCode);
    }

    return renderPdfFromText(res, plainText);
  } catch (err) {
    console.error('Local PDF generation error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: 'Failed to generate PDF' });
    }
  }
}

module.exports = { generatePdf };
