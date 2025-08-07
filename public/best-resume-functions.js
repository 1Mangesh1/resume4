// Global variable to store the generated LaTeX code and extracted resume text
let generatedLatexCode = '';
let extractedResumeText = '';

// Generate Best Resume Function
async function generateBestResume() {
  const generateBestResumeBtn = document.getElementById("generateBestResumeBtn");
  const bestResumeSection = document.getElementById("bestResumeSection");
  const latexCodeDisplay = document.getElementById("latexCodeDisplay");
  
  if (!generateBestResumeBtn || !bestResumeSection || !latexCodeDisplay) {
    console.error("Required elements not found");
    return;
  }

  // Get the current resume text
  let currentResumeText = '';
  if (currentInputMethod === "text" && resumeText?.value) {
    currentResumeText = resumeText.value;
  } else if (extractedResumeText) {
    currentResumeText = extractedResumeText;
  }

  if (!currentResumeText.trim()) {
    alert("Please provide resume text first by analyzing your resume.");
    return;
  }

  // Show loading state
  generateBestResumeBtn.disabled = true;
  generateBestResumeBtn.innerHTML = `
    <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Generating...
  `;

  try {
    const response = await fetch("/api/generate-best-resume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resumeText: currentResumeText,
        analysisData: window.lastAnalysisResult || null
      }),
    });

    const result = await response.json();

    if (result.success) {
      generatedLatexCode = result.latex_code;
      latexCodeDisplay.textContent = result.latex_code;
      bestResumeSection.classList.remove("hidden");
      bestResumeSection.scrollIntoView({ behavior: "smooth" });
      
      console.log("✅ Best resume generated successfully");
    } else {
      throw new Error(result.error || "Failed to generate resume");
    }
  } catch (error) {
    console.error("Error generating best resume:", error);
    alert("Failed to generate resume. Please try again.");
  } finally {
    // Reset button
    generateBestResumeBtn.disabled = false;
    generateBestResumeBtn.innerHTML = `
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
      Generate Best Resume
    `;
  }
}

// Preview Resume on TeXlive.net
function previewResumeOnTexlive() {
  if (!generatedLatexCode) {
    alert("Please generate a resume first.");
    return;
  }
  
  const previewUrl = `https://texlive.net/run?code=${encodeURIComponent(generatedLatexCode)}`;
  window.open(previewUrl, '_blank');
}

// Copy LaTeX Code to Clipboard
async function copyLatexCode() {
  if (!generatedLatexCode) {
    alert("Please generate a resume first.");
    return;
  }
  
  try {
    await navigator.clipboard.writeText(generatedLatexCode);
    
    // Show success feedback
    const copyBtn = document.getElementById("copyLatexBtn");
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      Copied!
    `;
    
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
    
  } catch (error) {
    console.error("Failed to copy:", error);
    alert("Failed to copy to clipboard. Please select and copy manually.");
  }
}
