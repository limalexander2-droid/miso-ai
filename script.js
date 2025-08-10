let currentQuestion = 0;
let answers = [];

const container = document.getElementById("question-container");
const answerButtons = document.getElementById("answer-buttons");
const resultContainer = document.getElementById("result");
const loadingContainer = document.getElementById("loading");
const quizContainer = document.getElementById("quiz");

const loadingMessages = [
  { emoji: "🍣", text: "Plating your cravings…" },
  { emoji: "🍜", text: "Asking the kitchen for something special…" },
  { emoji: "🥢", text: "Warming up the noodles…" },
  { emoji: "🍱", text: "Tossing ideas into the wok…" },
  { emoji: "🌶️", text: "Sniffing out nearby bites…" },
  { emoji: "🧠", text: "Thinking with my stomach…" },
  { emoji: "🥡", text: "Grabbing extra napkins…" },
  { emoji: "🧂", text: "Scouting the sauce section…" },
  { emoji: "👨‍🍳", text: "Consulting my inner foodie…" }
];

function updateQuestionProgress() {
  const bar = document.getElementById("question-progress");
  if (!bar) return;
  const answered = currentQuestion; // keep 0% on Q1
  const percent = Math.min(100, Math.round((answered / questions.length) * 100));
  bar.style.width = `${percent}%`;

  // NEW: keep ARIA in sync
  bar.parentElement?.setAttribute("aria-valuenow", String(percent));
}

// Quiz Questions
const questions = [
  {
    question: "How hungry are you right now?",
    options: ["Just a little hungry", "Pretty hungry", "Starving", "Planning ahead"]
  },
  {
    question: "How much time do you have to eat?",
    options: ["Less than 15 minutes", "About 30 minutes", "An hour or more", "No rush"]
  },
  {
    question: "Who are you eating with?",
    options: ["Just me", "With a friend or partner", "Small group (3–4)", "Big group or family", "Doesn’t matter"]
  },
  {
    question: "What’s your current mood?",
    options: ["Cozy / comfort food", "Energized / healthy", "Indulgent / treat yourself", "Adventurous", "Chill / no strong cravings"]
  },
  {
    question: "Are you craving anything specific?",
    options: ["Spicy", "Sweet", "Hot and hearty", "Fresh and light", "No specific craving"]
  },
  {
    question: "Any dietary goals or restrictions?",
    options: ["Weight loss / low-cal", "Vegetarian / Vegan", "Gluten-Free", "Low-Carb / Keto", "High-Protein", "No restrictions"]
  },
  {
    question: "How much are you looking to spend?",
    options: ["Under $10", "$10–$20", "$20–$40", "Money’s not a concern"]
  },
  {
    question: "How far are you willing to go?",
    options: ["Walking distance", "Short drive (under 10 mins)", "15–30 mins", "I'll go anywhere"]
  },
  {
    question: "How would you like to eat today?",
    options: ["Dine-in", "Takeout", "Delivery", "Drive-thru", "Doesn’t matter"]
  },
  {
    question: "Any special occasion or vibe?",
    options: ["Just a regular meal", "Quick lunch break", "Date night", "Post-workout", "Comfort after a long day", "Celebration"]
  }
];

// Show the current question
function showQuestion() {
  resultContainer.classList.add("hidden");
  quizContainer.classList.remove("hidden");

  // Update progress text
  const progressIndicator = document.getElementById("progress-indicator");
  progressIndicator.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;

  const question = questions[currentQuestion];
  container.innerHTML = `
    <div class="card fade-in">
      <div class="question">${question.question}</div>
    </div>
  `;
  answerButtons.innerHTML = "";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.innerText = option;
    button.className = `
      bg-white text-gray-700 text-sm sm:text-base px-4 py-2 sm:px-5 sm:py-3 rounded-xl shadow-sm border border-gray-200
      hover:bg-rose-100 hover:text-rose-700 transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2
    `;
    button.addEventListener("click", () => selectAnswer(option));
    answerButtons.appendChild(button);
  });

  // ✅ keep the bar synced on every render
  updateQuestionProgress();
}

// Handle answer selection
function selectAnswer(answer) {
  answers.push({ question: questions[currentQuestion].question, answer });
  currentQuestion++;
  updateQuestionProgress();

  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    showResults();
  }
}

// Show results placeholder
function showResults() {
  // ✅ Smoothly complete the thin question-progress bar
  const qBar = document.getElementById("question-progress");
  if (qBar) {
    qBar.style.transition = "width 300ms ease-out";
    qBar.style.width = "100%";
    qBar.parentElement?.setAttribute("aria-valuenow", "100"); // ARIA update
  }

  // 1) Hide quiz, play sound, show loading
  quizContainer.classList.add("hidden");
  const sound = document.getElementById("miso-sound");
  if (sound) sound.play().catch(() => {}); // avoid autoplay errors
  loadingContainer.classList.remove("hidden");

  // 2) Smooth CSS-driven fill for the loading bar
  const progressBar = document.getElementById("progress-bar");
  if (progressBar) {
    // reset to 0% and remove transition to avoid jump
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    void progressBar.offsetWidth; // force reflow

    // animate to 100%
    progressBar.style.transition = "width 2.8s ease-in-out";
    progressBar.style.width = "100%";

    // 🔊 ARIA: keep aria-valuenow updated during the animation (optional)
    const track = progressBar.parentElement;
    if (track) track.setAttribute("aria-valuenow", "0");
    const start = performance.now();
    const duration = 2800;

    if (window.loadingAriaInterval) {
      clearInterval(window.loadingAriaInterval);
      window.loadingAriaInterval = null;
    }
    window.loadingAriaInterval = setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      track?.setAttribute("aria-valuenow", String(pct));
      if (pct >= 100) {
        clearInterval(window.loadingAriaInterval);
        window.loadingAriaInterval = null;
      }
    }, 100);
  }

  // 3) Loading message / emoji rotation
  const loadingText = loadingContainer.querySelector("p");
  const loadingEmoji = document.getElementById("loading-emoji");

  let messageIndex = 0;
  function updateLoadingMessage() {
    const { emoji, text } = loadingMessages[messageIndex];
    if (loadingText) loadingText.textContent = text;
    if (loadingEmoji) loadingEmoji.textContent = emoji;
    messageIndex = (messageIndex + 1) % loadingMessages.length;
  }

  updateLoadingMessage(); // first message immediately
  window.messageInterval = setInterval(updateLoadingMessage, 800);

  // 4) Simulate "thinking" to line up with the bar animation
  setTimeout(() => {
    if (window.messageInterval) {
      clearInterval(window.messageInterval);
      window.messageInterval = null;
    }
    loadingContainer.classList.add("hidden");
    resultContainer.classList.remove("hidden");

    // Fill the existing results area
    const display = document.getElementById("results-display");
    if (display) {
      display.innerHTML = answers
        .map(a => `<p><strong>${a.question}</strong><br><span class="text-rose-600">→ ${a.answer}</span></p>`)
        .join("<hr class='my-2' />");
    }
  }, 2800); // ~matches the 2.8s width animation
}


// Restart quiz
const restartBtn = document.getElementById("restart-btn");
if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // 1) reset state
    currentQuestion = 0;
    answers = [];

    // ✅ stop any running loading message rotation
    if (window.messageInterval) {
      clearInterval(window.messageInterval);
      window.messageInterval = null;
    }

    // ✅ stop ARIA updater for loading bar if running (NEW)
    if (window.loadingAriaInterval) {
      clearInterval(window.loadingAriaInterval);
      window.loadingAriaInterval = null;
    }

    // ✅ reset ARIA values to 0 (NEW)
    document.getElementById("question-progress")?.parentElement
      ?.setAttribute("aria-valuenow", "0");
    document.getElementById("progress-bar")?.parentElement
      ?.setAttribute("aria-valuenow", "0");

    // 2) reset progress bars (thin question bar + loading bar)
    const qBar = document.getElementById("question-progress");
    if (qBar) {
      qBar.style.transition = "none";
      qBar.style.width = "0%";
      void qBar.offsetWidth;
      qBar.style.transition = ""; // let Tailwind handle future updates
    }

    const lb = document.getElementById("progress-bar");
    if (lb) {
      lb.style.transition = "none";
      lb.style.width = "0%";
      void lb.offsetWidth;
    }

    // 3) reset screens
    resultContainer.classList.add("hidden");
    loadingContainer.classList.add("hidden");
    quizContainer.classList.remove("hidden");

    // 4) render first question & sync the thin bar
    showQuestion();
    if (typeof updateQuestionProgress === "function") updateQuestionProgress();

    // Optional: reset the "Question X of Y" text
    const progressIndicator = document.getElementById("progress-indicator");
    if (progressIndicator) {
      progressIndicator.textContent = `Question 1 of ${questions.length}`;
    }
  });
}


// Start the quiz
showQuestion();
updateQuestionProgress();
