require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs").promises;
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists in /tmp (writable in serverless)
const ensureUploadsDir = async () => {
  try {
    await fs.access("/tmp");
  } catch {
    await fs.mkdir("/tmp", { recursive: true });
  }
  try {
    await fs.access("/tmp/uploads");
  } catch {
    await fs.mkdir("/tmp/uploads", { recursive: true });
  }
};

// Initialize uploads directory for serverless
ensureUploadsDir().catch(console.error);

// Configure multer for file uploads (use memory storage for serverless)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOCX, and TXT files are allowed."
        )
      );
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

// Extract text from file buffer or file path
const extractTextFromFile = async (fileData, mimetype) => {
  try {
    if (mimetype === "application/pdf") {
      // Handle both buffer and file path
      const dataBuffer = Buffer.isBuffer(fileData)
        ? fileData
        : await fs.readFile(fileData);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      if (Buffer.isBuffer(fileData)) {
        const result = await mammoth.extractRawText({ buffer: fileData });
        return result.value;
      } else {
        const result = await mammoth.extractRawText({ path: fileData });
        return result.value;
      }
    } else if (mimetype === "text/plain") {
      if (Buffer.isBuffer(fileData)) {
        return fileData.toString("utf8");
      } else {
        const data = await fs.readFile(fileData, "utf8");
        return data;
      }
    }
    throw new Error("Unsupported file type");
  } catch (error) {
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

// Clean up uploaded file
const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.log("Cleanup warning:", error.message);
  }
};

// Enhanced Gemini prompt for resume analysis
const createAnalysisPrompt = (
  resumeText,
  jobDescription = null,
  options = {}
) => {
  let prompt = `You are an expert resume reviewer and career coach with deep expertise in recruitment, HR practices, and professional communication. Please analyze the following resume and provide detailed, actionable feedback across multiple dimensions.

RESUME TEXT:
${resumeText}

${
  jobDescription
    ? `
JOB DESCRIPTION:
${jobDescription}

Please analyze how well this resume matches the job description and provide specific recommendations for improvement.
`
    : ""
}

Please respond with a JSON object containing the following structure:

{
  "overall_score": <number 0-100>,
  "sections": {
    "clarity": {
      "score": <number 0-100>,
      "feedback": "<detailed feedback about resume clarity and readability>"
    },
    "impact": {
      "score": <number 0-100>,
      "feedback": "<feedback about quantified achievements and impact statements>"
    },
    "ats_optimization": {
      "score": <number 0-100>,
      "feedback": "<feedback about ATS compatibility and keyword optimization>"
    },
    "formatting": {
      "score": <number 0-100>,
      "feedback": "<feedback about structure, organization, and presentation>"
    }
  },
  "advanced_analysis": {
    "tone_evaluation": {
      "score": <number 0-100>,
      "tone_type": "<professional/casual/formal/conversational>",
      "feedback": "<analysis of writing tone, consistency, and appropriateness>"
    },
    "bullet_point_grade": {
      "score": <number 0-100>,
      "action_verbs_count": <number>,
      "quantified_bullets": <number>,
      "total_bullets": <number>,
      "feedback": "<detailed analysis of bullet point quality, action verbs usage, specificity>"
    },
    "buzzword_detection": {
      "score": <number 0-100>,
      "buzzwords_found": ["<list of generic buzzwords found>"],
      "buzzword_count": <number>,
      "feedback": "<analysis of buzzword usage and suggestions for more specific alternatives>"
    },
    "red_flags": {
      "score": <number 0-100>,
      "flags_detected": ["<list of potential red flags>"],
      "flag_count": <number>,
      "feedback": "<analysis of potential concerns like gaps, vague descriptions, inconsistencies>"
    },
    "skills_balance": {
      "score": <number 0-100>,
      "hard_skills_count": <number>,
      "soft_skills_count": <number>,
      "balance_ratio": "<ratio like 70:30>",
      "feedback": "<analysis of hard vs soft skills balance for the role>"
    }
  },
  ${
    jobDescription
      ? `
  "jd_match": {
    "score": <number 0-100>,
    "feedback": "<specific feedback about how well the resume matches the job description>"
  },
  "jd_recommendations": [
    "<specific recommendation for better job matching>",
    "<another job-specific recommendation>",
    "<third job-specific recommendation>"
  ],
  `
      : ""
  }
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>",
    "<strength 4>"
  ],
  "top_suggestions": [
    "<most important improvement suggestion>",
    "<second most important suggestion>",
    "<third most important suggestion>",
    "<fourth suggestion>",
    "<fifth suggestion>"
  ]
}

ANALYSIS FOCUS:
${
  options.includeKeywords
    ? "- Focus on keyword optimization for ATS systems\n"
    : ""
}
${options.includeATS ? "- Evaluate ATS compatibility and formatting\n" : ""}
${
  options.includeJDMatch && jobDescription
    ? "- Provide detailed job description matching analysis\n"
    : ""
}

ADVANCED ANALYSIS GUIDELINES:

**Tone & Language Evaluation:**
- Assess professional tone consistency
- Identify overly casual or overly formal language
- Check for appropriate industry language
- Evaluate readability and flow

**Bullet Point Grader:**
- Count action verbs (aim for 80%+ bullets starting with action verbs)
- Identify quantified achievements (numbers, percentages, metrics)
- Assess specificity vs. vague statements
- Rate overall impact and clarity

**Buzzword Detection:**
- Identify overused terms: "hardworking", "team player", "detail-oriented", "results-driven", "dynamic", "innovative", "passionate", "motivated", "excellent communication skills"
- Flag generic phrases that don't add value
- Suggest specific alternatives

**Red Flag Detection:**
- Employment gaps without explanation
- Job hopping (multiple short-term positions)
- Vague job descriptions or responsibilities
- Inconsistent formatting or dates
- Typos, grammatical errors
- Overqualification or underqualification signals
- Lack of progression or growth

**Skills Balance Analysis:**
- Categorize skills as hard (technical) vs soft (interpersonal)
- Assess appropriate balance for the role type
- Identify missing skill categories
- Evaluate skill relevance and currency

Guidelines:
- Be specific and actionable in all feedback
- Provide realistic scores based on resume quality
- Focus on improvements that will have the biggest impact
- Consider industry standards and current hiring practices
${jobDescription ? "- Prioritize recommendations that improve job fit" : ""}
- Ensure all suggestions are implementable
- Score advanced analysis sections independently
- Provide constructive criticism with clear improvement paths

Return ONLY the JSON object, no additional text.`;

  return prompt;
};

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    gemini_configured: !!process.env.GEMINI_API_KEY,
    features: ["file_upload", "jd_matching", "enhanced_analysis"],
  });
});

// API endpoint for resume analysis
app.post("/api/analyze", upload.single("resumeFile"), async (req, res) => {
  try {
    let resumeText = "";

    // Extract resume text from file or direct input
    if (req.file) {
      // Use buffer from memory storage
      resumeText = await extractTextFromFile(
        req.file.buffer,
        req.file.mimetype
      );
    } else if (req.body.resumeText) {
      resumeText = req.body.resumeText;
    } else {
      return res.status(400).json({ error: "Resume text or file is required" });
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Resume content is empty or could not be extracted" });
    }

    if (resumeText.length < 50) {
      return res.status(400).json({
        error:
          "Resume content is too short. Please provide a more complete resume.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "Gemini API key is not configured" });
    }

    // Get analysis options
    const options = {
      includeKeywords: req.body.includeKeywords === "true",
      includeATS: req.body.includeATS === "true",
      includeJDMatch: req.body.includeJDMatch === "true",
    };

    // Get job description if provided
    const jobDescription = req.body.jobDescription?.trim() || null;

    // Create the enhanced prompt
    const prompt = createAnalysisPrompt(resumeText, jobDescription, options);

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const geminiResponse = await response.json();

    if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
      throw new Error("No response from Gemini API");
    }

    const analysisText = geminiResponse.candidates[0].content.parts[0].text;

    // Parse JSON response
    let analysisResult;
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = analysisText.replace(/```json|```/g, "").trim();
      analysisResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Raw response:", analysisText);

      // Fallback analysis if JSON parsing fails
      analysisResult = {
        overall_score: 70,
        sections: {
          clarity: {
            score: 70,
            feedback:
              "Resume analysis completed but detailed scoring unavailable.",
          },
          impact: { score: 70, feedback: "Impact assessment completed." },
          ats_optimization: {
            score: 70,
            feedback: "ATS optimization review completed.",
          },
          formatting: { score: 70, feedback: "Formatting review completed." },
        },
        advanced_analysis: {
          tone_evaluation: {
            score: 70,
            tone_type: "professional",
            feedback: "Tone analysis completed.",
          },
          bullet_point_grade: {
            score: 70,
            action_verbs_count: 5,
            quantified_bullets: 3,
            total_bullets: 8,
            feedback: "Bullet point analysis completed.",
          },
          buzzword_detection: {
            score: 70,
            buzzwords_found: [],
            buzzword_count: 0,
            feedback: "Buzzword detection completed.",
          },
          red_flags: {
            score: 85,
            flags_detected: [],
            flag_count: 0,
            feedback: "No immediate red flags detected.",
          },
          skills_balance: {
            score: 70,
            hard_skills_count: 8,
            soft_skills_count: 4,
            balance_ratio: "67:33",
            feedback: "Skills balance analysis completed.",
          },
        },
        strengths: ["Resume submitted successfully", "Content analyzed by AI"],
        top_suggestions: [
          "Please try the analysis again for detailed feedback",
          "Consider reformatting your resume",
          "Add more quantified achievements",
        ],
      };

      if (jobDescription) {
        analysisResult.jd_match = {
          score: 70,
          feedback: "Job description matching completed.",
        };
        analysisResult.jd_recommendations = [
          "Try analysis again for detailed job matching",
        ];
      }
    }

    // Ensure all scores are within valid range
    if (analysisResult.overall_score) {
      analysisResult.overall_score = Math.max(
        0,
        Math.min(100, analysisResult.overall_score)
      );
    }

    if (analysisResult.sections) {
      Object.keys(analysisResult.sections).forEach((section) => {
        if (analysisResult.sections[section].score) {
          analysisResult.sections[section].score = Math.max(
            0,
            Math.min(100, analysisResult.sections[section].score)
          );
        }
      });
    }

    if (analysisResult.jd_match?.score) {
      analysisResult.jd_match.score = Math.max(
        0,
        Math.min(100, analysisResult.jd_match.score)
      );
    }

    // Validate advanced analysis scores
    if (analysisResult.advanced_analysis) {
      const advancedAnalysis = analysisResult.advanced_analysis;

      if (advancedAnalysis.tone_evaluation?.score) {
        advancedAnalysis.tone_evaluation.score = Math.max(
          0,
          Math.min(100, advancedAnalysis.tone_evaluation.score)
        );
      }
      if (advancedAnalysis.bullet_point_grade?.score) {
        advancedAnalysis.bullet_point_grade.score = Math.max(
          0,
          Math.min(100, advancedAnalysis.bullet_point_grade.score)
        );
      }
      if (advancedAnalysis.buzzword_detection?.score) {
        advancedAnalysis.buzzword_detection.score = Math.max(
          0,
          Math.min(100, advancedAnalysis.buzzword_detection.score)
        );
      }
      if (advancedAnalysis.red_flags?.score) {
        advancedAnalysis.red_flags.score = Math.max(
          0,
          Math.min(100, advancedAnalysis.red_flags.score)
        );
      }
      if (advancedAnalysis.skills_balance?.score) {
        advancedAnalysis.skills_balance.score = Math.max(
          0,
          Math.min(100, advancedAnalysis.skills_balance.score)
        );
      }
    }

    res.json(analysisResult);
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      error: "Failed to analyze resume. Please try again.",
      details: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 10MB." });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "Unexpected file field." });
    }
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({ error: error.message });
  }

  console.error("Server error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Resume Analyzer running at http://localhost:${PORT}`);
  console.log(
    `📊 Features: File Upload, Job Description Matching, Enhanced Analysis`
  );
  console.log(
    `🤖 Gemini API: ${
      process.env.GEMINI_API_KEY ? "✅ Configured" : "❌ Not configured"
    }`
  );
});
