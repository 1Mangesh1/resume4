// DOM Elements
const resumeText = document.getElementById("resumeText");
const resumeFile = document.getElementById("resumeFile");
const jobDescription = document.getElementById("jobDescription");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const resultsSection = document.getElementById("resultsSection");

// Tab elements
const textInputTab = document.getElementById("textInputTab");
const fileInputTab = document.getElementById("fileInputTab");
const textInputSection = document.getElementById("textInputSection");
const fileInputSection = document.getElementById("fileInputSection");
const fileDropZone = document.getElementById("fileDropZone");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");

// Analysis option checkboxes
const includeKeywords = document.getElementById("includeKeywords");
const includeATS = document.getElementById("includeATS");
const includeJDMatch = document.getElementById("includeJDMatch");

// Result elements
const overallScore = document.getElementById("overallScore");
const overallProgress = document.getElementById("overallProgress");
const clarityScore = document.getElementById("clarityScore");
const clarityProgress = document.getElementById("clarityProgress");
const clarityFeedback = document.getElementById("clarityFeedback");
const impactScore = document.getElementById("impactScore");
const impactProgress = document.getElementById("impactProgress");
const impactFeedback = document.getElementById("impactFeedback");
const atsScore = document.getElementById("atsScore");
const atsProgress = document.getElementById("atsProgress");
const atsFeedback = document.getElementById("atsFeedback");
const formattingScore = document.getElementById("formattingScore");
const formattingProgress = document.getElementById("formattingProgress");
const formattingFeedback = document.getElementById("formattingFeedback");

// JD-specific elements
const jdMatchSection = document.getElementById("jdMatchSection");
const jdMatchScore = document.getElementById("jdMatchScore");
const jdMatchProgress = document.getElementById("jdMatchProgress");
const jdMatchFeedback = document.getElementById("jdMatchFeedback");
const jdRecommendationsSection = document.getElementById(
  "jdRecommendationsSection"
);
const jdRecommendationsList = document.getElementById("jdRecommendationsList");

// Advanced Analysis elements
const toneScore = document.getElementById("toneScore");
const toneProgress = document.getElementById("toneProgress");
const toneType = document.getElementById("toneType");
const toneFeedback = document.getElementById("toneFeedback");

const bulletScore = document.getElementById("bulletScore");
const bulletProgress = document.getElementById("bulletProgress");
const actionVerbs = document.getElementById("actionVerbs");
const quantifiedBullets = document.getElementById("quantifiedBullets");
const bulletFeedback = document.getElementById("bulletFeedback");

const buzzwordScore = document.getElementById("buzzwordScore");
const buzzwordProgress = document.getElementById("buzzwordProgress");
const buzzwordCount = document.getElementById("buzzwordCount");
const buzzwordList = document.getElementById("buzzwordList");

const redFlagScore = document.getElementById("redFlagScore");
const redFlagProgress = document.getElementById("redFlagProgress");
const redFlagCount = document.getElementById("redFlagCount");
const redFlagList = document.getElementById("redFlagList");

const skillsScore = document.getElementById("skillsScore");
const skillsProgress = document.getElementById("skillsProgress");
const hardSkills = document.getElementById("hardSkills");
const softSkills = document.getElementById("softSkills");
const skillsRatio = document.getElementById("skillsRatio");

const advancedInsights = document.getElementById("advancedInsights");

// Lists
const strengthsList = document.getElementById("strengthsList");
const suggestionsList = document.getElementById("suggestionsList");

// Global variables
let currentInputMethod = "text";
let selectedFile = null;

// Event Listeners
analyzeBtn.addEventListener("click", analyzeResume);
clearBtn.addEventListener("click", clearForm);
textInputTab.addEventListener("click", () => switchInputMethod("text"));
fileInputTab.addEventListener("click", () => switchInputMethod("file"));
resumeFile.addEventListener("change", handleFileSelect);
fileDropZone.addEventListener("click", () => resumeFile.click());

// Auto-check JD matching when job description is entered
jobDescription.addEventListener("input", function () {
  if (this.value.trim().length > 50) {
    includeJDMatch.checked = true;
  }
});

// Textarea auto-resize
resumeText.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

jobDescription.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// File drag and drop
fileDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  fileDropZone.parentElement.classList.add(
    "border-primary-300",
    "bg-primary-50/50"
  );
  fileDropZone.parentElement.classList.remove("border-gray-200");
});

fileDropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  fileDropZone.parentElement.classList.remove(
    "border-primary-300",
    "bg-primary-50/50"
  );
  fileDropZone.parentElement.classList.add("border-gray-200");
});

fileDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  fileDropZone.parentElement.classList.remove(
    "border-primary-300",
    "bg-primary-50/50"
  );
  fileDropZone.parentElement.classList.add("border-gray-200");
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileSelect({ target: { files } });
  }
});

// Switch between input methods
function switchInputMethod(method) {
  currentInputMethod = method;

  if (method === "text") {
    textInputTab.classList.remove("tab-inactive");
    textInputTab.classList.add("tab-active");
    fileInputTab.classList.remove("tab-active");
    fileInputTab.classList.add("tab-inactive");

    textInputSection.classList.remove("hidden");
    fileInputSection.classList.add("hidden");
  } else {
    fileInputTab.classList.remove("tab-inactive");
    fileInputTab.classList.add("tab-active");
    textInputTab.classList.remove("tab-active");
    textInputTab.classList.add("tab-inactive");

    fileInputSection.classList.remove("hidden");
    textInputSection.classList.add("hidden");
  }
}

// Handle file selection
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  if (!allowedTypes.includes(file.type)) {
    showError("Please select a PDF, DOCX, or TXT file.");
    return;
  }

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    showError("File size must be less than 10MB.");
    return;
  }

  selectedFile = file;

  // Show file info
  fileName.textContent = file.name;
  fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  fileInfo.classList.remove("hidden");

  // Update file drop zone with success state
  fileDropZone.innerHTML = `
    <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
      <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </div>
    <h4 class="text-lg font-semibold text-green-900 mb-2">File Selected Successfully</h4>
    <p class="text-green-700 font-medium">${file.name}</p>
    <p class="text-sm text-green-600">Ready for analysis</p>
  `;
}

// Clear form function
function clearForm() {
  resumeText.value = "";
  jobDescription.value = "";
  selectedFile = null;
  resumeFile.value = "";

  // Reset file input section
  fileInfo.classList.add("hidden");
  fileDropZone.innerHTML = `
    <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
      <svg class="w-8 h-8 text-primary-600" stroke="currentColor" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    </div>
    <h4 class="text-lg font-semibold text-gray-900 mb-2">Drop your resume here</h4>
    <p class="text-gray-600 mb-1">or <span class="text-primary-600 font-medium">browse files</span></p>
    <p class="text-sm text-gray-500">PDF, DOCX, or TXT • Max 10MB</p>
  `;

  hideAllStates();

  // Reset textarea heights for floating labels
  resumeText.style.height = "auto";
  jobDescription.style.height = "auto";
}

// Hide all states
function hideAllStates() {
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");
  resultsSection.classList.add("hidden");
  jdMatchSection.classList.add("hidden");
  jdRecommendationsSection.classList.add("hidden");
}

// Show loading state
function showLoading() {
  hideAllStates();
  loadingState.classList.remove("hidden");
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = `
    <svg class="w-5 h-5 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    Analyzing...
  `;
}

// Show error state
function showError(message) {
  hideAllStates();
  errorMessage.textContent = message;
  errorState.classList.remove("hidden");
  analyzeBtn.disabled = false;
  analyzeBtn.innerHTML = `
    <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
    </svg>
    Analyze Resume
  `;
}

// Show results
function showResults(data) {
  hideAllStates();
  resultsSection.classList.remove("hidden");
  analyzeBtn.disabled = false;
  analyzeBtn.innerHTML = `
    <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
    </svg>
    Analyze Resume
  `;

  // Update scores and progress bars with smooth animations
  setTimeout(() => {
    updateScore(overallScore, overallProgress, data.overall_score || 0);
  }, 300);

  if (data.sections) {
    setTimeout(() => {
      updateScore(
        clarityScore,
        clarityProgress,
        data.sections.clarity?.score || 0
      );
      clarityFeedback.textContent =
        data.sections.clarity?.feedback || "No feedback available";

      updateScore(
        impactScore,
        impactProgress,
        data.sections.impact?.score || 0
      );
      impactFeedback.textContent =
        data.sections.impact?.feedback || "No feedback available";

      updateScore(
        atsScore,
        atsProgress,
        data.sections.ats_optimization?.score || 0
      );
      atsFeedback.textContent =
        data.sections.ats_optimization?.feedback || "No feedback available";

      updateScore(
        formattingScore,
        formattingProgress,
        data.sections.formatting?.score || 0
      );
      formattingFeedback.textContent =
        data.sections.formatting?.feedback || "No feedback available";
    }, 600);
  }

  // Update Advanced Analysis with staggered animations
  if (data.advanced_analysis) {
    setTimeout(() => {
      updateAdvancedAnalysis(data.advanced_analysis);
    }, 900);
  }

  // Show JD matching results if available
  if (data.jd_match) {
    setTimeout(() => {
      jdMatchSection.classList.remove("hidden");
      updateScore(
        jdMatchScore,
        jdMatchProgress,
        data.jd_match.score || 0,
        "/100"
      );
      jdMatchFeedback.textContent =
        data.jd_match.feedback || "No JD feedback available";

      if (data.jd_recommendations && data.jd_recommendations.length > 0) {
        jdRecommendationsSection.classList.remove("hidden");
        updateList(jdRecommendationsList, data.jd_recommendations);
      }
    }, 1200);
  }

  // Update lists with final animation
  setTimeout(() => {
    updateList(strengthsList, data.strengths || []);
    updateList(suggestionsList, data.top_suggestions || []);
  }, 1500);
}

// Update score and progress bar
function updateScore(scoreElement, progressElement, score, suffix = "/100") {
  scoreElement.textContent = `${score}${suffix}`;
  setTimeout(() => {
    progressElement.style.width = `${score}%`;
  }, 100);
}

// Update lists
function updateList(listElement, items) {
  listElement.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `• ${item}`;
    listElement.appendChild(li);
  });

  if (items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "• No items available";
    li.className = "text-gray-400";
    listElement.appendChild(li);
  }
}

// Update advanced analysis section
function updateAdvancedAnalysis(advancedData) {
  // Tone Evaluation
  if (advancedData.tone_evaluation) {
    const tone = advancedData.tone_evaluation;
    updateScore(toneScore, toneProgress, tone.score || 0, "/100");
    toneType.textContent = `Tone: ${tone.tone_type || "Unknown"}`;
    toneFeedback.textContent = tone.feedback || "No tone feedback available";
  }

  // Bullet Point Grade
  if (advancedData.bullet_point_grade) {
    const bullet = advancedData.bullet_point_grade;
    updateScore(bulletScore, bulletProgress, bullet.score || 0, "/100");
    actionVerbs.textContent = bullet.action_verbs_count || 0;
    quantifiedBullets.textContent = `${bullet.quantified_bullets || 0}/${
      bullet.total_bullets || 0
    }`;
    bulletFeedback.textContent =
      bullet.feedback || "No bullet point feedback available";
  }

  // Buzzword Detection
  if (advancedData.buzzword_detection) {
    const buzzword = advancedData.buzzword_detection;
    updateScore(buzzwordScore, buzzwordProgress, buzzword.score || 0, "/100");
    buzzwordCount.textContent = buzzword.buzzword_count || 0;
    formatBuzzwordList(buzzword.buzzwords_found || []);
  }

  // Red Flags
  if (advancedData.red_flags) {
    const redFlag = advancedData.red_flags;
    updateScore(redFlagScore, redFlagProgress, redFlag.score || 0, "/100");
    redFlagCount.textContent = redFlag.flag_count || 0;
    formatRedFlagList(redFlag.flags_detected || []);
  }

  // Skills Balance
  if (advancedData.skills_balance) {
    const skills = advancedData.skills_balance;
    updateScore(skillsScore, skillsProgress, skills.score || 0, "/100");
    hardSkills.textContent = skills.hard_skills_count || 0;
    softSkills.textContent = skills.soft_skills_count || 0;
    skillsRatio.textContent = skills.balance_ratio || "--";
  }

  // Generate advanced insights
  generateAdvancedInsights(advancedData);
}

// Format buzzword list
function formatBuzzwordList(buzzwords) {
  if (buzzwords.length === 0) {
    buzzwordList.innerHTML =
      '<p class="text-green-600">✓ No problematic buzzwords found</p>';
    return;
  }

  const buzzwordItems = buzzwords
    .slice(0, 5)
    .map((word) => `• ${word}`)
    .join("<br>");
  const moreText =
    buzzwords.length > 5
      ? `<br><span class="text-yellow-500">+${
          buzzwords.length - 5
        } more...</span>`
      : "";
  buzzwordList.innerHTML = buzzwordItems + moreText;
}

// Format red flag list
function formatRedFlagList(flags) {
  if (flags.length === 0) {
    redFlagList.innerHTML =
      '<p class="text-green-600">✓ No red flags detected</p>';
    return;
  }

  const flagItems = flags
    .slice(0, 3)
    .map((flag) => `• ${flag}`)
    .join("<br>");
  const moreText =
    flags.length > 3
      ? `<br><span class="text-red-500">+${
          flags.length - 3
        } more issues...</span>`
      : "";
  redFlagList.innerHTML = flagItems + moreText;
}

// Generate advanced insights
function generateAdvancedInsights(advancedData) {
  const insights = [];

  // Tone insights
  if (advancedData.tone_evaluation?.score >= 80) {
    insights.push("• Professional tone detected");
  } else if (advancedData.tone_evaluation?.score < 60) {
    insights.push("• Consider improving tone consistency");
  }

  // Bullet point insights
  if (advancedData.bullet_point_grade?.action_verbs_count >= 5) {
    insights.push("• Good use of action verbs");
  } else {
    insights.push("• Add more action verbs to bullets");
  }

  // Buzzword insights
  if (advancedData.buzzword_detection?.buzzword_count === 0) {
    insights.push("• Excellent: No buzzwords detected");
  } else if (advancedData.buzzword_detection?.buzzword_count > 3) {
    insights.push("• Warning: Too many buzzwords");
  }

  // Red flag insights
  if (advancedData.red_flags?.flag_count === 0) {
    insights.push("• Clean resume: No red flags");
  } else {
    insights.push("• Address detected red flags");
  }

  // Skills balance insights
  const skillsBalance = advancedData.skills_balance;
  if (skillsBalance) {
    const hardCount = skillsBalance.hard_skills_count || 0;
    const softCount = skillsBalance.soft_skills_count || 0;
    if (hardCount > softCount * 2) {
      insights.push("• Good technical skills emphasis");
    } else if (softCount > hardCount) {
      insights.push("• Consider adding more technical skills");
    }
  }

  // Default insights if none generated
  if (insights.length === 0) {
    insights.push("• Analysis complete - see detailed scores above");
    insights.push("• Focus on top suggestions for improvement");
  }

  advancedInsights.innerHTML = insights
    .map((insight) => `<p>${insight}</p>`)
    .join("");
}

// Main analyze function
async function analyzeResume() {
  let resumeContent = "";

  // Get resume content based on input method
  if (currentInputMethod === "text") {
    resumeContent = resumeText.value.trim();
    if (!resumeContent) {
      showError("Please enter your resume text before analyzing.");
      return;
    }
  } else {
    if (!selectedFile) {
      showError("Please select a resume file to analyze.");
      return;
    }
  }

  // Minimum content validation for text input
  if (currentInputMethod === "text" && resumeContent.length < 100) {
    showError("Please enter a more complete resume (at least 100 characters).");
    return;
  }

  showLoading();

  try {
    const formData = new FormData();

    if (currentInputMethod === "file") {
      formData.append("resumeFile", selectedFile);
    } else {
      formData.append("resumeText", resumeContent);
    }

    // Add job description if provided
    const jdText = jobDescription.value.trim();
    if (jdText) {
      formData.append("jobDescription", jdText);
    }

    // Add analysis options
    formData.append("includeKeywords", includeKeywords.checked);
    formData.append("includeATS", includeATS.checked);
    formData.append(
      "includeJDMatch",
      includeJDMatch.checked && jdText.length > 0
    );

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      showError(data.error);
      return;
    }

    showResults(data);
  } catch (error) {
    console.error("Analysis error:", error);
    showError(
      "Failed to analyze resume. Please check your connection and try again."
    );
  }
}

// Sample data for testing (remove in production)
function showSampleResults() {
  const sampleData = {
    overall_score: 78,
    sections: {
      clarity: {
        score: 82,
        feedback:
          "Your resume is well-structured and easy to read. Consider using more action verbs.",
      },
      impact: {
        score: 75,
        feedback:
          "Good use of metrics. Try to quantify more achievements with specific numbers.",
      },
      ats_optimization: {
        score: 70,
        feedback:
          "Include more industry keywords relevant to your target role.",
      },
      formatting: {
        score: 85,
        feedback:
          "Clean format with good use of white space. Consider bullet points for achievements.",
      },
    },
    strengths: [
      "Clear professional summary",
      "Good use of action verbs",
      "Consistent formatting",
      "Relevant work experience",
    ],
    top_suggestions: [
      "Add more quantified achievements",
      "Include relevant industry keywords",
      "Expand on technical skills",
      "Add professional certifications",
    ],
  };

  showResults(sampleData);
}

// For development - remove in production
// analyzeBtn.addEventListener('dblclick', showSampleResults);

// Initialize UI enhancements when DOM loads
document.addEventListener("DOMContentLoaded", function () {
  // Floating label functionality
  const textareas = document.querySelectorAll(".textarea-focus");

  textareas.forEach((textarea) => {
    // Handle focus/blur states
    textarea.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
    });

    textarea.addEventListener("blur", function () {
      this.parentElement.classList.remove("focused");
    });

    // Handle content state
    textarea.addEventListener("input", function () {
      if (this.value.trim() !== "") {
        this.classList.add("has-content");
      } else {
        this.classList.remove("has-content");
      }
    });

    // Check initial state
    if (textarea.value.trim() !== "") {
      textarea.classList.add("has-content");
    }
  });

  // Enhanced smooth scroll for results
  function smoothScrollToResults() {
    const element = document.getElementById("resultsSection");
    if (element && !element.classList.contains("hidden")) {
      setTimeout(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }, 1600);
    }
  }

  // Override showResults to include smooth scroll
  const originalShowResults = showResults;
  window.showResults = function (data) {
    originalShowResults(data);
    smoothScrollToResults();
  };

  // Add subtle hover animations to checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      this.parentElement.classList.toggle("scale-105", this.checked);
    });
  });

  // Add loading animation to progress bars
  const progressBars = document.querySelectorAll(".progress-bar");
  progressBars.forEach((bar) => {
    bar.addEventListener("transitionstart", function () {
      this.classList.add("animate-pulse-soft");
    });
    bar.addEventListener("transitionend", function () {
      this.classList.remove("animate-pulse-soft");
    });
  });

  console.log("✨ Professional Resume Analyzer UI initialized successfully!");
});
