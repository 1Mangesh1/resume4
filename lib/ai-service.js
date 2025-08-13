const { google } = require("@ai-sdk/google");
const { generateText, generateObject, streamText } = require("ai");
const { z } = require("zod");
const {
  PromptBuilder,
  PromptTemplates,
  ConversationManager,
  PromptSecurity,
} = require("./prompt-system");
const LaTeXResumeGenerator = require("./latex-generator");
const TeXliveService = require("./texlive-service");

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

  // Simplified optional generator outputs - still complex enough for frontend
  resume_summary: z
    .object({
      optimized_summary: z.string(),
      keyword_density: z.number(),
      improvement_suggestions: z.array(z.string()),
    })
    .optional(),
  tailored_resume: z
    .object({
      tailored_summary: z.string(),
      match_percentage: z.number(),
    })
    .optional(),
  cover_letter: z
    .object({
      full_letter: z.string(),
      word_count: z.number(),
    })
    .optional(),
  linkedin_summary: z
    .object({
      linkedin_summary: z.string(),
      optimization_score: z.number(),
    })
    .optional(),
  latex_resume: z
    .object({
      latex_source: z.string(),
      template_used: z.string(),
    })
    .optional(),
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
    this.model = google("gemini-2.0-flash");
    this.conversationManager = new ConversationManager();
    this.latexGenerator = new LaTeXResumeGenerator();
    this.texliveService = new TeXliveService();

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
        generatorSections += `\n- resume_summary (REQUIRED): Object with optimized_summary (string), keyword_density (number 0-100), improvement_suggestions (array of strings).`;
      }
      if (generatorOptions.includeVariantGen) {
        generatorSections += `\n- tailored_resume (REQUIRED): Object with tailored_summary (string) and match_percentage (number 0-100).`;
      }
      if (generatorOptions.includeCoverGen) {
        generatorSections += `\n- cover_letter (REQUIRED): Object with full_letter (string) and word_count (number).`;
      }
      if (generatorOptions.includeLinkedInGen) {
        generatorSections += `\n- linkedin_summary (REQUIRED): Object with linkedin_summary (string) and optimization_score (number 0-100).`;
      }
      if (generatorOptions.includeLatexGen) {
        generatorSections += `\n- latex_resume (REQUIRED): Object with latex_source (string with LaTeX code) and template_used (string).`;
      }

      let outputFormat = PromptTemplates.RESUME_ANALYSIS.outputFormat;

      if (generatorSections.length > 0) {
        // Include generator instructions when generators are requested
        outputFormat = outputFormat.replace(
          "{{GENERATOR_SECTIONS}}",
          generatorSections.trim()
        );
      } else {
        // Remove generator instructions completely when no generators requested
        outputFormat = outputFormat.replace(
          /IMPORTANT: If any of the following generator sections are requested[\s\S]*?Keep each generator response concise and focused\./,
          "IMPORTANT: Do NOT include any optional generator content (resume_summary, tailored_resume, cover_letter, linkedin_summary, latex_resume) in your response."
        );
      }

      console.log("🔥 Final outputFormat sent to AI:");
      console.log(outputFormat.substring(0, 500) + "...");

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
          }. ${
            generatorSections.length > 0
              ? "CRITICAL: You MUST generate content for ALL requested generator sections listed in the output format. Each section marked as (REQUIRED) must be included in your response. Do not skip any requested sections. This is mandatory."
              : "IMPORTANT: Do NOT generate any optional generator content (resume_summary, tailored_resume, cover_letter, linkedin_summary, latex_resume) unless explicitly requested in the output format."
          }`
        )
        .setOutputFormat(outputFormat);

      const messages = promptBuilder.buildMessages();

      // Create dynamic schema based on requested generators
      const dynamicSchema = this.createDynamicSchema(generatorOptions);

      const { object } = await generateObject({
        model: this.model,
        schema: dynamicSchema,
        messages,
        maxTokens: 8000, // Further increased limit for multiple generators
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

      // Debug: Log what sections the AI actually generated
      console.log("🔍 AI Response sections:", {
        resume_summary_exists: object.resume_summary !== undefined,
        tailored_resume_exists: object.tailored_resume !== undefined,
        cover_letter_exists: object.cover_letter !== undefined,
        linkedin_summary_exists: object.linkedin_summary !== undefined,
        latex_resume_exists: object.latex_resume !== undefined,
      });

      // Post-process LaTeX generation if requested
      if (generatorOptions.includeLatexGen) {
        try {
          // Check if AI generated LaTeX content
          if (
            object.latex_resume &&
            object.latex_resume.latex_source &&
            object.latex_resume.latex_source.length > 100 &&
            !object.latex_resume.latex_source.startsWith("%")
          ) {
            // Use AI-generated LaTeX (with our enhanced formatting)
            console.log("✅ Using AI-generated LaTeX with enhanced formatting");
            object.latex_resume.template_used = "ai-enhanced-modern.tex";
          } else {
            // Fallback: Generate LaTeX using our template
            console.log("⚠️ AI LaTeX not available, using template fallback");
            const resumeData = this.extractResumeData(resumeText, object);
            const latexCode = this.latexGenerator.generateFromJSON(resumeData);

            object.latex_resume = {
              latex_source: latexCode,
              template_used: "resume-modern.tex",
            };
          }

          console.log("✅ LaTeX resume ready for PDF generation");
        } catch (latexError) {
          console.error("❌ LaTeX generation error:", latexError);
          // Set a minimal latex_resume object as fallback
          object.latex_resume = {
            latex_source: "% LaTeX generation failed",
            template_used: "resume-modern.tex",
          };
        }
      }

      // Filter out generator fields that weren't requested
      const filteredObject = { ...object };

      if (!generatorOptions.includeSummaryGen) {
        delete filteredObject.resume_summary;
      }
      if (!generatorOptions.includeVariantGen) {
        delete filteredObject.tailored_resume;
      }
      if (!generatorOptions.includeCoverGen) {
        delete filteredObject.cover_letter;
      }
      if (!generatorOptions.includeLinkedInGen) {
        delete filteredObject.linkedin_summary;
      }
      if (!generatorOptions.includeLatexGen) {
        delete filteredObject.latex_resume;
      }

      console.log("🎯 Final response after filtering:", {
        has_resume_summary: !!filteredObject.resume_summary,
        has_tailored_resume: !!filteredObject.tailored_resume,
        has_cover_letter: !!filteredObject.cover_letter,
        has_linkedin_summary: !!filteredObject.linkedin_summary,
        has_latex_resume: !!filteredObject.latex_resume,
      });

      // Double-check: remove any fields with default/placeholder values
      if (
        filteredObject.resume_summary?.optimized_summary === "default string"
      ) {
        console.log("🧹 Removing resume_summary with default values");
        delete filteredObject.resume_summary;
      }
      if (
        filteredObject.tailored_resume?.tailored_summary === "default string"
      ) {
        console.log("🧹 Removing tailored_resume with default values");
        delete filteredObject.tailored_resume;
      }
      if (filteredObject.cover_letter?.full_letter === "default string") {
        console.log("🧹 Removing cover_letter with default values");
        delete filteredObject.cover_letter;
      }
      if (
        filteredObject.linkedin_summary?.linkedin_summary === "default string"
      ) {
        console.log("🧹 Removing linkedin_summary with default values");
        delete filteredObject.linkedin_summary;
      }

      return filteredObject;
    } catch (error) {
      console.error("Resume analysis error:", error);
      throw new Error(`Resume analysis failed: ${error.message}`);
    }
  }

  /**
   * Create dynamic schema based on requested generators
   */
  createDynamicSchema(generatorOptions = {}) {
    console.log("🔧 Creating dynamic schema for generators:", generatorOptions);

    // Base schema always includes core analysis
    let schemaObject = {
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
          tone_type: z.enum([
            "professional",
            "casual",
            "formal",
            "conversational",
          ]),
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
    };

    // Only add generator fields if they're actually requested
    if (generatorOptions.includeSummaryGen) {
      console.log("✅ Adding resume_summary to schema");
      schemaObject.resume_summary = z.object({
        optimized_summary: z.string(),
        keyword_density: z.number(),
        improvement_suggestions: z.array(z.string()),
      });
    }

    if (generatorOptions.includeVariantGen) {
      console.log("✅ Adding tailored_resume to schema");
      schemaObject.tailored_resume = z.object({
        tailored_summary: z.string(),
        match_percentage: z.number(),
      });
    }

    if (generatorOptions.includeCoverGen) {
      console.log("✅ Adding cover_letter to schema");
      schemaObject.cover_letter = z.object({
        full_letter: z.string(),
        word_count: z.number(),
      });
    }

    if (generatorOptions.includeLinkedInGen) {
      console.log("✅ Adding linkedin_summary to schema");
      schemaObject.linkedin_summary = z.object({
        linkedin_summary: z.string(),
        optimization_score: z.number(),
      });
    }

    if (generatorOptions.includeLatexGen) {
      console.log("✅ Adding latex_resume to schema");
      schemaObject.latex_resume = z.object({
        latex_source: z.string(),
        template_used: z.string(),
      });
    }

    const dynamicSchema = z.object(schemaObject);

    console.log("🎯 Dynamic schema created with generators:", {
      includeSummaryGen: !!schemaObject.resume_summary,
      includeVariantGen: !!schemaObject.tailored_resume,
      includeCoverGen: !!schemaObject.cover_letter,
      includeLinkedInGen: !!schemaObject.linkedin_summary,
      includeLatexGen: !!schemaObject.latex_resume,
    });

    console.log("🔧 Schema keys:", Object.keys(schemaObject));

    return dynamicSchema;
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

  /**
   * Extract structured resume data from text and AI analysis
   */
  extractResumeData(resumeText, aiAnalysis) {
    // Use AI analysis to get better structured data when available
    const lines = resumeText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    // Extract contact information more intelligently
    const emailMatch = resumeText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const phoneMatch = resumeText.match(
      /(\+?1?)[\s\-]?\(?([0-9]{3})\)?[\s\-]?([0-9]{3})[\s\-]?([0-9]{4})/
    );
    const linkedinMatch = resumeText.match(/linkedin\.com\/in\/[\w\-]+/i);

    // Extract name - first line that's not an email/phone/title
    let name = "Your Name";
    for (const line of lines.slice(0, 3)) {
      if (
        !line.includes("@") &&
        !line.match(/[\d\-\(\)\+\s]{8,}/) &&
        !this.isJobTitle(line) &&
        line.length > 2 &&
        line.length < 50
      ) {
        name = line;
        break;
      }
    }

    // If still no name found, use first line that looks like a name
    if (name === "Your Name" && lines.length > 0) {
      const firstLine = lines[0];
      if (
        firstLine.split(" ").length >= 2 &&
        firstLine.split(" ").length <= 4
      ) {
        name = firstLine;
      }
    }

    return {
      personal: {
        name: name,
        email: emailMatch ? emailMatch[0] : "your.email@example.com",
        phone: phoneMatch ? phoneMatch[0] : "+1 (555) 123-4567",
        linkedin: linkedinMatch
          ? linkedinMatch[0]
          : "linkedin.com/in/yourprofile",
        location: this.extractLocation(resumeText) || "Your City, State",
      },
      summary: aiAnalysis.resume_summary
        ? aiAnalysis.resume_summary.optimized_summary
        : "Professional summary highlighting key achievements and skills.",
      education: this.extractEducation(resumeText),
      experience: this.extractExperience(resumeText),
      projects: this.extractProjects(resumeText),
      skills: this.extractSkills(resumeText, aiAnalysis),
    };
  }

  /**
   * Check if a line looks like a job title
   */
  isJobTitle(line) {
    const jobTitles = [
      "engineer",
      "developer",
      "manager",
      "analyst",
      "scientist",
      "designer",
      "architect",
      "consultant",
      "specialist",
      "coordinator",
      "director",
      "lead",
      "senior",
      "junior",
      "intern",
      "trainee",
    ];
    return jobTitles.some((title) => line.toLowerCase().includes(title));
  }

  /**
   * Extract location information
   */
  extractLocation(resumeText) {
    // Look for common location patterns
    const locationPatterns = [
      /([A-Za-z\s]+),\s*([A-Z]{2})/g, // City, State
      /([A-Za-z\s]+),\s*([A-Za-z\s]+)/g, // City, Country
    ];

    for (const pattern of locationPatterns) {
      const match = resumeText.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  /**
   * Extract education information
   */
  extractEducation(resumeText) {
    const educationSections = [];
    const lines = resumeText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    // Education patterns and keywords
    const educationKeywords = [
      "education",
      "bachelor",
      "master",
      "phd",
      "university",
      "college",
      "institute",
      "degree",
    ];
    const degreePatterns = [
      /b\.?\s*tech|bachelor|b\.?\s*sc|b\.?\s*e|b\.?\s*eng/i,
      /m\.?\s*tech|master|m\.?\s*sc|m\.?\s*e|m\.?\s*eng|mba/i,
      /ph\.?d|doctorate/i,
    ];

    let educationFound = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();

      // Check if this line indicates start of education section
      if (educationKeywords.some((keyword) => lineLower.includes(keyword))) {
        educationFound = true;

        // Look for degree pattern in current and next few lines
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          const degreeMatch = degreePatterns.find((pattern) =>
            pattern.test(lines[j])
          );
          if (degreeMatch) {
            const degreeLine = lines[j];
            const yearMatch = lines
              .slice(j, j + 3)
              .join(" ")
              .match(/20\d{2}/g);

            // Look for institution in nearby lines
            let institution = "University Name";
            for (
              let k = Math.max(0, j - 2);
              k < Math.min(j + 3, lines.length);
              k++
            ) {
              if (
                k !== j &&
                (lines[k].toLowerCase().includes("university") ||
                  lines[k].toLowerCase().includes("college") ||
                  lines[k].toLowerCase().includes("institute"))
              ) {
                institution = lines[k];
                break;
              }
            }

            educationSections.push({
              degree: degreeLine,
              institution: institution,
              year: yearMatch ? yearMatch[yearMatch.length - 1] : "2023",
              gpa: this.extractGPA(
                lines.slice(Math.max(0, j - 2), j + 3).join(" ")
              ),
            });

            i = j + 2; // Skip processed lines
            break;
          }
        }
      }
    }

    // Fallback: If no proper education found, create a default one
    if (educationSections.length === 0) {
      educationSections.push({
        degree: "Bachelor of Science in Computer Science",
        institution: "University Name",
        year: "2023",
        gpa: null,
      });
    }

    return educationSections;
  }

  /**
   * Extract GPA from text
   */
  extractGPA(text) {
    const gpaMatch =
      text.match(/gpa[:\s]*(\d+\.?\d*)/i) ||
      text.match(/(\d+\.?\d*)\s*\/\s*(\d+)/);
    if (gpaMatch) {
      return gpaMatch[1];
    }
    return null;
  }

  /**
   * Extract work experience
   */
  extractExperience(resumeText) {
    const experiences = [];
    const lines = resumeText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    // Job title patterns
    const jobTitlePatterns = [
      /engineer|developer|analyst|manager|designer|architect|consultant|specialist|coordinator|director|lead|senior|junior|intern|trainee/i,
    ];

    // Company patterns
    const companyIndicators = [
      "llc",
      "inc",
      "corp",
      "ltd",
      "pvt",
      "technologies",
      "solutions",
      "systems",
      "software",
    ];

    // Date patterns
    const datePattern = /(\d{4}|\w+\s+\d{4})/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for job titles
      if (jobTitlePatterns.some((pattern) => pattern.test(line))) {
        let title = line;
        let company = "Company Name";
        let period = "Present";
        let achievements = [];

        // Look for company in nearby lines
        for (
          let j = Math.max(0, i - 2);
          j < Math.min(i + 3, lines.length);
          j++
        ) {
          if (j !== i) {
            const checkLine = lines[j].toLowerCase();
            if (
              companyIndicators.some((indicator) =>
                checkLine.includes(indicator)
              ) ||
              checkLine.includes("—") ||
              checkLine.includes("•")
            ) {
              company = lines[j].replace(/[—•]/g, "").trim();
              break;
            }
          }
        }

        // Look for date range in nearby lines
        for (
          let j = Math.max(0, i - 1);
          j < Math.min(i + 3, lines.length);
          j++
        ) {
          const dates = lines[j].match(datePattern);
          if (dates && dates.length >= 1) {
            if (dates.length === 1) {
              period = `${dates[0]} - Present`;
            } else {
              period = `${dates[0]} - ${dates[dates.length - 1]}`;
            }
            break;
          }
        }

        // Collect achievements from following lines (bullet points or descriptive text)
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          const achievementLine = lines[j];
          if (
            achievementLine.startsWith("•") ||
            achievementLine.startsWith("-") ||
            achievementLine.includes("developed") ||
            achievementLine.includes("managed") ||
            achievementLine.includes("led") ||
            achievementLine.includes("improved")
          ) {
            achievements.push(achievementLine.replace(/^[•\-]\s*/, ""));
          } else if (
            jobTitlePatterns.some((pattern) => pattern.test(achievementLine))
          ) {
            // Stop if we hit another job title
            break;
          }
        }

        experiences.push({
          title: title,
          company: company,
          period: period,
          achievements: achievements.slice(0, 3), // Limit to 3 achievements
        });

        // Skip the lines we've processed
        i += Math.min(achievements.length + 2, 4);
      }
    }

    // Default experience if none found
    if (experiences.length === 0) {
      experiences.push({
        title: "Software Developer",
        company: "Company Name",
        period: "2022 - Present",
        achievements: [
          "Developed and maintained web applications",
          "Collaborated with cross-functional teams",
          "Improved system performance by 30%",
        ],
      });
    }

    return experiences.slice(0, 3); // Limit to 3 experiences for clean LaTeX
  }

  /**
   * Extract projects
   */
  extractProjects(resumeText) {
    const projects = [];
    const lines = resumeText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    // Project indicators
    const projectKeywords = [
      "project",
      "portfolio",
      "github",
      "application",
      "system",
      "app",
      "website",
      "platform",
    ];
    const techKeywords = [
      "javascript",
      "python",
      "react",
      "node",
      "django",
      "angular",
      "vue",
      "html",
      "css",
    ];

    let inProjectsSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();

      // Check if we're entering projects section
      if (lineLower.includes("project") && lineLower.length < 20) {
        inProjectsSection = true;
        continue;
      }

      // Look for project names
      if (
        inProjectsSection ||
        projectKeywords.some((keyword) => lineLower.includes(keyword))
      ) {
        // Skip lines that are too long or look like descriptions
        if (
          line.length > 100 ||
          line.includes("•") ||
          line.includes("developed")
        ) {
          continue;
        }

        let projectName = line;
        let technologies = "JavaScript, React, Node.js";
        let description = "Description of the project and key achievements";

        // Look for technologies in nearby lines
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const techLine = lines[j].toLowerCase();
          if (techKeywords.some((tech) => techLine.includes(tech))) {
            technologies = lines[j];
            break;
          }
        }

        // Look for description in nearby lines
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const descLine = lines[j];
          if (
            descLine.length > 20 &&
            !techKeywords.some((tech) => descLine.toLowerCase().includes(tech))
          ) {
            description = descLine.replace(/^[•\-]\s*/, "");
            break;
          }
        }

        // Only add if it looks like a real project
        if (projectName.length > 3 && projectName.length < 80) {
          projects.push({
            name: projectName,
            technologies: technologies,
            description: description,
          });

          if (projects.length >= 3) break; // Limit to 3 projects
        }

        i += 2; // Skip some lines to avoid duplicates
      }
    }

    // Default project if none found
    if (projects.length === 0) {
      projects.push({
        name: "Portfolio Website",
        technologies: "JavaScript, React, Node.js",
        description:
          "Built a responsive portfolio website showcasing projects and skills",
      });
    }

    return projects.slice(0, 3); // Limit to 3 projects
  }

  /**
   * Extract skills
   */
  extractSkills(resumeText, aiAnalysis) {
    const skills = {
      technical: [],
      tools: [],
      languages: [],
      soft: [],
    };

    // Comprehensive skill keywords
    const techSkills = [
      "javascript",
      "python",
      "java",
      "typescript",
      "c++",
      "c#",
      "php",
      "ruby",
      "go",
      "rust",
      "react",
      "angular",
      "vue",
      "svelte",
      "node",
      "express",
      "django",
      "flask",
      "spring",
      "html",
      "css",
      "sass",
      "less",
      "bootstrap",
      "tailwind",
    ];

    const toolSkills = [
      "git",
      "docker",
      "kubernetes",
      "jenkins",
      "terraform",
      "ansible",
      "aws",
      "azure",
      "gcp",
      "firebase",
      "vercel",
      "heroku",
      "mysql",
      "postgresql",
      "mongodb",
      "redis",
      "elasticsearch",
    ];

    const languageSkills = [
      "english",
      "spanish",
      "french",
      "german",
      "chinese",
      "japanese",
      "hindi",
      "marathi",
    ];

    const softSkills = [
      "leadership",
      "communication",
      "teamwork",
      "problem solving",
      "analytical thinking",
      "project management",
      "time management",
      "adaptability",
      "creativity",
      "collaboration",
    ];

    const resumeLower = resumeText.toLowerCase();

    // Extract technical skills
    techSkills.forEach((skill) => {
      if (resumeLower.includes(skill)) {
        const formattedSkill = this.formatSkillName(skill);
        if (!skills.technical.includes(formattedSkill)) {
          skills.technical.push(formattedSkill);
        }
      }
    });

    // Extract tools and technologies
    toolSkills.forEach((tool) => {
      if (resumeLower.includes(tool)) {
        const formattedTool = this.formatSkillName(tool);
        if (!skills.tools.includes(formattedTool)) {
          skills.tools.push(formattedTool);
        }
      }
    });

    // Extract languages
    languageSkills.forEach((lang) => {
      if (resumeLower.includes(lang)) {
        const formattedLang = lang.charAt(0).toUpperCase() + lang.slice(1);
        if (!skills.languages.includes(formattedLang)) {
          skills.languages.push(formattedLang);
        }
      }
    });

    // Extract soft skills
    softSkills.forEach((skill) => {
      if (resumeLower.includes(skill)) {
        const formattedSkill = skill
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        if (!skills.soft.includes(formattedSkill)) {
          skills.soft.push(formattedSkill);
        }
      }
    });

    // Defaults if categories are empty
    if (skills.technical.length === 0) {
      skills.technical = ["JavaScript", "Python", "HTML", "CSS"];
    }
    if (skills.tools.length === 0) {
      skills.tools = ["Git", "Docker", "AWS"];
    }
    if (skills.languages.length === 0) {
      skills.languages = ["English"];
    }
    if (skills.soft.length === 0) {
      skills.soft = ["Problem Solving", "Team Collaboration", "Communication"];
    }

    // Limit each category to reasonable numbers for LaTeX formatting
    skills.technical = skills.technical.slice(0, 6);
    skills.tools = skills.tools.slice(0, 4);
    skills.languages = skills.languages.slice(0, 3);
    skills.soft = skills.soft.slice(0, 4);

    return skills;
  }

  /**
   * Format skill names properly
   */
  formatSkillName(skill) {
    const specialCases = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      nodejs: "Node.js",
      reactjs: "React.js",
      angularjs: "Angular.js",
      vuejs: "Vue.js",
      html: "HTML",
      css: "CSS",
      sql: "SQL",
      aws: "AWS",
      gcp: "GCP",
      api: "API",
      rest: "REST",
      json: "JSON",
      xml: "XML",
    };

    return (
      specialCases[skill.toLowerCase()] ||
      skill.charAt(0).toUpperCase() + skill.slice(1)
    );
  }

  /**
   * Generate the best possible LaTeX resume
   */
  async generateBestResume(resumeText, analysisData = null) {
    try {
      const sanitizedResume = PromptSecurity.sanitizeInput(resumeText);
      const delimitedResume = PromptSecurity.delimitText(
        sanitizedResume,
        "RESUME_CONTENT"
      );

      // Include analysis data if available
      let backgroundData = delimitedResume;
      if (analysisData) {
        backgroundData += `\n\n===ANALYSIS_CONTEXT===\n${JSON.stringify(
          analysisData,
          null,
          2
        )}`;
      }
      const promptBuilder = new PromptBuilder()
        .setTaskContext(
          "You are an expert LaTeX resume designer and professional career writer with deep knowledge of ATS optimization, minimalistic typography, and print-safe formatting."
        )
        .setToneContext(
          "Concise, modern, results-focused, and space-efficient. Resume must use impactful bullet points, strong action verbs, quantifiable results, and be scannable by both humans and ATS."
        )
        .setBackgroundData(backgroundData)
        .setTaskDescription(
          "Rewrite, optimize, and format the resume into a visually appealing, single-page professional LaTeX file with excellent spacing, alignment, and strategic bolding. Ensure the output meaningfully improves the resume content — not just reformatting — by rewriting bullets for clarity, impact, and measurable outcomes.",
          [
            // --- FORMATTING & PACKAGE RULES ---
            "Use only these LaTeX packages: article, fullpage, titlesec, enumitem, ragged2e, amsmath, amssymb, hyperref, geometry, latexsym.",
            "Hyperlinks must use hyperref with options: colorlinks=true, linkcolor=blue, urlcolor=blue, citecolor=blue.",
            "Use \\documentclass[10pt]{article} for compactness.",
            "Set page margins with \\geometry{left=0.75in,right=0.75in,top=0.6in,bottom=0.6in} to fit more content.",
            "Set \\setlength{\\parindent}{0pt} for clean paragraph formatting.",
            "Use \\RaggedRight for professional text alignment.",
            // --- ONE-PAGE & SPACING RULES ---
            "Fit content onto a single page unless have larger resume like very experienced candidate; do not add excessive blank lines but must not look too crowded .",
            "Reduce vertical whitespace: keep \\vspace between entries minimal (1pt) or none if possible.",
            "Use compact list formatting: \\setlist[itemize]{leftmargin=15pt, topsep=0pt, parsep=0pt, partopsep=0pt, itemsep=2pt}.",
            "Remove filler text; prioritize brevity without losing meaning.",
            // --- VISUAL HIERARCHY & SPACING RULES ---
            "Header (Name): Use {\\LARGE \\textbf{FULL NAME}} for prominent display large size and bold.",
            "Contact Info: Place email, phone, LinkedIn, GitHub on the same line each with hyperlink, separated by $\\cdot$ with proper spacing, ending with \\\\.",
            "Section Headers: Use \\section*{\\Large Section Name} for clear hierarchy.",
            "Experience/Education Layout: CRITICAL - follow this format exactly:",
            "  \textbf{Job Title/Degree} \\hfill Time Period \\\\",
            "  Company/Institution \textendash{} Location \\\\",
            "  (Always end each of the above lines with `\\\\` for proper LaTeX line breaks.)",
            // --- DASH USAGE RULES ---
            "CRITICAL: Use proper LaTeX dash commands for consistent PDF output:",
            "  - Company - Location: Use \textendash{} (e.g., 'Tech Corp\textendash{} San Francisco')",
            "  - Date ranges: Use \textendash{} (e.g., 'Jan 2022\textendash{} Present')",
            "  - Degree - Field: Use \textendash{} (e.g., 'Bachelor of Science\textendash{} Computer Science')",
            "  - NEVER use plain hyphens (-) or em dashes (—) or double hyphens (--)",
            "  - Always use \textendash{} with proper spacing: '\textendash{} '",
            // --- STRATEGIC BOLDING RULES ---
            "Bold ONLY:",
            "  - Full name in header",
            "  - Job titles in experience",
            "  - Degree names in education",
            "  - Project names in projects section",
            "  - Category labels in skills",
            "Do NOT bold company names, universities, locations, dates, or bullet content.",
            // --- BULLET REWRITE RULES ---
            "Rewrite all bullets to:",
            "  - Start with a strong action verb (Designed, Developed, Optimized, Led, Automated, Improved, Deployed, Implemented).",
            "  - Include quantifiable results (% improvement, time saved, revenue impact, etc.).",
            "  - State business/technical impact of the action.",
            "  - Avoid vague phrases like 'Responsible for' or 'Worked on'.",
            "  - Keep each bullet one concise sentence.",
            "  - Use present tense for current roles, past tense for previous roles.",
            // --- CONTENT ORGANIZATION RULES ---
            "Order sections: Header, Education, Skills, Experience, Projects, Certifications/Achievements.",
            "Group skills into logical categories with bold labels.",
            "Ensure each line and bullet ends with proper LaTeX line breaks (\\\\) where needed.",
            "Make resume scannable by humans and ATS.",
            // --- TECHNICAL RULES ---
            "Output must be fully self-contained and compilable.",
            "No tables, columns, or complex layouts that break ATS parsing.",
            "Use standard LaTeX fonts and formatting only.",
            "Ensure consistent grammar, spelling, and tense.",
          ]
        )
        .setImmediateTask(
          "Generate a visually stunning, compact, single-page LaTeX resume with perfect alignment, minimal whitespace, correct dash usage, strategic bolding, and compelling action-oriented bullet points. Use proper \\hfill alignment for job titles and dates, and always include explicit LaTeX newlines (\\\\) where required."
        )
        .setOutputFormat(
          "Return only the complete LaTeX code, starting with \\documentclass and ending with \\end{document}. Must compile without errors."
        );

      const messages = promptBuilder.buildMessages();

      const { text } = await generateText({
        model: this.model,
        messages,
        maxTokens: 4000,
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

      // Clean up the response to ensure it's pure LaTeX
      let latexCode = text.trim();

      // Remove any markdown code block markers
      latexCode = latexCode.replace(/```latex\n?/g, "");
      latexCode = latexCode.replace(/```\n?/g, "");

      // Ensure it starts with \documentclass
      if (!latexCode.startsWith("\\documentclass")) {
        const docStart = latexCode.indexOf("\\documentclass");
        if (docStart > -1) {
          latexCode = latexCode.substring(docStart);
        }
      }

      // Post-process: ensure xcolor is included when HTML color definitions are present
      try {
        const usesHtmlDefineColor =
          /\\definecolor\{[^}]+\}\{HTML\}\{[0-9A-Fa-f]{6}\}/.test(latexCode);
        const hasXcolor = /\\usepackage(\[[^\]]*\])?\{xcolor\}/.test(latexCode);
        if (usesHtmlDefineColor && !hasXcolor) {
          // Inject \usepackage{xcolor} right after \documentclass line
          latexCode = latexCode.replace(
            /(\\documentclass[^\n]*\n)/,
            `$1\\usepackage{xcolor}\n`
          );
        }
      } catch (_) {}

      return {
        success: true,
        latex_code: latexCode,
        // Avoid long GET preview URLs that can exceed server limits; use server-side compile instead.
        preview_url: null,
        message: "Professional LaTeX resume generated successfully",
      };
    } catch (error) {
      console.error("Best resume generation error:", error);
      return {
        success: false,
        error: `Resume generation failed: ${error.message}`,
        latex_code: null,
      };
    }
  }

  /**
   * Compile LaTeX to PDF using TeXlive.net
   */
  async compileLaTeXToPDF(latexCode, filename = "resume") {
    try {
      console.log("🔄 Compiling LaTeX to PDF...");

      const result = await this.texliveService.compileToPDF(
        latexCode,
        filename
      );

      if (result.success) {
        console.log("✅ PDF compilation successful");
        return {
          success: true,
          pdfBuffer: result.pdfBuffer,
          size: result.size,
          contentType: result.contentType,
        };
      } else {
        console.error("❌ PDF compilation failed:", result.error);
        return {
          success: false,
          error: result.error,
          details: result.rawError,
        };
      }
    } catch (error) {
      console.error("❌ PDF compilation error:", error);
      return {
        success: false,
        error: `PDF compilation failed: ${error.message}`,
      };
    }
  }
}

module.exports = {
  AIService,
  ResumeAnalysisSchema,
  SummaryGenerationSchema,
  CoverLetterSchema,
  LinkedInOptimizationSchema,
};
