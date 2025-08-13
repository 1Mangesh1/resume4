const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");

class IntegratedLatexService {
  constructor() {
    this.tempDir = path.join(__dirname, "../temp");
    this.config = {
      isDockerized: process.env.DOCKERIZED === "true",
      texlivePath: process.env.TEXLIVE_PATH || "pdflatex",
      maxCompilationTime: 30000, // 30 seconds
      maxFileSize: 10 * 1024 * 1024, // 10MB
    };
  }

  /**
   * Main compilation method - Integrated LaTeX only
   */
  async compileToPDF(latexCode, filename = "resume") {
    console.log("🔄 Starting integrated LaTeX compilation...");

    try {
      // Validate input
      this.validateInput(latexCode, filename);

      // Create temp files
      await fs.mkdir(this.tempDir, { recursive: true });

      const texFile = path.join(this.tempDir, `${filename}.tex`);
      const pdfFile = path.join(this.tempDir, `${filename}.pdf`);

      // Clean and prepare LaTeX code
      const cleanedLatex = this.cleanLatexCode(latexCode);
      await fs.writeFile(texFile, cleanedLatex);

      console.log(`📄 Compiling ${filename}.tex with integrated pdflatex...`);

      // Run pdflatex directly (no Docker needed)
      const result = await this.runPdfLatex(this.tempDir, filename);

      if (result.success) {
        const pdfBuffer = await fs.readFile(pdfFile);

        // Clean up temp files
        await this.cleanupTempFiles(this.tempDir, filename);

        console.log(`✅ PDF generated successfully: ${pdfBuffer.length} bytes`);

        return {
          success: true,
          pdfBuffer,
          size: pdfBuffer.length,
          contentType: "application/pdf",
          quality: "native-latex",
          method: "integrated_latex",
        };
      }

      throw new Error(result.error);
    } catch (error) {
      console.error("❌ Integrated LaTeX compilation failed:", error.message);
      throw new Error(`LaTeX compilation failed: ${error.message}`);
    }
  }

  /**
   * Run pdflatex directly on the system
   */
  async runPdfLatex(tempDir, filename) {
    return new Promise((resolve) => {
      const texFile = path.join(tempDir, `${filename}.tex`);

      const latex = spawn(
        this.config.texlivePath,
        [
          "-interaction=nonstopmode",
          "-halt-on-error",
          "-file-line-error",
          `-output-directory=${tempDir}`,
          texFile,
        ],
        {
          cwd: tempDir,
          timeout: this.config.maxCompilationTime,
        }
      );

      let output = "";
      let errorOutput = "";

      latex.stdout.on("data", (data) => {
        output += data.toString();
      });

      latex.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      latex.on("close", (code) => {
        const success = code === 0;

        if (success) {
          console.log("✅ pdflatex compilation completed successfully");
        } else {
          console.log(`❌ pdflatex failed with exit code: ${code}`);
        }

        resolve({
          success,
          error: success ? null : this.parseLatexError(output + errorOutput),
          exitCode: code,
          output: output,
        });
      });

      latex.on("error", (error) => {
        console.error("❌ pdflatex process error:", error.message);
        resolve({
          success: false,
          error: `pdflatex execution failed: ${error.message}`,
          exitCode: -1,
        });
      });

      // Handle timeout
      latex.on("timeout", () => {
        latex.kill();
        resolve({
          success: false,
          error: "LaTeX compilation timeout (30 seconds exceeded)",
          exitCode: -1,
        });
      });
    });
  }

  /**
   * Clean and fix common LaTeX code issues
   */
  cleanLatexCode(latexCode) {
    console.log("🧹 Cleaning LaTeX code for compilation...");

    let cleaned = latexCode;

    // Fix common titlespacing issues
    cleaned = cleaned.replace(
      /\\titlespacing\{\\section\*\}/g,
      "\\titlespacing*{\\section}"
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

    // Fix dash formatting - use proper LaTeX commands
    cleaned = cleaned.replace(/—/g, "\\textendash{} ");
    cleaned = cleaned.replace(/–/g, "\\textendash{} ");
    cleaned = cleaned.replace(/--/g, "\\textendash{} ");
    cleaned = cleaned.replace(/\\extendash\{\}/g, "\\textendash{}");

    // Ensure proper spacing around \textendash{}
    cleaned = cleaned.replace(/\\textendash\{\}\s*/g, " \\textendash{} ");

    // Remove centering commands that break formatting
    cleaned = cleaned.replace(/\\centering\s*/g, "");
    cleaned = cleaned.replace(/\{\\centering\s*([^}]*)\s*\\par\}/g, "$1");
    cleaned = cleaned.replace(/\\begin\{center\}/g, "");
    cleaned = cleaned.replace(/\\end\{center\}/g, "");

    // Fix missing backslashes safely
    cleaned = cleaned.replace(/(^|\s|})textbf\{/gm, "$1\\textbf{");
    cleaned = cleaned.replace(/(^|\s|})href\{/gm, "$1\\href{");
    cleaned = cleaned.replace(/(^|\s|})section\*/gm, "$1\\section*");
    cleaned = cleaned.replace(/(^|\s|})begin\{/gm, "$1\\begin{");
    cleaned = cleaned.replace(/(^|\s|})end\{/gm, "$1\\end{");

    // Clean up triple backslashes, preserve double backslashes
    cleaned = cleaned.replace(/\\\\\\+/g, "\\\\");

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

  /**
   * Parse LaTeX error messages for user-friendly output
   */
  parseLatexError(output) {
    const lines = output.split("\n");
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for error patterns
      if (line.includes("! ")) {
        errors.push(line.replace("! ", "").trim());
      } else if (line.includes("Error:")) {
        errors.push(line.trim());
      } else if (line.includes("Undefined control sequence")) {
        errors.push("Undefined LaTeX command found");
      }
    }

    if (errors.length > 0) {
      return `LaTeX compilation error: ${errors[0]}`;
    }

    return "LaTeX compilation failed with unknown error";
  }

  /**
   * Validate input parameters
   */
  validateInput(latexCode, filename) {
    if (!latexCode || typeof latexCode !== "string") {
      throw new Error("LaTeX code is required and must be a string");
    }

    if (latexCode.length > this.config.maxFileSize) {
      throw new Error("LaTeX code exceeds maximum file size limit");
    }

    if (!filename || typeof filename !== "string") {
      throw new Error("Filename is required and must be a string");
    }

    // Check for basic LaTeX structure
    if (
      !latexCode.includes("\\documentclass") ||
      !latexCode.includes("\\begin{document}")
    ) {
      throw new Error("Invalid LaTeX code: missing document structure");
    }
  }

  /**
   * Clean up temporary files
   */
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
   * Check if LaTeX is available
   */
  async checkLatexAvailability() {
    return new Promise((resolve) => {
      const latex = spawn(this.config.texlivePath, ["--version"]);

      latex.on("close", (code) => {
        resolve(code === 0);
      });

      latex.on("error", () => {
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        latex.kill();
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      name: "Integrated LaTeX Service",
      version: "1.0.0",
      description: "Native LaTeX compilation with integrated pdflatex",
      method: "integrated_latex",
      quality: "native-latex",
      isDockerized: this.config.isDockerized,
      texlivePath: this.config.texlivePath,
      features: [
        "Native pdflatex compilation",
        "Integrated LaTeX cleaning",
        "Professional error handling",
        "Fast compilation times",
        "No external dependencies",
      ],
    };
  }
}

module.exports = IntegratedLatexService;
