// DOM Elements - will be initialized after DOM loads
let resumeText, resumeFile, jobDescription, analyzeBtn, clearBtn;
let loadingState, errorState, errorMessage, resultsSection;

// Tab elements and other DOM elements - will be initialized after DOM loads
let textInputTab, fileInputTab, textInputSection, fileInputSection;
let fileDropZone, fileInfo, fileName, fileSize;
let includeClarity, includeImpact, includeATS, includeJDMatch;
let jobDescriptionSection, inputGrid;

// Generator elements
let includeSummaryGen, includeVariantGen, includeCoverGen, includeLinkedInGen;

// Result elements - will be initialized after DOM loads
let overallScore,
  overallProgress,
  clarityScore,
  clarityProgress,
  clarityFeedback;
let impactScore,
  impactProgress,
  impactFeedback,
  atsScore,
  atsProgress,
  atsFeedback;
let formattingScore, formattingProgress, formattingFeedback;

// All other elements - will be initialized after DOM loads
let jdMatchSection, jdMatchScore, jdMatchProgress, jdMatchFeedback;
let jdRecommendationsSection, jdRecommendationsList;
let toneScore, toneProgress, toneType, toneFeedback;
let bulletScore, bulletProgress, actionVerbs, quantifiedBullets, bulletFeedback;
let buzzwordScore, buzzwordProgress, buzzwordCount, buzzwordList;
let redFlagScore, redFlagProgress, redFlagCount, redFlagList;
let skillsScore, skillsProgress, hardSkills, softSkills, skillsRatio;
let advancedInsights, strengthsList, suggestionsList;
let themeToggle, proTipToast, dismissProTip;

// Global variables
let currentInputMethod = "file";
let selectedFile = null;

// Dark Mode Functionality
function initializeTheme() {
  // Check for saved theme preference or default to light mode
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";

  if (isDark) {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }

  // Track theme change
  if (window.va) {
    window.va("track", "Theme Changed", { theme: newTheme });
  }
}

// Pro Tip Toast Functionality
function showProTip() {
  if (!localStorage.getItem("proTipDismissed")) {
    // Reset display style in case it was hidden
    proTipToast.style.display = "block";
    setTimeout(() => {
      proTipToast.classList.remove("translate-x-full");
      proTipToast.classList.add("translate-x-0");
    }, 2000); // Show after 2 seconds
  }
}

function hideProTip() {
  proTipToast.classList.remove("translate-x-0");
  proTipToast.classList.add("translate-x-full");
}

function dismissProTipPermanently() {
  // Slide out immediately
  proTipToast.classList.remove("translate-x-0");
  proTipToast.classList.add("translate-x-full");

  // After animation completes, ensure it's completely hidden
  setTimeout(() => {
    proTipToast.style.display = "none";
  }, 500);

  localStorage.setItem("proTipDismissed", "true");
}

// Initialize theme immediately (doesn't require DOM)
initializeTheme();

// Initialize Vercel Analytics immediately
if (typeof window !== "undefined" && window.va) {
  // Track page view
  window.va("pageview");
}

// Smooth scroll to results function
function smoothScrollToResults() {
  const resultsSection = document.getElementById("resultsSection");
  if (resultsSection) {
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Wait for DOM to be ready before attaching event listeners
document.addEventListener("DOMContentLoaded", function () {
  // Initialize all DOM elements
  resumeText = document.getElementById("resumeText");
  resumeFile = document.getElementById("resumeFile");
  jobDescription = document.getElementById("jobDescription");
  analyzeBtn = document.getElementById("analyzeBtn");
  clearBtn = document.getElementById("clearBtn");
  loadingState = document.getElementById("loadingState");
  errorState = document.getElementById("errorState");
  errorMessage = document.getElementById("errorMessage");
  resultsSection = document.getElementById("resultsSection");

  // Tab elements
  textInputTab = document.getElementById("textInputTab");
  fileInputTab = document.getElementById("fileInputTab");
  textInputSection = document.getElementById("textInputSection");
  fileInputSection = document.getElementById("fileInputSection");
  fileDropZone = document.getElementById("fileDropZone");
  fileInfo = document.getElementById("fileInfo");
  fileName = document.getElementById("fileName");
  fileSize = document.getElementById("fileSize");

  // Analysis option checkboxes
  includeClarity = document.getElementById("includeClarity");
  includeImpact = document.getElementById("includeImpact");
  includeATS = document.getElementById("includeATS");
  includeJDMatch = document.getElementById("includeJDMatch");

  // Generator option checkboxes
  includeSummaryGen = document.getElementById("includeSummaryGen");
  includeVariantGen = document.getElementById("includeVariantGen");
  includeCoverGen = document.getElementById("includeCoverGen");
  includeLinkedInGen = document.getElementById("includeLinkedInGen");

  // Job Description Section elements
  jobDescriptionSection = document.getElementById("jobDescriptionSection");
  inputGrid = document.getElementById("inputGrid");

  // Result elements
  overallScore = document.getElementById("overallScore");
  overallProgress = document.getElementById("overallProgress");
  clarityScore = document.getElementById("clarityScore");
  clarityProgress = document.getElementById("clarityProgress");
  clarityFeedback = document.getElementById("clarityFeedback");
  impactScore = document.getElementById("impactScore");
  impactProgress = document.getElementById("impactProgress");
  impactFeedback = document.getElementById("impactFeedback");
  atsScore = document.getElementById("atsScore");
  atsProgress = document.getElementById("atsProgress");
  atsFeedback = document.getElementById("atsFeedback");
  formattingScore = document.getElementById("formattingScore");
  formattingProgress = document.getElementById("formattingProgress");
  formattingFeedback = document.getElementById("formattingFeedback");

  // JD-specific elements
  jdMatchSection = document.getElementById("jdMatchSection");
  jdMatchScore = document.getElementById("jdMatchScore");
  jdMatchProgress = document.getElementById("jdMatchProgress");
  jdMatchFeedback = document.getElementById("jdMatchFeedback");
  jdRecommendationsSection = document.getElementById(
    "jdRecommendationsSection"
  );
  jdRecommendationsList = document.getElementById("jdRecommendationsList");

  // Advanced Analysis elements
  toneScore = document.getElementById("toneScore");
  toneProgress = document.getElementById("toneProgress");
  toneType = document.getElementById("toneType");
  toneFeedback = document.getElementById("toneFeedback");
  bulletScore = document.getElementById("bulletScore");
  bulletProgress = document.getElementById("bulletProgress");
  actionVerbs = document.getElementById("actionVerbs");
  quantifiedBullets = document.getElementById("quantifiedBullets");
  bulletFeedback = document.getElementById("bulletFeedback");
  buzzwordScore = document.getElementById("buzzwordScore");
  buzzwordProgress = document.getElementById("buzzwordProgress");
  buzzwordCount = document.getElementById("buzzwordCount");
  buzzwordList = document.getElementById("buzzwordList");
  redFlagScore = document.getElementById("redFlagScore");
  redFlagProgress = document.getElementById("redFlagProgress");
  redFlagCount = document.getElementById("redFlagCount");
  redFlagList = document.getElementById("redFlagList");
  skillsScore = document.getElementById("skillsScore");
  skillsProgress = document.getElementById("skillsProgress");
  hardSkills = document.getElementById("hardSkills");
  softSkills = document.getElementById("softSkills");
  skillsRatio = document.getElementById("skillsRatio");
  advancedInsights = document.getElementById("advancedInsights");
  strengthsList = document.getElementById("strengthsList");
  suggestionsList = document.getElementById("suggestionsList");

  // Theme and UI elements
  themeToggle = document.getElementById("themeToggle");
  proTipToast = document.getElementById("proTipToast");
  dismissProTip = document.getElementById("dismissProTip");

  // Event Listeners - Ensure DOM elements exist first
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", analyzeResume);
  }
  if (clearBtn) clearBtn.addEventListener("click", clearForm);
  if (textInputTab)
    textInputTab.addEventListener("click", () => switchInputMethod("text"));
  if (fileInputTab)
    fileInputTab.addEventListener("click", () => switchInputMethod("file"));
  if (resumeFile) resumeFile.addEventListener("change", handleFileSelect);
  if (fileDropZone)
    fileDropZone.addEventListener("click", () => resumeFile.click());

  // Dark mode toggle
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

  // Pro tip toast listeners
  if (dismissProTip)
    dismissProTip.addEventListener("click", dismissProTipPermanently);

  // Auto-check JD matching when job description is entered
  if (jobDescription) {
    jobDescription.addEventListener("input", function () {
      if (this.value.trim().length > 50 && !includeJDMatch?.checked) {
        if (includeJDMatch) {
          includeJDMatch.checked = true;
          toggleJobDescriptionSection(); // Trigger the section to show
        }
      }
    });

    // Show pro tip when job description is focused (if not permanently dismissed)
    jobDescription.addEventListener("focus", function () {
      if (!localStorage.getItem("proTipDismissed")) {
        // Reset display style in case it was hidden
        proTipToast.style.display = "block";
        setTimeout(() => {
          proTipToast.classList.remove("translate-x-full");
          proTipToast.classList.add("translate-x-0");
        }, 500);
      }
    });
  }

  // Job Description Matching checkbox toggle
  if (includeJDMatch)
    includeJDMatch.addEventListener("change", toggleJobDescriptionSection);

  // File drag and drop
  if (fileDropZone) {
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
  }

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

  // Show pro tip on page load (if not dismissed) - after DOM is ready
  showProTip();

  // Set file input as default
  switchInputMethod("file");

  console.log("✨ Professional Resume Analyzer UI initialized successfully!");
});

// Job Description Section Toggle Function
function toggleJobDescriptionSection() {
  const isChecked = includeJDMatch?.checked || false;

  // Track job description matching toggle
  if (window.va) {
    window.va("track", "Job Description Matching", { enabled: isChecked });
  }

  if (isChecked) {
    // Show job description section
    if (jobDescriptionSection) {
      jobDescriptionSection.classList.remove("hidden");
      // Use setTimeout to ensure the element is rendered before animating
      setTimeout(() => {
        jobDescriptionSection.classList.remove("opacity-0", "translate-y-4");
        jobDescriptionSection.classList.add("opacity-100", "translate-y-0");
      }, 10);
    }

    // Change grid to 2 columns
    if (inputGrid) {
      inputGrid.classList.remove("lg:grid-cols-1");
      inputGrid.classList.add("lg:grid-cols-2");
    }
  } else {
    // Hide job description section
    if (jobDescriptionSection) {
      jobDescriptionSection.classList.remove("opacity-100", "translate-y-0");
      jobDescriptionSection.classList.add("opacity-0", "translate-y-4");

      // Hide after animation completes
      setTimeout(() => {
        jobDescriptionSection.classList.add("hidden");
      }, 500);
    }

    // Change grid to 1 column
    if (inputGrid) {
      inputGrid.classList.remove("lg:grid-cols-2");
      inputGrid.classList.add("lg:grid-cols-1");
    }

    // Clear job description content when hidden
    if (jobDescription) {
      jobDescription.value = "";
    }
  }
}

// Switch between input methods
function switchInputMethod(method) {
  currentInputMethod = method;

  // Track input method switch
  if (window.va) {
    window.va("track", "Input Method Changed", { method: method });
  }

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

  // Track file upload
  if (window.va) {
    window.va("track", "File Uploaded", {
      fileType: file.type,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    });
  }

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

  // Reset checkboxes and hide job description section
  if (includeJDMatch) includeJDMatch.checked = false;
  toggleJobDescriptionSection();

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
}

// Hide all states
function hideAllStates() {
  if (loadingState) loadingState.classList.add("hidden");
  if (errorState) errorState.classList.add("hidden");
  if (resultsSection) resultsSection.classList.add("hidden");
  if (jdMatchSection) jdMatchSection.classList.add("hidden");
  if (jdRecommendationsSection)
    jdRecommendationsSection.classList.add("hidden");

  // Don't hide generators section - it should always be visible
}

// Show loading state
function showLoading() {
  hideAllStates();
  if (loadingState) loadingState.classList.remove("hidden");

  // Disable analyze button and show loading state
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `
      <svg class="w-5 h-5 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      Analyzing...
    `;
  }
}

// Show error state
function showError(message) {
  hideAllStates();
  if (errorState) errorState.classList.remove("hidden");
  if (errorMessage) errorMessage.textContent = message;

  // Re-enable analyze button
  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `
      <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      Analyze Resume
    `;
  }
}

function showResults(data) {
  hideAllStates();
  resultsSection.classList.remove("hidden");

  // Re-enable analyze button
  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `
      <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      Analyze Resume
    `;
  }

  // Update scores and progress bars
  updateScore(overallScore, overallProgress, data.overall_score);
  updateScore(clarityScore, clarityProgress, data.sections?.clarity?.score);
  updateScore(impactScore, impactProgress, data.sections?.impact?.score);
  updateScore(atsScore, atsProgress, data.sections?.ats_optimization?.score);
  updateScore(
    formattingScore,
    formattingProgress,
    data.sections?.formatting?.score
  );

  // Update feedback sections
  if (clarityFeedback)
    clarityFeedback.textContent = data.sections?.clarity?.feedback || "";
  if (impactFeedback)
    impactFeedback.textContent = data.sections?.impact?.feedback || "";
  if (atsFeedback)
    atsFeedback.textContent = data.sections?.ats_optimization?.feedback || "";
  if (formattingFeedback)
    formattingFeedback.textContent = data.sections?.formatting?.feedback || "";

  // Update JD match section if available
  if (data.jd_match) {
    jdMatchSection?.classList.remove("hidden");
    updateScore(jdMatchScore, jdMatchProgress, data.jd_match.score);
    if (jdMatchFeedback)
      jdMatchFeedback.textContent = data.jd_match.feedback || "";
  } else {
    jdMatchSection?.classList.add("hidden");
  }

  // Update JD recommendations if available
  if (data.jd_recommendations && data.jd_recommendations.length > 0) {
    jdRecommendationsSection?.classList.remove("hidden");
    updateList(jdRecommendationsList, data.jd_recommendations);
  } else {
    jdRecommendationsSection?.classList.add("hidden");
  }

  // Update strengths and suggestions
  updateList(strengthsList, data.strengths);
  updateList(suggestionsList, data.top_suggestions);

  // Update advanced analysis if available
  if (data.advanced_analysis) {
    updateAdvancedAnalysis(data.advanced_analysis);
  }

  // Display generated content
  displayGeneratedContent(data);

  // Smooth scroll to results
  smoothScrollToResults();
}

// Update score and progress bar
function updateScore(scoreElement, progressElement, score, suffix = "/100") {
  if (scoreElement) scoreElement.textContent = `${score}${suffix}`;
  if (progressElement) {
    setTimeout(() => {
      progressElement.style.width = `${score}%`;
    }, 100);
  }
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
    if (toneScore && toneProgress) {
      updateScore(toneScore, toneProgress, tone.score || 0, "/100");
    }
    if (toneType) toneType.textContent = `Tone: ${tone.tone_type || "Unknown"}`;
    if (toneFeedback)
      toneFeedback.textContent = tone.feedback || "No tone feedback available";
  }

  // Bullet Point Grade
  if (advancedData.bullet_point_grade) {
    const bullet = advancedData.bullet_point_grade;
    if (bulletScore && bulletProgress) {
      updateScore(bulletScore, bulletProgress, bullet.score || 0, "/100");
    }
    if (actionVerbs) actionVerbs.textContent = bullet.action_verbs_count || 0;
    if (quantifiedBullets) {
      quantifiedBullets.textContent = `${bullet.quantified_bullets || 0}/${
        bullet.total_bullets || 0
      }`;
    }
    if (bulletFeedback) {
      bulletFeedback.textContent =
        bullet.feedback || "No bullet point feedback available";
    }
  }

  // Buzzword Detection
  if (advancedData.buzzword_detection) {
    const buzzword = advancedData.buzzword_detection;
    if (buzzwordScore && buzzwordProgress) {
      updateScore(buzzwordScore, buzzwordProgress, buzzword.score || 0, "/100");
    }
    if (buzzwordCount) buzzwordCount.textContent = buzzword.buzzword_count || 0;
    formatBuzzwordList(buzzword.buzzwords_found || []);
  }

  // Red Flags
  if (advancedData.red_flags) {
    const redFlag = advancedData.red_flags;
    if (redFlagScore && redFlagProgress) {
      updateScore(redFlagScore, redFlagProgress, redFlag.score || 0, "/100");
    }
    if (redFlagCount) redFlagCount.textContent = redFlag.flag_count || 0;
    formatRedFlagList(redFlag.flags_detected || []);
  }

  // Skills Balance
  if (advancedData.skills_balance) {
    const skills = advancedData.skills_balance;
    if (skillsScore && skillsProgress) {
      updateScore(skillsScore, skillsProgress, skills.score || 0, "/100");
    }
    if (hardSkills) hardSkills.textContent = skills.hard_skills_count || 0;
    if (softSkills) softSkills.textContent = skills.soft_skills_count || 0;
    if (skillsRatio) skillsRatio.textContent = skills.balance_ratio || "--";
  }

  // Generate advanced insights
  generateAdvancedInsights(advancedData);
}

// Format buzzword list
function formatBuzzwordList(buzzwords) {
  if (!buzzwordList) return;

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
  if (!redFlagList) return;

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

  if (advancedInsights) {
    advancedInsights.innerHTML = insights
      .map((insight) => `<p>${insight}</p>`)
      .join("");
  }
}

// Function to display generated content
function displayGeneratedContent(data) {
  // Remove any existing generated content
  const existingContent = document.getElementById("generatedContent");
  if (existingContent) {
    existingContent.remove();
  }

  // Create container for generated content
  const contentContainer = document.createElement("div");
  contentContainer.id = "generatedContent";
  contentContainer.className = "mt-8 space-y-6";

  let hasGeneratedContent = false;

  // Resume Summary
  if (data.resume_summary) {
    hasGeneratedContent = true;
    const summaryDiv = document.createElement("div");
    summaryDiv.className =
      "glass-card rounded-3xl p-8 shadow-soft-lg dark:shadow-dark-soft";

    const summaryData =
      typeof data.resume_summary === "string"
        ? { summary: data.resume_summary }
        : data.resume_summary;

    summaryDiv.innerHTML = `
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Generated Resume Summary</h3>
      </div>
      <div class="p-6 bg-primary-50 dark:bg-dark-800 rounded-lg">
        <div class="mb-4">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Professional Summary</h4>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${
            summaryData.summary
          }</p>
        </div>
        ${
          summaryData.explanation
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Strategy</h4>
            <p class="text-gray-600 dark:text-gray-400 text-sm">${summaryData.explanation}</p>
          </div>
        `
            : ""
        }
        ${
          summaryData.keywords
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Keywords Included</h4>
            <div class="flex flex-wrap gap-2">
              ${summaryData.keywords
                .map(
                  (keyword) =>
                    `<span class="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs">${keyword}</span>`
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
        ${
          summaryData.metrics_highlighted
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Metrics Highlighted</h4>
            <ul class="text-gray-600 dark:text-gray-400 text-sm space-y-1">
              ${summaryData.metrics_highlighted
                .map((metric) => `<li>• ${metric}</li>`)
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
        ${
          summaryData.improvement_tips
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Improvement Tips</h4>
            <ul class="text-gray-600 dark:text-gray-400 text-sm space-y-1">
              ${summaryData.improvement_tips
                .map((tip) => `<li>• ${tip}</li>`)
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
      </div>
      <button onclick="copyToClipboard('${summaryData.summary.replace(
        /'/g,
        "\\'"
      )}', this)" class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
        Copy Summary
      </button>
    `;
    contentContainer.appendChild(summaryDiv);
  }

  // Tailored Resume
  if (data.tailored_resume) {
    hasGeneratedContent = true;
    const variantDiv = document.createElement("div");
    variantDiv.className =
      "glass-card rounded-3xl p-8 shadow-soft-lg dark:shadow-dark-soft";

    const variantData = data.tailored_resume;

    variantDiv.innerHTML = `
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
        </svg>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Tailored Resume Optimization</h3>
      </div>
      <div class="p-6 bg-primary-50 dark:bg-dark-800 rounded-lg">
        ${
          variantData.tailored_summary
            ? `
          <div class="mb-6">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Tailored Professional Summary</h4>
            <div class="p-4 bg-white dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${variantData.tailored_summary}</p>
            </div>
          </div>
        `
            : ""
        }
        
        ${
          variantData.enhanced_bullets
            ? `
          <div class="mb-6">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Enhanced Bullet Points</h4>
            <div class="space-y-4">
              ${variantData.enhanced_bullets
                .map(
                  (bullet) => `
                <div class="p-4 bg-white dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
                  <div class="mb-2">
                    <span class="text-sm font-medium text-red-600 dark:text-red-400">Original:</span>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">${bullet.original}</p>
                  </div>
                  <div class="mb-2">
                    <span class="text-sm font-medium text-green-600 dark:text-green-400">Enhanced:</span>
                    <p class="text-gray-700 dark:text-gray-300 mt-1">${bullet.enhanced}</p>
                  </div>
                  <div>
                    <span class="text-sm font-medium text-blue-600 dark:text-blue-400">Reasoning:</span>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">${bullet.reasoning}</p>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
        
        ${
          variantData.skills_optimization
            ? `
          <div class="mb-6">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Skills Optimization</h4>
            <div class="space-y-3">
              ${
                variantData.skills_optimization.prioritized_skills
                  ? `
                <div>
                  <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Prioritized Skills</h5>
                  <div class="flex flex-wrap gap-2">
                    ${variantData.skills_optimization.prioritized_skills
                      .map(
                        (skill) =>
                          `<span class="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs">${skill}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              ${
                variantData.skills_optimization.skills_to_add
                  ? `
                <div>
                  <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Skills to Add</h5>
                  <div class="flex flex-wrap gap-2">
                    ${variantData.skills_optimization.skills_to_add
                      .map(
                        (skill) =>
                          `<span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs">${skill}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              ${
                variantData.skills_optimization.skills_to_remove
                  ? `
                <div>
                  <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Skills to De-emphasize</h5>
                  <div class="flex flex-wrap gap-2">
                    ${variantData.skills_optimization.skills_to_remove
                      .map(
                        (skill) =>
                          `<span class="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs">${skill}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
        
        ${
          variantData.ats_keywords
            ? `
          <div class="mb-6">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">ATS Keywords</h4>
            <div class="flex flex-wrap gap-2">
              ${variantData.ats_keywords
                .map(
                  (keyword) =>
                    `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">${keyword}</span>`
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
        
        ${
          variantData.match_percentage
            ? `
          <div class="mb-6">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Job Match Analysis</h4>
            <div class="p-4 bg-white dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
              <div class="flex items-center mb-2">
                <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">${variantData.match_percentage}%</span>
                <span class="text-gray-600 dark:text-gray-400 ml-2">Job Match Score</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div class="bg-primary-600 h-2 rounded-full" style="width: ${variantData.match_percentage}%"></div>
              </div>
            </div>
          </div>
        `
            : ""
        }
        
        ${
          variantData.section_recommendations
            ? `
          <div class="mb-6">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Section Recommendations</h4>
            <div class="space-y-3">
              ${variantData.section_recommendations
                .map(
                  (rec) => `
                <div class="p-3 bg-white dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
                  <div class="flex items-center mb-1">
                    <span class="font-medium text-gray-800 dark:text-gray-200">${
                      rec.section
                    }</span>
                    <span class="ml-2 px-2 py-1 text-xs rounded-full ${
                      rec.priority === "high"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : rec.priority === "medium"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    }">${rec.priority}</span>
                  </div>
                  <p class="text-gray-600 dark:text-gray-400 text-sm">${
                    rec.recommendation
                  }</p>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
        
        ${
          variantData.improvement_areas
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Areas for Improvement</h4>
            <ul class="text-gray-600 dark:text-gray-400 text-sm space-y-1">
              ${variantData.improvement_areas
                .map((area) => `<li>• ${area}</li>`)
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
      </div>
      <button onclick="copyToClipboard('${JSON.stringify(
        variantData,
        null,
        2
      ).replace(
        /'/g,
        "\\'"
      )}', this)" class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
        Copy Tailored Resume Data
      </button>
    `;
    contentContainer.appendChild(variantDiv);
  }

  // Cover Letter
  if (data.cover_letter) {
    hasGeneratedContent = true;
    const coverDiv = document.createElement("div");
    coverDiv.className =
      "glass-card rounded-3xl p-8 shadow-soft-lg dark:shadow-dark-soft";

    const coverData = data.cover_letter;
    const fullLetter =
      coverData.full_letter ||
      `${coverData.greeting || ""}\n\n${coverData.introduction || ""}\n\n${
        coverData.body_paragraph_1 || ""
      }\n\n${coverData.body_paragraph_2 || ""}\n\n${
        coverData.body_paragraph_3 || ""
      }\n\n${coverData.closing || ""}\n\n${coverData.signature || ""}`;

    coverDiv.innerHTML = `
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Generated Cover Letter</h3>
      </div>
      <div class="p-6 bg-primary-50 dark:bg-dark-800 rounded-lg">
        <div class="mb-6">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Complete Cover Letter</h4>
          <div class="p-4 bg-white dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
            <pre class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">${fullLetter}</pre>
          </div>
        </div>
        
        ${
          coverData.key_strengths_highlighted
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Key Strengths Highlighted</h4>
            <ul class="text-gray-600 dark:text-gray-400 text-sm space-y-1">
              ${coverData.key_strengths_highlighted
                .map((strength) => `<li>• ${strength}</li>`)
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
        
        ${
          coverData.personalization_elements
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Personalization Elements</h4>
            <ul class="text-gray-600 dark:text-gray-400 text-sm space-y-1">
              ${coverData.personalization_elements
                .map((element) => `<li>• ${element}</li>`)
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
        
        ${
          coverData.word_count
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Letter Analysis</h4>
            <div class="text-gray-600 dark:text-gray-400 text-sm">
              <p>Word Count: ${coverData.word_count}</p>
              ${
                coverData.tone_analysis
                  ? `<p>Tone: ${coverData.tone_analysis}</p>`
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
        
        ${
          coverData.improvement_suggestions
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Improvement Suggestions</h4>
            <ul class="text-gray-600 dark:text-gray-400 text-sm space-y-1">
              ${coverData.improvement_suggestions
                .map((suggestion) => `<li>• ${suggestion}</li>`)
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
      </div>
      <button onclick="copyToClipboard('${fullLetter.replace(
        /'/g,
        "\\'"
      )}', this)" class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
        Copy Cover Letter
      </button>
    `;
    contentContainer.appendChild(coverDiv);
  }

  // LinkedIn Summary
  if (data.linkedin_summary) {
    hasGeneratedContent = true;
    const linkedinDiv = document.createElement("div");
    linkedinDiv.className =
      "glass-card rounded-3xl p-8 shadow-soft-lg dark:shadow-dark-soft";

    const linkedinData =
      typeof data.linkedin_summary === "string"
        ? { linkedin_summary: data.linkedin_summary }
        : data.linkedin_summary;

    linkedinDiv.innerHTML = `
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">LinkedIn Summary Optimization</h3>
      </div>
      <div class="p-6 bg-primary-50 dark:bg-dark-800 rounded-lg">
        <div class="mb-6">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Optimized LinkedIn About Section</h4>
          <div class="p-4 bg-white dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
            <pre class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">${
              linkedinData.linkedin_summary
            }</pre>
          </div>
        </div>
        
        ${
          linkedinData.keyword_density
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Keyword Optimization</h4>
            <div class="space-y-3">
              ${
                linkedinData.keyword_density.primary_keywords
                  ? `
                <div>
                  <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-1">Primary Keywords</h5>
                  <div class="flex flex-wrap gap-2">
                    ${linkedinData.keyword_density.primary_keywords
                      .map(
                        (keyword) =>
                          `<span class="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs">${keyword}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              ${
                linkedinData.keyword_density.secondary_keywords
                  ? `
                <div>
                  <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-1">Secondary Keywords</h5>
                  <div class="flex flex-wrap gap-2">
                    ${linkedinData.keyword_density.secondary_keywords
                      .map(
                        (keyword) =>
                          `<span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs">${keyword}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              ${
                linkedinData.keyword_density.industry_terms
                  ? `
                <div>
                  <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-1">Industry Terms</h5>
                  <div class="flex flex-wrap gap-2">
                    ${linkedinData.keyword_density.industry_terms
                      .map(
                        (term) =>
                          `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">${term}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
        
        ${
          linkedinData.optimization_score
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Optimization Analysis</h4>
            <div class="text-gray-600 dark:text-gray-400 text-sm space-y-1">
              <p>Optimization Score: <span class="font-medium text-primary-600 dark:text-primary-400">${
                linkedinData.optimization_score
              }/100</span></p>
              ${
                linkedinData.character_count
                  ? `<p>Character Count: ${linkedinData.character_count}</p>`
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
        
        ${
          linkedinData.structure_analysis
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Structure Analysis</h4>
            <div class="text-gray-600 dark:text-gray-400 text-sm space-y-1">
              ${
                linkedinData.structure_analysis.hook_strength
                  ? `<p><strong>Hook:</strong> ${linkedinData.structure_analysis.hook_strength}</p>`
                  : ""
              }
              ${
                linkedinData.structure_analysis.story_flow
                  ? `<p><strong>Flow:</strong> ${linkedinData.structure_analysis.story_flow}</p>`
                  : ""
              }
              ${
                linkedinData.structure_analysis.cta_effectiveness
                  ? `<p><strong>Call-to-Action:</strong> ${linkedinData.structure_analysis.cta_effectiveness}</p>`
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
        
        ${
          linkedinData.profile_completion_tips
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Profile Completion Tips</h4>
            <ul class="text-gray-600 dark:text-gray-400 text-sm space-y-1">
              ${linkedinData.profile_completion_tips
                .map((tip) => `<li>• ${tip}</li>`)
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
      </div>
      <button onclick="copyToClipboard('${linkedinData.linkedin_summary.replace(
        /'/g,
        "\\'"
      )}', this)" class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
        Copy LinkedIn Summary
      </button>
    `;
    contentContainer.appendChild(linkedinDiv);
  }

  // Add generated content to results section if any content was generated
  if (hasGeneratedContent) {
    resultsSection.appendChild(contentContainer);
  }
}

// Helper function to copy text to clipboard
function copyToClipboard(text, button) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = button.textContent;
      button.textContent = "Copied!";
      button.classList.add("bg-green-600");
      button.classList.remove("bg-primary-600");

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("bg-green-600");
        button.classList.add("bg-primary-600");
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
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

  // Track resume analysis start
  if (window.va) {
    window.va("track", "Resume Analysis Started", {
      inputMethod: currentInputMethod,
      hasJobDescription: jobDescription.value.trim().length > 0,
      options: {
        clarity: includeClarity?.checked || false,
        impact: includeImpact?.checked || false,
        ats: includeATS?.checked || false,
        jdMatch: includeJDMatch?.checked || false,
      },
    });
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
    formData.append("includeClarity", includeClarity?.checked || false);
    formData.append("includeImpact", includeImpact?.checked || false);
    formData.append("includeATS", includeATS?.checked || false);
    formData.append(
      "includeJDMatch",
      (includeJDMatch?.checked || false) && jdText.length > 0
    );

    // Add generator options
    formData.append("includeSummaryGen", includeSummaryGen?.checked || false);
    formData.append("includeVariantGen", includeVariantGen?.checked || false);
    formData.append("includeCoverGen", includeCoverGen?.checked || false);
    formData.append("includeLinkedInGen", includeLinkedInGen?.checked || false);

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

    // Track successful analysis completion
    if (window.va) {
      window.va("track", "Resume Analysis Completed", {
        overallScore: data.overall_score || "unknown",
        hasAdvancedAnalysis: !!data.advanced_analysis,
        hasJDMatch: !!data.jd_match,
      });
    }

    // Show results and generators section
    showResults(data);
  } catch (error) {
    console.error("Analysis error:", error);

    // Track analysis errors
    if (window.va) {
      window.va("track", "Resume Analysis Error", {
        error: error.message || "Unknown error",
      });
    }

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
