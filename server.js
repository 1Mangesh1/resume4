require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const { validateEnvironment } = require("./config/env");
const { ensureUploadsDir } = require("./utils/file");
const {
  handleMulterError,
  handleGenericError,
  setupGlobalErrorHandlers,
} = require("./middlewares/errorHandler");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Environment validation
const environmentIssues = validateEnvironment();
if (environmentIssues.length > 0) {
  console.error("❌ Environment validation failed:");
  environmentIssues.forEach((issue) => console.error(`  - ${issue}`));
  console.error("\nPlease fix these issues before starting the server.");
  process.exit(1);
}
console.log("✅ Environment validation passed");

// Initialize uploads directory for serverless
ensureUploadsDir().catch(console.error);

// Setup global error handlers
setupGlobalErrorHandlers();

// Middleware
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// Basic rate limiting (60 req/min per IP)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too many requests, please try again later.",
    },
  })
);

// Routes
app.use("/", routes);

// Error handling middleware
app.use(handleMulterError);
app.use(handleGenericError);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Resume Analyzer running at http://localhost:${PORT}`);
  console.log(
    `📊 Features: File Upload, Job Description Matching, Enhanced Analysis, LaTeX Resume Generator`
  );
  console.log(
    `🤖 Gemini API: ${
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "✅ Configured" : "❌ Not configured"
    }`
  );
  console.log(`📄 LaTeX Generator: Ready for professional resume compilation`);
});
