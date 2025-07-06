# �� AI Resume Analyzer - Enhanced Edition

A powerful, AI-driven web application that analyzes resumes using Google's Gemini AI and provides comprehensive feedback with job description matching capabilities.

## ✨ Features

### 📄 **Multiple Input Methods**

- **Text Input** - Paste your resume directly
- **File Upload** - Support for PDF, DOCX, and TXT files (up to 10MB)
- **Drag & Drop** - Intuitive file upload interface

### 🎯 **Advanced Analysis**

- **AI-Powered Feedback** - Powered by Google Gemini 1.5 Flash
- **4 Core Metrics**: Clarity, Impact, ATS Optimization, Formatting
- **Job Description Matching** - Tailored analysis for specific roles
- **Configurable Options** - Keyword optimization, ATS compatibility focus
- **Instant Results** - Get comprehensive feedback in seconds

### 🤖 **Optional AI Generators**

- **📝 Resume Summary Generator** - Auto-generate professional summaries with keyword optimization
- **🎯 Tailored Resume Generator** - Create job-specific resume variants with ATS optimization
- **💌 Cover Letter Generator** - Generate personalized cover letters with strategic positioning
- **🔗 LinkedIn Summary Optimizer** - Optimize LinkedIn "About" sections with keyword density analysis

### 💼 **Job-Specific Features**

- **JD Match Score** - See how well your resume fits the role (0-100)
- **Targeted Recommendations** - Job-specific improvement suggestions
- **Skills Gap Analysis** - Identify missing keywords and requirements
- **Industry-Specific Feedback** - Tailored advice based on job context

### 🎨 **Modern UI/UX**

- **Clean, Responsive Design** - Built with Tailwind CSS
- **Tab-Based Interface** - Easy switching between input methods
- **Visual Progress Bars** - Clear score visualization
- **Real-Time Feedback** - Interactive and engaging user experience

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Google Gemini API key** (free from Google AI Studio)

### Installation

1. **Clone/Download** this repository
2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up Gemini API key**:

   - Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a `.env` file in the project root:

   ```bash
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3000
   ```

4. **Start the server**:

   ```bash
   npm start
   ```

5. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

### 🔑 Gemini API Setup

The application uses Google's Gemini 1.5 Flash model for AI analysis. Here's how to set it up:

1. **Visit [Google AI Studio](https://aistudio.google.com/app/apikey)**
2. **Sign in** with your Google account
3. **Create API Key** - Click "Create API Key" button
4. **Copy the key** and add it to your `.env` file
5. **Restart the server** to apply the changes

**Note**: The Gemini API has a generous free tier that's perfect for resume analysis. If the API is not configured, the application will fall back to mock responses.

## 📋 How to Use

### Method 1: Text Input

1. Click on **"Text Input"** tab
2. Paste your resume text in the textarea
3. Optionally add a job description for targeted analysis
4. Select analysis options (Keywords, ATS, JD Matching)
5. Click **"🔍 Analyze Resume"**

### Method 2: File Upload

1. Click on **"File Upload"** tab
2. Drag & drop or click to upload your resume file
3. Supported formats: **PDF, DOCX, TXT** (max 10MB)
4. Add job description for enhanced matching
5. Configure analysis options
6. Click **"🔍 Analyze Resume"**

### Enhanced Analysis Options

- ✅ **Keyword Optimization** - Focus on ATS-friendly keywords
- ✅ **ATS Compatibility** - Evaluate formatting and structure
- ✅ **Job Description Matching** - Get role-specific recommendations

## 📊 Analysis Results

### Core Metrics (0-100 scoring)

- **📝 Clarity** - Readability and structure
- **💥 Impact** - Quantified achievements and results
- **🎯 ATS Optimization** - Keyword usage and ATS compatibility
- **🎨 Formatting** - Professional presentation and organization

### Job-Specific Analysis (when JD provided)

- **🎯 JD Match Score** - How well resume fits the specific role
- **💡 Job-Specific Recommendations** - Targeted improvement suggestions
- **🔍 Skills Gap Identification** - Missing keywords and requirements

### Actionable Feedback

- **✅ Strengths** - What's working well in your resume
- **💡 Top Suggestions** - Most impactful improvements to make
- **🎯 JD Recommendations** - Role-specific enhancements

## 🔧 Technical Stack

### Frontend

- **HTML5** with semantic structure
- **Tailwind CSS** for responsive design
- **Vanilla JavaScript** for interactivity
- **File APIs** for drag & drop functionality

### Backend

- **Node.js** with Express.js framework
- **Multer** for file upload handling
- **PDF-Parse** for PDF text extraction
- **Mammoth** for DOCX text extraction
- **Google Gemini API** for AI analysis

### File Processing

- **PDF Support** - Full text extraction from PDF files
- **DOCX Support** - Text extraction from Word documents
- **TXT Support** - Direct text file reading
- **File Validation** - Type checking and size limits
- **Automatic Cleanup** - Temporary files removed after processing

## 🛡️ Security & Validation

- **File Type Validation** - Only PDF, DOCX, TXT allowed
- **File Size Limits** - Maximum 10MB per file
- **Automatic Cleanup** - Uploaded files deleted after processing
- **Error Handling** - Comprehensive error messages and fallbacks
- **Input Sanitization** - Safe handling of user content

## 🎯 Use Cases

### For Job Seekers

- **Resume Optimization** - Improve your resume before applying
- **ATS Compatibility** - Ensure your resume passes screening systems
- **Job Matching** - Tailor your resume for specific roles
- **Skills Assessment** - Identify areas for improvement

### For Career Coaches

- **Client Assessment** - Provide data-driven feedback
- **Industry Standards** - Compare against best practices
- **Progress Tracking** - Monitor improvement over time
- **Professional Guidance** - Support coaching sessions with metrics

### For Recruiters

- **Quick Assessment** - Evaluate candidate resumes efficiently
- **Standardized Feedback** - Consistent evaluation criteria
- **Time Saving** - Automated initial screening insights

## 🚀 Performance

- **Fast Analysis** - Results in under 10 seconds
- **Efficient Processing** - Optimized file handling
- **Scalable Architecture** - Ready for multiple users
- **Responsive Design** - Works on all devices

## 🔄 API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and configured features.

### Resume Analysis

```
POST /api/analyze
```

**Form Data:**

- `resumeFile` (optional) - Resume file (PDF/DOCX/TXT)
- `resumeText` (optional) - Resume text content
- `jobDescription` (optional) - Job description for matching
- `includeKeywords` - Enable keyword optimization
- `includeATS` - Enable ATS compatibility check
- `includeJDMatch` - Enable job description matching

## 📈 Sample Analysis

```json
{
  "overall_score": 85,
  "sections": {
    "clarity": { "score": 90, "feedback": "Well-structured and readable" },
    "impact": {
      "score": 80,
      "feedback": "Good use of quantified achievements"
    },
    "ats_optimization": { "score": 75, "feedback": "Could use more keywords" },
    "formatting": { "score": 95, "feedback": "Professional presentation" }
  },
  "jd_match": {
    "score": 88,
    "feedback": "Strong alignment with job requirements"
  },
  "strengths": ["Quantified achievements", "Relevant experience"],
  "top_suggestions": ["Add more technical keywords", "Quantify more results"],
  "jd_recommendations": [
    "Highlight React experience",
    "Emphasize team leadership"
  ]
}
```

## 🛠️ Development

### Adding New File Types

1. Update `allowedTypes` in server.js
2. Add extraction logic in `extractTextFromFile()`
3. Update frontend file input accept attribute

### Customizing Analysis

- Modify `createAnalysisPrompt()` function
- Adjust scoring criteria
- Add new analysis categories

## 📞 Support

If you encounter any issues:

1. Check that all dependencies are installed
2. Verify your Gemini API key is configured
3. Ensure file formats are supported (PDF, DOCX, TXT)
4. Check file size is under 10MB

## 🎉 What's New in Enhanced Edition

- ✅ **File Upload Support** - PDF, DOCX, TXT processing
- ✅ **Job Description Matching** - Role-specific analysis
- ✅ **Enhanced UI** - Improved layout and user experience
- ✅ **Advanced Options** - Configurable analysis parameters
- ✅ **Better Scoring** - More detailed and accurate feedback
- ✅ **Professional Features** - Ready for real-world use

---

**Powered by Google Gemini AI • Built for Professional Resume Analysis**
