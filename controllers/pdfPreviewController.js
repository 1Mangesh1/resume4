const LaTeXResumeGenerator = require("../lib/latex-generator");
const LatexPDFGenerator = require("../lib/latex-pdf-generator");
const AdvancedLatexService = require("../lib/advanced-latex-service");
const { AIService } = require("../lib/ai-service");

class PDFPreviewController {
  constructor() {
    this.latexGenerator = new LaTeXResumeGenerator();
    this.pdfGenerator = new LatexPDFGenerator();
    this.advancedLatexService = new AdvancedLatexService();
    this.aiService = new AIService();

    // Cache for PDF previews to improve performance
    this.previewCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate high-quality PDF preview from AI-generated LaTeX
   */
  async generatePDFPreview(req, res) {
    try {
      const {
        resumeText,
        jobDescription,
        filename = "resume-preview",
      } = req.body;

      if (!resumeText) {
        return res.status(400).json({
          success: false,
          error: "Resume text is required",
        });
      }

      console.log("🔄 Generating high-quality PDF preview...");

      // Check cache first
      const cacheKey = this.generateCacheKey(resumeText, jobDescription);
      const cached = this.previewCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log("✅ Returning cached PDF preview");
        return res.json({
          success: true,
          data: {
            pdfBase64: cached.pdfBase64,
            size: cached.size,
            filename: `${filename}.pdf`,
            cached: true,
          },
        });
      }

      // Generate LaTeX from resume text
      console.log("🔄 Analyzing resume and generating LaTeX...");
      const aiAnalysis = await this.aiService.analyzeResume(
        resumeText,
        jobDescription,
        {},
        { includeLatexGen: true }
      );

      // Use AI-generated LaTeX if available, otherwise fallback to template
      let latexCode;
      if (
        aiAnalysis.latex_resume &&
        aiAnalysis.latex_resume.latex_source &&
        aiAnalysis.latex_resume.latex_source.length > 100 &&
        !aiAnalysis.latex_resume.latex_source.startsWith("%")
      ) {
        console.log("✅ Using AI-generated LaTeX with enhanced formatting");
        latexCode = aiAnalysis.latex_resume.latex_source;
      } else {
        console.log("⚠️ AI LaTeX not available, using template fallback");
        const resumeData = this.aiService.extractResumeData(
          resumeText,
          aiAnalysis
        );
        latexCode = this.latexGenerator.generateFromJSON(resumeData);
      }

      // Validate LaTeX
      const validation = this.pdfGenerator.validateLaTeX(latexCode);
      if (!validation.isValid) {
        console.warn("⚠️ LaTeX validation issues:", validation.issues);
        // Continue anyway with warnings
      }

      // Generate high-quality PDF using latex.js + PDFKit
      console.log("🔄 Converting LaTeX to high-quality PDF...");
      const result = await this.pdfGenerator.generatePDF(latexCode, filename);

      if (result.success) {
        const base64Pdf = result.pdfBuffer.toString("base64");

        // Cache the result
        this.previewCache.set(cacheKey, {
          pdfBase64: base64Pdf,
          size: result.size,
          timestamp: Date.now(),
        });

        // Clean old cache entries
        this.cleanupCache();

        console.log("✅ High-quality PDF preview generated successfully");

        res.json({
          success: true,
          data: {
            pdfBase64: base64Pdf,
            size: result.size,
            filename: `${filename}.pdf`,
            contentType: result.contentType,
            method: "latex.js + PDFKit",
            warning: result.warning || undefined,
          },
        });
      } else {
        console.error("❌ PDF generation failed:", result.error);
        res.status(500).json({
          success: false,
          error: "PDF generation failed",
          details: result.error,
        });
      }
    } catch (error) {
      console.error("❌ PDF preview generation error:", error);
      res.status(500).json({
        success: false,
        error: "PDF preview generation failed",
        details: error.message,
      });
    }
  }

  /**
   * Generate PDF preview from provided LaTeX code - ENHANCED WITH MULTI-METHOD SUPPORT
   */
  async generatePDFFromLatex(req, res) {
    try {
      const {
        latexCode,
        filename = "custom-resume",
        preferredMethod,
      } = req.body;

      if (!latexCode) {
        return res.status(400).json({
          success: false,
          error: "LaTeX code is required",
        });
      }

      console.log("🔄 Generating PDF with Advanced LaTeX Service...");
      console.log(`📄 Preferred method: ${preferredMethod || "auto-detect"}`);

      // Validate LaTeX before processing
      const validation = this.pdfGenerator.validateLaTeX(latexCode);
      if (!validation.isValid) {
        console.warn("⚠️ LaTeX validation issues:", validation.issues);
        // Continue anyway - advanced service might handle it better
      }

      // Use the Advanced LaTeX Service with intelligent fallbacks
      const result = await this.advancedLatexService.compileToPDF(
        latexCode,
        filename,
        preferredMethod
      );

      if (result.success) {
        const base64Pdf = result.pdfBuffer.toString("base64");

        console.log("✅ PDF generated successfully with advanced service");
        console.log(`📄 Method: ${result.method}, Quality: ${result.quality}`);

        res.json({
          success: true,
          data: {
            pdfBase64: base64Pdf,
            size: result.size,
            filename: `${filename}.pdf`,
            contentType: result.contentType,
            method: result.method,
            quality: result.quality,
            warning: this.getMethodWarning(result.method),
          },
        });
      } else {
        console.error("❌ All PDF generation methods failed");
        res.status(500).json({
          success: false,
          error: "All PDF generation methods failed",
          details: result.error,
        });
      }
    } catch (error) {
      console.error("❌ Advanced PDF generation error:", error);
      res.status(500).json({
        success: false,
        error: "PDF generation failed",
        details: error.message,
      });
    }
  }

  /**
   * Download PDF directly (for browser download)
   */
  async downloadPDFPreview(req, res) {
    try {
      const { resumeText, jobDescription, filename = "resume" } = req.body;

      if (!resumeText) {
        return res.status(400).json({
          success: false,
          error: "Resume text is required",
        });
      }

      console.log("🔄 Generating PDF for download...");

      // Generate LaTeX
      const aiAnalysis = await this.aiService.analyzeResume(
        resumeText,
        jobDescription,
        {},
        { includeLatexGen: true }
      );

      const resumeData = this.aiService.extractResumeData(
        resumeText,
        aiAnalysis
      );
      const latexCode = this.latexGenerator.generateFromJSON(resumeData);

      // Generate PDF
      const result = await this.pdfGenerator.generatePDF(latexCode, filename);

      if (result.success) {
        console.log("✅ PDF generated for download");

        // Set headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}.pdf"`
        );
        res.setHeader("Content-Length", result.size);
        res.setHeader("X-Generated-By", "LaTeX.js + PDFKit");

        // Send PDF buffer directly
        res.send(result.pdfBuffer);
      } else {
        console.error("❌ PDF generation failed:", result.error);
        res.status(500).json({
          success: false,
          error: "PDF generation failed",
          details: result.error,
        });
      }
    } catch (error) {
      console.error("❌ PDF download error:", error);
      res.status(500).json({
        success: false,
        error: "PDF download failed",
        details: error.message,
      });
    }
  }

  /**
   * Stream PDF for inline viewing (preview in browser)
   */
  async streamPDFPreview(req, res) {
    try {
      const { resumeText, jobDescription, filename = "resume" } = req.body;

      if (!resumeText) {
        return res.status(400).json({
          success: false,
          error: "Resume text is required",
        });
      }

      console.log("🔄 Generating PDF for streaming...");

      // Generate LaTeX
      const aiAnalysis = await this.aiService.analyzeResume(
        resumeText,
        jobDescription,
        {},
        { includeLatexGen: true }
      );

      const resumeData = this.aiService.extractResumeData(
        resumeText,
        aiAnalysis
      );
      const latexCode = this.latexGenerator.generateFromJSON(resumeData);

      // Generate PDF
      const result = await this.pdfGenerator.generatePDF(latexCode, filename);

      if (result.success) {
        console.log("✅ PDF generated for streaming");

        // Set headers for inline viewing
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${filename}.pdf"`
        );
        res.setHeader("Content-Length", result.size);
        res.setHeader("X-Generated-By", "LaTeX.js + PDFKit");
        res.setHeader("Cache-Control", "no-cache");

        // Send PDF buffer for inline viewing
        res.send(result.pdfBuffer);
      } else {
        console.error("❌ PDF streaming failed:", result.error);
        res.status(500).json({
          success: false,
          error: "PDF streaming failed",
          details: result.error,
        });
      }
    } catch (error) {
      console.error("❌ PDF streaming error:", error);
      res.status(500).json({
        success: false,
        error: "PDF streaming failed",
        details: error.message,
      });
    }
  }

  /**
   * Get service information and capabilities
   */
  async getServiceInfo(req, res) {
    try {
      const serviceInfo = this.pdfGenerator.getServiceInfo();
      const advancedServiceInfo = this.advancedLatexService.getServiceInfo();
      const availableMethods =
        await this.advancedLatexService.getAvailableMethods();
      const templates = await this.latexGenerator.getAvailableTemplates();

      res.json({
        success: true,
        data: {
          service: serviceInfo,
          advancedService: advancedServiceInfo,
          availableMethods: availableMethods,
          templates: templates,
          cacheInfo: {
            size: this.previewCache.size,
            maxAge: this.cacheExpiry,
          },
          features: [
            "Multi-method LaTeX compilation",
            "Docker-based compilation (Overleaf quality)",
            "Local pdflatex support",
            "KaTeX + HTML rendering",
            "Enhanced manual parsing",
            "Intelligent fallback system",
            "Preview caching",
            "Professional typography",
            "Memory-efficient processing",
          ],
        },
      });
    } catch (error) {
      console.error("❌ Service info error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get service information",
        details: error.message,
      });
    }
  }

  /**
   * Clear preview cache
   */
  async clearCache(req, res) {
    try {
      const cacheSize = this.previewCache.size;
      this.previewCache.clear();

      console.log(`🗑️ Cleared ${cacheSize} cached previews`);

      res.json({
        success: true,
        message: `Cleared ${cacheSize} cached previews`,
      });
    } catch (error) {
      console.error("❌ Cache clear error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear cache",
        details: error.message,
      });
    }
  }

  /**
   * Helper methods
   */
  generateCacheKey(resumeText, jobDescription = "") {
    const content = resumeText + (jobDescription || "");
    return Buffer.from(content).toString("base64").slice(0, 32);
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.previewCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.previewCache.delete(key);
      }
    }
  }

  getMethodWarning(method) {
    const warnings = {
      enhanced_manual:
        "Using manual parser - for best quality, install Docker or pdflatex",
      texlive_api: "Using external API - may have memory limits",
      katex_html: "HTML-rendered PDF - good quality but not native LaTeX",
      local_docker: null, // No warning for Docker method
      local_binary: null, // No warning for local binary method
    };

    return warnings[method] || undefined;
  }
}

// Create and export instance
const pdfPreviewController = new PDFPreviewController();

module.exports = {
  generatePDFPreview:
    pdfPreviewController.generatePDFPreview.bind(pdfPreviewController),
  generatePDFFromLatex:
    pdfPreviewController.generatePDFFromLatex.bind(pdfPreviewController),
  downloadPDFPreview:
    pdfPreviewController.downloadPDFPreview.bind(pdfPreviewController),
  streamPDFPreview:
    pdfPreviewController.streamPDFPreview.bind(pdfPreviewController),
  getServiceInfo:
    pdfPreviewController.getServiceInfo.bind(pdfPreviewController),
  clearCache: pdfPreviewController.clearCache.bind(pdfPreviewController),
};
