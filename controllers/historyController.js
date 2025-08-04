const { AIService } = require("../lib/ai-service");

let aiService;
try {
  aiService = new AIService();
} catch (error) {
  aiService = null;
}

const clearHistory = (req, res) => {
  try {
    if (aiService) {
      aiService.clearHistory();
      res.json({ message: "Conversation history cleared successfully" });
    } else {
      res.status(500).json({ error: "AI Service not available" });
    }
  } catch (error) {
    console.error("Error clearing history:", error);
    res.status(500).json({ error: "Failed to clear conversation history" });
  }
};

const getHistory = (req, res) => {
  try {
    if (aiService) {
      const history = aiService.getHistory();
      res.json({ history });
    } else {
      res.status(500).json({ error: "AI Service not available" });
    }
  } catch (error) {
    console.error("Error getting history:", error);
    res.status(500).json({ error: "Failed to get conversation history" });
  }
};

module.exports = {
  clearHistory,
  getHistory,
};
