# Integrated LaTeX Service Documentation

## 🎯 Overview

The `IntegratedLatexService` is a comprehensive LaTeX compilation service that runs native `pdflatex` directly within the Docker container, eliminating the need for external Docker containers or services.

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  IntegratedLatexService             │
├─────────────────────────────────────┤
│  Input Validation                   │
│  ├── LaTeX syntax validation        │
│  ├── File size limits              │
│  └── Document structure checks      │
├─────────────────────────────────────┤
│  LaTeX Code Cleaning               │
│  ├── Package reordering            │
│  ├── Dash normalization            │
│  ├── Command fixing                │
│  └── Centering removal             │
├─────────────────────────────────────┤
│  Native pdflatex Compilation       │
│  ├── Direct system calls           │
│  ├── Timeout handling              │
│  ├── Error parsing                 │
│  └── Output processing             │
├─────────────────────────────────────┤
│  File Management                   │
│  ├── Temporary file creation       │
│  ├── PDF extraction                │
│  └── Cleanup operations            │
└─────────────────────────────────────┘
```

## 🚀 Key Features

### ✅ Native Compilation

- Direct `pdflatex` execution
- No Docker-in-Docker complexity
- Fast compilation times
- Full TeX Live environment

### ✅ Intelligent Code Cleaning

- Automatic LaTeX syntax fixes
- Package reordering for compatibility
- Dash normalization (`\textendash{}`)
- Centering command removal
- Missing backslash insertion

### ✅ Robust Error Handling

- Comprehensive error parsing
- User-friendly error messages
- Timeout protection (30 seconds)
- Resource limits enforcement

### ✅ Professional Features

- Input validation
- Temporary file management
- Automatic cleanup
- Structured logging
- Performance monitoring

## 📝 API Reference

### Constructor

```javascript
const service = new IntegratedLatexService();
```

**Configuration:**

- `isDockerized`: Boolean indicating Docker environment
- `texlivePath`: Path to pdflatex binary (default: 'pdflatex')
- `maxCompilationTime`: Timeout in milliseconds (default: 30000)
- `maxFileSize`: Maximum LaTeX file size (default: 10MB)

### Main Methods

#### `compileToPDF(latexCode, filename)`

Compiles LaTeX code to PDF.

**Parameters:**

- `latexCode` (string): The LaTeX source code
- `filename` (string): Output filename (without extension)

**Returns:**

```javascript
{
  success: true,
  pdfBuffer: Buffer,
  size: number,
  contentType: "application/pdf",
  quality: "native-latex",
  method: "integrated_latex"
}
```

**Example:**

```javascript
const result = await service.compileToPDF(latexCode, "resume");
if (result.success) {
  const pdfData = result.pdfBuffer.toString("base64");
  // Use pdfData...
}
```

#### `checkLatexAvailability()`

Checks if LaTeX is available on the system.

**Returns:** `Promise<boolean>`

#### `getServiceInfo()`

Returns service information and capabilities.

**Returns:**

```javascript
{
  name: "Integrated LaTeX Service",
  version: "1.0.0",
  description: "Native LaTeX compilation with integrated pdflatex",
  method: "integrated_latex",
  quality: "native-latex",
  isDockerized: boolean,
  texlivePath: string,
  features: string[]
}
```

## 🧹 LaTeX Code Cleaning

The service automatically cleans LaTeX code before compilation:

### Package Reordering

```latex
// Before
\usepackage{hyperref}
\usepackage{geometry}
\documentclass{article}

// After
\documentclass{article}
\usepackage{geometry}
\usepackage{hyperref}
```

### Dash Normalization

```latex
// Before
Company - Location
Jan 2020 -- Present
Bachelor's — Computer Science

// After
Company \textendash{} Location
Jan 2020 \textendash{} Present
Bachelor's \textendash{} Computer Science
```

### Command Fixing

```latex
// Before
textbf{Bold Text}
href{url}{text}

// After
\textbf{Bold Text}
\href{url}{text}
```

### Centering Removal

```latex
// Before
\centering
{\centering Name\par}
\begin{center}Content\end{center}

// After
Name
Content
```

## ⚡ Performance Characteristics

### Compilation Speed

- **Small documents** (1-2 pages): ~2-5 seconds
- **Medium documents** (3-5 pages): ~5-10 seconds
- **Large documents** (5+ pages): ~10-15 seconds

### Resource Usage

- **Memory**: ~50-100MB during compilation
- **CPU**: Single core, moderate usage
- **Disk**: Temporary files cleaned automatically

### Limits

- **Timeout**: 30 seconds maximum
- **File size**: 10MB maximum input
- **Concurrent**: Limited by container resources

## 🔧 Configuration

### Environment Variables

```bash
# LaTeX binary path
TEXLIVE_PATH=/usr/bin/pdflatex

# Temporary directory
TEMP_DIR=/app/temp

# Enable Docker mode
DOCKERIZED=true
```

### Runtime Configuration

```javascript
const service = new IntegratedLatexService();

// Override configuration
service.config.maxCompilationTime = 60000; // 60 seconds
service.config.maxFileSize = 20 * 1024 * 1024; // 20MB
```

## 🐛 Error Handling

### Input Validation Errors

```javascript
// Missing document structure
"Invalid LaTeX code: missing document structure";

// File too large
"LaTeX code exceeds maximum file size limit";

// Invalid parameters
"LaTeX code is required and must be a string";
```

### Compilation Errors

```javascript
// LaTeX syntax errors
"LaTeX compilation error: Undefined control sequence";

// Timeout
"LaTeX compilation timeout (30 seconds exceeded)";

// Binary not found
"pdflatex execution failed: ENOENT";
```

### Error Response Format

```javascript
{
  success: false,
  error: "User-friendly error message",
  details: "Technical error details"
}
```

## 🔍 Debugging

### Enable Debug Logging

```javascript
// Set environment variable
process.env.LOG_LEVEL = "debug";

// Check compilation output
const result = await service.compileToPDF(latexCode, "test");
console.log(result.output); // Raw pdflatex output
```

### Common Issues

#### LaTeX Template Missing

```bash
# Check if template exists
ls -la public/templates/

# Container shell debugging
docker exec -it resume-app ls -la /app/public/templates/
```

#### Permission Issues

```bash
# Check temp directory permissions
docker exec -it resume-app ls -la /app/temp/

# Fix permissions
docker exec -it resume-app chmod 755 /app/temp/
```

#### pdflatex Not Found

```bash
# Check LaTeX installation
docker exec -it resume-app pdflatex --version

# Check PATH
docker exec -it resume-app echo $PATH
```

## 📊 Monitoring

### Performance Metrics

```javascript
const start = Date.now();
const result = await service.compileToPDF(latexCode, "resume");
const duration = Date.now() - start;

console.log(`Compilation took ${duration}ms`);
console.log(`PDF size: ${result.size} bytes`);
```

### Success/Failure Tracking

```javascript
let successCount = 0;
let failureCount = 0;

try {
  const result = await service.compileToPDF(latexCode, "resume");
  if (result.success) {
    successCount++;
  } else {
    failureCount++;
  }
} catch (error) {
  failureCount++;
  console.error("Compilation error:", error.message);
}
```

## 🔐 Security Considerations

### Input Sanitization

- LaTeX code validation
- File size limits
- Document structure verification
- Command injection prevention

### File System Security

- Temporary file isolation
- Automatic cleanup
- Non-root execution
- Limited file permissions

### Resource Protection

- Compilation timeouts
- Memory limits
- CPU usage control
- Concurrent request limits

## 🚀 Advanced Usage

### Custom Cleaning Rules

```javascript
class CustomLatexService extends IntegratedLatexService {
  cleanLatexCode(latexCode) {
    let cleaned = super.cleanLatexCode(latexCode);

    // Add custom cleaning rules
    cleaned = cleaned.replace(/customPattern/g, "replacement");

    return cleaned;
  }
}
```

### Error Customization

```javascript
parseLatexError(output) {
  const customErrors = [
    { pattern: /Missing \\begin{document}/, message: 'Document structure is incomplete' },
    { pattern: /Undefined control sequence/, message: 'Unknown LaTeX command used' }
  ];

  for (const error of customErrors) {
    if (error.pattern.test(output)) {
      return error.message;
    }
  }

  return super.parseLatexError(output);
}
```

## 📈 Best Practices

### Performance Optimization

1. **Cache compiled PDFs** for identical input
2. **Implement request queuing** to prevent overload
3. **Use connection pooling** for database operations
4. **Monitor resource usage** and scale accordingly

### Error Handling

1. **Validate input early** before compilation
2. **Provide clear error messages** to users
3. **Log detailed errors** for debugging
4. **Implement retry logic** for transient failures

### Security

1. **Sanitize all inputs** before processing
2. **Run with minimal privileges**
3. **Implement rate limiting**
4. **Monitor for suspicious patterns**

---

## 📞 Support

For technical issues:

1. Check service logs: `service.getServiceInfo()`
2. Validate LaTeX code manually
3. Test with minimal LaTeX document
4. Check container environment variables

Generated for Resume Generator v1.0.0
