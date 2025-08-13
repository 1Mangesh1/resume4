const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");
const fetch = require("node-fetch");

class AdvancedLatexService {
  constructor() {
    this.methods = {
      LOCAL_DOCKER: "local_docker",
      LOCAL_BINARY: "local_binary",
      KATEX_HTML: "katex_html",
      ENHANCED_MANUAL: "enhanced_manual",
      TEXLIVE_API: "texlive_api",
    };

    this.fallbackOrder = [
      this.methods.LOCAL_DOCKER,
      this.methods.LOCAL_BINARY,
      this.methods.KATEX_HTML,
      this.methods.ENHANCED_MANUAL,
      this.methods.TEXLIVE_API,
    ];
  }

  /**
   * Main compilation method with intelligent fallbacks
   */
  async compileToPDF(latexCode, filename = "resume", preferredMethod = null) {
    console.log("🔄 Starting advanced LaTeX compilation...");

    const methods = preferredMethod
      ? [
          preferredMethod,
          ...this.fallbackOrder.filter((m) => m !== preferredMethod),
        ]
      : this.fallbackOrder;

    for (const method of methods) {
      try {
        console.log(`🔄 Trying method: ${method}`);
        const result = await this.compileWithMethod(
          method,
          latexCode,
          filename
        );

        if (result.success) {
          console.log(`✅ Success with method: ${method}`);
          return { ...result, method };
        }
      } catch (error) {
        console.log(`❌ Method ${method} failed:`, error.message);
        continue;
      }
    }

    throw new Error("All LaTeX compilation methods failed");
  }

  /**
   * Method 1: Docker-based LaTeX compilation (Best Quality)
   */
  async compileWithDocker(latexCode, filename) {
    try {
      // Check if Docker is available
      await this.checkDockerAvailability();

      // Create temporary files
      const tempDir = path.join(__dirname, "../temp");
      await fs.mkdir(tempDir, { recursive: true });

      const texFile = path.join(tempDir, `${filename}.tex`);
      const pdfFile = path.join(tempDir, `${filename}.pdf`);

      await fs.writeFile(texFile, latexCode);

      // Run LaTeX compilation in Docker
      const dockerResult = await this.runDockerLatex(tempDir, filename);

      if (dockerResult.success) {
        const pdfBuffer = await fs.readFile(pdfFile);

        // Clean up
        await this.cleanupTempFiles(tempDir, filename);

        return {
          success: true,
          pdfBuffer,
          size: pdfBuffer.length,
          contentType: "application/pdf",
          quality: "overleaf-equivalent",
        };
      }

      throw new Error(dockerResult.error);
    } catch (error) {
      throw new Error(`Docker compilation failed: ${error.message}`);
    }
  }

  /**
   * Method 2: Local LaTeX binary (if installed)
   */
  async compileWithLocalBinary(latexCode, filename) {
    try {
      // Check if pdflatex is available
      await this.checkLocalLatex();

      const tempDir = path.join(__dirname, "../temp");
      await fs.mkdir(tempDir, { recursive: true });

      const texFile = path.join(tempDir, `${filename}.tex`);
      await fs.writeFile(texFile, latexCode);

      // Run pdflatex
      const result = await this.runLocalLatex(tempDir, filename);

      if (result.success) {
        const pdfFile = path.join(tempDir, `${filename}.pdf`);
        const pdfBuffer = await fs.readFile(pdfFile);

        await this.cleanupTempFiles(tempDir, filename);

        return {
          success: true,
          pdfBuffer,
          size: pdfBuffer.length,
          contentType: "application/pdf",
          quality: "native-latex",
        };
      }

      throw new Error(result.error);
    } catch (error) {
      throw new Error(`Local LaTeX compilation failed: ${error.message}`);
    }
  }

  /**
   * Method 3: KaTeX + HTML to PDF (Good Quality)
   */
  async compileWithKaTeX(latexCode, filename) {
    try {
      // Check if required packages are available
      let katex, puppeteer;

      try {
        katex = require("katex");
      } catch (e) {
        throw new Error("KaTeX package not installed. Run: npm install katex");
      }

      try {
        puppeteer = require("puppeteer-core");
      } catch (e) {
        throw new Error(
          "Puppeteer package not installed. Run: npm install puppeteer-core"
        );
      }

      // Convert LaTeX to HTML using KaTeX
      const htmlContent = this.convertLatexToHTML(latexCode, katex);

      // Convert HTML to PDF using Puppeteer
      let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

      // Try to find Chrome/Chromium executable
      if (!executablePath) {
        const { spawn } = require("child_process");
        const possiblePaths = [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
          "/usr/bin/google-chrome",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        ];

        for (const path of possiblePaths) {
          try {
            require("fs").accessSync(path);
            executablePath = path;
            break;
          } catch (e) {
            // Continue to next path
          }
        }
      }

      if (!executablePath) {
        throw new Error(
          "Chrome/Chromium executable not found. Please install Chrome or set PUPPETEER_EXECUTABLE_PATH environment variable."
        );
      }

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        executablePath: executablePath,
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "1in", bottom: "1in", left: "1in", right: "1in" },
        printBackground: true,
      });

      await browser.close();

      return {
        success: true,
        pdfBuffer,
        size: pdfBuffer.length,
        contentType: "application/pdf",
        quality: "html-rendered",
      };
    } catch (error) {
      throw new Error(`KaTeX compilation failed: ${error.message}`);
    }
  }

  /**
   * Method 4: Enhanced Manual Parser (Current System)
   */
  async compileWithEnhancedManual(latexCode, filename) {
    try {
      const LatexPDFGenerator = require("./latex-pdf-generator");
      const generator = new LatexPDFGenerator();

      const result = await generator.generatePDF(latexCode, filename);

      if (result.success) {
        return {
          ...result,
          quality: "manual-parsed",
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw new Error(`Enhanced manual compilation failed: ${error.message}`);
    }
  }

  /**
   * Method 5: TeXlive.net API (Fallback)
   */
  async compileWithTexliveAPI(latexCode, filename) {
    try {
      const TeXliveService = require("./texlive-service");
      const service = new TeXliveService();

      const result = await service.compileToPDF(latexCode, filename);

      if (result.success) {
        return {
          ...result,
          quality: "api-dependent",
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw new Error(`TeXlive API compilation failed: ${error.message}`);
    }
  }

  // Helper methods
  async compileWithMethod(method, latexCode, filename) {
    // Pre-process LaTeX code to fix common AI-generated issues
    const cleanedLatexCode = this.cleanLatexCode(latexCode);

    switch (method) {
      case this.methods.LOCAL_DOCKER:
        return await this.compileWithDocker(cleanedLatexCode, filename);
      case this.methods.LOCAL_BINARY:
        return await this.compileWithLocalBinary(cleanedLatexCode, filename);
      case this.methods.KATEX_HTML:
        return await this.compileWithKaTeX(cleanedLatexCode, filename);
      case this.methods.ENHANCED_MANUAL:
        return await this.compileWithEnhancedManual(cleanedLatexCode, filename);
      case this.methods.TEXLIVE_API:
        return await this.compileWithTexliveAPI(cleanedLatexCode, filename);
      default:
        throw new Error(`Unknown compilation method: ${method}`);
    }
  }

  /**
   * Clean and fix common LaTeX code issues generated by AI
   */
  cleanLatexCode(latexCode) {
    console.log("🧹 Cleaning LaTeX code for compilation...");

    let cleaned = latexCode;

    // Fix common titlespacing issues
    cleaned = cleaned.replace(
      /\\titlespacing\{\\section\*\}/g,
      "\\titlespacing*{\\section}"
    );
    cleaned = cleaned.replace(
      /\\titlespacing\{\\subsection\*\}/g,
      "\\titlespacing*{\\subsection}"
    );

    // Ensure proper package order
    const packages = [];
    const packageRegex = /\\usepackage(\[[^\]]*\])?\{([^}]+)\}/g;
    let match;

    // Extract all packages
    while ((match = packageRegex.exec(cleaned)) !== null) {
      packages.push(match[0]);
    }

    // Remove all package declarations
    cleaned = cleaned.replace(/\\usepackage(\[[^\]]*\])?\{[^}]+\}\n?/g, "");

    // Add packages in correct order after documentclass
    const documentClassMatch = cleaned.match(/(\\documentclass[^\n]*\n)/);
    if (documentClassMatch && packages.length > 0) {
      const insertPoint =
        documentClassMatch.index + documentClassMatch[1].length;
      const orderedPackages = this.orderPackages(packages);
      cleaned =
        cleaned.slice(0, insertPoint) +
        orderedPackages.join("\n") +
        "\n" +
        cleaned.slice(insertPoint);
    }

    // Fix common geometry issues
    cleaned = cleaned.replace(/\\geometry\{([^}]+)\}/g, (match, params) => {
      // Ensure proper parameter format
      return `\\geometry{${params
        .replace(/\s*=\s*/g, "=")
        .replace(/,\s*/g, ",")}}`;
    });

    // Fix section formatting issues
    cleaned = cleaned.replace(
      /\\section\*\{\\LARGE\s+([^}]+)\}/g,
      "\\section*{\\LARGE $1}"
    );
    cleaned = cleaned.replace(
      /\\section\*\{\\Large\s+([^}]+)\}/g,
      "\\section*{\\Large $1}"
    );

    // Ensure proper header formatting
    cleaned = cleaned.replace(
      /\{\\LARGE\s+\\textbf\{([^}]+)\}\}/g,
      "{\\LARGE \\textbf{$1}}"
    );

    // Fix hfill spacing issues
    cleaned = cleaned.replace(
      /\\textbf\{([^}]+)\}\s*\\hfill\s*([^\\\n]+)/g,
      "\\textbf{$1} \\hfill $2"
    );

    // Ensure proper vspace formatting
    cleaned = cleaned.replace(/\\vspace\{(\d+)pt\}/g, "\\vspace{$1pt}");

    // Fix dash formatting for company-location separator - use proper LaTeX commands
    // Convert any remaining em dashes to \textendash{} for consistent PDF output
    cleaned = cleaned.replace(/—/g, "\\textendash{} ");

    // Convert en dashes to \textendash{}
    cleaned = cleaned.replace(/–/g, "\\textendash{} ");

    // Convert double hyphens to \textendash{}
    cleaned = cleaned.replace(/--/g, "\\textendash{} ");

    // Fix missing backslashes in \textendash{} commands
    cleaned = cleaned.replace(/extendash\{\}/g, "\\textendash{}");

    // Ensure proper spacing around \textendash{}
    cleaned = cleaned.replace(/\\textendash\{\}\s*/g, "\\textendash{} ");

    // Fix any remaining plain hyphens in separators to use \textendash{}
    cleaned = cleaned.replace(
      /([A-Za-z0-9])\s*-\s*([A-Za-z0-9])/g,
      "$1\\textendash{} $2"
    );

    // Fix missing backslashes in \textbf{} commands
    cleaned = cleaned.replace(/textbf\{/g, "\\textbf{");

    // Fix missing backslashes in \href{} commands
    cleaned = cleaned.replace(/href\{/g, "\\href{");

    // Fix missing backslashes in \section{} commands
    cleaned = cleaned.replace(/section\*/g, "\\section*");

    // Fix missing backslashes in \begin{} and \end{} commands
    cleaned = cleaned.replace(/begin\{/g, "\\begin{");
    cleaned = cleaned.replace(/end\{/g, "\\end{");

    // Fix missing backslashes in \item commands
    cleaned = cleaned.replace(/item /g, "\\item ");

    // Fix missing backslashes in \vspace{} commands
    cleaned = cleaned.replace(/vspace\{/g, "\\vspace{");

    // Fix missing backslashes in \setlist commands
    cleaned = cleaned.replace(/setlist\[/g, "\\setlist[");

    // Fix double backslashes that might have been created
    cleaned = cleaned.replace(/\\\\\\/g, "\\\\");
    cleaned = cleaned.replace(/\\\\\s*\\\\/g, "\\\\");

    // Clean up any remaining double backslashes
    cleaned = cleaned.replace(/\\\\+/g, "\\\\");

    // Fix broken commands caused by double backslashes
    cleaned = cleaned.replace(/\\\\b/g, "\\b");
    cleaned = cleaned.replace(/\\\\e/g, "\\e");
    cleaned = cleaned.replace(/\\\\i/g, "\\i");
    cleaned = cleaned.replace(/\\\\s/g, "\\s");
    cleaned = cleaned.replace(/\\\\t/g, "\\t");
    cleaned = cleaned.replace(/\\\\d/g, "\\d");
    cleaned = cleaned.replace(/\\\\c/g, "\\c");
    cleaned = cleaned.replace(/\\\\l/g, "\\l");
    cleaned = cleaned.replace(/\\\\a/g, "\\a");
    cleaned = cleaned.replace(/\\\\n/g, "\\n");
    cleaned = cleaned.replace(/\\\\m/g, "\\m");
    cleaned = cleaned.replace(/\\\\u/g, "\\u");
    cleaned = cleaned.replace(/\\\\p/g, "\\p");
    cleaned = cleaned.replace(/\\\\h/g, "\\h");
    cleaned = cleaned.replace(/\\\\f/g, "\\f");
    cleaned = cleaned.replace(/\\\\r/g, "\\r");
    cleaned = cleaned.replace(/\\\\o/g, "\\o");
    cleaned = cleaned.replace(/\\\\v/g, "\\v");
    cleaned = cleaned.replace(/\\\\w/g, "\\w");
    cleaned = cleaned.replace(/\\\\k/g, "\\k");
    cleaned = cleaned.replace(/\\\\x/g, "\\x");
    cleaned = cleaned.replace(/\\\\y/g, "\\y");
    cleaned = cleaned.replace(/\\\\z/g, "\\z");

    console.log("✅ LaTeX code cleaned");
    return cleaned;
  }

  /**
   * Order packages to avoid conflicts
   */
  orderPackages(packages) {
    const packageOrder = [
      "latexsym",
      "fullpage",
      "titlesec",
      "marvosym",
      "color",
      "verbatim",
      "enumitem",
      "hyperref",
      "fancyhdr",
      "babel",
      "tabularx",
      "fontawesome",
      "ragged2e",
      "amsmath",
      "amssymb",
      "geometry",
    ];

    const orderedPackages = [];
    const remainingPackages = [...packages];

    // Add packages in preferred order
    packageOrder.forEach((preferredPkg) => {
      const index = remainingPackages.findIndex((pkg) =>
        pkg.includes(`{${preferredPkg}}`)
      );
      if (index !== -1) {
        orderedPackages.push(remainingPackages.splice(index, 1)[0]);
      }
    });

    // Add any remaining packages
    orderedPackages.push(...remainingPackages);

    return orderedPackages;
  }

  async checkDockerAvailability() {
    return new Promise((resolve, reject) => {
      const docker = spawn("docker", ["--version"]);

      docker.on("close", (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error("Docker not available"));
        }
      });

      docker.on("error", (error) => {
        reject(new Error(`Docker check failed: ${error.message}`));
      });

      // Set timeout for the check
      setTimeout(() => {
        docker.kill();
        reject(new Error("Docker check timeout"));
      }, 5000);
    });
  }

  async checkLocalLatex() {
    return new Promise((resolve, reject) => {
      const latex = spawn("pdflatex", ["--version"]);

      latex.on("close", (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error("pdflatex not available"));
        }
      });

      latex.on("error", (error) => {
        reject(new Error(`pdflatex check failed: ${error.message}`));
      });

      // Set timeout for the check
      setTimeout(() => {
        latex.kill();
        reject(new Error("pdflatex check timeout"));
      }, 5000);
    });
  }

  async runDockerLatex(tempDir, filename) {
    return new Promise((resolve) => {
      const docker = spawn("docker", [
        "run",
        "--rm",
        "-v",
        `${tempDir}:/workspace`,
        "resume4-latex-compiler", // Use our custom built image
        "pdflatex",
        "-interaction=nonstopmode",
        `-output-directory=/workspace`,
        `/workspace/${filename}.tex`,
      ]);

      let output = "";
      docker.stdout.on("data", (data) => (output += data.toString()));
      docker.stderr.on("data", (data) => (output += data.toString()));

      docker.on("close", (code) => {
        resolve({
          success: code === 0,
          error: code !== 0 ? output : null,
        });
      });

      docker.on("error", (error) => {
        resolve({
          success: false,
          error: `Docker execution failed: ${error.message}`,
        });
      });
    });
  }

  async runLocalLatex(tempDir, filename) {
    return new Promise((resolve) => {
      const latex = spawn("pdflatex", [
        "-interaction=nonstopmode",
        `-output-directory=${tempDir}`,
        `${tempDir}/${filename}.tex`,
      ]);

      let output = "";
      latex.stdout.on("data", (data) => (output += data.toString()));
      latex.stderr.on("data", (data) => (output += data.toString()));

      latex.on("close", (code) => {
        resolve({
          success: code === 0,
          error: code !== 0 ? output : null,
        });
      });

      latex.on("error", (error) => {
        resolve({
          success: false,
          error: `pdflatex execution failed: ${error.message}`,
        });
      });
    });
  }

  convertLatexToHTML(latexCode, katex) {
    // Enhanced LaTeX to HTML conversion
    let bodyContent = latexCode
      // Remove document class and begin/end document
      .replace(/\\documentclass.*?\n/g, "")
      .replace(/\\usepackage.*?\n/g, "")
      .replace(/\\begin\{document\}/g, "")
      .replace(/\\end\{document\}/g, "")

      // Convert sections
      .replace(/\\section\*?\{([^}]+)\}/g, "<h2>$1</h2>")
      .replace(/\\subsection\*?\{([^}]+)\}/g, "<h3>$1</h3>")

      // Convert text formatting
      .replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>")
      .replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>")
      .replace(/\\underline\{([^}]+)\}/g, "<u>$1</u>")

      // Convert lists
      .replace(/\\begin\{itemize\}/g, "<ul>")
      .replace(/\\end\{itemize\}/g, "</ul>")
      .replace(/\\item\s*/g, "<li>")

      // Convert resume-specific commands
      .replace(
        /\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
        '<div class="resume-item"><strong>$1</strong> - $2<br><em>$3 | $4</em></div>'
      )
      .replace(/\\resumeItem\{([^}]*)\}/g, "<li>$1</li>")

      // Convert links
      .replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '<a href="$1">$2</a>')

      // Clean up extra whitespace and line breaks
      .replace(/\n\s*\n/g, "</p><p>")
      .replace(/^\s*/, "<p>")
      .replace(/\s*$/, "</p>");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
  <style>
    body { 
      font-family: 'Times New Roman', serif; 
      margin: 1in; 
      font-size: 11pt;
      line-height: 1.2;
      color: #000;
    }
    h2 { 
      font-size: 14pt; 
      font-weight: bold; 
      margin-top: 12pt; 
      margin-bottom: 6pt;
      border-bottom: 1px solid #ccc;
      padding-bottom: 2pt;
    }
    h3 { 
      font-size: 12pt; 
      font-weight: bold; 
      margin-top: 8pt; 
      margin-bottom: 4pt;
    }
    p { 
      margin: 6pt 0; 
    }
    ul { 
      margin: 6pt 0; 
      padding-left: 20pt;
    }
    li { 
      margin: 2pt 0; 
    }
    .resume-item {
      margin: 8pt 0;
      padding: 4pt 0;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    strong {
      font-weight: bold;
    }
    em {
      font-style: italic;
    }
    .header {
      text-align: center;
      margin-bottom: 20pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <!-- Header content will be parsed from LaTeX -->
  </div>
  ${bodyContent}
</body>
</html>`;
  }

  async cleanupTempFiles(tempDir, filename) {
    const extensions = [
      ".tex",
      ".pdf",
      ".log",
      ".aux",
      ".fls",
      ".fdb_latexmk",
      ".out",
      ".toc",
    ];

    for (const ext of extensions) {
      try {
        await fs.unlink(path.join(tempDir, filename + ext));
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get available compilation methods
   */
  async getAvailableMethods() {
    const methods = [];

    // Check Docker
    try {
      await this.checkDockerAvailability();
      methods.push({
        method: this.methods.LOCAL_DOCKER,
        quality: "overleaf-equivalent",
        available: true,
        description: "Full LaTeX compilation using Docker container",
      });
    } catch (e) {
      methods.push({
        method: this.methods.LOCAL_DOCKER,
        quality: "overleaf-equivalent",
        available: false,
        reason: "Docker not installed",
        description: "Install Docker to enable this method",
      });
    }

    // Check Local LaTeX
    try {
      await this.checkLocalLatex();
      methods.push({
        method: this.methods.LOCAL_BINARY,
        quality: "native-latex",
        available: true,
        description: "Native pdflatex compilation",
      });
    } catch (e) {
      methods.push({
        method: this.methods.LOCAL_BINARY,
        quality: "native-latex",
        available: false,
        reason: "pdflatex not installed",
        description: "Install TeX Live or MiKTeX to enable this method",
      });
    }

    // KaTeX method
    try {
      require("katex");
      require("puppeteer-core");
      methods.push({
        method: this.methods.KATEX_HTML,
        quality: "html-rendered",
        available: true,
        description: "LaTeX to HTML conversion with PDF rendering",
      });
    } catch (e) {
      methods.push({
        method: this.methods.KATEX_HTML,
        quality: "html-rendered",
        available: false,
        reason: "katex or puppeteer-core not installed",
        description: "Install katex and puppeteer-core packages",
      });
    }

    // Enhanced Manual (always available)
    methods.push({
      method: this.methods.ENHANCED_MANUAL,
      quality: "manual-parsed",
      available: true,
      description: "Manual LaTeX parsing with PDFKit rendering",
    });

    // TeXlive API (always available but unreliable)
    methods.push({
      method: this.methods.TEXLIVE_API,
      quality: "api-dependent",
      available: true,
      note: "May have memory limits and outages",
      description: "External TeXlive.net API compilation",
    });

    return methods;
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      name: "Advanced LaTeX Service",
      version: "1.0.0",
      description: "Multi-method LaTeX compilation with intelligent fallbacks",
      supportedMethods: Object.values(this.methods),
      fallbackOrder: this.fallbackOrder,
    };
  }
}

module.exports = AdvancedLatexService;
