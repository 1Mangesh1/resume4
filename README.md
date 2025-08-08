# 🚀 AI Resume Analyzer - Complete Edition

A comprehensive, AI-powered web application that analyzes resumes using Google's Gemini AI and provides detailed feedback with advanced job matching capabilities, content generation tools, and professional LaTeX resume generation.

## 🎉 Latest Features

- **🌟 NEW: Generate Best Resume** - AI-powered clean LaTeX resume generation with server-side preview
- **🚀 Single API Call Optimization** - All generators run in one combined API call (6 calls → 1 call)
- **✅ Enhanced LaTeX Generation** - Professional ATS-friendly templates with instant preview
- **📥 PDF Download** - Instant PDF generation via server (no TeX Live required)
- **🔄 Background Processing** - LaTeX-to-PDF rendering without local dependencies
- **⚠️ Improved Error Handling** - Graceful fallback and comprehensive error management
- **🎨 Enhanced UI** - Modern glass morphism design with smooth animations
- **🔧 Enhanced JSON Parsing** - Better handling of Gemini API responses
- **🛡️ Advanced Security** - Input sanitization and prompt injection protection

## ✨ Complete Feature Set

### 📄 **Multiple Input Methods**

- **📝 Text Input** - Paste your resume directly into the text editor
- **📁 File Upload** - Support for PDF, DOCX, and TXT files (up to 5MB)
- **🖱️ Drag & Drop** - Intuitive file upload interface with visual feedback
- **🔄 Flexible Switching** - Easy toggle between input methods

### 🎯 **Core Analysis Engine**

- **🤖 AI-Powered Feedback** - Powered by Google Gemini 2.0 Flash
- **📊 4 Core Metrics** - Comprehensive scoring system (0-100):
  - **📝 Clarity** - Readability, structure, and communication effectiveness
  - **💥 Impact** - Quantified achievements and results-oriented content
  - **🎯 ATS Optimization** - Keyword usage and applicant tracking system compatibility
  - **🎨 Formatting** - Professional presentation and visual organization
- **⚡ Instant Results** - Get comprehensive feedback in under 10 seconds
- **🔧 Configurable Analysis** - Choose specific metrics to focus on

### 🔍 **Advanced Analysis Features**

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
- **📄 LaTeX Resume Generator** - Generate professional LaTeX resumes with instant PDF compilation

### 🌟 **Generate Best Resume Feature**

- **🤖 AI-Powered LaTeX Generation** - Creates clean, professional LaTeX code from scratch
- **🎨 ATS-Friendly Templates** - Modern designs optimized for applicant tracking systems
- **🔗 TeX-Less Server Option** - Instant preview and PDF generation via pure Node (no TeX Live)
- **📋 One-Click Copy** - Copy LaTeX code to clipboard with visual confirmation
- **📄 Professional Output** - Industry-standard resume formatting and structure
- **⚡ Fast Generation** - Complete LaTeX resume in seconds
- **🔄 Analysis Integration** - Uses existing resume analysis for enhanced output

### 🎨 **Modern UI/UX**

- **🌓 Dark/Light Theme** - Automatic theme detection with manual toggle
- **📱 Responsive Design** - Perfect experience on all devices (mobile, tablet, desktop)
- **💫 Glass Morphism** - Modern glass-effect design elements with blur effects
- **🎯 Tab-Based Interface** - Intuitive navigation between features
- **📊 Visual Progress Bars** - Clear score visualization with smooth animations
- **📋 Copy-to-Clipboard** - Easy content copying with visual feedback
- **💡 Pro Tips** - Contextual help and guidance throughout the app
- **🔄 Smooth Animations** - Polished transitions and micro-interactions
- **🎭 Loading States** - Animated spinners and progress indicators
- **🎨 Tailwind CSS** - Utility-first styling for consistent design

### 🛡️ **Security & Privacy**

- **🔒 Input Sanitization** - Advanced protection against prompt injection attacks
- **📋 Delimited Processing** - Secure text processing with clear boundaries
- **✅ File Validation** - Strict file type and size checking
- **🗑️ Automatic Cleanup** - Temporary files removed after processing
- **🛡️ Error Handling** - Comprehensive error management and user feedback
- **🔐 API Security** - Safe handling of API keys and sensitive data

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
   GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here
   ```

4. **Get your Gemini API key**:

   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key
   - Copy the key to your `.env` file

5. **Start the server**:

   ```bash
   npm start
   # or
   node server.js
   ```

6. **Open your browser**:

   Navigate to `http://localhost:3000`

## 🎯 How to Use

### 1. **Resume Analysis**
1. Choose input method (text or file upload)
2. Paste resume text or upload PDF/DOCX file
3. Optionally add job description for targeted analysis
4. Select analysis features you want
5. Click "Analyze Resume"
6. Review detailed scores and feedback

### 2. **Generate Best Resume**
1. Complete resume analysis first
2. Click "Generate Best Resume" button
3. Wait for AI to generate professional LaTeX code
4. Preview inline (server-side compile)
5. Copy LaTeX code for further editing
6. Download PDF directly from the server

Optional: TeX-Less PDF (no TeX Live)
- POST /api/generate-pdf with JSON { "latexCode": "..." }
- Streams a PDF generated with Node (latex.js + pdfkit)

### 3. **Content Generation**
- Enable specific generators during analysis
- Get AI-generated summaries, cover letters, and LinkedIn content
- Copy generated content for immediate use

## 🔧 Technical Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload handling
- **Google AI SDK** - Gemini API integration
- **PDF-Parse** - PDF text extraction
- **Mammoth** - DOCX text extraction

### Frontend
- **Vanilla JavaScript** - Client-side functionality
- **Tailwind CSS** - Utility-first styling
- **HTML5** - Modern semantic markup
- **CSS3** - Advanced styling and animations

### AI & Processing
- **Google Gemini 2.0 Flash** - Advanced language model
- **Structured Prompts** - Optimized prompt engineering
- **Token Management** - Efficient API usage
- **Error Recovery** - Robust error handling

## 🔧 Troubleshooting

### Common Issues

**❌ "API not configured" error**
- Make sure you have set the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable
- Check that your API key is valid and has quota remaining
- Restart the server after setting the environment variable

**❌ "LaTeX compilation failed" error**
- Try the "Generate Best Resume" feature for better LaTeX output
- Use TeXlive.net preview for instant PDF generation
- Check LaTeX syntax if editing manually

**❌ "File upload failed" error**
- Check file size (max 5MB)
- Ensure file is PDF, DOCX, or TXT format
- Try refreshing the page and uploading again

**❌ "Generate Best Resume not working"**
- Ensure you've completed resume analysis first
- Check browser console for JavaScript errors
- Verify server is running and API is responding

**❌ "Preview not opening"**
- Check if popup blockers are enabled
- Try copying LaTeX code and opening TeXlive.net manually
- Ensure internet connection for external preview

### Development Setup

For development with enhanced logging:

```bash
# Set development mode
export NODE_ENV=development

# Start with debug logging
npm run dev
```

### Production Deployment

For production deployment:

```bash
# Set production mode
export NODE_ENV=production

# Start the server
npm start
```

## 📊 API Usage & Limits

The application uses Google's Gemini API with the following considerations:

- **Free tier**: 15 requests per minute, 1500 requests per day
- **Rate limiting**: Automatic handling with user-friendly messages
- **Token limits**: Optimized prompts for efficient usage
- **Fallback mode**: Demo mode available when quota is exceeded

## 🌟 Advanced Features

### LaTeX Resume Generation
- Professional templates with modern design
- ATS-optimized formatting
- Instant preview capability
- One-click PDF generation
- Clean, compilable LaTeX code

### Prompt Engineering
- Advanced prompt security and sanitization
- Structured output schemas for consistent results
- Context-aware generation based on analysis
- Optimized token usage for cost efficiency

### Error Handling
- Graceful degradation when services are unavailable
- User-friendly error messages with actionable advice
- Automatic retry mechanisms for transient failures
- Comprehensive logging for debugging

## 🛡️ Security Features

- **Input sanitization** prevents prompt injection attacks
- **File validation** ensures only safe file types are processed
- **Rate limiting** prevents abuse and ensures fair usage
- **Error handling** provides safe fallbacks for all operations
- **CORS protection** secures API endpoints
- **Environment variable protection** keeps sensitive data secure

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

## 🌟 Roadmap

- [ ] **Multi-language support** - Resume analysis in multiple languages
- [ ] **Template library** - Multiple LaTeX templates to choose from
- [ ] **Resume scoring history** - Track improvement over time
- [ ] **Batch processing** - Analyze multiple resumes at once
- [ ] **Integration APIs** - Connect with job boards and ATS systems
- [ ] **Advanced analytics** - Detailed usage and improvement metrics

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the server logs for detailed error information
3. Check browser console for client-side errors
4. Create an issue with detailed steps to reproduce the problem

### Getting Help

- **Documentation**: This README covers all features
- **Issues**: Use GitHub issues for bug reports
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact for urgent production issues

---

**Made with ❤️ using Google Gemini AI and modern web technologies**

*Transform your resume with AI-powered analysis and professional LaTeX generation*
