
const { google } = require("@ai-sdk/google");
const { generateText, generateObject, streamText } = require("ai");
const { z } = require("zod");
const {
  PromptBuilder,
  PromptTemplates,
  ConversationManager,
  PromptSecurity,
} = require("./prompt-system");


const ResumeAnalysisSchema = z.object({
  overall_score: z.number().min(0).max(100),
  sections: z.object({
    clarity: z.object({
      score: z.number().min(0).max(100),
      feedback: z.string(),
    }),
    impact: z.object({
      score: z.number().min(0).max(100),
      feedback: z.string(),
    }),
    ats_optimization: z.object({
      score: z.number().min(0).max(100),
      feedback: z.string(),
    }),
    formatting: z.object({
      score: z.number().min(0).max(100),
      feedback: z.string(),
    }),
  }),
  advanced_analysis: z.object({
    tone_evaluation: z.object({
      score: z.number().min(0).max(100),
      tone_type: z.enum(["professional", "casual", "formal", "conversational"]),
      feedback: z.string(),
    }),
    bullet_point_grade: z.object({
      score: z.number().min(0).max(100),
      action_verbs_count: z.number(),
      quantified_bullets: z.number(),
      total_bullets: z.number(),
      feedback: z.string(),
    }),
    buzzword_detection: z.object({
      score: z.number().min(0).max(100),
      buzzwords_found: z.array(z.string()),
      buzzword_count: z.number(),
      feedback: z.string(),
    }),
    red_flags: z.object({
      score: z.number().min(0).max(100),
      flags_detected: z.array(z.string()),
      flag_count: z.number(),
      feedback: z.string(),
    }),
    skills_balance: z.object({
      score: z.number().min(0).max(100),
      hard_skills_count: z.number(),
      soft_skills_count: z.number(),
      balance_ratio: z.string(),
      feedback: z.string(),
    }),
  }),
  jd_match: z
    .object({
      score: z.number().min(0).max(100),
      feedback: z.string(),
    })
    .optional(),
  jd_recommendations: z.array(z.string()).optional(),
  strengths: z.array(z.string()),
  top_suggestions: z.array(z.string()),
  
  // Simplified optional generator outputs - make required when requested
  resume_summary: z.string().optional(),
  tailored_resume: z.string().optional(),
  cover_letter: z.string().optional(),
  linkedin_summary: z.string().optional(),
  latex_resume: z.string().optional(),
});

const SummaryGenerationSchema = z.object({
  summary: z.string(),
  explanation: z.string(),
  keywords: z.array(z.string()),
  metrics_highlighted: z.array(z.string()),
  improvement_tips: z.array(z.string()),
});

const CoverLetterSchema = z.object({
  cover_letter: z.object({
    greeting: z.string(),
    introduction: z.string(),
    body_paragraph_1: z.string(),
    body_paragraph_2: z.string(),
    body_paragraph_3: z.string().optional(),
    closing: z.string(),
    signature: z.string(),
  }),
  full_letter: z.string(),
  personalization_elements: z.array(z.string()),
  key_strengths_highlighted: z.array(z.string()),
  word_count: z.number(),
  tone_analysis: z.string(),
  improvement_suggestions: z.array(z.string()),
});

const LinkedInOptimizationSchema = z.object({
  linkedin_summary: z.string(),
  keyword_density: z.object({
    primary_keywords: z.array(z.string()),
    secondary_keywords: z.array(z.string()),
    industry_terms: z.array(z.string()),
  }),
  structure_analysis: z.object({
    hook_strength: z.string(),
    story_flow: z.string(),
    cta_effectiveness: z.string(),
  }),
  optimization_score: z.number().min(0).max(100),
  character_count: z.number(),
  readability_tips: z.array(z.string()),
  profile_completion_tips: z.array(z.string()),
});

class AIService {
  constructor() {
    this.model = google("gemini-1.5-flash");
    this.conversationManager = new ConversationManager();

    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error(
        "GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set"
      );
    }
  }

  async analyzeResume(
    resumeText,
    jobDescription = null,
    options = {},
    generatorOptions = {}
  ) {
    try {
      
      const sanitizedResume = PromptSecurity.sanitizeInput(resumeText);
      const sanitizedJobDescription = jobDescription
        ? PromptSecurity.sanitizeInput(jobDescription)
        : null;

      
      const delimitedResume = PromptSecurity.delimitText(
        sanitizedResume,
        "RESUME_CONTENT"
      );
      const delimitedJobDescription = sanitizedJobDescription
        ? PromptSecurity.delimitText(sanitizedJobDescription, "JOB_DESCRIPTION")
        : null;

      
      const hasJobDescription = !!jobDescription;
      const taskDescription = hasJobDescription
        ? `Analyze the provided resume content against the job description and provide detailed, actionable feedback with specific JD match analysis.`
        : `Analyze the provided resume content and provide detailed, actionable feedback focusing on general resume optimization and industry best practices.`;


      
      let generatorSections = "";
      if (generatorOptions.includeSummaryGen) {
        generatorSections += `\n- resume_summary (REQUIRED): Generate a concise professional summary (2-3 sentences, max 100 words). Return as a single string.`;
      }
      if (generatorOptions.includeVariantGen) {
        generatorSections += `\n- tailored_resume (REQUIRED): Generate key improvements and optimizations for the resume (max 200 words). Focus on summary enhancements, not full resume rewrite. Return as a formatted string.`;
      }
      if (generatorOptions.includeCoverGen) {
        generatorSections += `\n- cover_letter (REQUIRED): Generate a concise cover letter (max 250 words). Return as a complete formatted letter string.`;
      }
      if (generatorOptions.includeLinkedInGen) {
        generatorSections += `\n- linkedin_summary (REQUIRED): Generate a LinkedIn About section (max 150 words). Return as a formatted string.`;
      }
      if (generatorOptions.includeLatexGen) {
        generatorSections += `\n- latex_resume (REQUIRED): Generate key LaTeX formatting suggestions (max 100 words). Do not generate full LaTeX code. Return as a string.`;
      }

      
      let outputFormat = PromptTemplates.RESUME_ANALYSIS.outputFormat;
      outputFormat = outputFormat.replace("{{GENERATOR_SECTIONS}}", generatorSections.trim());

      const promptBuilder = new PromptBuilder()
        .setTaskContext(PromptTemplates.RESUME_ANALYSIS.taskContext)
        .setToneContext(PromptTemplates.RESUME_ANALYSIS.toneContext)
        .setBackgroundData(
          delimitedResume +
            (delimitedJobDescription ? "\n\n" + delimitedJobDescription : "")
        )
        .setTaskDescription(
          taskDescription,
          PromptTemplates.RESUME_ANALYSIS.rules
        )
        .setExamples(PromptTemplates.RESUME_ANALYSIS.examples)
        .setConversationHistory(this.conversationManager.getHistory())
        .setImmediateTask(
          `Please analyze this resume${
            hasJobDescription ? " against the provided job description" : ""
          } and provide comprehensive feedback${
            hasJobDescription
              ? " including JD match analysis"
              : " focusing on general optimization"
          }. ${generatorSections.length > 0 ? 'CRITICAL: You MUST generate content for ALL requested generator sections listed in the output format. Each section marked as (REQUIRED) must be included in your response. Do not skip any requested sections. This is mandatory.' : ''}`
        )
        .setOutputFormat(outputFormat);

      const messages = promptBuilder.buildMessages();

      
      const { object } = await generateObject({
        model: this.model,
        schema: ResumeAnalysisSchema,
        messages,
        maxTokens: 4000, // Limit output tokens to prevent truncation
        providerOptions: {
          google: {
            safetySettings: [
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          },
        },
      });

      // Add to conversation history
      this.conversationManager.addMessage("user", `Resume analysis request`);
      this.conversationManager.addMessage(
        "assistant",
        `Analysis completed with score: ${object.overall_score}`
      );

      // Debug log to see what generators were requested and returned
      console.log("Generator options requested:", generatorOptions);
      console.log("Generator sections in response:", {
        has_resume_summary: !!object.resume_summary,
        has_tailored_resume: !!object.tailored_resume,
        has_cover_letter: !!object.cover_letter,
        has_linkedin_summary: !!object.linkedin_summary,
        has_latex_resume: !!object.latex_resume,
      });

      return object;
    } catch (error) {
      console.error("Resume analysis error:", error);
      throw new Error(`Resume analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate professional summary
   */
  async generateSummary(resumeText, targetRole = null) {
    try {
      const sanitizedResume = PromptSecurity.sanitizeInput(resumeText);
      const sanitizedTargetRole = targetRole
        ? PromptSecurity.sanitizeInput(targetRole)
        : null;

      const delimitedResume = PromptSecurity.delimitText(
        sanitizedResume,
        "RESUME_CONTENT"
      );
      const delimitedRole = sanitizedTargetRole
        ? PromptSecurity.delimitText(sanitizedTargetRole, "TARGET_ROLE")
        : "";

      const promptBuilder = new PromptBuilder()
        .setTaskContext(
          "You are an expert resume writer and career coach specializing in creating compelling professional summaries."
        )
        .setToneContext("Professional, engaging, and results-focused")
        .setBackgroundData(
          delimitedResume + (delimitedRole ? "\n\n" + delimitedRole : "")
        )
        .setTaskDescription(
          "Generate a compelling professional summary that showcases value proposition and key achievements.",
          [
            "Length: 3-4 powerful sentences (60-80 words)",
            "Include 2-3 quantified achievements or metrics",
            "Highlight 3-4 most relevant skills/technologies",
            "Match tone to industry standards",
            "Avoid generic buzzwords",
          ]
        )
        .setConversationHistory(this.conversationManager.getHistory())
        .setImmediateTask(
          "Create a professional summary that will grab recruiters' attention"
        )
        .setOutputFormat(
          "JSON response with summary, explanation, keywords, metrics, and improvement tips"
        );

      const messages = promptBuilder.buildMessages();

      const { object } = await generateObject({
        model: this.model,
        schema: SummaryGenerationSchema,
        messages,
        providerOptions: {
          google: {},
        },
      });

      return object;
    } catch (error) {
      console.error("Summary generation error:", error);
      throw new Error(`Summary generation failed: ${error.message}`);
    }
  }

  /**
   * Generate cover letter
   */
  async generateCoverLetter(
    resumeText,
    jobDescription = null,
    companyName = null
  ) {
    try {
      const sanitizedResume = PromptSecurity.sanitizeInput(resumeText);
      const sanitizedJobDescription = jobDescription
        ? PromptSecurity.sanitizeInput(jobDescription)
        : null;
      const sanitizedCompanyName = companyName
        ? PromptSecurity.sanitizeInput(companyName)
        : "[Company Name]";

      const delimitedResume = PromptSecurity.delimitText(
        sanitizedResume,
        "RESUME_CONTENT"
      );
      const delimitedJD = sanitizedJobDescription
        ? PromptSecurity.delimitText(sanitizedJobDescription, "JOB_DESCRIPTION")
        : null;
      const companyInfo = `COMPANY NAME: ${sanitizedCompanyName}`;

      
      let backgroundData = delimitedResume;
      if (delimitedJD) {
        backgroundData += "\n\n" + delimitedJD;
      }
      backgroundData += "\n\n" + companyInfo;

      const hasJobDescription = !!jobDescription;
      const taskDescription = hasJobDescription
        ? "Create a compelling, personalized cover letter that positions the candidate as the ideal fit for the specific role."
        : "Create a compelling, general cover letter that showcases the candidate's key strengths and achievements.";

      const immediateTask = hasJobDescription
        ? "Generate a persuasive cover letter that showcases relevant achievements and cultural fit for the specific role"
        : "Generate a persuasive cover letter that showcases key achievements and professional value";

      const promptBuilder = new PromptBuilder()
        .setTaskContext(PromptTemplates.COVER_LETTER_GENERATION.taskContext)
        .setToneContext(PromptTemplates.COVER_LETTER_GENERATION.toneContext)
        .setBackgroundData(backgroundData)
        .setTaskDescription(
          taskDescription,
          PromptTemplates.COVER_LETTER_GENERATION.rules
        )
        .setConversationHistory(this.conversationManager.getHistory())
        .setImmediateTask(immediateTask)
        .setOutputFormat(PromptTemplates.COVER_LETTER_GENERATION.outputFormat);

      const messages = promptBuilder.buildMessages();

      const { object } = await generateObject({
        model: this.model,
        schema: CoverLetterSchema,
        messages,
        providerOptions: {
          google: {},
        },
      });

      return object;
    } catch (error) {
      console.error("Cover letter generation error:", error);
      throw new Error(`Cover letter generation failed: ${error.message}`);
    }
  }

  /**
   * Optimize LinkedIn profile
   */
  async optimizeLinkedIn(resumeText) {
    try {
      const sanitizedResume = PromptSecurity.sanitizeInput(resumeText);
      const delimitedResume = PromptSecurity.delimitText(
        sanitizedResume,
        "RESUME_CONTENT"
      );

      const promptBuilder = new PromptBuilder()
        .setTaskContext(PromptTemplates.LINKEDIN_OPTIMIZATION.taskContext)
        .setToneContext(PromptTemplates.LINKEDIN_OPTIMIZATION.toneContext)
        .setBackgroundData(delimitedResume)
        .setTaskDescription(
          "Create a compelling LinkedIn About section that attracts recruiters and showcases personality.",
          PromptTemplates.LINKEDIN_OPTIMIZATION.rules
        )
        .setConversationHistory(this.conversationManager.getHistory())
        .setImmediateTask(
          "Optimize LinkedIn profile for maximum visibility and engagement"
        )
        .setOutputFormat(PromptTemplates.LINKEDIN_OPTIMIZATION.outputFormat);

      const messages = promptBuilder.buildMessages();

      const { object } = await generateObject({
        model: this.model,
        schema: LinkedInOptimizationSchema,
        messages,
        providerOptions: {
          google: {},
        },
      });

      return object;
    } catch (error) {
      console.error("LinkedIn optimization error:", error);
      throw new Error(`LinkedIn optimization failed: ${error.message}`);
    }
  }

  /**
   * Stream response for real-time feedback
   */
  async streamAnalysis(resumeText, jobDescription = null) {
    try {
      const sanitizedResume = PromptSecurity.sanitizeInput(resumeText);
      const sanitizedJobDescription = jobDescription
        ? PromptSecurity.sanitizeInput(jobDescription)
        : null;

      const delimitedResume = PromptSecurity.delimitText(
        sanitizedResume,
        "RESUME_CONTENT"
      );
      const delimitedJobDescription = sanitizedJobDescription
        ? PromptSecurity.delimitText(sanitizedJobDescription, "JOB_DESCRIPTION")
        : null;

      
      const hasJobDescription = !!jobDescription;
      const streamTaskDescription = hasJobDescription
        ? "Provide a step-by-step analysis of the resume against the job description, explaining your reasoning as you go."
        : "Provide a step-by-step analysis of the resume, explaining your reasoning as you go.";

      const streamImmediateTask = hasJobDescription
        ? "Analyze this resume against the job description step by step, showing your thinking process"
        : "Analyze this resume step by step, showing your thinking process";

      const promptBuilder = new PromptBuilder()
        .setTaskContext(PromptTemplates.RESUME_ANALYSIS.taskContext)
        .setToneContext(PromptTemplates.RESUME_ANALYSIS.toneContext)
        .setBackgroundData(
          delimitedResume +
            (delimitedJobDescription ? "\n\n" + delimitedJobDescription : "")
        )
        .setTaskDescription(
          streamTaskDescription,
          PromptTemplates.RESUME_ANALYSIS.rules
        )
        .setConversationHistory(this.conversationManager.getHistory())
        .setImmediateTask(streamImmediateTask)
        .setOutputFormat(
          "Provide analysis in a conversational format, explaining each evaluation step."
        );

      const messages = promptBuilder.buildMessages();

      const { textStream } = await streamText({
        model: this.model,
        messages,
        providerOptions: {
          google: {},
        },
      });

      return textStream;
    } catch (error) {
      console.error("Stream analysis error:", error);
      throw new Error(`Stream analysis failed: ${error.message}`);
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationManager.clearHistory();
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationManager.getHistory();
  }
}

module.exports = {
  AIService,
  ResumeAnalysisSchema,
  SummaryGenerationSchema,
  CoverLetterSchema,
  LinkedInOptimizationSchema,
};
