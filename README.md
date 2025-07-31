# 🚀 AI Resume Analyzer - Complete Edition

A comprehensive, AI-powered web application that analyzes resumes using Google's Gemini AI and provides detailed feedback with advanced job matching capabilities and content generation tools.

## 🎉 Recent Updates

- **🚀 Single API Call Optimization** - All generators now run in one combined API call (6 calls → 1 call)
- **✅ Fixed Copy LaTeX Button** - Enhanced clipboard functionality with fallback support
- **📥 Added PDF Download** - Instant PDF generation via TeXlive.net online service
- **🔄 Background Processing** - LaTeX-to-PDF rendering without local dependencies
- **⚠️ Improved Error Handling** - Graceful fallback to Overleaf.com when needed
- **🎨 Enhanced UI** - Better button styling and user feedback with toast notifications
- **🔧 Enhanced JSON Parsing** - Better handling of Gemini API responses
- **🛡️ Improved Security** - Better input validation and error handling
- **📊 Better Error Messages** - More helpful error messages with suggestions

## ✨ Complete Feature Set

### 📄 **Multiple Input Methods**

- **📝 Text Input** - Paste your resume directly into the text editor
- **📁 File Upload** - Support for PDF, DOCX, and TXT files (up to 5MB)
- **🖱️ Drag & Drop** - Intuitive file upload interface with visual feedback
- **🔄 Flexible Switching** - Easy toggle between input methods

### 🎯 **Core Analysis Engine**

- **🤖 AI-Powered Feedback** - Powered by Google Gemini 1.5 Flash
- **📊 4 Core Metrics** - Comprehensive scoring system (0-100):
  - **📝 Clarity** - Readability, structure, and communication effectiveness
  - **💥 Impact** - Quantified achievements and results-oriented content
  - **🎯 ATS Optimization** - Keyword usage and applicant tracking system compatibility
  - **🎨 Formatting** - Professional presentation and visual organization
- **⚡ Instant Results** - Get comprehensive feedback in under 10 seconds
- **🔧 Configurable Analysis** - Choose specific metrics to focus on

### 🎯 **Advanced Analysis Features**

- **🎭 Tone Evaluation** - Assessment of professional voice and consistency
- **🔸 Bullet Point Analysis** - Action verb usage and quantification scoring
- **🚩 Buzzword Detection** - Identifies and suggests alternatives to generic terms
- **⚠️ Red Flag Detection** - Spots potential concerns and gaps
- **⚖️ Skills Balance Analysis** - Hard vs. soft skills ratio optimization
- **📈 Advanced Insights** - Detailed recommendations and improvement strategies

### 💼 **Job Description Matching**

- **🎯 JD Match Score** - Precise alignment scoring (0-100)
- **📋 Targeted Recommendations** - Job-specific improvement suggestions
- **🔍 Skills Gap Analysis** - Identify missing keywords and requirements
- **🏢 Industry-Specific Feedback** - Tailored advice based on job context
- **📊 Compatibility Assessment** - ATS and recruiter-friendly formatting checks

### 🤖 **AI Content Generators**

- **📝 Resume Summary Generator** - Professional summaries with keyword optimization
- **🎯 Tailored Resume Generator** - Job-specific resume variants with ATS optimization
- **💌 Cover Letter Generator** - Personalized cover letters with strategic positioning
- **🔗 LinkedIn Summary Optimizer** - Optimized LinkedIn "About" sections with keyword density analysis
- **📄 LaTeX Resume Generator** - Generate professional LaTeX resumes with instant PDF download

### 🎨 **Modern UI/UX**

- **🌓 Dark/Light Theme** - Automatic theme detection with manual toggle
- **📱 Responsive Design** - Perfect experience on all devices
- **💫 Glass Morphism** - Modern glass-effect design elements
- **🎯 Tab-Based Interface** - Intuitive navigation between features
- **📊 Visual Progress Bars** - Clear score visualization with animations
- **📋 Copy-to-Clipboard** - Easy content copying with visual feedback
- **💡 Pro Tips** - Contextual help and guidance
- **🔄 Smooth Animations** - Polished transitions and micro-interactions

### 🛡️ **Security & Privacy**

- **🔒 Input Sanitization** - Advanced protection against prompt injection
- **📋 Delimited Processing** - Secure text processing with clear boundaries
- **✅ File Validation** - Strict file type and size checking
- **🗑️ Automatic Cleanup** - Temporary files removed after processing
- **🛡️ Error Handling** - Comprehensive error management and user feedback

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Google Gemini API key** (free from Google AI Studio)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd resume4
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Create a `.env` file in the root directory:

   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit the file and add your API key
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Get your Gemini API key**:

   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key
   - Copy the key to your `.env` file

5. **Start the server**:

   ```bash
   npm start
   ```

6. **Open your browser**:

   Navigate to `http://localhost:3000`

## 🔧 Troubleshooting

### Common Issues

**❌ "API not configured" error**

- Make sure you have set the `GEMINI_API_KEY` environment variable
- Check that your API key is valid and has quota remaining

**❌ "LaTeX compilation failed" error**

- This is expected if LaTeX is not installed locally
- Use the "Download .tex" option and compile with online services like Overleaf.com

**❌ "File upload failed" error**

- Check file size (max 5MB)
- Ensure file is PDF, DOCX, or TXT format
- Try refreshing the page and uploading again

**❌ "JSON parsing error"**

- This has been fixed with enhanced JSON parsing
- If you still see this, try refreshing the page

### Development Setup

For development with enhanced logging:

```bash
# Set development mode
export NODE_ENV=development

# Start with debug logging
npm start
```

### Production Deployment

For production deployment:

```bash
# Set production mode
export NODE_ENV=production

# Start the server
npm start
```

## 📊 API Usage

The application uses Google's Gemini API with the following limits:

- **Free tier**: 50 requests per day
- **Rate limiting**: Automatic handling with user-friendly messages
- **Fallback mode**: Demo mode available when quota is exceeded

## 🛡️ Security Features

- **Input sanitization** prevents prompt injection attacks
- **File validation** ensures only safe file types are processed
- **Rate limiting** prevents abuse and ensures fair usage
- **Error handling** provides safe fallbacks for all operations

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the server logs for detailed error information
3. Create an issue with detailed steps to reproduce the problem

---

**Made with ❤️ using Google Gemini AI**
