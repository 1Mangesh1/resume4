let resumeText, resumeFile, jobDescription, analyzeBtn, clearBtn;
let loadingState, errorState, errorMessage, resultsSection;

let textInputTab, fileInputTab, textInputSection, fileInputSection;
let fileDropZone, fileInfo, fileName, fileSize;
let includeClarity, includeImpact, includeATS, includeJDMatch;
let jobDescriptionSection, inputGrid;

let includeSummaryGen,
  includeVariantGen,
  includeCoverGen,
  includeLinkedInGen,
  includeLatexGen;

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

let jdMatchSection, jdMatchScore, jdMatchProgress, jdMatchFeedback;
let jdRecommendationsSection, jdRecommendationsList;
let toneScore, toneProgress, toneType, toneFeedback;
let bulletScore, bulletProgress, actionVerbs, quantifiedBullets, bulletFeedback;
let buzzwordScore, buzzwordProgress, buzzwordCount, buzzwordList;
let redFlagScore, redFlagProgress, redFlagCount, redFlagList;
let skillsScore, skillsProgress, hardSkills, softSkills, skillsRatio;
let advancedInsights, strengthsList, suggestionsList;
let themeToggle, proTipToast, dismissProTip;

let currentInputMethod = "file";
let selectedFile = null;
let isAnalyzing = false;

let apiCallCount = parseInt(localStorage.getItem("apiCallCount") || "0");
let lastResetDate =
  localStorage.getItem("lastResetDate") || new Date().toDateString();

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function updateApiUsage() {
  const today = new Date().toDateString();

  if (lastResetDate !== today) {
    apiCallCount = 0;
    lastResetDate = today;
    localStorage.setItem("lastResetDate", today);
  }

  apiCallCount++;
  localStorage.setItem("apiCallCount", apiCallCount.toString());

  if (apiCallCount >= 45) {
    showToast(
      `⚠️ High API usage: ${apiCallCount}/50 requests today. Only ${
        50 - apiCallCount
      } analyses remaining.`,
      "warning"
    );
  } else if (apiCallCount >= 35) {
    showToast(
      `📊 API usage: ${apiCallCount}/50 requests today. Consider using fewer generators to optimize usage.`,
      "info"
    );
  } else if (apiCallCount === 1) {
    showToast(
      `🚀 Optimized! All generators use just 1 API call per analysis.`,
      "success"
    );
  }
}

function trackApiCall() {
  updateApiUsage();
  showApiUsageIndicator();
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const html = document.documentElement;

  html.classList.remove("light", "dark");

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    html.classList.add("light");
    localStorage.setItem("theme", "light");
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        if (e.matches) {
          html.classList.remove("light");
          html.classList.add("dark");
        } else {
          html.classList.remove("dark");
          html.classList.add("light");
        }
      }
    });
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";

  html.classList.remove("light", "dark");

  html.classList.add(newTheme);

  localStorage.setItem("theme", newTheme);

  document.body.style.transition = "background-color 0.3s ease";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.transition = "";
    });
  });

  if (window.va) {
    window.va("track", "Theme Changed", { theme: newTheme });
  }
}

function showProTip() {
  if (!proTipToast || localStorage.getItem("proTipDismissed")) {
    return;
  }

  proTipToast.style.display = "block";
  setTimeout(() => {
    if (proTipToast) {
      proTipToast.classList.remove("translate-x-full");
      proTipToast.classList.add("translate-x-0");
    }
  }, 2000);
}

function hideProTip() {
  if (!proTipToast) return;

  proTipToast.classList.remove("translate-x-0");
  proTipToast.classList.add("translate-x-full");
}

function dismissProTipPermanently() {
  if (!proTipToast) return;

  proTipToast.classList.remove("translate-x-0");
  proTipToast.classList.add("translate-x-full");

  setTimeout(() => {
    if (proTipToast) {
      proTipToast.style.display = "none";
    }
  }, 500);

  localStorage.setItem("proTipDismissed", "true");
}

initializeTheme();

if (typeof window !== "undefined" && window.va) {
  window.va("pageview");
}

function initializeScrollObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in");
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".scroll-animate").forEach((el) => {
    observer.observe(el);
  });
}

function smoothScrollToResults() {
  if (!resultsSection) return;

  const headerOffset = 80;
  const elementPosition = resultsSection.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
}

function handleFileSelect(event) {
  const file = event.target.files[0] || event.dataTransfer?.files[0];
  if (!file) return;

  clearForm();

  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  fileInfo.classList.remove("hidden");
  fileInfo.classList.add("animate-fade-in");

  analyzeBtn.disabled = false;
  analyzeBtn.classList.remove("opacity-50", "cursor-not-allowed");
  analyzeBtn.classList.add("hover:shadow-lg");
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function clearForm() {
  const elementsToFade = [fileInfo, resultsSection, errorState];
  elementsToFade.forEach((el) => {
    if (el && !el.classList.contains("hidden")) {
      el.classList.add("animate-fade-out");
      setTimeout(() => {
        el.classList.add("hidden");
        el.classList.remove("animate-fade-out");
      }, 300);
    }
  });

  if (resumeText) resumeText.value = "";
  if (resumeFile) resumeFile.value = "";
  if (jobDescription) jobDescription.value = "";

  selectedFile = null;

  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add("opacity-50", "cursor-not-allowed");
    analyzeBtn.classList.remove("hover:shadow-lg");
  }
}

function hideAllStates() {
  [loadingState, errorState, resultsSection].forEach((el) => {
    if (el && !el.classList.contains("hidden")) {
      el.classList.add("animate-fade-out");
      setTimeout(() => {
        el.classList.add("hidden");
        el.classList.remove("animate-fade-out");
      }, 300);
    }
  });
}

function showLoading() {
  hideAllStates();
  if (!loadingState) return;

  loadingState.classList.remove("hidden");
  loadingState.classList.add("animate-fade-in");

  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
}

function showError(message) {
  hideAllStates();
  if (!errorState || !errorMessage) return;

  errorMessage.textContent = message;
  errorState.classList.remove("hidden");
  errorState.classList.add("animate-fade-in");

  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  resumeText = document.getElementById("resumeText");
  resumeFile = document.getElementById("resumeFile");
  jobDescription = document.getElementById("jobDescription");
  analyzeBtn = document.getElementById("analyzeBtn");
  clearBtn = document.getElementById("clearBtn");
  loadingState = document.getElementById("loadingState");
  errorState = document.getElementById("errorState");
  errorMessage = document.getElementById("errorMessage");
  resultsSection = document.getElementById("resultsSection");

  textInputTab = document.getElementById("textInputTab");
  fileInputTab = document.getElementById("fileInputTab");
  textInputSection = document.getElementById("textInputSection");
  fileInputSection = document.getElementById("fileInputSection");
  fileDropZone = document.getElementById("fileDropZone");
  fileInfo = document.getElementById("fileInfo");
  fileName = document.getElementById("fileName");
  fileSize = document.getElementById("fileSize");

  includeClarity = document.getElementById("includeClarity");
  includeImpact = document.getElementById("includeImpact");
  includeATS = document.getElementById("includeATS");
  includeJDMatch = document.getElementById("includeJDMatch");

  includeSummaryGen = document.getElementById("includeSummaryGen");
  includeVariantGen = document.getElementById("includeVariantGen");
  includeCoverGen = document.getElementById("includeCoverGen");
  includeLinkedInGen = document.getElementById("includeLinkedInGen");
  includeLatexGen = document.getElementById("includeLatexGen");

  jobDescriptionSection = document.getElementById("jobDescriptionSection");
  inputGrid = document.getElementById("inputGrid");

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

  jdMatchSection = document.getElementById("jdMatchSection");
  jdMatchScore = document.getElementById("jdMatchScore");
  jdMatchProgress = document.getElementById("jdMatchProgress");
  jdMatchFeedback = document.getElementById("jdMatchFeedback");
  jdRecommendationsSection = document.getElementById(
    "jdRecommendationsSection"
  );
  jdRecommendationsList = document.getElementById("jdRecommendationsList");

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

  themeToggle = document.getElementById("themeToggle");
  proTipToast = document.getElementById("proTipToast");
  dismissProTip = document.getElementById("dismissProTip");

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

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      themeToggle.classList.add("scale-95");
      setTimeout(() => themeToggle.classList.remove("scale-95"), 100);

      toggleTheme();
    });
  }

  if (dismissProTip)
    dismissProTip.addEventListener("click", dismissProTipPermanently);

  if (jobDescription) {
    jobDescription.addEventListener("input", function () {
      if (this.value.trim().length > 50 && !includeJDMatch?.checked) {
        if (includeJDMatch) {
          includeJDMatch.checked = true;
          toggleJobDescriptionSection();
        }
      }
    });

    jobDescription.addEventListener("focus", function () {
      if (!localStorage.getItem("proTipDismissed")) {
        proTipToast.style.display = "block";
        setTimeout(() => {
          proTipToast.classList.remove("translate-x-full");
          proTipToast.classList.add("translate-x-0");
        }, 500);
      }
    });
  }

  if (includeJDMatch)
    includeJDMatch.addEventListener("change", toggleJobDescriptionSection);

  // Best Resume Generation Event Listeners
  const generateBestResumeBtn = document.getElementById("generateBestResumeBtn");
  const previewResumeBtn = document.getElementById("previewResumeBtn");
  const copyLatexBtn = document.getElementById("copyLatexBtn");
  
  if (generateBestResumeBtn) {
    generateBestResumeBtn.addEventListener("click", generateBestResume);
  }
  
  if (previewResumeBtn) {
    previewResumeBtn.addEventListener("click", previewResumeOnTexlive);
  }
  
  if (copyLatexBtn) {
    copyLatexBtn.addEventListener("click", copyLatexCode);
  }

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

  const textareas = document.querySelectorAll(".textarea-focus");

  textareas.forEach((textarea) => {
    textarea.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
    });

    textarea.addEventListener("blur", function () {
      this.parentElement.classList.remove("focused");
    });

    textarea.addEventListener("input", function () {
      if (this.value.trim() !== "") {
        this.classList.add("has-content");
      } else {
        this.classList.remove("has-content");
      }
    });

    if (textarea.value.trim() !== "") {
      textarea.classList.add("has-content");
    }
  });

  initializeScrollObserver();

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  initializeTheme();

  const originalShowResults = showResults;
  window.showResults = function (data) {
    originalShowResults(data);
    smoothScrollToResults();
  };

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      this.parentElement.classList.toggle("scale-105", this.checked);
    });
  });

  const progressBars = document.querySelectorAll(".progress-bar");
  progressBars.forEach((bar) => {
    bar.addEventListener("transitionstart", function () {
      this.classList.add("animate-pulse-soft");
    });
    bar.addEventListener("transitionend", function () {
      this.classList.remove("animate-pulse-soft");
    });
  });

  showProTip();

  showApiUsageIndicator();

  // Initialize generator checkboxes with error handling
  try {
    initializeGeneratorCheckboxes();
    console.log("✅ Generator checkboxes initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing generator checkboxes:", error);
  }

  initializeJobDescriptionListener();

  switchInputMethod("file");

  console.log("✨ Professional Resume Analyzer UI initialized successfully!");
});

function initializeJobDescriptionListener() {
  const jobDescription = document.getElementById("jobDescription");
  if (jobDescription) {
    jobDescription.addEventListener(
      "input",
      debounce(() => {
        updateGeneratorUI();
      }, 300)
    );
  }
}

function updateGeneratorUI() {
  const jobDescription = document.getElementById("jobDescription");
  const hasJobDescription =
    jobDescription && jobDescription.value.trim().length > 0;

  const generators = [
    { id: "includeVariantGen", name: "Tailored Resume" },
    { id: "includeCoverGen", name: "Cover Letter" },
  ];

  generators.forEach((gen) => {
    const checkbox = document.getElementById(gen.id);
    if (!checkbox) return;

    const label = checkbox.closest("label");
    if (!label) return;

    const indicator =
      label.querySelector(".jd-indicator") || document.createElement("span");
    indicator.className = "jd-indicator text-xs ml-2";

    if (hasJobDescription) {
      indicator.textContent = "✓ JD Optimized";
      indicator.classList.add("text-green-500");
      indicator.classList.remove("text-gray-400");
    } else {
      indicator.textContent = "(JD Recommended)";
      indicator.classList.add("text-gray-400");
      indicator.classList.remove("text-green-500");
    }

    if (!label.querySelector(".jd-indicator")) {
      label.appendChild(indicator);
    }
  });
}

function toggleJobDescriptionSection() {
  const isChecked = includeJDMatch?.checked || false;

  if (window.va) {
    window.va("track", "Job Description Matching", { enabled: isChecked });
  }

  if (isChecked) {
    if (jobDescriptionSection) {
      jobDescriptionSection.classList.remove("hidden");

      setTimeout(() => {
        jobDescriptionSection.classList.remove("opacity-0", "translate-y-4");
        jobDescriptionSection.classList.add("opacity-100", "translate-y-0");
      }, 10);
    }

    if (inputGrid) {
      inputGrid.classList.remove("lg:grid-cols-1");
      inputGrid.classList.add("lg:grid-cols-2");
    }
  } else {
    if (jobDescriptionSection) {
      jobDescriptionSection.classList.remove("opacity-100", "translate-y-0");
      jobDescriptionSection.classList.add("opacity-0", "translate-y-4");

      setTimeout(() => {
        jobDescriptionSection.classList.add("hidden");
      }, 500);
    }

    if (inputGrid) {
      inputGrid.classList.remove("lg:grid-cols-2");
      inputGrid.classList.add("lg:grid-cols-1");
    }

    if (jobDescription) {
      jobDescription.value = "";
    }
  }
}

function switchInputMethod(method) {
  currentInputMethod = method;

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

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  if (!allowedTypes.includes(file.type)) {
    showError("Please select a PDF, DOCX, or TXT file.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showError("File size must be less than 10MB.");
    return;
  }

  selectedFile = file;

  if (window.va) {
    window.va("track", "File Uploaded", {
      fileType: file.type,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    });
  }

  fileName.textContent = file.name;
  fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  fileInfo.classList.remove("hidden");

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

function clearForm() {
  resumeText.value = "";
  jobDescription.value = "";
  selectedFile = null;
  resumeFile.value = "";

  if (includeJDMatch) includeJDMatch.checked = false;
  toggleJobDescriptionSection();

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

function hideAllStates() {
  if (loadingState) loadingState.classList.add("hidden");
  if (errorState) errorState.classList.add("hidden");
  if (resultsSection) resultsSection.classList.add("hidden");
  if (jdMatchSection) jdMatchSection.classList.add("hidden");
  if (jdRecommendationsSection)
    jdRecommendationsSection.classList.add("hidden");
}

function showLoading() {
  hideAllStates();
  if (loadingState) loadingState.classList.remove("hidden");

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

function showError(message) {
  hideAllStates();
  errorState.style.display = "block";

  if (message.includes("\n")) {
    const lines = message.split("\n");
    errorMessage.innerHTML = lines
      .map((line) => {
        if (line.trim() === "") return "<br>";
        if (
          line.startsWith("⚠️") ||
          line.startsWith("💡") ||
          line.startsWith("🔄")
        ) {
          return `<div class="font-semibold text-lg mb-2">${line}</div>`;
        }
        if (line.startsWith("•")) {
          return `<div class="ml-4 mb-1">${line}</div>`;
        }
        return `<div class="mb-2">${line}</div>`;
      })
      .join("");
  } else {
    errorMessage.textContent = message;
  }

  smoothScrollToResults();
}

function showResults(data) {
  hideAllStates();
  resultsSection.classList.remove("hidden");

  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `
      <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      Analyze Resume
    `;
  }

  updateScore(overallScore, overallProgress, data.overall_score);
  updateScore(clarityScore, clarityProgress, data.sections?.clarity?.score);
  updateScore(impactScore, impactProgress, data.sections?.impact?.score);
  updateScore(atsScore, atsProgress, data.sections?.ats_optimization?.score);
  updateScore(
    formattingScore,
    formattingProgress,
    data.sections?.formatting?.score
  );

  if (clarityFeedback)
    clarityFeedback.textContent = data.sections?.clarity?.feedback || "";
  if (impactFeedback)
    impactFeedback.textContent = data.sections?.impact?.feedback || "";
  if (atsFeedback)
    atsFeedback.textContent = data.sections?.ats_optimization?.feedback || "";
  if (formattingFeedback)
    formattingFeedback.textContent = data.sections?.formatting?.feedback || "";

  if (data.jd_match) {
    jdMatchSection?.classList.remove("hidden");
    updateScore(jdMatchScore, jdMatchProgress, data.jd_match.score);
    if (jdMatchFeedback)
      jdMatchFeedback.textContent = data.jd_match.feedback || "";
  } else {
    jdMatchSection?.classList.add("hidden");
  }

  if (data.jd_recommendations && data.jd_recommendations.length > 0) {
    jdRecommendationsSection?.classList.remove("hidden");
    updateList(jdRecommendationsList, data.jd_recommendations);
  } else {
    jdRecommendationsSection?.classList.add("hidden");
  }

  updateList(strengthsList, data.strengths);
  updateList(suggestionsList, data.top_suggestions);

  if (data.advanced_analysis) {
    updateAdvancedAnalysis(data.advanced_analysis);
  }

  displayGeneratedContent(data);

  smoothScrollToResults();
}

function updateScore(scoreElement, progressElement, score, suffix = "/100") {
  if (scoreElement) scoreElement.textContent = `${score}${suffix}`;
  if (progressElement) {
    setTimeout(() => {
      progressElement.style.width = `${score}%`;
    }, 100);
  }
}

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

function updateAdvancedAnalysis(advancedData) {
  if (advancedData.tone_evaluation) {
    const tone = advancedData.tone_evaluation;
    if (toneScore && toneProgress) {
      updateScore(toneScore, toneProgress, tone.score || 0, "/100");
    }
    if (toneType) toneType.textContent = `Tone: ${tone.tone_type || "Unknown"}`;
    if (toneFeedback)
      toneFeedback.textContent = tone.feedback || "No tone feedback available";
  }

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

  if (advancedData.buzzword_detection) {
    const buzzword = advancedData.buzzword_detection;
    if (buzzwordScore && buzzwordProgress) {
      updateScore(buzzwordScore, buzzwordProgress, buzzword.score || 0, "/100");
    }
    if (buzzwordCount) buzzwordCount.textContent = buzzword.buzzword_count || 0;
    formatBuzzwordList(buzzword.buzzwords_found || []);
  }

  if (advancedData.red_flags) {
    const redFlag = advancedData.red_flags;
    if (redFlagScore && redFlagProgress) {
      updateScore(redFlagScore, redFlagProgress, redFlag.score || 0, "/100");
    }
    if (redFlagCount) redFlagCount.textContent = redFlag.flag_count || 0;
    formatRedFlagList(redFlag.flags_detected || []);
  }

  if (advancedData.skills_balance) {
    const skills = advancedData.skills_balance;
    if (skillsScore && skillsProgress) {
      updateScore(skillsScore, skillsProgress, skills.score || 0, "/100");
    }
    if (hardSkills) hardSkills.textContent = skills.hard_skills_count || 0;
    if (softSkills) softSkills.textContent = skills.soft_skills_count || 0;
    if (skillsRatio) skillsRatio.textContent = skills.balance_ratio || "--";
  }

  generateAdvancedInsights(advancedData);
}

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

function generateAdvancedInsights(advancedData) {
  const insights = [];

  if (advancedData.tone_evaluation?.score >= 80) {
    insights.push("• Professional tone detected");
  } else if (advancedData.tone_evaluation?.score < 60) {
    insights.push("• Consider improving tone consistency");
  }

  if (advancedData.bullet_point_grade?.action_verbs_count >= 5) {
    insights.push("• Good use of action verbs");
  } else {
    insights.push("• Add more action verbs to bullets");
  }

  if (advancedData.buzzword_detection?.buzzword_count === 0) {
    insights.push("• Excellent: No buzzwords detected");
  } else if (advancedData.buzzword_detection?.buzzword_count > 3) {
    insights.push("• Warning: Too many buzzwords");
  }

  if (advancedData.red_flags?.flag_count === 0) {
    insights.push("• Clean resume: No red flags");
  } else {
    insights.push("• Address detected red flags");
  }

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

function displayGeneratedContent(data) {
  const contentContainer = document.getElementById("generatedContent");
  if (!contentContainer) {
    console.error("❌ generatedContent container not found!");
    return;
  }
  console.log("✅ generatedContent container found");

  // Debug: Log the data structure to see what we're working with
  console.log("📊 Full data object:", data);
  console.log("📝 Resume summary data:", data.resume_summary);
  console.log("🎯 Tailored resume data:", data.tailored_resume);
  console.log("💌 Cover letter data:", data.cover_letter);
  console.log("🔗 LinkedIn summary data:", data.linkedin_summary);
  console.log("📄 LaTeX resume data:", data.latex_resume);

  contentContainer.innerHTML = "";
  let hasGeneratedContent = false;

  function escapeHtml(text) {
    if (!text || typeof text !== "string") return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeForOnclick(text) {
    if (!text || typeof text !== "string") return "";
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  }

  if (data.resume_summary && data.resume_summary.optimized_summary) {
    console.log("✅ Resume summary check passed");
    hasGeneratedContent = true;
    const summaryDiv = document.createElement("div");
    summaryDiv.className =
      "glass-card rounded-3xl p-8 shadow-soft-lg dark:shadow-dark-soft";

    const summaryData = data.resume_summary;

    summaryDiv.innerHTML = `
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Professional Summary</h3>
      </div>
      <div class="p-6 bg-primary-50 dark:bg-dark-800 rounded-lg">
        <p class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">${escapeHtml(
          summaryData.optimized_summary
        )}</p>
        
        ${
          summaryData.keyword_density
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Keyword Density</h4>
            <div class="flex items-center">
              <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">${summaryData.keyword_density}%</span>
              <span class="text-gray-600 dark:text-gray-400 ml-2">Optimization Score</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
              <div class="bg-primary-600 h-2 rounded-full" style="width: ${summaryData.keyword_density}%"></div>
            </div>
          </div>
        `
            : ""
        }
        
        ${
          summaryData.improvement_suggestions &&
          summaryData.improvement_suggestions.length > 0
            ? `
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Improvement Suggestions</h4>
            <ul class="text-gray-600 dark:text-gray-400 text-sm space-y-1">
              ${summaryData.improvement_suggestions
                .map((suggestion) => `<li>• ${escapeHtml(suggestion)}</li>`)
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
      </div>
      <button onclick="copyToClipboard('${escapeForOnclick(
        summaryData.optimized_summary
      )}', this)" class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
        Copy Summary
      </button>
    `;
    contentContainer.appendChild(summaryDiv);
  } else {
    console.log("❌ Resume summary check failed:", {
      hasResumeSum: !!data.resume_summary,
      hasOptSum: !!(data.resume_summary && data.resume_summary.optimized_summary),
      structure: data.resume_summary
    });
  }

  if (data.tailored_resume) {
    console.log("✅ Tailored resume check passed");
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
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(
                variantData.tailored_summary
              )}</p>
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
      </div>
      <button onclick="copyToClipboard('${escapeForOnclick(
        variantData.tailored_summary || ""
      )}', this)" class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
        Copy Optimization
      </button>
    `;
    contentContainer.appendChild(variantDiv);
  } else {
    console.log("❌ Tailored resume check failed:", {
      hasTailoredResume: !!data.tailored_resume,
      structure: data.tailored_resume
    });
  }

  if (data.cover_letter && data.cover_letter.full_letter) {
    console.log("✅ Cover letter check passed");
    hasGeneratedContent = true;
    const coverDiv = document.createElement("div");
    coverDiv.className =
      "glass-card rounded-3xl p-8 shadow-soft-lg dark:shadow-dark-soft";

    const coverData = data.cover_letter;

    coverDiv.innerHTML = `
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Cover Letter</h3>
      </div>
      <div class="p-6 bg-primary-50 dark:bg-dark-800 rounded-lg">
        <div class="bg-white dark:bg-dark-700 rounded-lg p-6 whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">
          ${escapeHtml(coverData.full_letter)}
        </div>
        
        ${
          coverData.word_count
            ? `
          <div class="mt-4 flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Word Count: ${
              coverData.word_count
            }</span>
            ${
              coverData.personalization_score
                ? `<span class="text-sm text-gray-600 dark:text-gray-400">Personalization: ${coverData.personalization_score}%</span>`
                : ""
            }
          </div>
        `
            : ""
        }
      </div>
      <button onclick="copyToClipboard('${escapeForOnclick(
        coverData.full_letter
      )}', this)" class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
        Copy Cover Letter
      </button>
    `;
    contentContainer.appendChild(coverDiv);
  }

  if (data.linkedin_summary && data.linkedin_summary.linkedin_summary) {
    hasGeneratedContent = true;
    const linkedinDiv = document.createElement("div");
    linkedinDiv.className =
      "glass-card rounded-3xl p-8 shadow-soft-lg dark:shadow-dark-soft";

    const linkedinData = data.linkedin_summary;

    linkedinDiv.innerHTML = `
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
        </svg>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">LinkedIn Summary</h3>
      </div>
      <div class="p-6 bg-primary-50 dark:bg-dark-800 rounded-lg">
        <div class="bg-white dark:bg-dark-700 rounded-lg p-6">
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">${escapeHtml(
            linkedinData.linkedin_summary
          )}</p>
        </div>
        
        ${
          linkedinData.optimization_score
            ? `
          <div class="mt-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Optimization Score</h4>
            <div class="flex items-center">
              <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">${linkedinData.optimization_score}%</span>
              <span class="text-gray-600 dark:text-gray-400 ml-2">Optimization Level</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
              <div class="bg-primary-600 h-2 rounded-full" style="width: ${linkedinData.optimization_score}%"></div>
            </div>
          </div>
        `
            : ""
        }
      </div>
      <button onclick="copyToClipboard('${escapeForOnclick(
        linkedinData.linkedin_summary
      )}', this)" class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
        Copy LinkedIn Summary
      </button>
    `;
    contentContainer.appendChild(linkedinDiv);
  }

  if (data.latex_resume && data.latex_resume.latex_source) {
    hasGeneratedContent = true;
    const latexDiv = document.createElement("div");
    latexDiv.className =
      "glass-card rounded-3xl p-8 shadow-soft-lg dark:shadow-dark-soft";

    const latexData = data.latex_resume;

    latexDiv.innerHTML = `
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">LaTeX Resume</h3>
      </div>
      <div class="p-6 bg-primary-50 dark:bg-dark-800 rounded-lg">
        <div class="bg-white dark:bg-dark-700 rounded-lg p-4">
          <pre class="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">${escapeHtml(
            latexData.latex_source
          )}</pre>
        </div>
        
        ${
          latexData.template_used
            ? `
          <div class="mt-4">
            <span class="text-sm text-gray-600 dark:text-gray-400">Template: ${latexData.template_used}</span>
          </div>
        `
            : ""
        }
      </div>
      <div class="flex gap-2 mt-4">
        <button onclick="copyToClipboard('${escapeForOnclick(
          latexData.latex_source
        )}', this)" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Copy LaTeX
        </button>
        <button onclick="downloadLatexSource('${escapeForOnclick(
          latexData.latex_source
        )}', '${
      latexData.template_used || "modern"
    }')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          Download .tex
        </button>
        <button onclick="compileLatexToPdf('${escapeForOnclick(
          latexData.latex_source
        )}')" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Compile PDF
        </button>
      </div>
    `;
    contentContainer.appendChild(latexDiv);
  }

  if (hasGeneratedContent && !contentContainer.classList.contains("block")) {
    console.log("🎉 Showing generated content container");
    contentContainer.classList.remove("hidden");
    contentContainer.classList.add("block");

    setTimeout(() => {
      contentContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  } else {
    console.log("❌ Not showing container:", {
      hasGeneratedContent,
      hasBlockClass: contentContainer.classList.contains("block")
    });
  }
}

function copyToClipboard(text, button) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = button.textContent;
      button.textContent = "Copied!";
      button.classList.add("bg-green-600");
      button.classList.remove("bg-primary-600", "bg-gray-500");

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("bg-green-600");
        button.classList.add("bg-primary-600");
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);

      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        const originalText = button.textContent;
        button.textContent = "Copied!";
        button.classList.add("bg-green-600");
        button.classList.remove("bg-primary-600", "bg-gray-500");
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove("bg-green-600");
          button.classList.add("bg-primary-600");
        }, 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed: ", fallbackErr);
        button.textContent = "Copy failed";
        setTimeout(() => {
          button.textContent = "📋 Copy";
        }, 2000);
      }
      document.body.removeChild(textArea);
    });
}

async function analyzeResume() {
  let resumeContent = "";

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

  if (currentInputMethod === "text" && resumeContent.length < 100) {
    showError("Please enter a more complete resume (at least 100 characters).");
    return;
  }

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

  trackApiCall();

  try {
    const formData = new FormData();

    if (currentInputMethod === "file") {
      formData.append("resumeFile", selectedFile);
    } else {
      formData.append("resumeText", resumeContent);
    }

    const jdText = jobDescription.value.trim();
    if (jdText) {
      formData.append("jobDescription", jdText);
    }

    formData.append("includeClarity", includeClarity?.checked || false);
    formData.append("includeImpact", includeImpact?.checked || false);
    formData.append("includeATS", includeATS?.checked || false);
    formData.append(
      "includeJDMatch",
      (includeJDMatch?.checked || false) && jdText.length > 0
    );

    formData.append("includeSummaryGen", includeSummaryGen?.checked || false);
    formData.append("includeVariantGen", includeVariantGen?.checked || false);
    formData.append("includeCoverGen", includeCoverGen?.checked || false);
    formData.append("includeLinkedInGen", includeLinkedInGen?.checked || false);
    formData.append("includeLatexGen", includeLatexGen?.checked || false);

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      showError(
        "A server error occurred. Please try again later.\n\n" +
          (text.length < 500 ? text : text.slice(0, 500) + "...")
      );
      return;
    }

    if (!response.ok) {
      if (handleApiError(response, data)) {
        return;
      }
    }

    if (data.error) {
      showError(data.error);
      return;
    }

    if (window.va) {
      window.va("track", "Resume Analysis Completed", {
        overallScore: data.overall_score || "unknown",
        hasAdvancedAnalysis: !!data.advanced_analysis,
        hasJDMatch: !!data.jd_match,
      });
    }

    showResults(data);
  } catch (error) {
    console.error("Analysis error:", error);

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

function downloadLatexSource(latexContent, templateName) {
  const blob = new Blob([latexContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume-${templateName}.tex`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadPDF(base64Data, filename) {
  const linkSource = `data:application/pdf;base64,${base64Data}`;
  const downloadLink = document.createElement("a");
  downloadLink.href = linkSource;
  downloadLink.download = filename;
  downloadLink.click();
}

async function regenerateLatexResume(selectedTemplate = "modern") {
  let resumeContent = "";
  if (currentInputMethod === "text") {
    resumeContent = resumeText.value.trim();
  } else if (selectedFile) {
    showError("Please re-analyze your resume to regenerate with new template.");
    return;
  }

  if (!resumeContent) {
    showError("No resume content available for regeneration.");
    return;
  }

  const regenerateButtons = document.querySelectorAll('[id^="regenerate-"]');
  regenerateButtons.forEach((btn) => {
    btn.disabled = true;
    btn.textContent = "Generating...";
    btn.classList.add("opacity-50");
  });

  try {
    const response = await fetch("/api/generate-latex-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: resumeContent,
        analysisData: null,
        templateName: selectedTemplate,
      }),
    });

    const data = await response.json();
    if (data.success || data.latex_source) {
      displayGeneratedContent({ latex_resume: data });

      showMessage("LaTeX resume regenerated successfully!", "success");
    } else {
      showError(data.error || "Failed to regenerate LaTeX resume");
    }
  } catch (error) {
    console.error("Error regenerating LaTeX resume:", error);
    showError("Failed to regenerate LaTeX resume. Please try again.");
  } finally {
    regenerateButtons.forEach((btn) => {
      btn.disabled = false;
      btn.textContent = "Regenerate";
      btn.classList.remove("opacity-50");
    });
  }
}

function showMessage(message, type = "info") {
  const messageDiv = document.createElement("div");
  messageDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
    type === "success"
      ? "bg-green-500 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : "bg-blue-500 text-white"
  }`;
  messageDiv.textContent = message;

  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

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

function copyLatexToClipboard(latexId) {
  const latexElement = document.getElementById(`latexCode-${latexId}`);

  if (!latexElement) {
    showToast("LaTeX code not found", "error");
    return;
  }

  const latexContent = latexElement.textContent || latexElement.innerText;

  if (!latexContent) {
    showToast("No LaTeX content to copy", "error");
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(latexContent)
      .then(() => {
        showToast("LaTeX code copied to clipboard!", "success");
      })
      .catch((err) => {
        console.error("Failed to copy to clipboard:", err);
        fallbackCopyText(latexContent);
      });
  } else {
    fallbackCopyText(latexContent);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    if (successful) {
      showToast("LaTeX code copied to clipboard!", "success");
    } else {
      showToast(
        "Failed to copy to clipboard. Please select and copy manually.",
        "error"
      );
    }
  } catch (err) {
    console.error("Fallback copy failed:", err);
    showToast(
      "Failed to copy to clipboard. Please select and copy manually.",
      "error"
    );
  }

  document.body.removeChild(textArea);
}

function downloadLatexFile(latexId) {
  const latexContent = document.getElementById(
    `latexCode-${latexId}`
  ).textContent;
  const blob = new Blob([latexContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "resume.tex";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("LaTeX file downloaded!", "success");
}

async function downloadPdf(latexId) {
  const latexContent = document.getElementById(
    `latexCode-${latexId}`
  ).textContent;
  const button = document.getElementById(`downloadPdf-${latexId}`);

  const originalText = button.textContent;
  button.textContent = "⏳ Generating PDF...";
  button.disabled = true;

  try {
    const response = await fetch("/api/download-latex-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ texSource: latexContent }),
    });

    if (response.ok) {
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/pdf")) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "resume.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("PDF downloaded successfully! 🎉", "success");
      } else {
        const result = await response.json();
        showToast(
          `PDF generation completed: ${result.message || "Success"}`,
          "success"
        );
      }
    } else {
      const error = await response.json();
      if (error.suggestion) {
        showToast(
          `${error.details || "PDF generation failed"} ${error.suggestion}`,
          "warning"
        );
      } else {
        showToast(
          `PDF generation failed: ${error.error || "Unknown error"}`,
          "error"
        );
      }
    }
  } catch (error) {
    console.error("PDF download error:", error);
    showToast(
      "PDF generation failed. Please try downloading the .tex file and use Overleaf.com instead.",
      "error"
    );
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
}

function regenerateLatex(latexId) {
  const storedData = JSON.parse(localStorage.getItem("lastAnalysis") || "{}");
  if (storedData.resumeText && storedData.analysis) {
    generateLatexResume(storedData.resumeText, storedData.analysis, true);
  } else {
    showToast(
      "No previous analysis found. Please analyze a resume first.",
      "warning"
    );
  }
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
    type === "success"
      ? "bg-green-500 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : type === "warning"
      ? "bg-yellow-500 text-white"
      : "bg-blue-500 text-white"
   }`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 5000);
}

function showApiUsageIndicator() {
  const today = new Date().toDateString();

  if (lastResetDate !== today) {
    apiCallCount = 0;
    lastResetDate = today;
    localStorage.setItem("lastResetDate", today);
    localStorage.setItem("apiCallCount", "0");
  }

  let indicator = document.getElementById("api-usage-indicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "api-usage-indicator";
    indicator.className =
      "fixed top-4 left-4 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400 z-40";
    document.body.appendChild(indicator);
  }

  const percentage = Math.round((apiCallCount / 50) * 100);
  let color = "text-green-600 dark:text-green-400";

  if (percentage >= 80) {
    color = "text-red-600 dark:text-red-400";
  } else if (percentage >= 60) {
    color = "text-yellow-600 dark:text-yellow-400";
  }

  indicator.className = `fixed top-4 left-4 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs ${color} z-40`;
  indicator.textContent = `API: ${apiCallCount}/50`;
}

function handleApiError(response, errorData) {
  if (response.status === 429) {
    const suggestions = errorData.suggestions || [];
    const suggestionsList = suggestions.map((s) => `• ${s}`).join("\n");

    showError(
      `⚠️ API Rate Limit Exceeded\n\n` +
        `${errorData.message}\n\n` +
        `💡 What you can do:\n${suggestionsList}\n\n` +
        `🔄 Your quota will reset in ${errorData.retryAfter || "24 hours"}`
    );

    const demoButton = document.createElement("button");
    demoButton.className =
      "mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors";
    demoButton.textContent = "🎯 Try Demo Mode";
    demoButton.onclick = () => {
      showSampleResults();
      showToast(
        "🎯 Demo mode activated! This shows sample analysis results.",
        "info"
      );
    };

    if (errorMessage) {
      errorMessage.appendChild(demoButton);
    }

    if (errorData.demoMode) {
      setTimeout(() => {
        showToast(
          "💡 Try using fewer analysis options to reduce API usage, or click the demo button above!",
          "info"
        );
      }, 2000);
    }

    return true;
  }

  const errorMessage =
    errorData.message || errorData.error || "Analysis failed";
  const suggestions = errorData.suggestions || [];

  if (suggestions.length > 0) {
    const suggestionsList = suggestions.map((s) => `• ${s}`).join("\n");
    showError(`${errorMessage}\n\n💡 Suggestions:\n${suggestionsList}`);
  } else {
    showError(errorMessage);
  }

  return true;
}

function initializeGeneratorCheckboxes() {
  const checkboxes = [
    "includeSummaryGen",
    "includeVariantGen",
    "includeCoverGen",
    "includeLinkedInGen",
    "includeLatexGen",
  ];

  checkboxes.forEach((id) => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      // Add event listener to both change and click events for better compatibility
      checkbox.addEventListener("change", function () {
        console.log(`🔘 Checkbox ${id} changed to:`, this.checked);
        updateGeneratorUI();
        validateGeneratorSelection();
      });

      // Also add click event listener to handle label clicks
      checkbox.addEventListener("click", function (e) {
        // Prevent double-triggering
        e.stopPropagation();
        console.log(`🔘 Checkbox ${id} clicked`);
      });

      // Add event listener to the parent label for better UX
      const label = checkbox.closest("label");
      if (label) {
        label.addEventListener("click", function (e) {
          // Only handle if the click wasn't directly on the checkbox
          if (e.target !== checkbox) {
            console.log(`🏷️ Label clicked for ${id}`);
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      }
    }
  });

  validateGeneratorSelection();
}

function updateGeneratorUI() {
  const jobDescription = document.getElementById("jobDescription");
  const hasJobDescription =
    jobDescription && jobDescription.value.trim().length > 0;

  const generators = [
    { id: "includeVariantGen", name: "Tailored Resume" },
    { id: "includeCoverGen", name: "Cover Letter" },
  ];

  generators.forEach((gen) => {
    const checkbox = document.getElementById(gen.id);
    if (!checkbox) return;

    const label = checkbox.closest("label");
    if (!label) return;

    const indicator =
      label.querySelector(".jd-indicator") || document.createElement("span");
    indicator.className = "jd-indicator text-xs ml-2";

    if (hasJobDescription) {
      indicator.textContent = "✓ JD Optimized";
      indicator.classList.add("text-green-500");
      indicator.classList.remove("text-gray-400");
    } else {
      indicator.textContent = "(JD Recommended)";
      indicator.classList.add("text-gray-400");
      indicator.classList.remove("text-green-500");
    }

    if (!label.querySelector(".jd-indicator")) {
      label.appendChild(indicator);
    }
  });
}

function toggleJobDescriptionSection() {
  const isChecked = includeJDMatch?.checked || false;

  if (window.va) {
    window.va("track", "Job Description Matching", { enabled: isChecked });
  }

  if (isChecked) {
    if (jobDescriptionSection) {
      jobDescriptionSection.classList.remove("hidden");

      setTimeout(() => {
        jobDescriptionSection.classList.remove("opacity-0", "translate-y-4");
        jobDescriptionSection.classList.add("opacity-100", "translate-y-0");
      }, 10);
    }

    if (inputGrid) {
      inputGrid.classList.remove("lg:grid-cols-1");
      inputGrid.classList.add("lg:grid-cols-2");
    }
  } else {
    if (jobDescriptionSection) {
      jobDescriptionSection.classList.remove("opacity-100", "translate-y-0");
      jobDescriptionSection.classList.add("opacity-0", "translate-y-4");

      setTimeout(() => {
        jobDescriptionSection.classList.add("hidden");
      }, 500);
    }

    if (inputGrid) {
      inputGrid.classList.remove("lg:grid-cols-2");
      inputGrid.classList.add("lg:grid-cols-1");
    }

    if (jobDescription) {
      jobDescription.value = "";
    }
  }
}

function switchInputMethod(method) {
  currentInputMethod = method;

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

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  if (!allowedTypes.includes(file.type)) {
    showError("Please select a PDF, DOCX, or TXT file.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showError("File size must be less than 10MB.");
    return;
  }

  selectedFile = file;

  if (window.va) {
    window.va("track", "File Uploaded", {
      fileType: file.type,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    });
  }

  fileName.textContent = file.name;
  fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  fileInfo.classList.remove("hidden");

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

function clearForm() {
  resumeText.value = "";
  jobDescription.value = "";
  selectedFile = null;
  resumeFile.value = "";

  if (includeJDMatch) includeJDMatch.checked = false;
  toggleJobDescriptionSection();

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

function hideAllStates() {
  if (loadingState) loadingState.classList.add("hidden");
  if (errorState) errorState.classList.add("hidden");
  if (resultsSection) resultsSection.classList.add("hidden");
  if (jdMatchSection) jdMatchSection.classList.add("hidden");
  if (jdRecommendationsSection)
    jdRecommendationsSection.classList.add("hidden");
}

function showLoading() {
  hideAllStates();
  if (loadingState) loadingState.classList.remove("hidden");

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

function showError(message) {
  hideAllStates();
  errorState.style.display = "block";

  if (message.includes("\n")) {
    const lines = message.split("\n");
    errorMessage.innerHTML = lines
      .map((line) => {
        if (line.trim() === "") return "<br>";
        if (
          line.startsWith("⚠️") ||
          line.startsWith("💡") ||
          line.startsWith("🔄")
        ) {
          return `<div class="font-semibold text-lg mb-2">${line}</div>`;
        }
        if (line.startsWith("•")) {
          return `<div class="ml-4 mb-1">${line}</div>`;
        }
        return `<div class="mb-2">${line}</div>`;
      })
      .join("");
  } else {
    errorMessage.textContent = message;
  }

  smoothScrollToResults();
}

function showResults(data) {
  hideAllStates();
  resultsSection.classList.remove("hidden");

  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `
      <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      Analyze Resume
    `;
  }

  updateScore(overallScore, overallProgress, data.overall_score);
  updateScore(clarityScore, clarityProgress, data.sections?.clarity?.score);
  updateScore(impactScore, impactProgress, data.sections?.impact?.score);
  updateScore(atsScore, atsProgress, data.sections?.ats_optimization?.score);
  updateScore(
    formattingScore,
    formattingProgress,
    data.sections?.formatting?.score
  );

  if (clarityFeedback)
    clarityFeedback.textContent = data.sections?.clarity?.feedback || "";
  if (impactFeedback)
    impactFeedback.textContent = data.sections?.impact?.feedback || "";
  if (atsFeedback)
    atsFeedback.textContent = data.sections?.ats_optimization?.feedback || "";
  if (formattingFeedback)
    formattingFeedback.textContent = data.sections?.formatting?.feedback || "";

  if (data.jd_match) {
    jdMatchSection?.classList.remove("hidden");
    updateScore(jdMatchScore, jdMatchProgress, data.jd_match.score);
    if (jdMatchFeedback)
      jdMatchFeedback.textContent = data.jd_match.feedback || "";
  } else {
    jdMatchSection?.classList.add("hidden");
  }

  if (data.jd_recommendations && data.jd_recommendations.length > 0) {
    jdRecommendationsSection?.classList.remove("hidden");
    updateList(jdRecommendationsList, data.jd_recommendations);
  } else {
    jdRecommendationsSection?.classList.add("hidden");
  }

  updateList(strengthsList, data.strengths);
  updateList(suggestionsList, data.top_suggestions);

  if (data.advanced_analysis) {
    updateAdvancedAnalysis(data.advanced_analysis);
  }

  displayGeneratedContent(data);

  smoothScrollToResults();
}

function updateScore(scoreElement, progressElement, score, suffix = "/100") {
  if (scoreElement) scoreElement.textContent = `${score}${suffix}`;
  if (progressElement) {
    setTimeout(() => {
      progressElement.style.width = `${score}%`;
    }, 100);
  }
}

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

function updateAdvancedAnalysis(advancedData) {
  if (advancedData.tone_evaluation) {
    const tone = advancedData.tone_evaluation;
    if (toneScore && toneProgress) {
      updateScore(toneScore, toneProgress, tone.score || 0, "/100");
    }
    if (toneType) toneType.textContent = `Tone: ${tone.tone_type || "Unknown"}`;
    if (toneFeedback)
      toneFeedback.textContent = tone.feedback || "No tone feedback available";
  }

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

  if (advancedData.buzzword_detection) {
    const buzzword = advancedData.buzzword_detection;
    if (buzzwordScore && buzzwordProgress) {
      updateScore(buzzwordScore, buzzwordProgress, buzzword.score || 0, "/100");
    }
    if (buzzwordCount) buzzwordCount.textContent = buzzword.buzzword_count || 0;
    formatBuzzwordList(buzzword.buzzwords_found || []);
  }

  if (advancedData.red_flags) {
    const redFlag = advancedData.red_flags;
    if (redFlagScore && redFlagProgress) {
      updateScore(redFlagScore, redFlagProgress, redFlag.score || 0, "/100");
    }
    if (redFlagCount) redFlagCount.textContent = redFlag.flag_count || 0;
    formatRedFlagList(redFlag.flags_detected || []);
  }

  if (advancedData.skills_balance) {
    const skills = advancedData.skills_balance;
    if (skillsScore && skillsProgress) {
      updateScore(skillsScore, skillsProgress, skills.score || 0, "/100");
    }
    if (hardSkills) hardSkills.textContent = skills.hard_skills_count || 0;
    if (softSkills) softSkills.textContent = skills.soft_skills_count || 0;
    if (skillsRatio) skillsRatio.textContent = skills.balance_ratio || "--";
  }

  generateAdvancedInsights(advancedData);
}

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

function generateAdvancedInsights(advancedData) {
  const insights = [];

  if (advancedData.tone_evaluation?.score >= 80) {
    insights.push("• Professional tone detected");
  } else if (advancedData.tone_evaluation?.score < 60) {
    insights.push("• Consider improving tone consistency");
  }

  if (advancedData.bullet_point_grade?.action_verbs_count >= 5) {
    insights.push("• Good use of action verbs");
  } else {
    insights.push("• Add more action verbs to bullets");
  }

  if (advancedData.buzzword_detection?.buzzword_count === 0) {
    insights.push("• Excellent: No buzzwords detected");
  } else if (advancedData.buzzword_detection?.buzzword_count > 3) {
    insights.push("• Warning: Too many buzzwords");
  }

  if (advancedData.red_flags?.flag_count === 0) {
    insights.push("• Clean resume: No red flags");
  } else {
    insights.push("• Address detected red flags");
  }

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
