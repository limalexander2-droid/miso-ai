/* ==============================
   STATE + DOM REFERENCES
============================== */
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

/* ==============================
   QUESTION PROGRESS BAR
============================== */
function updateQuestionProgress() {
  const bar = document.getElementById("question-progress");
  if (!bar) return;
  const answered = currentQuestion;
  const total = questions.length || 1;
  const percent = Math.min(100, Math.round((answered / total) * 100));
  bar.style.width = `${percent}%`;
  bar.parentElement?.setAttribute("aria-valuenow", String(percent));
}

/* ==============================
   QUIZ QUESTIONS
============================== */
const questions = [
  { question: "How hungry are you right now?", options: ["Just a little hungry", "Pretty hungry", "Starving", "Planning ahead"] },
  { question: "How much time do you have to eat?", options: ["Less than 15 minutes", "About 30 minutes", "An hour or more", "No rush"] },
  { question: "Who are you eating with?", options: ["Just me", "With a friend or partner", "Small group (3–4)", "Big group or family", "Doesn’t matter"] },
  { question: "What’s your current mood?", options: ["Cozy / comfort food", "Energized / healthy", "Indulgent / treat yourself", "Adventurous", "Chill / no strong cravings"] },
  { question: "Are you craving anything specific?", options: ["Spicy", "Sweet", "Hot and hearty", "Fresh and light", "No specific craving"] },
  { question: "Any dietary goals or restrictions?", options: ["Weight loss / low-cal", "Vegetarian / Vegan", "Gluten-Free", "Low-Carb / Keto", "High-Protein", "No restrictions"] },
  { question: "How much are you looking to spend?", options: ["Under $10", "$10–$20", "$20–$40", "Money’s not a concern"] },
  { question: "How far are you willing to go?", options: ["Walking distance", "Short drive (under 10 mins)", "15–30 mins", "I'll go anywhere"] },
  { question: "How would you like to eat today?", options: ["Dine-in", "Takeout", "Delivery", "Drive-thru", "Doesn’t matter"] },
  { question: "Any special occasion or vibe?", options: ["Just a regular meal", "Quick lunch break", "Date night", "Post-workout", "Comfort after a long day", "Celebration"] }
];

/* ==============================
   QUIZ FLOW
============================== */
function showQuestion() {
  resultContainer.classList.add("hidden");
  quizContainer.classList.remove("hidden");

  const progressIndicator = document.getElementById("progress-indicator");
  if (progressIndicator) progressIndicator.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;

  const question = questions[currentQuestion];
  container.innerHTML = `<div class="card fade-in"><div class="question">${question.question}</div></div>`;
  answerButtons.innerHTML = "";

  question.options.forEach(option => {
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

  updateQuestionProgress();
}

function selectAnswer(answer) {
  answers.push({ question: questions[currentQuestion].question, answer });
  currentQuestion += 1;
  updateQuestionProgress();

  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    showResults();
  }
}

/* ==============================
   RESULTS + LOADING
============================== */
// Persist filter state
const STATE_KEY = "miso.filters.v1";
function loadFilterState() {
  try { return JSON.parse(sessionStorage.getItem(STATE_KEY)) || {}; } catch { return {}; }
}
function saveFilterState(s) {
  try { sessionStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {}
}

// Defaults
let currentSort = loadFilterState().sort_by || "best_match";
let openNow = typeof loadFilterState().open_now === "boolean" ? loadFilterState().open_now : true;
let currentRadius = loadFilterState().radius || 8000;

// Geolocation or manual location used for subsequent re-queries
let lastCoords = null;
let lastLocationStr = null;

function applyFiltersUI() {
  const best = document.getElementById("sort-best");
  const rating = document.getElementById("sort-rating");
  const distance = document.getElementById("sort-distance");
  const open = document.getElementById("open-now");

  if (best && rating && distance) {
    [best, rating, distance].forEach(b => { b.setAttribute("aria-pressed", "false"); b.classList.remove("ring-2","ring-rose-400"); });
    const active = currentSort === "rating" ? rating : currentSort === "distance" ? distance : best;
    active.setAttribute("aria-pressed", "true");
    active.classList.add("ring-2","ring-rose-400");
  }
  if (open) open.checked = !!openNow;
}

function attachControlsHandlers() {
  const best = document.getElementById("sort-best");
  const rating = document.getElementById("sort-rating");
  const distance = document.getElementById("sort-distance");
  const open = document.getElementById("open-now");
  const widen = document.getElementById("btn-widen");

  best?.addEventListener("click", () => { currentSort = "best_match"; saveFilterState({ sort_by: currentSort, open_now: openNow, radius: currentRadius }); refetch(); applyFiltersUI(); });
  rating?.addEventListener("click", () => { currentSort = "rating"; saveFilterState({ sort_by: currentSort, open_now: openNow, radius: currentRadius }); refetch(); applyFiltersUI(); });
  distance?.addEventListener("click", () => { currentSort = "distance"; saveFilterState({ sort_by: currentSort, open_now: openNow, radius: currentRadius }); refetch(); applyFiltersUI(); });
  open?.addEventListener("change", () => { openNow = open.checked; saveFilterState({ sort_by: currentSort, open_now: openNow, radius: currentRadius }); refetch(); });
  widen?.addEventListener("click", () => { currentRadius = Math.min(16000, (currentRadius || 8000) * 1.6); saveFilterState({ sort_by: currentSort, open_now: openNow, radius: currentRadius }); refetch(); });
}

function showResults() {
  const qBar = document.getElementById("question-progress");
  if (qBar) { qBar.style.transition = "width 300ms ease-out"; qBar.style.width = "100%"; qBar.parentElement?.setAttribute("aria-valuenow", "100"); }

  quizContainer.classList.add("hidden");
  const sound = document.getElementById("miso-sound");
  if (sound) sound.play().catch(() => {});
  loadingContainer.classList.remove("hidden");

  const progressBar = document.getElementById("progress-bar");
  if (progressBar) {
    progressBar.style.transition = "none"; progressBar.style.width = "0%"; void progressBar.offsetWidth;
    progressBar.style.transition = "width 2.8s ease-in-out"; progressBar.style.width = "100%";
    const track = progressBar.parentElement; if (track) track.setAttribute("aria-valuenow", "0");
    const start = performance.now(), duration = 2800;
    if (window.loadingAriaInterval) clearInterval(window.loadingAriaInterval);
    window.loadingAriaInterval = setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      track?.setAttribute("aria-valuenow", String(pct));
      if (pct >= 100) { clearInterval(window.loadingAriaInterval); window.loadingAriaInterval = null; }
    }, 100);
  }

  const loadingText = loadingContainer.querySelector("p");
  const loadingEmoji = document.getElementById("loading-emoji");
  let messageIndex = 0;
  function updateLoadingMessage() {
    const { emoji, text } = loadingMessages[messageIndex];
    if (loadingText) loadingText.textContent = text;
    if (loadingEmoji) loadingEmoji.textContent = emoji;
    messageIndex = (messageIndex + 1) % loadingMessages.length;
  }
  updateLoadingMessage();
  window.messageInterval = setInterval(updateLoadingMessage, 800);

  // Begin fetching during loading: try geolocation first
  loadYelpResultsDuringLoading();
}

function showSkeletons() {
  const list = document.getElementById("results-list");
  list.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const card = document.createElement("div");
    card.className = "p-4 rounded-xl border bg-white shadow-sm flex gap-4";
    card.innerHTML = `
      <div class="card-thumb skeleton"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 w-2/3 rounded skeleton"></div>
        <div class="h-3 w-1/2 rounded skeleton"></div>
        <div class="h-3 w-1/3 rounded skeleton"></div>
      </div>`;
    list.appendChild(card);
  }
}

function renderEmptyState() {
  const list = document.getElementById("results-list");
  list.innerHTML = `
    <div class="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
      <p class="text-gray-700 text-sm mb-3">No matching restaurants found.</p>
      <div class="flex gap-2">
        <button id="empty-widen" class="px-3 py-1.5 text-sm rounded-full border border-gray-300 bg-white">Widen radius</button>
        <button id="empty-clear-price" class="px-3 py-1.5 text-sm rounded-full border border-gray-300 bg-white">Clear price filter</button>
      </div>
    </div>`;

  document.getElementById("empty-widen")?.addEventListener("click", () => {
    currentRadius = Math.min(16000, (currentRadius || 8000) * 1.6);
    saveFilterState({ sort_by: currentSort, open_now: openNow, radius: currentRadius });
    refetch();
  });
  document.getElementById("empty-clear-price")?.addEventListener("click", () => {
    // Remove price preference by removing the mapped answer; simpler: mark a flag to ignore price
    ignorePriceFilter = true;
    refetch();
  });
}

function renderBusinesses(businesses = []) {
  const list = document.getElementById("results-list");
  list.innerHTML = "";

  if (!businesses.length) {
    renderEmptyState();
    return;
  }

  for (const b of businesses) {
    const miles = typeof b.distance === "number" ? (b.distance / 1609.34).toFixed(1) : "";
    const maps = b.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}` : "#";
    const tel = (b.phone || "").replace(/[^\\d+]/g, "");
    const telHref = tel ? `tel:${tel}` : null;

    const card = document.createElement("div");
    card.className = "p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition flex gap-4";
    card.innerHTML = `
      <a href="${b.url || "#"}" target="_blank" rel="noopener noreferrer">
        <img loading="lazy" src="${b.image_url || ""}" alt="${b.name}" class="card-thumb" onerror="this.style.display='none'"/>
      </a>
      <div class="flex-1">
        <div class="flex items-center justify-between">
          <a href="${b.url || "#"}" target="_blank" rel="noopener noreferrer" class="text-lg font-semibold text-gray-900 hover:underline">${b.name}</a>
          ${b.price ? `<span class="text-sm text-gray-600">${b.price}</span>` : ""}
        </div>
        <div class="text-sm text-gray-700 mt-1">
          ${b.rating ? `⭐ ${b.rating} · ` : ""}${b.review_count ? `${b.review_count} reviews` : ""}
          ${typeof b.is_closed === "boolean" ? ` · <span class="${b.is_closed ? 'text-red-600' : 'text-green-600'}">${b.is_closed ? 'Closed' : 'Open now'}</span>` : ""}
        </div>
        <div class="text-xs text-gray-600 mt-1">
          ${Array.isArray(b.categories) ? b.categories.slice(0,2).join(", ") : ""}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          ${b.address || ""} ${miles ? ` · ${miles} mi` : ""}
        </div>
        <div class="flex gap-2 mt-2">
          ${telHref ? `<a href="${telHref}" class="px-3 py-1.5 text-xs rounded-full border border-gray-300 bg-white">Call</a>` : ""}
          ${b.address ? `<a href="${maps}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 text-xs rounded-full border border-gray-300 bg-white">Directions</a>` : ""}
          ${b.url ? `<a href="${b.url}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 text-xs rounded-full border border-gray-300 bg-white">Yelp</a>` : ""}
        </div>
      </div>
    `;
    list.appendChild(card);
  }
}

async function callYelp(params) {
  const resp = await fetch('/.netlify/functions/yelp-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Search failed (${resp.status}): ${txt}`);
  }
  const data = await resp.json();
  return data.businesses || [];
}

// Map quiz answers to Yelp params; allow ignoring price via a flag (when user clears price)
let ignorePriceFilter = false;
function mapAnswersToParams() {
  const find = (qText) => answers.find(a => a.question.includes(qText))?.answer || "";

  // Craving/mood -> term
  const craving = find("Are you craving anything specific?");
  const mood = find("What’s your current mood?");
  let term = "restaurants";
  if (craving === "Spicy") term = "spicy food";
  else if (craving === "Sweet") term = "dessert";
  else if (craving === "Hot and hearty") term = "comfort food";
  else if (craving === "Fresh and light") term = "salad healthy";
  if (mood.includes("healthy")) term = "healthy food";
  if (mood.includes("Indulgent")) term = "dessert steak fried";
  if (mood.includes("Adventurous")) term = "international food";

  // Price
  let price;
  if (!ignorePriceFilter) {
    const priceAnswer = find("How much are you looking to spend?");
    if (priceAnswer === "Under $10") price = "1";
    else if (priceAnswer === "$10–$20") price = "1,2";
    else if (priceAnswer === "$20–$40") price = "2,3";
    else if (priceAnswer === "Money’s not a concern") price = "1,2,3,4";
  }

  // Transactions
  const method = find("How would you like to eat today?");
  let transactions = [];
  if (method === "Delivery") transactions = ["delivery"];
  else if (method === "Takeout") transactions = ["pickup"];

  // Dietary -> nudge term
  const diet = find("Any dietary goals or restrictions?");
  if (diet.includes("Vegetarian")) term = "vegetarian";
  else if (diet.includes("Vegan")) term = "vegan";
  else if (diet.includes("Gluten-Free")) term = "gluten free";
  else if (diet.includes("Low-Carb") || diet.includes("Keto")) term = "keto";
  else if (diet.includes("High-Protein")) term = "protein bowls";

  return { term, price, transactions };
}

function baseParams() {
  const mapped = mapAnswersToParams();
  return {
    ...mapped,
    open_now: openNow,
    sort_by: currentSort,
    radius: currentRadius,
    limit: 20
  };
}

async function refetch() {
  showSkeletons();
  try {
    let businesses;
    const params = { ...baseParams() };

    if (lastCoords) {
      businesses = await callYelp({ ...params, ...lastCoords });
    } else if (lastLocationStr) {
      businesses = await callYelp({ ...params, location: lastLocationStr });
    } else {
      // Shouldn't happen, but fallback to manual UI
      const locBox = document.getElementById("location-fallback");
      locBox?.classList.remove("hidden");
      renderEmptyState();
      return;
    }
    renderBusinesses(businesses);
  } catch (e) {
    const list = document.getElementById("results-list");
    list.innerHTML = `<div class="p-4 border rounded-xl bg-white text-sm text-red-600">Error: ${e.message} <button id="retry" class="ml-2 px-2 py-1 text-xs rounded border">Retry</button></div>`;
    document.getElementById("retry")?.addEventListener("click", () => refetch());
  }
}

async function loadYelpResultsDuringLoading() {
  // Try geolocation during loading
  const geo = await new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });

  const params = { ...baseParams() };
  let businesses = [];

  try {
    if (geo) {
      lastCoords = geo; lastLocationStr = null;
      businesses = await callYelp({ ...params, ...geo });
    } else {
      // show manual input on loading
      const locBox = document.getElementById("location-fallback");
      const manualInput = document.getElementById("manual-location");
      const useBtn = document.getElementById("use-location-btn");
      locBox?.classList.remove("hidden");

      await new Promise((resolve) => {
        const handler = async () => {
          const loc = (manualInput.value || "").trim();
          if (!loc) return;
          lastLocationStr = loc; lastCoords = null;
          businesses = await callYelp({ ...params, location: loc });
          resolve();
        };
        useBtn?.addEventListener("click", handler, { once: true });
        manualInput?.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { handler(); } }, { once: true });
      });
    }
  } catch (e) {
    // fall through to results with error
  } finally {
    // End loading state and show results
    if (window.messageInterval) { clearInterval(window.messageInterval); window.messageInterval = null; }
    if (window.loadingAriaInterval) { clearInterval(window.loadingAriaInterval); window.loadingAriaInterval = null; }

    loadingContainer.classList.add("hidden");
    resultContainer.classList.remove("hidden");

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Hook up controls and apply UI state
    attachControlsHandlers();
    applyFiltersUI();

    // Render results or empty state
    if (businesses?.length) renderBusinesses(businesses);
    else renderEmptyState();
  }
}

/* ==============================
   RESTART
============================== */
const restartBtn = document.getElementById("restart-btn");
if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    currentQuestion = 0;
    answers = [];
    ignorePriceFilter = false;

    if (window.messageInterval) { clearInterval(window.messageInterval); window.messageInterval = null; }
    if (window.loadingAriaInterval) { clearInterval(window.loadingAriaInterval); window.loadingAriaInterval = null; }

    document.getElementById("question-progress")?.parentElement?.setAttribute("aria-valuenow", "0");
    document.getElementById("progress-bar")?.parentElement?.setAttribute("aria-valuenow", "0");

    const qBar = document.getElementById("question-progress");
    if (qBar) { qBar.style.transition = "none"; qBar.style.width = "0%"; void qBar.offsetWidth; qBar.style.transition = ""; }

    const lb = document.getElementById("progress-bar");
    if (lb) { lb.style.transition = "none"; lb.style.width = "0%"; void lb.offsetWidth; }

    resultContainer.classList.add("hidden");
    loadingContainer.classList.add("hidden");
    quizContainer.classList.remove("hidden");

    showQuestion();
    updateQuestionProgress();

    const progressIndicator = document.getElementById("progress-indicator");
    if (progressIndicator) progressIndicator.textContent = `Question 1 of ${questions.length}`;
  });
}

/* ==============================
   INIT
============================== */
showQuestion();
updateQuestionProgress();
