
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
  resume_summary: z.object({
    optimized_summary: z.string(),
    keyword_density: z.number(),
    improvement_suggestions: z.array(z.string()),
  }).optional(),
  tailored_resume: z.object({
    tailored_summary: z.string(),
    match_percentage: z.number(),
  }).optional(),
  cover_letter: z.object({
    full_letter: z.string(),
    word_count: z.number(),
  }).optional(),
  linkedin_summary: z.object({
    linkedin_summary: z.string(),
    optimization_score: z.number(),
  }).optional(),
  latex_resume: z.object({
    latex_source: z.string(),
    template_used: z.string(),
  }).optional(),
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

      // Post-process LaTeX generation if requested
      if (generatorOptions.includeLatexGen && object.latex_resume) {
        try {
          // Generate structured resume data from AI analysis
          const resumeData = this.extractResumeData(resumeText, object);
          
          // Generate LaTeX using our template
          const latexCode = this.latexGenerator.generateFromJSON(resumeData);
          
          // Update the latex_resume object with our generated code
          object.latex_resume = {
            latex_source: latexCode,
            template_used: "resume-modern.tex"
          };
          
          console.log("✅ LaTeX resume generated successfully");
        } catch (latexError) {
          console.error("❌ LaTeX generation error:", latexError);
          // Keep the AI-generated latex_resume as fallback
        }
      }

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

  /**
   * Extract structured resume data from text and AI analysis
   */
  extractResumeData(resumeText, aiAnalysis) {
    // Basic regex patterns to extract information
    const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line);
    
    // Extract basic info (simplified extraction)
    const emailMatch = resumeText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const phoneMatch = resumeText.match(/(\+?1?)[\s\-]?\(?([0-9]{3})\)?[\s\-]?([0-9]{3})[\s\-]?([0-9]{4})/);
    const linkedinMatch = resumeText.match(/linkedin\.com\/in\/[\w\-]+/i);
    
    // Try to extract name (first non-empty line, often the name)
    const name = lines[0] || "Your Name";
    
    return {
      personal: {
        name: name,
        email: emailMatch ? emailMatch[0] : "your.email@example.com",
        phone: phoneMatch ? phoneMatch[0] : "+1 (555) 123-4567",
        linkedin: linkedinMatch ? linkedinMatch[0] : "linkedin.com/in/yourprofile",
        location: "Your City, State"
      },
      summary: aiAnalysis.resume_summary ? 
        aiAnalysis.resume_summary.optimized_summary : 
        "Professional summary highlighting key achievements and skills.",
      education: this.extractEducation(resumeText),
      experience: this.extractExperience(resumeText),
      projects: this.extractProjects(resumeText),
      skills: this.extractSkills(resumeText, aiAnalysis)
    };
  }

  /**
   * Extract education information
   */
  extractEducation(resumeText) {
    const educationSections = [];
    const lines = resumeText.split('\n');
    
    // Look for education keywords
    const educationKeywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd', 'certification'];
    let inEducationSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (educationKeywords.some(keyword => line.includes(keyword))) {
        inEducationSection = true;
        
        // Try to extract degree info from current and next few lines
        const nextLines = lines.slice(i, i + 3).join(' ');
        const yearMatch = nextLines.match(/20\d{2}/g);
        
        educationSections.push({
          degree: lines[i].trim() || "Bachelor of Science in Computer Science",
          institution: lines[i + 1]?.trim() || "University Name",
          year: yearMatch ? yearMatch[yearMatch.length - 1] : "2023",
          gpa: null
        });
        
        i += 2; // Skip next lines we already processed
      }
    }
    
    // Default education if none found
    if (educationSections.length === 0) {
      educationSections.push({
        degree: "Bachelor of Science in Computer Science",
        institution: "University Name",
        year: "2023",
        gpa: null
      });
    }
    
    return educationSections;
  }

  /**
   * Extract work experience
   */
  extractExperience(resumeText) {
    const experiences = [];
    const lines = resumeText.split('\n');
    
    // Look for experience keywords
    const experienceKeywords = ['experience', 'work', 'employment', 'position', 'job', 'role'];
    
    // Simple extraction - look for company patterns and dates
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const yearMatch = line.match(/20\d{2}/);
      
      if (yearMatch && i > 0) {
        const prevLine = lines[i - 1];
        const nextLines = lines.slice(i + 1, i + 4);
        
        experiences.push({
          title: prevLine.trim() || "Software Developer",
          company: line.split('-')[0]?.trim() || "Company Name",
          period: yearMatch[0] + " - Present",
          achievements: nextLines.filter(l => l.trim()).slice(0, 3)
        });
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
          "Improved system performance by 30%"
        ]
      });
    }
    
    return experiences;
  }

  /**
   * Extract projects
   */
  extractProjects(resumeText) {
    const projects = [];
    const lines = resumeText.split('\n');
    
    // Look for project keywords
    const projectKeywords = ['project', 'portfolio', 'github', 'application', 'system', 'app'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (projectKeywords.some(keyword => line.includes(keyword))) {
        const nextLines = lines.slice(i + 1, i + 3);
        
        projects.push({
          name: lines[i].trim() || "Project Name",
          technologies: "JavaScript, React, Node.js",
          description: nextLines.join(' ').trim() || "Description of the project and key achievements"
        });
        
        i += 2;
      }
    }
    
    // Default project if none found
    if (projects.length === 0) {
      projects.push({
        name: "Portfolio Website",
        technologies: "JavaScript, React, Node.js",
        description: "Built a responsive portfolio website showcasing projects and skills"
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
      soft: []
    };
    
    // Common technical skills to look for
    const techKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
      'html', 'css', 'sql', 'mongodb', 'postgresql', 'aws', 'docker',
      'kubernetes', 'git', 'linux', 'windows', 'macos'
    ];
    
    const resumeLower = resumeText.toLowerCase();
    
    techKeywords.forEach(skill => {
      if (resumeLower.includes(skill)) {
        if (['javascript', 'python', 'java', 'html', 'css', 'sql'].includes(skill)) {
          skills.technical.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        } else if (['git', 'docker', 'kubernetes', 'aws'].includes(skill)) {
          skills.tools.push(skill.toUpperCase());
        }
      }
    });
    
    // Default skills if none found
    if (skills.technical.length === 0) {
      skills.technical = ['JavaScript', 'Python', 'React', 'Node.js'];
    }
    if (skills.tools.length === 0) {
      skills.tools = ['Git', 'Docker', 'AWS'];
    }
    
    skills.languages = ['English'];
    skills.soft = ['Problem Solving', 'Team Collaboration', 'Communication'];
    
    return skills;
  }

  /**
   * Compile LaTeX to PDF using TeXlive.net
   */
  async compileLaTeXToPDF(latexCode, filename = 'resume') {
    try {
      console.log('🔄 Compiling LaTeX to PDF...');
      
      const result = await this.texliveService.compileToPDF(latexCode, filename);
      
      if (result.success) {
        console.log('✅ PDF compilation successful');
        return {
          success: true,
          pdfBuffer: result.pdfBuffer,
          size: result.size,
          contentType: result.contentType
        };
      } else {
        console.error('❌ PDF compilation failed:', result.error);
        return {
          success: false,
          error: result.error,
          details: result.rawError
        };
      }
    } catch (error) {
      console.error('❌ PDF compilation error:', error);
      return {
        success: false,
        error: `PDF compilation failed: ${error.message}`
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
