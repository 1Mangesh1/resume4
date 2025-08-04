const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController");
const resumeController = require("../controllers/resumeController");
const streamController = require("../controllers/streamController");
const historyController = require("../controllers/historyController");
const latexController = require("../controllers/latexController");
const upload = require("../config/multer");

// Main routes
router.get("/", mainController.getIndex);
router.get("/api/health", mainController.getHealth);

// Resume analysis and generation routes
router.post("/api/analyze", upload.single("resumeFile"), resumeController.analyzeResume);
router.post("/api/generate-summary", resumeController.generateSummary);
router.post("/api/generate-variant", resumeController.generateVariant);
router.post("/api/generate-cover-letter", resumeController.generateCoverLetter);
router.post("/api/optimize-linkedin", resumeController.optimizeLinkedIn);

// Streaming route
router.post("/api/stream-analysis", upload.single("resumeFile"), streamController.streamAnalysis);

// History routes
router.post("/api/clear-history", historyController.clearHistory);
router.get("/api/conversation-history", historyController.getHistory);

// LaTeX routes
router.post("/api/generate-latex-resume", latexController.generateLatexResume);
router.get("/api/latex-templates", latexController.getLatexTemplates);
router.post("/api/compile-latex-pdf", latexController.compileLatexPdf);
router.post("/api/download-latex-pdf", latexController.downloadLatexPdf);

module.exports = router;
