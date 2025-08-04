const multer = require("multer");

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File size too large. Maximum size is 5MB.",
        details: "Please reduce your file size and try again.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Unexpected file field.",
        details: "Please ensure you are uploading the file correctly.",
      });
    }
  }

  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      error: err.message,
      details: "Supported formats: PDF, DOC, DOCX, TXT",
    });
  }

  next(err);
};

const handleGenericError = (err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "An unexpected error occurred. Please try again.",
    details: "If the problem persists, please contact support.",
  });
};

const logError = (context, error, additionalData = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error.message,
    stack: error.stack,
    ...additionalData,
  };

  console.error(`[${timestamp}] ${context}:`, errorInfo);
};

const setupGlobalErrorHandlers = () => {
  process.on("uncaughtException", (error) => {
    logError("Uncaught Exception", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logError("Unhandled Rejection", reason, { promise: promise.toString() });
  });
};

module.exports = {
  handleMulterError,
  handleGenericError,
  logError,
  setupGlobalErrorHandlers,
};
