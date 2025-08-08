const fs = require("fs");
const path = require("path");

const validateEnvironment = () => {
  const issues = [];

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    issues.push("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set");
  }

  // Check if uploads directory exists and is writable
  try {
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (error) {
    issues.push(`Cannot create uploads directory: ${error.message}`);
  }

  // Check if templates directory exists
  const templatesDir = path.join(__dirname, "..", "public", "templates");
  if (!fs.existsSync(templatesDir)) {
    issues.push("Templates directory not found");
  }

  return issues;
};

module.exports = { validateEnvironment };
