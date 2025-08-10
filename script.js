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
   MICRO-ANIMATIONS + TRANSITIONS
============================== */
function attachButtonEffects(parentEl = document) {
  parentEl.querySelectorAll('button').forEach(btn => {
    btn.classList.add('tap-anim','ripple');
    btn.addEventListener('click', e => {
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--ripple-x', (e.clientX - rect.left) + 'px');
      btn.style.setProperty('--ripple-y', (e.clientY - rect.top) + 'px');
      btn.classList.add('rippling');
      setTimeout(() => btn.classList.remove('rippling'), 350);
    });
  });
}

async function transitionQuestion(renderFn) {
  const q = document.getElementById('question-container');
  const head = document.getElementById('question-header');
  [q, head].forEach(node => node?.classList.remove('slide-in'));
  [q, head].forEach(node => node?.classList.add('slide-out'));
  await new Promise(r => setTimeout(r, 220));
  renderFn();
  [q, head].forEach(node => node?.classList.remove('slide-out'));
  [q, head].forEach(node => node?.classList.add('slide-in'));
}

const emojiMap = [
  { match: /hungry|time|plan/i, emoji: '⏱️' },
  { match: /who|with/i, emoji: '👥' },
  { match: /mood|comfort|healthy/i, emoji: '🥗' },
  { match: /craving|spicy|sweet/i, emoji: '🍔' },
  { match: /diet|keto|protein|gluten/i, emoji: '🥦' },
  { match: /spend|budget|price/i, emoji: '💸' },
  { match: /distance|far|drive/i, emoji: '🗺️' },
  { match: /eat today|dine|delivery|takeout/i, emoji: '🍽️' },
  { match: /special|occasion|vibe|date/i, emoji: '✨' },
];
function setQuestionEmoji(text) {
  const el = document.getElementById('question-emoji');
  const title = document.getElementById('question-title');
  const hit = emojiMap.find(e => e.match.test(text));
  if (el) el.textContent = hit ? hit.emoji : '🍽️';
  if (title) title.textContent = text;
}

/* ==============================
   QUIZ FLOW
============================== */
function showQuestion() {
  resultContainer.classList.add("hidden");
  quizContainer.classList.remove("hidden");

  const progressIndicator = document.getElementById("progress-indicator");
  if (progressIndicator) progressIndicator.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;

  const q = questions[currentQuestion];
  const render = () => {
    setQuestionEmoji(q.question);
    container.innerHTML = "";
    answerButtons.innerHTML = "";
    q.options.forEach(option => {
      const button = document.createElement("button");
      button.innerText = option;
      button.className = `
        bg-white text-gray-700 text-base px-5 py-4 rounded-2xl shadow-sm border border-gray-200
        hover:bg-rose-100 hover:text-rose-700 transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2
      `;
      button.addEventListener("click", () => selectAnswer(option));
      answerButtons.appendChild(button);
    });
    attachButtonEffects(answerButtons);
  };

  // first render with slide
  transitionQuestion(render);

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
   SUCCESS TOAST
============================== */
function showSuccessToast() {
  const t = document.getElementById('success-toast');
  if (!t) return;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

/* ==============================
   RESULTS + LOADING
============================== */
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

  setTimeout(async () => {
    if (window.messageInterval) { clearInterval(window.messageInterval); window.messageInterval = null; }
    if (window.loadingAriaInterval) { clearInterval(window.loadingAriaInterval); window.loadingAriaInterval = null; }

    loadingContainer.classList.add("hidden");
    showSuccessToast();
    resultContainer.classList.remove("hidden");

    await initYelpResults();
  }, 2800);
}

/* ==============================
   TERM EXPANSION
============================== */
function expandedSearchTerms(rawTerms) {
  const bank = {
    sweet: ['dessert','ice cream','frozen yogurt','gelato','bakery','boba'],
    spicy: ['thai','sichuan','mexican','indian','hot chicken'],
    noodles: ['ramen','pho','udon','noodle'],
    healthy: ['salad','poke','mediterranean','grill','healthy'],
    breakfast: ['brunch','breakfast','coffee','bakery'],
    bbq: ['bbq','barbecue','smokehouse','brisket'],
    burgers: ['burger','smashburger'],
    pizza: ['pizza','slice'],
    tacos: ['taco','taqueria'],
    seafood: ['seafood','oyster','sushi','poke'],
    comfort: ['comfort food','chicken and waffles','meatloaf','mac and cheese'],
  };
  const out = new Set();
  rawTerms.forEach(t => {
    const key = String(t).toLowerCase();
    out.add(key);
    Object.entries(bank).forEach(([k, list]) => {
      if (key.includes(k)) list.forEach(x => out.add(x));
    });
  });
  return [...out];
}

/* ==============================
   MAP ANSWERS -> YELP PARAMS
============================== */
function mapAnswersToParams() {
  const find = (qText) => answers.find(a => a.question.includes(qText))?.answer || "";

  const craving = find("Are you craving anything specific?");
  const mood = find("What’s your current mood?");
  let baseTerm = "restaurants";
  if (craving === "Spicy") baseTerm = "spicy";
  else if (craving === "Sweet") baseTerm = "sweet";
  else if (craving === "Hot and hearty") baseTerm = "comfort";
  else if (craving === "Fresh and light") baseTerm = "healthy";
  if (mood.includes("healthy")) baseTerm = "healthy";
  if (mood.includes("Indulgent")) baseTerm = "dessert steak fried";
  if (mood.includes("Adventurous")) baseTerm = "international";

  const priceAnswer = find("How much are you looking to spend?");
  let price = undefined;
  if (priceAnswer === "Under $10") price = "1";
  else if (priceAnswer === "$10–$20") price = "1,2";
  else if (priceAnswer === "$20–$40") price = "2,3";
  else if (priceAnswer === "Money’s not a concern") price = "1,2,3,4";

  const distance = find("How far are you willing to go?");
  let radius = 8000;
  if (distance === "Walking distance") radius = 800;
  else if (distance.includes("under 10")) radius = 3000;
  else if (distance.includes("15–30")) radius = 8000;
  else if (distance.includes("anywhere")) radius = 16000;

  const method = find("How would you like to eat today?");
  let transactions = [];
  if (method === "Delivery") transactions = ["delivery"];
  else if (method === "Takeout") transactions = ["pickup"];

  const diet = find("Any dietary goals or restrictions?");
  if (diet.includes("Vegetarian")) baseTerm = "vegetarian";
  else if (diet.includes("Vegan")) baseTerm = "vegan";
  else if (diet.includes("Gluten-Free")) baseTerm = "gluten free";
  else if (diet.includes("Low-Carb") || diet.includes("Keto")) baseTerm = "keto";
  else if (diet.includes("High-Protein")) baseTerm = "protein bowls";

  const terms = expandedSearchTerms(baseTerm.split(/\s+/).filter(Boolean));

  return { terms, price, radius, transactions };
}

/* ==============================
   RESULTS RENDERING
============================== */
function hoursOrCallLine(b) {
  // server provides open_status: 'open'|'closed'|'unknown', has_hours: boolean, phone
  if (b.has_hours) {
    if (b.open_status === "open") return "⏰ Open now";
    if (b.open_status === "closed") return "⏰ Closed now";
    return "⏰ Hours available";
  }
  if (b.phone) return `Hours not listed — tap to call 📞`;
  return "Hours not listed";
}

function renderBusinesses(businesses = []) {
  const list = document.getElementById("results-list");
  list.innerHTML = "";

  if (!businesses.length) {
    list.innerHTML = `<div class="p-4 border border-gray-200 rounded-xl bg-white shadow-sm"><p class="text-gray-700 text-sm">No matching restaurants found. Try widening the distance or clearing price filters.</p></div>`;
    return;
  }

  businesses.forEach((b, i) => {
    const miles = typeof b.distance === "number" ? (b.distance / 1609.34).toFixed(1) : "";
    const a = document.createElement("a");
    a.href = b.url || "#";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition flex gap-4";
    a.innerHTML = `
      ${i === 0 ? `<div class="top-pick-badge">Top Pick</div>` : ""}
      <img src="${b.image_url || ""}" alt="${b.name}" class="w-28 h-20 object-cover rounded-lg bg-gray-100" onerror="this.style.display='none'"/>
      <div class="flex-1">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">${b.name}</h3>
          ${b.price ? `<span class="text-sm text-gray-600">💲 ${b.price}</span>` : ""}
        </div>
        <div class="text-sm text-gray-700 mt-1">
          ${b.rating ? `⭐ ${b.rating} · ` : ""}${b.review_count ? `${b.review_count} reviews` : ""}
        </div>
        <div class="text-xs text-gray-600 mt-1">
          ${Array.isArray(b.categories) ? b.categories.join(", ") : ""}
        </div>
        <div class="text-xs text-gray-600 mt-1">
          📍 ${b.address || ""} ${miles ? ` · ${miles} mi` : ""}
        </div>
        <div class="text-xs text-gray-700 mt-1">
          ${hoursOrCallLine(b)} ${b.phone ? `• <a href="tel:${b.phone.replace(/[^\\d+]/g,'')}" class="underline">Call</a>` : ""}
        </div>
      </div>
    `;
    if (i === 0) {
      a.classList.add("ring-2","ring-yellow-400");
    }
    list.appendChild(a);
  });
}

/* ==============================
   YELP INTEGRATION + CONTROLS
============================== */
let currentSort = "best_match";
let openNow = true;
let currentRadius = 8000;
let lastGeo = null;        // { latitude, longitude } if used
let lastLocation = null;   // string location if used
let baseParams = null;
let filterState = { highRated: false, budget: false, nearby: false };

function readFilters() {
  filterState.highRated = !!document.getElementById("filter-highrated")?.checked;
  filterState.budget = !!document.getElementById("filter-budget")?.checked;
  filterState.nearby = !!document.getElementById("filter-nearby")?.checked;
  return filterState;
}

function applyClientFilters(items) {
  let list = [...items];
  if (filterState.highRated) list = list.filter(b => (b.rating || 0) >= 4.5);
  if (filterState.budget) list = list.filter(b => !b.price || b.price.length <= 2); // $ or $$
  return list;
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

async function doSearch(overrides = {}) {
  readFilters();
  const params = {
    ...baseParams,
    sort_by: filterState.nearby ? "distance" : currentSort,
    open_now: openNow,
    radius: currentRadius,
    limit: 20,
    filters: { openNow, nearby: filterState.nearby },
    ...overrides
  };

  if (lastGeo) {
    params.latitude = lastGeo.latitude;
    params.longitude = lastGeo.longitude;
    delete params.location;
  } else if (lastLocation) {
    params.location = lastLocation;
    delete params.latitude; delete params.longitude;
  }

  showSkeletons();
  try {
    const results = await callYelp(params);
    const filtered = applyClientFilters(results);
    renderBusinesses(filtered);
  } catch (e) {
    const list = document.getElementById("results-list");
    list.innerHTML = `<div class="p-4 border rounded-xl bg-white text-sm text-red-600">Error: ${e.message}</div>`;
  }
}

function showSkeletons() {
  const list = document.getElementById("results-list");
  list.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const card = document.createElement("div");
    card.className = "p-4 rounded-xl border bg-white shadow-sm flex gap-4";
    card.innerHTML = `
      <div class="w-28 h-20 rounded-lg skeleton"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 w-2/3 rounded skeleton"></div>
        <div class="h-3 w-1/2 rounded skeleton"></div>
        <div class="h-3 w-1/3 rounded skeleton"></div>
      </div>`;
    list.appendChild(card);
  }
}

async function initYelpResults() {
  // Controls
  const bestBtn = document.getElementById("sort-best");
  const ratingBtn = document.getElementById("sort-rating");
  const distanceBtn = document.getElementById("sort-distance");
  const openChk = document.getElementById("open-now");
  const widenBtn = document.getElementById("btn-widen");
  const hiChk = document.getElementById("filter-highrated");
  const budChk = document.getElementById("filter-budget");
  const nearChk = document.getElementById("filter-nearby");

  const setActive = (btn) => {
    [bestBtn, ratingBtn, distanceBtn].forEach(b => {
      if (!b) return;
      const isActive = b === btn;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  bestBtn?.addEventListener("click", () => { currentSort = "best_match"; setActive(bestBtn); doSearch(); });
  ratingBtn?.addEventListener("click", () => { currentSort = "rating"; setActive(ratingBtn); doSearch(); });
  distanceBtn?.addEventListener("click", () => { currentSort = "distance"; setActive(distanceBtn); doSearch(); });
  openChk?.addEventListener("change", () => { openNow = !!openChk.checked; doSearch(); });
  widenBtn?.addEventListener("click", () => { currentRadius = Math.min(16000, Math.round(currentRadius * 1.5)); doSearch(); });
  hiChk?.addEventListener("change", () => doSearch());
  budChk?.addEventListener("change", () => doSearch());
  nearChk?.addEventListener("change", () => doSearch());

  // Base params from answers
  baseParams = mapAnswersToParams();

  // Try geolocation first
  const geo = await new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });

  if (geo) {
    lastGeo = geo;
    await doSearch();
    return;
  }

  // Manual fallback
  const locBox = document.getElementById("location-fallback");
  locBox?.classList.remove("hidden");

  const manualInput = locBox ? locBox.querySelector("#manual-location") : null;
  const useBtn = locBox ? locBox.querySelector("#use-location-btn") : null;

  const triggerSearch = async () => {
    const value = (manualInput?.value || "").trim();
    if (!value) return;
    lastLocation = value;
    lastGeo = null;
    await doSearch();
  };

  useBtn?.addEventListener("click", triggerSearch);
  manualInput?.addEventListener("keydown", (ev) => { if (ev.key === "Enter") triggerSearch(); });
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

    // Reset Yelp state
    currentSort = "best_match";
    openNow = true;
    currentRadius = 8000;
    lastGeo = null;
    lastLocation = null;
    baseParams = null;
    filterState = { highRated: false, budget: false, nearby: false };

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
attachButtonEffects();
