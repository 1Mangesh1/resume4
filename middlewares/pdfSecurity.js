const rateLimit = require("express-rate-limit");

/**
 * PDF Generation Security Middleware
 * Provides rate limiting, input validation, and security measures for PDF endpoints
 */

// Rate limiting for PDF generation
const pdfRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 PDF generations per 15 minutes per IP
  message: {
    success: false,
    error: "Too many PDF generation requests. Please try again in 15 minutes.",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to include user agent for better identification
  keyGenerator: (req) => {
    return `${req.ip}_${req.get("User-Agent") || "unknown"}`.slice(0, 64);
  },
});

// Strict rate limiting for high-quality PDF generation (more resource intensive)
const highQualityPdfRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Max 10 high-quality PDF generations per 10 minutes per IP
  message: {
    success: false,
    error:
      "Too many high-quality PDF requests. Please try again in 10 minutes.",
    retryAfter: 10 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `hq_${req.ip}_${req.get("User-Agent") || "unknown"}`.slice(0, 64);
  },
});

/**
 * Validate LaTeX input for security
 */
function validateLatexInput(req, res, next) {
  try {
    const { latexCode, resumeText } = req.body;

    // Check if at least one input is provided
    if (!latexCode && !resumeText) {
      return res.status(400).json({
        success: false,
        error: "Either LaTeX code or resume text is required",
      });
    }

    // Validate LaTeX code if provided
    if (latexCode) {
      // Check size limits
      if (latexCode.length > 100000) {
        // 100KB limit
        return res.status(400).json({
          success: false,
          error: "LaTeX code too large. Maximum size is 100KB.",
        });
      }

      // Security checks for dangerous commands
      const dangerousCommands = [
        "\\write18",
        "\\immediate\\write18",
        "\\input{|",
        "\\openin",
        "\\openout",
        "\\special",
        "\\directlua",
        "\\catcode",
        "\\def\\",
        "\\gdef\\",
        "\\expandafter",
        "\\csname",
        "\\endcsname",
        "\\uppercase",
        "\\lowercase",
      ];

      const foundDangerous = dangerousCommands.find((cmd) =>
        latexCode.toLowerCase().includes(cmd.toLowerCase())
      );

      if (foundDangerous) {
        console.warn(
          `Security: Blocked dangerous LaTeX command: ${foundDangerous}`
        );
        return res.status(400).json({
          success: false,
          error: `Dangerous LaTeX command detected: ${foundDangerous}. This command is not allowed for security reasons.`,
        });
      }

      // Check for excessive nesting (potential DoS)
      const openBraces = (latexCode.match(/\{/g) || []).length;
      const closeBraces = (latexCode.match(/\}/g) || []).length;

      if (Math.abs(openBraces - closeBraces) > 50) {
        return res.status(400).json({
          success: false,
          error: "LaTeX code has too many unbalanced braces",
        });
      }

      if (openBraces > 1000) {
        return res.status(400).json({
          success: false,
          error: "LaTeX code too complex. Please simplify your document.",
        });
      }
    }

    // Validate resume text if provided
    if (resumeText) {
      if (resumeText.length > 50000) {
        // 50KB limit
        return res.status(400).json({
          success: false,
          error: "Resume text too large. Maximum size is 50KB.",
        });
      }

      // Basic content validation
      if (typeof resumeText !== "string") {
        return res.status(400).json({
          success: false,
          error: "Resume text must be a string",
        });
      }
    }

    // Validate filename if provided
    if (req.body.filename) {
      const filename = req.body.filename.toString();

      // Allow only alphanumeric, dash, underscore
      if (!/^[a-zA-Z0-9_-]{1,50}$/.test(filename)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid filename. Use only letters, numbers, dash, and underscore (max 50 chars)",
        });
      }
    }

    next();
  } catch (error) {
    console.error("PDF input validation error:", error);
    res.status(500).json({
      success: false,
      error: "Input validation failed",
    });
  }
}

/**
 * Content Security Headers for PDF responses
 */
function setPdfSecurityHeaders(req, res, next) {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Cache control for PDF responses
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  next();
}

/**
 * Request logging for PDF operations
 */
function logPdfRequest(req, res, next) {
  const start = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  // Override response methods to log completion
  res.send = function (data) {
    const duration = Date.now() - start;
    logPdfOperation(req, res, duration, data);
    return originalSend.call(this, data);
  };

  res.json = function (data) {
    const duration = Date.now() - start;
    logPdfOperation(req, res, duration, data);
    return originalJson.call(this, data);
  };

  // Log request start
  console.log(`📄 PDF Request: ${req.method} ${req.path} from ${req.ip}`);

  next();
}

function logPdfOperation(req, res, duration, responseData) {
  const endpoint = req.path;
  const method = req.method;
  const ip = req.ip;
  const statusCode = res.statusCode;
  const userAgent = req.get("User-Agent") || "unknown";

  let logLevel = "✅";
  if (statusCode >= 400 && statusCode < 500) {
    logLevel = "⚠️";
  } else if (statusCode >= 500) {
    logLevel = "❌";
  }

  let sizeInfo = "";
  if (
    responseData &&
    typeof responseData === "object" &&
    responseData.data &&
    responseData.data.size
  ) {
    sizeInfo = ` | Size: ${(responseData.data.size / 1024).toFixed(1)}KB`;
  }

  console.log(
    `${logLevel} PDF ${method} ${endpoint} | ${statusCode} | ${duration}ms${sizeInfo} | ${ip} | ${userAgent.slice(
      0,
      50
    )}`
  );

  // Log errors for debugging
  if (statusCode >= 400 && responseData && responseData.error) {
    console.error(`PDF Error Details: ${responseData.error}`);
  }
}

/**
 * Memory usage monitoring for PDF operations
 */
function monitorMemoryUsage(req, res, next) {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

  // Warn if memory usage is high
  if (heapUsedMB > 500) {
    // 500MB threshold
    console.warn(`⚠️ High memory usage: ${heapUsedMB}MB heap used`);
  }

  // Add memory info to request for potential throttling
  req.memoryUsage = memUsage;

  next();
}

/**
 * Timeout middleware for PDF operations
 */
function setPdfTimeout(timeoutMs = 60000) {
  // 60 second default
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      console.error(`PDF request timeout: ${req.method} ${req.path}`);
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: "PDF generation timeout. Please try with a simpler document.",
          timeout: timeoutMs / 1000,
        });
      }
    });

    res.setTimeout(timeoutMs, () => {
      console.error(`PDF response timeout: ${req.method} ${req.path}`);
    });

    next();
  };
}

module.exports = {
  pdfRateLimit,
  highQualityPdfRateLimit,
  validateLatexInput,
  setPdfSecurityHeaders,
  logPdfRequest,
  monitorMemoryUsage,
  setPdfTimeout,
};
