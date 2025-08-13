const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const mainController = require("../controllers/mainController");
const resumeController = require("../controllers/resumeController");
const streamController = require("../controllers/streamController");
const historyController = require("../controllers/historyController");
const latexController = require("../controllers/latexController");
const localPdfController = require("../controllers/localPdfController");
const pdfPreviewController = require("../controllers/pdfPreviewController");
const upload = require("../config/multer");
const {
  pdfRateLimit,
  highQualityPdfRateLimit,
  validateLatexInput,
  setPdfSecurityHeaders,
  logPdfRequest,
  monitorMemoryUsage,
  setPdfTimeout,
} = require("../middlewares/pdfSecurity");

// Main routes
router.get("/", mainController.getIndex);
router.get("/api/health", mainController.getHealth);

// Resume analysis and generation routes
router.post(
  "/api/analyze",
  upload.single("resumeFile"),
  resumeController.analyzeResume
);
router.post("/api/generate-summary", resumeController.generateSummary);
router.post("/api/generate-variant", resumeController.generateVariant);
router.post("/api/generate-cover-letter", resumeController.generateCoverLetter);
router.post("/api/optimize-linkedin", resumeController.optimizeLinkedIn);

// Streaming route
router.post(
  "/api/stream-analysis",
  upload.single("resumeFile"),
  streamController.streamAnalysis
);

// History routes
router.post("/api/clear-history", historyController.clearHistory);
router.get("/api/conversation-history", historyController.getHistory);

// LaTeX routes
router.post("/api/generate-latex-resume", latexController.generateLatexResume);
router.post("/api/generate-best-resume", resumeController.generateBestResume);
router.get("/api/latex-templates", latexController.getLatexTemplates);
router.post("/api/compile-latex-pdf", latexController.compileLatexPdf);
router.post("/api/download-latex-pdf", latexController.downloadLatexPdf);

// Pure Node.js LaTeX->PDF (no TeX Live) endpoint
router.post("/api/generate-pdf", localPdfController.generatePdf);

// High-quality PDF preview routes (latex.js + PDFKit) with security
router.post(
  "/api/pdf-preview",
  highQualityPdfRateLimit,
  validateLatexInput,
  setPdfSecurityHeaders,
  logPdfRequest,
  monitorMemoryUsage,
  setPdfTimeout(90000), // 90 seconds for high-quality generation
  pdfPreviewController.generatePDFPreview
);

router.post(
  "/api/pdf-from-latex",
  highQualityPdfRateLimit,
  validateLatexInput,
  setPdfSecurityHeaders,
  logPdfRequest,
  monitorMemoryUsage,
  setPdfTimeout(90000),
  pdfPreviewController.generatePDFFromLatex
);

router.post(
  "/api/download-pdf-preview",
  pdfRateLimit,
  validateLatexInput,
  setPdfSecurityHeaders,
  logPdfRequest,
  monitorMemoryUsage,
  setPdfTimeout(120000), // 2 minutes for downloads
  pdfPreviewController.downloadPDFPreview
);

router.post(
  "/api/stream-pdf-preview",
  pdfRateLimit,
  validateLatexInput,
  setPdfSecurityHeaders,
  logPdfRequest,
  monitorMemoryUsage,
  setPdfTimeout(90000),
  pdfPreviewController.streamPDFPreview
);

router.get(
  "/api/pdf-service-info",
  setPdfSecurityHeaders,
  pdfPreviewController.getServiceInfo
);

router.post(
  "/api/clear-pdf-cache",
  rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Max 5 cache clears per 5 minutes
    message: { success: false, error: "Too many cache clear requests" },
  }),
  setPdfSecurityHeaders,
  logPdfRequest,
  pdfPreviewController.clearCache
);

module.exports = router;
