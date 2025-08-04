const path = require("path");
const { AIService } = require("../lib/ai-service");

let aiService;
try {
  aiService = new AIService();
} catch (error) {
  aiService = null;
}

const getIndex = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
};

const getHealth = (req, res) => {
  res.json({
    status: "healthy",
    gemini_configured: !!process.env.GEMINI_API_KEY,
    ai_service_available: !!aiService,
    features: [
      "file_upload",
      "jd_matching",
      "enhanced_analysis",
      "structured_prompts",
      "ai_sdk_integration",
      "streaming_analysis",
      "conversation_history",
    ],
  });
};

module.exports = {
  getIndex,
  getHealth,
};
