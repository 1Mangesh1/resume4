const { AIService } = require("../lib/ai-service");
const { PromptSecurity } = require("../lib/prompt-system");
const { extractTextFromFile } = require("../utils/file");

let aiService;
try {
  aiService = new AIService();
} catch (error) {
  aiService = null;
}

const streamAnalysis = async (req, res) => {
  try {
    if (!aiService) {
      return res.status(500).json({
        error: "AI Service not available",
        message: "AI streaming service is not properly configured.",
      });
    }

    let resumeText = "";

    if (req.file) {
      try {
        resumeText = await extractTextFromFile(
          req.file.buffer,
          req.file.mimetype
        );
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    } else if (req.body.resumeText) {
      resumeText = req.body.resumeText;
    } else {
      return res.status(400).json({
        error:
          "No resume provided. Please upload a file or enter text content.",
      });
    }

    const sanitizedResumeText = PromptSecurity.sanitizeInput(resumeText);
    if (!sanitizedResumeText || sanitizedResumeText.trim().length < 50) {
      return res.status(400).json({
        error: "Resume content is too short or invalid.",
      });
    }

    const jobDescription = req.body.jobDescription || null;

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    try {
      const textStream = await aiService.streamAnalysis(
        sanitizedResumeText,
        jobDescription
      );

      for await (const chunk of textStream) {
        res.write(chunk);
      }

      res.end();
    } catch (error) {
      console.error("Streaming analysis error:", error);
      res.write(`\n\nError: ${error.message}`);
      res.end();
    }
  } catch (error) {
    console.error("Stream analysis setup error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to start streaming analysis" });
    }
  }
};

module.exports = { streamAnalysis };
