const fetch = require('node-fetch');
const FormData = require('form-data');

class TeXliveService {
  constructor() {
    this.baseUrl = 'https://texlive.net';
    this.compileEndpoint = '/cgi-bin/latexcgi';
  }

  /**
   * Compile LaTeX code to PDF using TeXlive.net API
   * @param {string} latexCode - The LaTeX source code
   * @param {string} filename - Filename for the output (without extension)
   * @returns {Promise<{success: boolean, pdfBuffer?: Buffer, error?: string}>}
   */
  async compileToPDF(latexCode, filename = 'resume') {
    try {
      console.log('🔄 Compiling LaTeX to PDF using TeXlive.net...');
      
      // Create form data for the API request
      const formData = new FormData();
      formData.append('filecontents[]', latexCode);
      formData.append('filename[]', `${filename}.tex`);
      formData.append('engine', 'pdflatex');
      formData.append('return', 'pdf');

      const response = await fetch(this.baseUrl + this.compileEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          ...formData.getHeaders(),
          'User-Agent': 'ResumeAnalyzer/1.0'
        },
        timeout: 30000 // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/pdf')) {
        // Success - got PDF back
        const pdfBuffer = await response.buffer();
        
        console.log('✅ LaTeX compilation successful');
        console.log(`📄 PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
        
        return {
          success: true,
          pdfBuffer: pdfBuffer,
          size: pdfBuffer.length,
          contentType: 'application/pdf'
        };
      } else {
        // Error response - likely HTML with error message
        const errorText = await response.text();
        console.error('❌ LaTeX compilation failed:', errorText.substring(0, 500));
        
        return {
          success: false,
          error: this.parseErrorMessage(errorText),
          rawError: errorText
        };
      }
    } catch (error) {
      console.error('❌ TeXlive API error:', error);
      
      return {
        success: false,
        error: `Compilation failed: ${error.message}`,
        details: error.toString()
      };
    }
  }

  /**
   * Alternative method using a different TeXlive endpoint if needed
   */
  async compileToBase64(latexCode, filename = 'resume') {
    try {
      const result = await this.compileToPDF(latexCode, filename);
      
      if (result.success && result.pdfBuffer) {
        return {
          success: true,
          base64: result.pdfBuffer.toString('base64'),
          size: result.size
        };
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: `Base64 conversion failed: ${error.message}`
      };
    }
  }

  /**
   * Parse error message from HTML response
   */
  parseErrorMessage(htmlError) {
    // Try to extract meaningful error from HTML
    const errorPatterns = [
      /! (.+)/g,  // LaTeX errors start with !
      /Error: (.+)/gi,
      /Fatal error: (.+)/gi,
      /Undefined control sequence (.+)/gi
    ];

    for (const pattern of errorPatterns) {
      const matches = htmlError.match(pattern);
      if (matches && matches.length > 0) {
        return matches.slice(0, 3).join(' | '); // Return first 3 errors
      }
    }

    // Fallback to generic message
    if (htmlError.includes('Undefined control sequence')) {
      return 'LaTeX compilation error: Undefined control sequence. Please check your LaTeX syntax.';
    }
    
    if (htmlError.includes('Emergency stop')) {
      return 'LaTeX compilation error: Emergency stop. Please check for syntax errors.';
    }

    return 'LaTeX compilation failed. Please check your LaTeX syntax and try again.';
  }

  /**
   * Validate LaTeX code before compilation
   */
  validateLaTeX(latexCode) {
    const requiredElements = [
      '\\documentclass',
      '\\begin{document}',
      '\\end{document}'
    ];

    const issues = [];

    requiredElements.forEach(element => {
      if (!latexCode.includes(element)) {
        issues.push(`Missing required element: ${element}`);
      }
    });

    // Check for balanced braces
    const openBraces = (latexCode.match(/\{/g) || []).length;
    const closeBraces = (latexCode.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      issues.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
    }

    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Get compilation statistics
   */
  getStats() {
    return {
      service: 'TeXlive.net',
      endpoint: this.baseUrl + this.compileEndpoint,
      supportedEngines: ['pdflatex', 'xelatex', 'lualatex'],
      maxFileSize: '10MB',
      timeout: '30 seconds'
    };
  }
}

module.exports = TeXliveService;
