const fs = require('fs');
const path = require('path');

class LaTeXResumeGenerator {
  constructor() {
    this.templatePath = path.join(__dirname, '../public/templates/resume-modern.tex');
    this.template = this.loadTemplate();
  }

  loadTemplate() {
    try {
      // Cache the template in memory to avoid repeated disk reads
      if (!this._templateCache) {
        this._templateCache = fs.readFileSync(this.templatePath, 'utf8');
      }
      return this._templateCache;
    } catch (error) {
      console.error('Error loading LaTeX template:', error);
      throw new Error('LaTeX template not found');
    }
  }

  /**
   * Generate LaTeX resume from JSON data
   */
  generateFromJSON(resumeData) {
    let latex = this.template;

    // Replace basic placeholders
    latex = this.replaceBasicInfo(latex, resumeData);
    
    // Replace sections
    latex = this.replaceProfessionalSummary(latex, resumeData);
    latex = this.replaceEducation(latex, resumeData);
    latex = this.replaceSkills(latex, resumeData);
    latex = this.replaceExperience(latex, resumeData);
    latex = this.replaceProjects(latex, resumeData);
    latex = this.replaceAdditionalSections(latex, resumeData);

    return latex;
  }

  /**
   * Alias for generateFromJSON for compatibility
   */
  generateLaTeX(resumeData) {
    return this.generateFromJSON(resumeData);
  }

  /**
   * Replace basic contact information
   */
  replaceBasicInfo(latex, data) {
    const replacements = {
      'FULL_NAME': this.sanitizeLaTeX(data.personal?.name || data.name || 'Your Name'),
      'PHONE': this.sanitizeLaTeX(data.personal?.phone || data.phone || '+1-XXX-XXX-XXXX'),
      'EMAIL': this.sanitizeLaTeX(data.personal?.email || data.email || 'your.email@example.com'),
      'LINKEDIN': data.personal?.linkedin || data.linkedin || 'https://linkedin.com/in/yourprofile',
      'LINKEDIN_TEXT': this.extractLinkText(data.personal?.linkedin || data.linkedin || 'linkedin.com/in/yourprofile'),
      'GITHUB': data.personal?.github || data.github || 'https://github.com/yourusername',
      'GITHUB_TEXT': this.extractLinkText(data.personal?.github || data.github || 'github.com/yourusername'),
      'WEBSITE': data.personal?.website || data.website || 'https://yourwebsite.com',
      'WEBSITE_TEXT': this.extractLinkText(data.personal?.website || data.website || 'yourwebsite.com')
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      latex = latex.replace(regex, value);
    });

    return latex;
  }

  /**
   * Replace professional summary
   */
  replaceProfessionalSummary(latex, data) {
    let summary = '';
    
    if (data.summary) {
      summary = this.sanitizeLaTeX(data.summary);
    } else if (data.professional_summary) {
      summary = this.sanitizeLaTeX(data.professional_summary);
    } else if (data.objective) {
      summary = this.sanitizeLaTeX(data.objective);
    } else {
      summary = 'Experienced professional with a strong background in delivering high-quality solutions and driving business success.';
    }

    return latex.replace(/{{PROFESSIONAL_SUMMARY}}/g, summary);
  }

  /**
   * Replace education section
   */
  replaceEducation(latex, data) {
    let educationItems = '';
    const education = data.education || [];

    if (education.length === 0) {
      educationItems = '\\resumeSubHeadingListStart\n\\resumeSubheading{Your University}{Location}{Degree}{Graduation Date}\n\\resumeSubHeadingListEnd';
    } else {
      educationItems = '\\resumeSubHeadingListStart\n';
      
      education.forEach(edu => {
        const institution = this.sanitizeLaTeX(edu.institution || edu.school || 'University Name');
        const location = this.sanitizeLaTeX(edu.location || 'Location');
        const degree = this.sanitizeLaTeX(edu.degree || edu.field || 'Degree');
        const date = this.sanitizeLaTeX(edu.graduation_date || edu.end_date || edu.year || 'Year');
        
        educationItems += `\\resumeSubheading{${institution}}{${location}}{${degree}}{${date}}\n`;
        
        // Add relevant coursework, GPA, honors if available
        if (edu.gpa || edu.honors || edu.coursework) {
          educationItems += '\\resumeItemListStart\n';
          
          if (edu.gpa) {
            educationItems += `\\resumeItem{GPA: ${this.sanitizeLaTeX(edu.gpa.toString())}}\n`;
          }
          
          if (edu.honors && edu.honors.length > 0) {
            const honorsText = Array.isArray(edu.honors) ? edu.honors.join(', ') : edu.honors;
            educationItems += `\\resumeItem{Honors: ${this.sanitizeLaTeX(honorsText)}}\n`;
          }
          
          if (edu.coursework && edu.coursework.length > 0) {
            const courseworkText = Array.isArray(edu.coursework) ? edu.coursework.join(', ') : edu.coursework;
            educationItems += `\\resumeItem{Relevant Coursework: ${this.sanitizeLaTeX(courseworkText)}}\n`;
          }
          
          educationItems += '\\resumeItemListEnd\n';
        }
      });
      
      educationItems += '\\resumeSubHeadingListEnd';
    }

    return latex.replace(/{{EDUCATION_ITEMS}}/g, educationItems);
  }

  /**
   * Replace skills section
   */
  replaceSkills(latex, data) {
    let skillsSection = '';
    const skills = data.skills || data.technical_skills || [];

    // Check if skills is an object (from extractSkills method) or array
    if (skills && typeof skills === 'object' && !Array.isArray(skills)) {
      // Handle skills object structure from extractSkills
      skillsSection = '\\begin{itemize}[leftmargin=0.1in]\n';
      
      if (skills.technical && skills.technical.length > 0) {
        const skillsText = this.sanitizeLaTeX(skills.technical.join(', '));
        skillsSection += `\\item \\textbf{Programming Languages:} ${skillsText}\n`;
      }
      
      if (skills.tools && skills.tools.length > 0) {
        const skillsText = this.sanitizeLaTeX(skills.tools.join(', '));
        skillsSection += `\\item \\textbf{Tools \\& Technologies:} ${skillsText}\n`;
      }
      
      if (skills.languages && skills.languages.length > 0) {
        const skillsText = this.sanitizeLaTeX(skills.languages.join(', '));
        skillsSection += `\\item \\textbf{Languages:} ${skillsText}\n`;
      }
      
      if (skills.soft && skills.soft.length > 0) {
        const skillsText = this.sanitizeLaTeX(skills.soft.join(', '));
        skillsSection += `\\item \\textbf{Soft Skills:} ${skillsText}\n`;
      }
      
      skillsSection += '\\end{itemize}';
    } else if (Array.isArray(skills) && skills.length > 0) {
      // Handle array structure
      skillsSection = '\\begin{itemize}[leftmargin=0.1in]\n';
      
      // Group skills by category if they have categories
      const skillsByCategory = this.groupSkillsByCategory(skills);
      
      Object.entries(skillsByCategory).forEach(([category, skillList]) => {
        const categoryName = this.sanitizeLaTeX(category);
        const skillsText = this.sanitizeLaTeX(skillList.join(', '));
        skillsSection += `\\item \\textbf{${categoryName}:} ${skillsText}\n`;
      });
      
      skillsSection += '\\end{itemize}';
    } else {
      // Default skills section
      skillsSection = '\\begin{itemize}[leftmargin=0.1in]\n\\item \\textbf{Languages:} Your programming languages here\n\\item \\textbf{Technologies:} Your technologies here\n\\item \\textbf{Tools:} Your tools here\n\\end{itemize}';
    }

    return latex.replace(/{{SKILLS_SECTION}}/g, skillsSection);
  }

  /**
   * Replace experience section
   */
  replaceExperience(latex, data) {
    let experienceItems = '';
    const experience = data.experience || data.work_experience || [];

    if (experience.length === 0) {
      experienceItems = '\\resumeSubHeadingListStart\n\\resumeSubheading{Job Title}{Date Range}{Company Name}{Location}\n\\resumeItemListStart\n\\resumeItem{Achievement or responsibility}\n\\resumeItemListEnd\n\\resumeSubHeadingListEnd';
    } else {
      experienceItems = '\\resumeSubHeadingListStart\n';
      
      experience.forEach(exp => {
        const title = this.sanitizeLaTeX(exp.title || exp.position || 'Job Title');
        const dateRange = this.formatDateRange(exp.start_date, exp.end_date);
        const company = this.sanitizeLaTeX(exp.company || exp.organization || 'Company Name');
        const location = this.sanitizeLaTeX(exp.location || 'Location');
        
        experienceItems += `\\resumeSubheading{${title}}{${dateRange}}{${company}}{${location}}\n`;
        
        // Add bullet points for responsibilities/achievements
        if (exp.responsibilities || exp.achievements || exp.bullets || exp.description) {
          experienceItems += '\\resumeItemListStart\n';
          
          const bullets = exp.responsibilities || exp.achievements || exp.bullets || 
                         (typeof exp.description === 'string' ? [exp.description] : exp.description) || [];
          
          bullets.forEach(bullet => {
            if (typeof bullet === 'string') {
              experienceItems += `\\resumeItem{${this.sanitizeLaTeX(bullet)}}\n`;
            }
          });
          
          experienceItems += '\\resumeItemListEnd\n';
        }
      });
      
      experienceItems += '\\resumeSubHeadingListEnd';
    }

    return latex.replace(/{{EXPERIENCE_ITEMS}}/g, experienceItems);
  }

  /**
   * Replace projects section
   */
  replaceProjects(latex, data) {
    let projectItems = '';
    const projects = data.projects || [];

    if (projects.length === 0) {
      projectItems = '\\resumeSubHeadingListStart\n\\resumeSubheading{Project Name}{Date}{Technologies Used}{}\n\\resumeItemListStart\n\\resumeItem{Project description and key achievements}\n\\resumeItemListEnd\n\\resumeSubHeadingListEnd';
    } else {
      projectItems = '\\resumeSubHeadingListStart\n';
      
      projects.forEach(project => {
        const name = this.sanitizeLaTeX(project.name || project.title || 'Project Name');
        const date = this.sanitizeLaTeX(project.date || project.year || 'Date');
        const technologies = this.sanitizeLaTeX(
          project.technologies ? 
          (Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies) : 
          'Technologies'
        );
        
        projectItems += `\\resumeSubheading{${name}}{${date}}{${technologies}}{}\n`;
        
        // Add project description/bullets
        if (project.description || project.bullets || project.achievements) {
          projectItems += '\\resumeItemListStart\n';
          
          const bullets = project.bullets || project.achievements || 
                         (typeof project.description === 'string' ? [project.description] : project.description) || [];
          
          bullets.forEach(bullet => {
            if (typeof bullet === 'string') {
              projectItems += `\\resumeItem{${this.sanitizeLaTeX(bullet)}}\n`;
            }
          });
          
          projectItems += '\\resumeItemListEnd\n';
        }
      });
      
      projectItems += '\\resumeSubHeadingListEnd';
    }

    return latex.replace(/{{PROJECT_ITEMS}}/g, projectItems);
  }

  /**
   * Replace additional sections (certifications, awards, etc.)
   */
  replaceAdditionalSections(latex, data) {
    let additionalSections = '';

    // Certifications
    if (data.certifications && data.certifications.length > 0) {
      additionalSections += '\\begin{rSection}{CERTIFICATIONS}\n';
      additionalSections += '\\resumeSubHeadingListStart\n';
      
      data.certifications.forEach(cert => {
        const name = this.sanitizeLaTeX(cert.name || cert.title || 'Certification');
        const issuer = this.sanitizeLaTeX(cert.issuer || cert.organization || 'Issuing Organization');
        const date = this.sanitizeLaTeX(cert.date || cert.year || 'Date');
        
        additionalSections += `\\resumeSubheading{${name}}{${date}}{${issuer}}{}\n`;
      });
      
      additionalSections += '\\resumeSubHeadingListEnd\n';
      additionalSections += '\\end{rSection}\n\n';
    }

    // Awards
    if (data.awards && data.awards.length > 0) {
      additionalSections += '\\begin{rSection}{AWARDS \\& HONORS}\n';
      additionalSections += '\\resumeItemListStart\n';
      
      data.awards.forEach(award => {
        const awardText = typeof award === 'string' ? award : 
                         `${award.name || award.title} - ${award.organization || ''} (${award.date || award.year || ''})`;
        additionalSections += `\\resumeItem{${this.sanitizeLaTeX(awardText)}}\n`;
      });
      
      additionalSections += '\\resumeItemListEnd\n';
      additionalSections += '\\end{rSection}\n\n';
    }

    return latex.replace(/{{ADDITIONAL_SECTIONS}}/g, additionalSections);
  }

  /**
   * Helper methods
   */
  sanitizeLaTeX(text) {
    if (!text) return '';
    
    return text.toString()
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\$/g, '\\$')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/#/g, '\\#')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/_/g, '\\_')
      .replace(/~/g, '\\textasciitilde{}');
  }

  extractLinkText(url) {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  formatDateRange(startDate, endDate) {
    const start = startDate || 'Start';
    const end = endDate || 'Present';
    return `${start} -- ${end}`;
  }

  groupSkillsByCategory(skills) {
    const grouped = {};
    
    // Safety check - ensure skills is an array
    if (!Array.isArray(skills)) {
      console.warn('groupSkillsByCategory expects an array, got:', typeof skills);
      return {
        'Languages': ['Add your programming languages'],
        'Technologies': ['Add your technologies'], 
        'Tools': ['Add your tools']
      };
    }
    
    skills.forEach(skill => {
      if (typeof skill === 'string') {
        // If no category, put in 'Technologies'
        if (!grouped['Technologies']) grouped['Technologies'] = [];
        grouped['Technologies'].push(skill);
      } else if (skill.category && skill.name) {
        // If skill has category
        if (!grouped[skill.category]) grouped[skill.category] = [];
        grouped[skill.category].push(skill.name);
      } else if (skill.name) {
        // If skill has name but no category
        if (!grouped['Technologies']) grouped['Technologies'] = [];
        grouped['Technologies'].push(skill.name);
      }
    });

    // If no skills were categorized, create default categories
    if (Object.keys(grouped).length === 0) {
      grouped['Languages'] = ['Add your programming languages'];
      grouped['Technologies'] = ['Add your technologies'];
      grouped['Tools'] = ['Add your tools'];
    }

    return grouped;
  }

  /**
   * Get available LaTeX templates
   * @returns {Promise<Array>} Array of template objects
   */
  async getAvailableTemplates() {
    // Cache the templates to avoid creating a new array on every call
    if (!this._templatesCache) {
      this._templatesCache = [
        {
          id: "resume-modern",
          name: "Modern Resume Template",
          description: "Professional modern resume template with clean formatting",
          file: "resume-modern.tex",
          features: [
            "Clean typography",
            "ATS-friendly",
            "Professional layout",
            "Contact information header"
          ]
        }
      ];
    }
    return this._templatesCache;
  }
}

module.exports = LaTeXResumeGenerator;
