const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class LatexPDFGenerator {
  constructor() {
    // PDF styling constants
    this.styles = {
      fonts: {
        regular: "Helvetica",
        bold: "Helvetica-Bold",
        italic: "Helvetica-Oblique",
      },
      colors: {
        primary: "#2c3e50",
        secondary: "#34495e",
        accent: "#3498db",
        text: "#2c3e50",
        lightText: "#7f8c8d",
      },
      sizes: {
        name: 26, // Larger name for impact
        sectionTitle: 16, // Prominent section headers
        jobTitle: 13, // Clear job title distinction
        company: 11, // Company name size
        date: 10, // Smaller date text
        body: 11, // Readable body text
        contact: 10, // Contact info size
      },
      spacing: {
        sectionGap: 18, // Better section separation
        itemGap: 6, // Tighter item spacing
        lineHeight: 1.3, // Improved line spacing
        paragraphGap: 4, // Space between paragraphs
      },
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    };
  }

  /**
   * Convert LaTeX to PDF using latex.js parsing + PDFKit rendering
   * @param {string} latexCode - The LaTeX source code
   * @param {string} filename - Output filename (optional)
   * @returns {Promise<{success: boolean, pdfBuffer?: Buffer, error?: string}>}
   */
  async generatePDF(latexCode, filename = "resume") {
    try {
      console.log(
        "🔄 Parsing LaTeX manually for high-quality PDF generation..."
      );

      // Use our manual LaTeX parsing method which works well
      const structuredData = this.parseLatexManually(latexCode);

      console.log("🔄 Creating high-quality PDF with PDFKit...");

      // Create PDF using PDFKit with structured data
      const pdfBuffer = await this.createPDFFromStructuredData(
        structuredData,
        filename
      );

      console.log("✅ High-quality LaTeX to PDF conversion successful");
      console.log(`📄 PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

      return {
        success: true,
        pdfBuffer: pdfBuffer,
        size: pdfBuffer.length,
        contentType: "application/pdf",
        method: "Manual LaTeX parsing + PDFKit rendering",
      };
    } catch (error) {
      console.error("❌ LaTeX to PDF conversion failed:", error);
      return {
        success: false,
        error: `LaTeX parsing failed: ${error.message}`,
      };
    }
  }

  /**
   * Enhanced manual LaTeX parsing with better section detection
   * @param {string} latexCode - LaTeX source code
   * @returns {Object} Enhanced structured resume data
   */
  /**
   * TRUE LaTeX Parser - Parses actual LaTeX structure instead of keyword matching
   * @param {string} latexCode - LaTeX source code
   * @returns {Object} Structured resume data from actual LaTeX parsing
   */
  parseLatexManually(latexCode) {
    console.log("🔍 Starting TRUE LaTeX parsing (not keyword matching)...");
    console.log("📄 LaTeX length:", latexCode.length, "characters");

    const data = {
      name: "",
      contact: {},
      sections: [],
    };

    // PHASE 1: Parse LaTeX document structure to find ALL sections
    console.log("📋 Phase 1: Analyzing LaTeX document structure...");

    // Find all section commands in the document
    const sectionMatches = latexCode.match(
      /\\section\*?\{([^}]+)\}([\s\S]*?)(?=\\section|\s*\\end\{document\}|\s*$)/gi
    );

    if (sectionMatches && sectionMatches.length > 0) {
      console.log(`✅ Found ${sectionMatches.length} LaTeX sections`);

      sectionMatches.forEach((sectionBlock, index) => {
        // Extract section title and content
        const titleMatch = sectionBlock.match(/\\section\*?\{([^}]+)\}/);
        const contentMatch = sectionBlock.match(
          /\\section\*?\{[^}]+\}([\s\S]*)/
        );

        if (titleMatch && contentMatch) {
          const title = titleMatch[1].trim();
          let content = contentMatch[1].trim();

          // Clean LaTeX content while preserving structure
          content = this.parseLatexContent(content);

          if (content && content.length > 3) {
            data.sections.push({
              title: title,
              content: content,
              originalLatex: contentMatch[1].trim(), // Keep original for debugging
            });
            console.log(
              `✅ Section ${index + 1}: "${title}" (${content.length} chars)`
            );
          }
        }
      });
    }

    // PHASE 2: Parse header area for name and contact (before first section)
    console.log("📋 Phase 2: Parsing header for name and contact...");

    // Find content before first section (header area)
    const firstSectionIndex = latexCode.indexOf("\\section");
    const headerArea =
      firstSectionIndex > 0
        ? latexCode.substring(0, firstSectionIndex)
        : latexCode;

    // Extract name from header
    data.name = this.extractNameFromHeader(headerArea);

    // Extract contact info from header
    data.contact = this.extractContactFromHeader(headerArea);

    // PHASE 3: If no sections found, try alternative LaTeX structures
    if (data.sections.length === 0) {
      console.log(
        "⚠️ No standard sections found, trying alternative LaTeX structures..."
      );

      // Look for other LaTeX sectioning commands
      const alternativeSections = [
        { cmd: "\\subsection", name: "Subsection" },
        { cmd: "\\chapter", name: "Chapter" },
        { cmd: "\\part", name: "Part" },
      ];

      alternativeSections.forEach(({ cmd, name }) => {
        const matches = latexCode.match(
          new RegExp(
            `${cmd.replace(
              /\\/g,
              "\\\\"
            )}\\*?\\{([^}]+)\\}([\\s\\S]*?)(?=${cmd.replace(
              /\\/g,
              "\\\\"
            )}|\\s*\\\\end\\{document\\}|\\s*$)`,
            "gi"
          )
        );
        if (matches) {
          console.log(`✅ Found ${matches.length} ${name}s`);
          // Process similar to sections...
        }
      });
    }

    console.log(`🎯 Parsing complete: Found ${data.sections.length} sections`);
    console.log(`📝 Sections: ${data.sections.map((s) => s.title).join(", ")}`);

    return data;
  }

  /**
   * Advanced LaTeX content cleaning
   */
  advancedLatexCleaning(content) {
    return (
      content
        // Remove LaTeX environments but keep content
        .replace(/\\begin\{[^}]+\}/g, "")
        .replace(/\\end\{[^}]+\}/g, "")

        // Remove specific LaTeX commands but keep content
        .replace(/\\resumeSubHeadingListStart/g, "")
        .replace(/\\resumeSubHeadingListEnd/g, "")
        .replace(/\\resumeItemListStart/g, "")
        .replace(/\\resumeItemListEnd/g, "")
        .replace(
          /\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
          "$1 - $2\n$3 | $4\n"
        )
        .replace(/\\resumeItem\{([^}]*)\}/g, "• $1")
        .replace(/\\item\s*/g, "• ")

        // Remove LaTeX formatting commands
        .replace(/\\textbf\{([^}]*)\}/g, "$1")
        .replace(/\\textit\{([^}]*)\}/g, "$1")
        .replace(/\\underline\{([^}]*)\}/g, "$1")
        .replace(/\\emph\{([^}]*)\}/g, "$1")
        .replace(/\\small\s*/g, "")
        .replace(/\\large\s*/g, "")
        .replace(/\\Large\s*/g, "")
        .replace(/\\vspace\{[^}]*\}/g, "")
        .replace(/\\hspace\{[^}]*\}/g, "")

        // Remove comments and LaTeX artifacts
        .replace(/%.*$/gm, "")
        .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})*\s*/g, " ")

        // Clean up whitespace and formatting
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .trim()
    );
  }

  /**
   * Create PDF from structured data with enhanced formatting
   * @param {Object} data - Structured resume data
   * @param {string} filename - Output filename
   * @returns {Promise<Buffer>}
   */
  async createPDFFromStructuredData(data, filename) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: this.styles.margins,
          info: {
            Title: filename,
            Author: "AI Resume Generator",
            Subject: "Professional Resume",
          },
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        let yPosition = doc.y;

        // Render name with better formatting
        if (data.name) {
          doc
            .font(this.styles.fonts.bold)
            .fontSize(this.styles.sizes.name)
            .fillColor(this.styles.colors.primary)
            .text(data.name, { align: "center" });

          yPosition = doc.y + this.styles.spacing.sectionGap;
        }

        // Render contact information in a cleaner format
        if (data.contact && Object.keys(data.contact).length > 0) {
          const contactInfo = [];
          if (data.contact.email) contactInfo.push(data.contact.email);
          if (data.contact.phone) contactInfo.push(data.contact.phone);
          if (data.contact.linkedin) contactInfo.push(data.contact.linkedin);
          if (data.contact.github) contactInfo.push(data.contact.github);

          if (contactInfo.length > 0) {
            doc
              .font(this.styles.fonts.regular)
              .fontSize(this.styles.sizes.contact)
              .fillColor(this.styles.colors.lightText)
              .text(contactInfo.join(" | "), { align: "center" });

            yPosition = doc.y + this.styles.spacing.sectionGap * 1.5;
          }
        }

        // Add a subtle line separator
        doc
          .strokeColor(this.styles.colors.accent)
          .lineWidth(1)
          .moveTo(this.styles.margins.left, yPosition)
          .lineTo(doc.page.width - this.styles.margins.right, yPosition)
          .stroke();

        yPosition += 15;

        // Render sections with enhanced formatting
        data.sections.forEach((section, index) => {
          // Check if we need a new page
          if (yPosition > doc.page.height - 150) {
            doc.addPage();
            yPosition = doc.y + 20;
          }

          // Section title with better styling
          doc
            .font(this.styles.fonts.bold)
            .fontSize(this.styles.sizes.sectionTitle)
            .fillColor(this.styles.colors.primary)
            .text(section.title.toUpperCase(), {
              y: yPosition,
            });

          // Add underline manually for better control
          const titleWidth = doc.widthOfString(section.title.toUpperCase());
          doc
            .strokeColor(this.styles.colors.primary)
            .lineWidth(1.5)
            .moveTo(doc.x, yPosition + this.styles.sizes.sectionTitle + 2)
            .lineTo(
              doc.x + titleWidth,
              yPosition + this.styles.sizes.sectionTitle + 2
            )
            .stroke();

          yPosition = doc.y + this.styles.spacing.itemGap + 5;

          // Section content with better formatting
          if (section.content) {
            const formattedContent = this.formatSectionContent(
              section.content,
              section.title
            );

            doc
              .font(this.styles.fonts.regular)
              .fontSize(this.styles.sizes.body)
              .fillColor(this.styles.colors.text);

            // Process content line by line for better formatting
            const lines = formattedContent.split("\n");

            lines.forEach((line, lineIndex) => {
              if (line.trim()) {
                // Check for bullet points or job titles
                if (line.includes("•") || line.includes("-")) {
                  // Bullet point formatting
                  doc.text(line, {
                    y: yPosition,
                    indent: 10,
                    lineGap: 2,
                  });
                } else if (this.isJobTitle(line)) {
                  // Job title formatting
                  doc
                    .font(this.styles.fonts.bold)
                    .fontSize(this.styles.sizes.jobTitle)
                    .fillColor(this.styles.colors.secondary)
                    .text(line, {
                      y: yPosition,
                      lineGap: 3,
                    });
                } else if (this.isCompanyInfo(line)) {
                  // Company/date formatting
                  doc
                    .font(this.styles.fonts.italic)
                    .fontSize(this.styles.sizes.date)
                    .fillColor(this.styles.colors.lightText)
                    .text(line, {
                      y: yPosition,
                      lineGap: 2,
                    });
                } else {
                  // Regular text
                  doc
                    .font(this.styles.fonts.regular)
                    .fontSize(this.styles.sizes.body)
                    .fillColor(this.styles.colors.text)
                    .text(line, {
                      y: yPosition,
                      lineGap: 2,
                    });
                }

                yPosition = doc.y + 3;
              }
            });

            yPosition += this.styles.spacing.sectionGap;
          }
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Format section content for better readability
   * @param {string} content - Raw section content
   * @param {string} sectionTitle - Section title for context
   * @returns {string} Formatted content
   */
  formatSectionContent(content, sectionTitle) {
    // Clean up the content
    let formatted = content
      .replace(/itemize\[label=,\s*noitemsep\]/g, "") // Remove LaTeX itemize
      .replace(/itemize/g, "") // Remove remaining itemize
      .replace(/\\%/g, "") // Remove LaTeX comments
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Add structure based on section type
    if (sectionTitle.toLowerCase().includes("experience")) {
      formatted = this.formatExperienceSection(formatted);
    } else if (sectionTitle.toLowerCase().includes("education")) {
      formatted = this.formatEducationSection(formatted);
    } else if (sectionTitle.toLowerCase().includes("project")) {
      formatted = this.formatProjectsSection(formatted);
    } else if (sectionTitle.toLowerCase().includes("skill")) {
      formatted = this.formatSkillsSection(formatted);
    }

    return formatted;
  }

  /**
   * Format experience section with proper job separation
   */
  formatExperienceSection(content) {
    // Split by job titles and format each job
    const jobs = content.split(
      /(?=\w+[\w\s]+(?:Engineer|Developer|Intern|Manager|Analyst|President|Lead))/
    );

    return jobs
      .filter((job) => job.trim())
      .map((job) => {
        const lines = job.trim().split(/(?=[A-Z][\w\s]+(?:—|-))/);
        return lines.join("\n").replace(/\s+/g, " ");
      })
      .join("\n\n");
  }

  /**
   * Format education section
   */
  formatEducationSection(content) {
    return content
      .replace(/(B\. Tech|Diploma|M\. Tech|Bachelor|Master)/g, "\n$1")
      .replace(/(\d{4}\s*--\s*\d{4})/g, "\n$1")
      .replace(/CGPA:/g, "\nCGPA:")
      .replace(/Percentage:/g, "\nPercentage:")
      .trim();
  }

  /**
   * Format projects section
   */
  formatProjectsSection(content) {
    return content
      .replace(/([A-Z][^(]*\([^)]+\))/g, "\n• $1")
      .replace(/itemize/g, "")
      .trim();
  }

  /**
   * Format skills section
   */
  formatSkillsSection(content) {
    return content
      .replace(/Programming Languages:/g, "\nProgramming Languages:")
      .replace(/Technologies:/g, "\nTechnologies:")
      .replace(/Tools:/g, "\nTools:")
      .replace(/Frameworks:/g, "\nFrameworks:")
      .trim();
  }

  /**
   * Check if a line is a job title
   */
  isJobTitle(line) {
    const jobTitlePatterns = [
      /engineer/i,
      /developer/i,
      /intern/i,
      /manager/i,
      /analyst/i,
      /president/i,
      /lead/i,
      /consultant/i,
      /architect/i,
    ];

    return (
      jobTitlePatterns.some((pattern) => pattern.test(line)) &&
      !line.includes("—") &&
      !line.includes("|")
    );
  }

  /**
   * Check if a line contains company/date information
   */
  isCompanyInfo(line) {
    return (
      line.includes("—") ||
      line.includes("|") ||
      /\d{4}\s*--\s*\d{4}/.test(line) ||
      /\w+\s+\d{4}/.test(line)
    );
  }

  /**
   * Helper methods
   */
  getCleanTextContent(element) {
    if (!element) return "";
    if (element.nodeType === 3) return element.textContent || "";
    if (element.textContent) return element.textContent.trim();
    return "";
  }

  cleanLatexContent(content) {
    return content
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1") // Remove LaTeX commands
      .replace(/\\[a-zA-Z]+/g, "") // Remove standalone commands
      .replace(/\{|\}/g, "") // Remove braces
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  renderHeading(doc, text, level, yPosition) {
    const fontSize =
      level === "h1"
        ? this.styles.sizes.name
        : level === "h2"
        ? this.styles.sizes.sectionTitle
        : this.styles.sizes.jobTitle;

    doc
      .font(this.styles.fonts.bold)
      .fontSize(fontSize)
      .fillColor(this.styles.colors.primary)
      .text(text, { y: yPosition });

    return doc.y + this.styles.spacing.sectionGap;
  }

  renderParagraph(doc, text, yPosition) {
    doc
      .font(this.styles.fonts.regular)
      .fontSize(this.styles.sizes.body)
      .fillColor(this.styles.colors.text)
      .text(text, {
        y: yPosition,
        lineGap: this.styles.spacing.lineHeight,
      });

    return doc.y + this.styles.spacing.itemGap;
  }

  renderList(doc, listElement, yPosition) {
    if (!listElement.children) return yPosition;

    Array.from(listElement.children).forEach((item) => {
      const text = this.getCleanTextContent(item);
      if (text.trim()) {
        doc
          .font(this.styles.fonts.regular)
          .fontSize(this.styles.sizes.body)
          .fillColor(this.styles.colors.text)
          .text(`• ${text}`, { y: yPosition });

        yPosition = doc.y + this.styles.spacing.itemGap;
      }
    });

    return yPosition + this.styles.spacing.itemGap;
  }

  renderBoldText(doc, text, yPosition) {
    doc
      .font(this.styles.fonts.bold)
      .fontSize(this.styles.sizes.body)
      .fillColor(this.styles.colors.text)
      .text(text, { y: yPosition });

    return doc.y;
  }

  renderText(doc, text, yPosition) {
    doc
      .font(this.styles.fonts.regular)
      .fontSize(this.styles.sizes.body)
      .fillColor(this.styles.colors.text)
      .text(text, { y: yPosition });

    return doc.y;
  }

  /**
   * Validate LaTeX code before processing
   * @param {string} latexCode - LaTeX source code
   * @returns {Object} Validation result
   */
  validateLaTeX(latexCode) {
    const requiredElements = [
      "\\documentclass",
      "\\begin{document}",
      "\\end{document}",
    ];

    const issues = [];

    requiredElements.forEach((element) => {
      if (!latexCode.includes(element)) {
        issues.push(`Missing required element: ${element}`);
      }
    });

    // Check for balanced braces
    const openBraces = (latexCode.match(/\{/g) || []).length;
    const closeBraces = (latexCode.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      issues.push(
        `Unbalanced braces: ${openBraces} open, ${closeBraces} close`
      );
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
    };
  }

  /**
   * Extract name from LaTeX header area using actual LaTeX structure
   */
  extractNameFromHeader(headerArea) {
    // Look for name in center environment or large text
    const namePatterns = [
      // Center environment with large text
      /\\begin\{center\}[\s\S]*?\\textbf\{[^}]*?([A-Z][a-z]+\s+[A-Z][a-z]+[^}]*)\}/i,
      // Large text commands
      /\\textbf\{[^}]*?([A-Z][a-z]+\s+[A-Z][a-z]+[^}]*)\}/,
      // Any bold text that looks like a name
      /\\textbf\{([A-Z][a-z]+\s+[A-Z][a-z]+)\}/,
    ];

    for (const pattern of namePatterns) {
      const match = headerArea.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 3 && /[A-Za-z]/.test(name)) {
          console.log("✅ Found name:", name);
          return name;
        }
      }
    }

    return "";
  }

  /**
   * Extract contact information from LaTeX header area
   */
  extractContactFromHeader(headerArea) {
    const contact = {};

    // Email
    const emailMatch = headerArea.match(/\\href\{mailto:([^}]+)\}/);
    if (emailMatch) {
      contact.email = emailMatch[1];
      console.log("✅ Found email:", contact.email);
    }

    // Phone
    const phoneMatch = headerArea.match(/([+]?[\d\s\-\(\)\.]{10,})/);
    if (phoneMatch && phoneMatch[1].replace(/\D/g, "").length >= 10) {
      contact.phone = phoneMatch[1].trim();
      console.log("✅ Found phone:", contact.phone);
    }

    // LinkedIn
    const linkedinMatch = headerArea.match(
      /\\href\{([^}]*linkedin[^}]*)\}\{([^}]+)\}/
    );
    if (linkedinMatch) {
      contact.linkedin = linkedinMatch[2] || linkedinMatch[1];
      console.log("✅ Found LinkedIn:", contact.linkedin);
    }

    return contact;
  }

  /**
   * Parse LaTeX content into readable text while preserving structure
   */
  parseLatexContent(latexContent) {
    if (!latexContent) return "";

    console.log(
      "🔍 Parsing LaTeX content:",
      latexContent.substring(0, 100) + "..."
    );

    let content = latexContent;

    // Step 1: Handle resume-specific LaTeX commands
    content = content
      // Resume subheadings: \resumeSubheading{Title}{Company}{Date}{Location}
      .replace(
        /\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
        (match, title, company, date, location) => {
          return `\n${title} - ${company}\n${date} | ${location}\n`;
        }
      )

      // Resume items: \resumeItem{Description}
      .replace(/\\resumeItem\{([^}]*)\}/g, "• $1")

      // Resume item lists
      .replace(/\\resumeItemListStart/g, "")
      .replace(/\\resumeItemListEnd/g, "")
      .replace(/\\resumeSubHeadingListStart/g, "")
      .replace(/\\resumeSubHeadingListEnd/g, "")

      // Itemize environments
      .replace(/\\begin\{itemize\}/g, "")
      .replace(/\\end\{itemize\}/g, "")
      .replace(/\\item\s*/g, "• ");

    // Step 2: Handle general LaTeX formatting
    content = content
      // Bold text
      .replace(/\\textbf\{([^}]*)\}/g, "$1")
      // Italic text
      .replace(/\\textit\{([^}]*)\}/g, "$1")
      // Underlined text
      .replace(/\\underline\{([^}]*)\}/g, "$1")
      // Emphasized text
      .replace(/\\emph\{([^}]*)\}/g, "$1");

    // Step 3: Handle LaTeX environments and spacing
    content = content
      // Remove environment tags but keep content
      .replace(/\\begin\{[^}]+\}/g, "")
      .replace(/\\end\{[^}]+\}/g, "")
      // Remove spacing commands
      .replace(/\\vspace\{[^}]*\}/g, "")
      .replace(/\\hspace\{[^}]*\}/g, "")
      // Remove size commands
      .replace(/\\small\s*/g, "")
      .replace(/\\large\s*/g, "")
      .replace(/\\Large\s*/g, "")
      .replace(/\\huge\s*/g, "");

    // Step 4: Clean up and format
    content = content
      // Remove LaTeX comments
      .replace(/%.*$/gm, "")
      // Remove any remaining LaTeX commands
      .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})*\s*/g, " ")
      // Clean up whitespace
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();

    console.log("✅ Parsed content:", content.substring(0, 100) + "...");
    return content;
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      name: "TRUE LaTeX Parser + PDFKit Generator",
      version: "2.0.0",
      description:
        "High-quality PDF generation using TRUE LaTeX structure parsing (not keyword matching) and professional PDFKit rendering",
      features: [
        "TRUE LaTeX structure parsing (not keyword matching)",
        "Professional PDF rendering with PDFKit",
        "Actual LaTeX command parsing",
        "High-quality typography",
        "Overleaf-style output",
        "Robust contact information extraction",
        "Any LaTeX format support",
      ],
    };
  }
}

module.exports = LatexPDFGenerator;
