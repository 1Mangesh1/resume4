const LaTeXResumeGenerator = require("../lib/latex-generator");
const TeXliveService = require("../lib/texlive-service");
const { AIService } = require("../lib/ai-service");

class LatexController {
  constructor() {
    this.latexGenerator = new LaTeXResumeGenerator();
    this.texliveService = new TeXliveService();
    this.aiService = new AIService();
  }

  /**
   * Generate LaTeX resume from resume text
   */
  async generateLatexResume(req, res) {
    try {
      const { resumeText, jobDescription } = req.body;

      if (!resumeText) {
        return res.status(400).json({
          success: false,
          error: "Resume text is required"
        });
      }

      console.log("🔄 Generating LaTeX resume...");

      // First analyze the resume to get structured data
      const aiAnalysis = await this.aiService.analyzeResume(
        resumeText,
        jobDescription,
        {},
        { includeLatexGen: true }
      );

      // Extract structured data
      const resumeData = this.aiService.extractResumeData(resumeText, aiAnalysis);

      // Generate LaTeX code
      const latexCode = this.latexGenerator.generateFromJSON(resumeData);

      console.log("✅ LaTeX resume generated successfully");

      res.json({
        success: true,
        data: {
          latexCode: latexCode,
          templateUsed: "resume-modern.tex",
          resumeData: resumeData
        }
      });

    } catch (error) {
      console.error("❌ LaTeX generation error:", error);
      res.status(500).json({
        success: false,
        error: "LaTeX generation failed",
        details: error.message
      });
    }
  }

  /**
   * Get available LaTeX templates
   */
  async getLatexTemplates(req, res) {
    try {
      const templates = await this.latexGenerator.getAvailableTemplates();
      
      res.json({
        success: true,
        data: {
          templates: templates,
          default: "resume-modern.tex"
        }
      });

    } catch (error) {
      console.error("❌ Template listing error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get templates",
        details: error.message
      });
    }
  }

  /**
   * Compile LaTeX code to PDF
   */
  async compileLatexPdf(req, res) {
    try {
      const { latexCode, filename = 'resume' } = req.body;

      if (!latexCode) {
        return res.status(400).json({
          success: false,
          error: "LaTeX code is required"
        });
      }

      console.log("🔄 Compiling LaTeX to PDF...");

      // Validate LaTeX before compilation
      const validation = this.texliveService.validateLaTeX(latexCode);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: "Invalid LaTeX code",
          issues: validation.issues
        });
      }

      // Compile to PDF
      const result = await this.texliveService.compileToPDF(latexCode, filename);

      if (result.success) {
        // Convert to base64 for JSON response
        const base64Pdf = result.pdfBuffer.toString('base64');
        
        console.log("✅ PDF compilation successful");
        
        res.json({
          success: true,
          data: {
            pdfBase64: base64Pdf,
            size: result.size,
            filename: `${filename}.pdf`,
            contentType: result.contentType
          }
        });
      } else {
        console.error("❌ PDF compilation failed:", result.error);
        res.status(400).json({
          success: false,
          error: "PDF compilation failed",
          details: result.error
        });
      }

    } catch (error) {
      console.error("❌ PDF compilation error:", error);
      res.status(500).json({
        success: false,
        error: "PDF compilation failed",
        details: error.message
      });
    }
  }

  /**
   * Download LaTeX PDF directly
   */
  async downloadLatexPdf(req, res) {
    try {
      const { latexCode, filename = 'resume' } = req.body;

      if (!latexCode) {
        return res.status(400).json({
          success: false,
          error: "LaTeX code is required"
        });
      }

      console.log("🔄 Generating PDF for download...");

      // Compile to PDF
      const result = await this.texliveService.compileToPDF(latexCode, filename);

      if (result.success) {
        console.log("✅ PDF generated for download");
        
        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        res.setHeader('Content-Length', result.size);
        
        // Send PDF buffer directly
        res.send(result.pdfBuffer);
      } else {
        console.error("❌ PDF generation failed:", result.error);
        res.status(400).json({
          success: false,
          error: "PDF generation failed",
          details: result.error
        });
      }

    } catch (error) {
      console.error("❌ PDF download error:", error);
      res.status(500).json({
        success: false,
        error: "PDF download failed",
        details: error.message
      });
    }
  }

  /**
   * Generate LaTeX resume and compile to PDF in one step
   */
  async generateAndCompilePdf(req, res) {
    try {
      const { resumeText, jobDescription, filename = 'resume' } = req.body;

      if (!resumeText) {
        return res.status(400).json({
          success: false,
          error: "Resume text is required"
        });
      }

      console.log("🔄 Generating LaTeX resume and compiling to PDF...");

      // Generate LaTeX
      const aiAnalysis = await this.aiService.analyzeResume(
        resumeText,
        jobDescription,
        {},
        { includeLatexGen: true }
      );

      const resumeData = this.aiService.extractResumeData(resumeText, aiAnalysis);
      const latexCode = this.latexGenerator.generateFromJSON(resumeData);

      // Compile to PDF
      const result = await this.texliveService.compileToPDF(latexCode, filename);

      if (result.success) {
        console.log("✅ LaTeX resume generated and compiled successfully");
        
        const base64Pdf = result.pdfBuffer.toString('base64');
        
        res.json({
          success: true,
          data: {
            latexCode: latexCode,
            pdfBase64: base64Pdf,
            size: result.size,
            filename: `${filename}.pdf`,
            resumeData: resumeData
          }
        });
      } else {
        // Return LaTeX even if PDF compilation fails
        console.error("❌ PDF compilation failed, returning LaTeX only");
        res.json({
          success: true,
          data: {
            latexCode: latexCode,
            resumeData: resumeData,
            pdfError: result.error
          },
          warning: "LaTeX generated but PDF compilation failed"
        });
      }

    } catch (error) {
      console.error("❌ Generate and compile error:", error);
      res.status(500).json({
        success: false,
        error: "Generation and compilation failed",
        details: error.message
      });
    }
  }
}

// Create and export instance
const latexController = new LatexController();

module.exports = {
  generateLatexResume: latexController.generateLatexResume.bind(latexController),
  getLatexTemplates: latexController.getLatexTemplates.bind(latexController),
  compileLatexPdf: latexController.compileLatexPdf.bind(latexController),
  downloadLatexPdf: latexController.downloadLatexPdf.bind(latexController),
  generateAndCompilePdf: latexController.generateAndCompilePdf.bind(latexController)
};
