# High-Quality PDF Preview System

## Overview

This system provides high-quality PDF generation from AI-generated LaTeX resume code using a combination of `latex.js` for parsing and `PDFKit` for rendering. This approach eliminates the need for external LaTeX services while maintaining excellent output quality comparable to Overleaf.

## Architecture

### Components

1. **LaTeX Parser (`lib/latex-pdf-generator.js`)**

   - Uses `latex.js` to parse LaTeX code into structured DOM
   - Implements fallback manual parsing for complex LaTeX
   - Provides high-quality PDF rendering with `PDFKit`

2. **PDF Preview Controller (`controllers/pdfPreviewController.js`)**

   - Handles PDF generation requests
   - Implements caching for improved performance
   - Provides multiple endpoints for different use cases

3. **Security Middleware (`middlewares/pdfSecurity.js`)**

   - Rate limiting for PDF generation
   - Input validation and sanitization
   - Security headers and logging

4. **Frontend Integration (`public/app.js`)**
   - Updated preview and download functions
   - Fallback support for multiple PDF generation methods
   - User feedback and error handling

## API Endpoints

### High-Quality PDF Generation

#### `POST /api/pdf-preview`

Generate high-quality PDF preview from resume text and job description.

**Request:**

```json
{
  "resumeText": "Your resume content...",
  "jobDescription": "Job description (optional)",
  "filename": "resume-preview"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "pdfBase64": "base64-encoded-pdf",
    "size": 123456,
    "filename": "resume-preview.pdf",
    "contentType": "application/pdf",
    "method": "latex.js + PDFKit"
  }
}
```

#### `POST /api/pdf-from-latex`

Generate PDF directly from LaTeX code.

**Request:**

```json
{
  "latexCode": "\\documentclass{article}...",
  "filename": "custom-resume"
}
```

#### `POST /api/download-pdf-preview`

Download PDF directly (browser download).

#### `POST /api/stream-pdf-preview`

Stream PDF for inline viewing.

#### `GET /api/pdf-service-info`

Get service information and capabilities.

#### `POST /api/clear-pdf-cache`

Clear PDF preview cache.

## Features

### High-Quality Rendering

- **LaTeX.js Parsing**: Converts LaTeX to structured DOM representation
- **PDFKit Rendering**: Professional PDF generation with proper typography
- **Fallback Parsing**: Manual LaTeX parsing when automated parsing fails
- **Professional Styling**: Overleaf-quality output with proper fonts and spacing

### Performance Optimization

- **Preview Caching**: 5-minute cache for repeated previews
- **Parallel Processing**: Multiple tool calls for efficiency
- **Memory Monitoring**: Tracks memory usage during PDF generation
- **Timeout Handling**: Configurable timeouts for different operations

### Security & Reliability

- **Rate Limiting**:
  - Standard PDFs: 20 per 15 minutes
  - High-quality PDFs: 10 per 10 minutes
- **Input Validation**: LaTeX sanitization and size limits
- **Security Headers**: Proper headers for PDF responses
- **Dangerous Command Blocking**: Prevents LaTeX injection attacks
- **Request Logging**: Comprehensive logging for debugging

### Fallback System

1. **Primary**: High-quality latex.js + PDFKit generation
2. **Fallback 1**: TeXlive external service
3. **Fallback 2**: Local simple PDF generator

## Usage Examples

### Frontend Integration

```javascript
// Generate high-quality PDF preview
async function generateHighQualityPreview() {
  try {
    const response = await fetch("/api/pdf-from-latex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latexCode: generatedLatexCode,
        filename: "resume-preview",
      }),
    });

    const result = await response.json();
    if (result.success) {
      // Display PDF in viewer
      displayPDFFromBase64(result.data.pdfBase64);
    }
  } catch (error) {
    console.error("PDF generation failed:", error);
  }
}
```

### Backend Usage

```javascript
const LatexPDFGenerator = require("./lib/latex-pdf-generator");

const pdfGenerator = new LatexPDFGenerator();

// Generate PDF from LaTeX
const result = await pdfGenerator.generatePDF(latexCode, "resume");

if (result.success) {
  // Use result.pdfBuffer
  console.log(`PDF generated: ${result.size} bytes`);
} else {
  console.error("PDF generation failed:", result.error);
}
```

## Configuration

### Rate Limiting

```javascript
// Standard PDF operations
const pdfRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // requests per window
});

// High-quality PDF operations
const highQualityPdfRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // requests per window
});
```

### Security Settings

```javascript
// Input validation limits
const limits = {
  latexCodeSize: 100000, // 100KB
  resumeTextSize: 50000, // 50KB
  maxBraces: 1000,
  unbalancedBraceThreshold: 50,
};
```

### Timeouts

- **Preview Generation**: 90 seconds
- **Download Operations**: 120 seconds
- **Standard Operations**: 60 seconds

## Error Handling

### Common Error Responses

```json
// Rate limit exceeded
{
  "success": false,
  "error": "Too many PDF generation requests. Please try again in 15 minutes.",
  "retryAfter": 900
}

// Invalid input
{
  "success": false,
  "error": "LaTeX code too large. Maximum size is 100KB."
}

// Security violation
{
  "success": false,
  "error": "Dangerous LaTeX command detected: \\write18. This command is not allowed for security reasons."
}

// Generation failure
{
  "success": false,
  "error": "LaTeX parsing failed: Syntax error at line 15"
}
```

### Frontend Error Handling

The frontend implements a graceful fallback system:

1. **Try high-quality generation** (latex.js + PDFKit)
2. **Fall back to TeXlive** service if available
3. **Fall back to simple local** PDF generator
4. **Show error message** with suggestion to use Overleaf

## Benefits Over Previous System

### Quality Improvements

- **Better Typography**: Professional font rendering
- **Proper Spacing**: Accurate line heights and margins
- **Consistent Layout**: Reliable cross-platform rendering
- **Modern PDF Features**: Proper metadata and structure

### User Experience

- **No External Dependencies**: Works without internet for LaTeX compilation
- **Faster Generation**: Local processing eliminates network delays
- **Better Error Messages**: Clear feedback on what went wrong
- **Automatic Fallbacks**: Seamless degradation when issues occur

### Developer Benefits

- **No Server Requirements**: No need for TeXlive installation
- **Better Debugging**: Detailed logging and error tracking
- **Scalable**: Handles multiple concurrent requests
- **Maintainable**: Clean separation of concerns

## Monitoring & Debugging

### Log Output Examples

```
📄 PDF Request: POST /api/pdf-from-latex from 192.168.1.100
✅ PDF POST /api/pdf-from-latex | 200 | 2340ms | Size: 45.2KB | 192.168.1.100 | Mozilla/5.0...
🔄 Generating high-quality PDF preview...
✅ High-quality PDF preview generated successfully
📄 Size: 45.2 KB
```

### Memory Monitoring

```
⚠️ High memory usage: 512MB heap used
```

### Security Logging

```
Security: Blocked dangerous LaTeX command: \write18
```

## Future Enhancements

- **Template Engine**: Support for multiple resume templates
- **Real-time Preview**: Live preview as user types
- **PDF Optimization**: Compression and optimization options
- **Advanced Security**: More sophisticated LaTeX analysis
- **Performance Metrics**: Detailed performance tracking
- **Custom Fonts**: Support for additional font families
