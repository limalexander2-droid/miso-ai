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

/* Controls (persisted) */
let currentSort = sessionStorage.getItem("miso_sort") || "best_match";
let openNow = sessionStorage.getItem("miso_open_now") !== "false"; // default true
let currentRadius = Number(sessionStorage.getItem("miso_radius") || 8000);

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
  { question: "How hungry are you right now?", options: ["😌 Just a little hungry", "🙂 Pretty hungry", "🤤 Starving", "🗓️ Planning ahead"] },
  { question: "How much time do you have to eat?", options: ["⏱️ < 15 minutes", "🕧 ~30 minutes", "🕐 An hour or more", "🧘 No rush"] },
  { question: "Who are you eating with?", options: ["👤 Just me", "👫 Friend or partner", "👨‍👩‍👧 Small group (3–4)", "👨‍👩‍👧‍👦 Big group / family", "🤷 Doesn’t matter"] },
  { question: "What’s your current mood?", options: ["🧸 Cozy / comfort food", "💪 Energized / healthy", "🍰 Indulgent / treat yourself", "🧭 Adventurous", "😌 Chill / no strong cravings"] },
  { question: "Are you craving anything specific?", options: ["🌶️ Spicy", "🍭 Sweet", "🍲 Hot and hearty", "🥗 Fresh and light", "🤷 No specific craving"] },
  { question: "Any dietary goals or restrictions?", options: ["⚖️ Weight loss / low-cal", "🌱 Vegetarian / Vegan", "🌾 Gluten-Free", "🥩 Low-Carb / Keto", "🏋️ High-Protein", "🙌 No restrictions"] },
  { question: "How much are you looking to spend?", options: ["$ Under $10", "$$ $10–$20", "$$$ $20–$40", "$$$$ Money’s not a concern"] },
  { question: "How far are you willing to go?", options: ["🚶 Walking distance", "🚗 < 10 mins", "🚙 15–30 mins", "🛣️ I'll go anywhere"] },
  { question: "How would you like to eat today?", options: ["🍽️ Dine-in", "🥡 Takeout", "🚚 Delivery", "🚗 Drive-thru", "🤷 Doesn’t matter"] },
  { question: "Any special occasion or vibe?", options: ["📅 Regular meal", "⏳ Quick lunch break", "💖 Date night", "🏃 Post-workout", "🛋️ Comfort after a long day", "🎉 Celebration"] }
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
  container.innerHTML = `<div class="rounded-2xl p-4 sm:p-5 text-center bg-white/70 shadow-md border border-violet-100 fade-in">
    <div class="text-xl sm:text-2xl font-semibold text-gray-900">${question.question}</div>
  </div>`;
  answerButtons.innerHTML = "";

  question.options.forEach(option => {
    const button = document.createElement("button");
    button.innerText = option;
    button.className = "answer-btn text-sm sm:text-base px-4 py-3 sm:px-5 sm:py-3 rounded-xl";
    button.addEventListener("click", () => selectAnswer(option));
    answerButtons.appendChild(button);
  });

  updateQuestionProgress();
}

function selectAnswer(answer) {
  // Strip emoji from answer when storing
  const clean = answer.replace(/^\\S+\\s/, "");
  answers.push({ question: questions[currentQuestion].question, answer: clean });
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
    progressBar.style.transition = "width 2.6s ease-in-out"; progressBar.style.width = "100%";
    const track = progressBar.parentElement; if (track) track.setAttribute("aria-valuenow", "0");
    const start = performance.now(), duration = 2600;
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

    // Start Yelp load while still on loading screen (so location fallback can appear)
    await loadYelpResults();

    // Reveal results and auto-scroll top
    loadingContainer.classList.add("hidden");
    resultContainer.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 2600);
}

/* ==============================
   SMART TERM EXPANSION + YELP
============================== */
function mapAnswersToParams() {
  const find = (qText) => answers.find(a => a.question.includes(qText))?.answer || "";

  // Smart term expansion from craving + mood
  const craving = find("Are you craving anything specific?");
  const mood = find("What’s your current mood?");

  // Default terms
  let terms = ["restaurants"];

  // Expand based on craving
  if (craving.includes("Spicy")) terms = ["spicy food", "thai", "sichuan", "indian"];
  else if (craving.includes("Sweet")) terms = ["dessert", "ice cream", "frozen yogurt", "gelato", "bakery"];
  else if (craving.includes("Hot and hearty")) terms = ["comfort food", "ramen", "bbq", "stew"];
  else if (craving.includes("Fresh and light")) terms = ["salad", "poke", "mediterranean", "healthy food"];
  else if (craving.includes("No specific craving")) terms = ["restaurants"];

  // Nudge by mood
  if (mood.includes("healthy")) terms = ["healthy food", "salad", "poke", "veggie"];
  if (mood.includes("Indulgent")) terms = [...terms, "dessert", "steak"];
  if (mood.includes("Adventurous")) terms = [...terms, "ethiopian", "korean", "filipino", "nepalese"];

  // Price
  const priceAnswer = find("How much are you looking to spend?");
  let price = undefined;
  if (priceAnswer.startsWith("$ Under")) price = "1";
  else if (priceAnswer.startsWith("$$")) price = "1,2";
  else if (priceAnswer.startsWith("$$$")) price = "2,3";
  else if (priceAnswer.startsWith("$$$$")) price = "1,2,3,4";

  // Radius
  const distance = find("How far are you willing to go?");
  let radius = currentRadius || 8000;
  if (distance.includes("Walking")) radius = 800;
  else if (distance.includes("< 10")) radius = 3000;
  else if (distance.includes("15–30")) radius = 8000;
  else if (distance.includes("anywhere")) radius = Math.max(radius, 16000);

  // Transactions
  const method = find("How would you like to eat today?");
  let transactions = [];
  if (method.includes("Delivery")) transactions = ["delivery"];
  else if (method.includes("Takeout")) transactions = ["pickup"];

  // Dietary -> nudge
  const diet = find("Any dietary goals or restrictions?");
  if (diet.includes("Vegetarian") || diet.includes("Vegan")) terms = ["vegetarian", "vegan", ...terms];
  else if (diet.includes("Gluten-Free")) terms = ["gluten free", ...terms];
  else if (diet.includes("Keto")) terms = ["keto", ...terms];
  else if (diet.includes("High-Protein")) terms = ["protein bowls", ...terms];

  return { terms: Array.from(new Set(terms)).slice(0, 6), price, radius, transactions };
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

function renderBusinesses(businesses = []) {
  const list = document.getElementById("results-list");
  list.innerHTML = "";

  if (!businesses.length) {
    list.innerHTML = `<div class="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
      <p class="text-gray-700 text-sm">No matching places found. Try <button id="inline-widen" class="underline text-rose-600">widening the radius</button> or <button id="inline-clear-price" class="underline text-rose-600">clearing price</button>.</p>
    </div>`;
    document.getElementById("inline-widen")?.addEventListener("click", () => { currentRadius = Math.min(16000, (currentRadius || 8000) * 2); persistControls(); reloadYelp(); });
    document.getElementById("inline-clear-price")?.addEventListener("click", () => { sessionStorage.setItem("miso_price_override", ""); reloadYelp(); });
    return;
  }

  for (const b of businesses) {
    const miles = typeof b.distance === "number" ? (b.distance / 1609.34).toFixed(1) : "";
    const card = document.createElement("div");
    card.className = "p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition";

    card.innerHTML = `
      <div class="flex gap-4">
        <a href="${b.url || "#"}" target="_blank" rel="noopener noreferrer">
          <img loading="lazy" src="${b.image_url || ""}" alt="${b.name}" class="w-28 h-20 object-cover rounded-lg bg-gray-100" onerror="this.style.display='none'"/>
        </a>
        <div class="flex-1">
          <div class="flex items-center justify-between gap-2">
            <a href="${b.url || "#"}" target="_blank" rel="noopener noreferrer" class="text-lg font-semibold text-gray-900 hover:underline">${b.name}</a>
            ${b.price ? `<span class="text-sm text-gray-700">${b.price}</span>` : ""}
          </div>
          <div class="text-sm text-gray-700 mt-1">
            ${b.rating ? `⭐ ${b.rating} · ` : ""}${b.review_count ? `${b.review_count} reviews` : ""}
          </div>
          <div class="text-xs text-gray-600 mt-1">
            ${Array.isArray(b.categories) ? b.categories.slice(0,2).join(", ") : ""}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            ${b.address || ""} ${miles ? ` · ${miles} mi` : ""}
          </div>
          <div class="flex gap-2 mt-2">
            ${b.phone ? `<a href="tel:${b.phone.replace(/[^\\d+]/g,'')}" class="px-3 py-1 text-xs rounded-full border">Call</a>` : ""}
            ${b.address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}" target="_blank" class="px-3 py-1 text-xs rounded-full border">Directions</a>` : ""}
            ${b.url ? `<a href="${b.url}" target="_blank" class="px-3 py-1 text-xs rounded-full border">Yelp</a>` : ""}
          </div>
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

/* Merge results from multiple terms and de-duplicate by id */
function mergeBusinesses(arrays) {
  const map = new Map();
  for (const list of arrays) {
    for (const b of list) {
      if (!map.has(b.id)) map.set(b.id, b);
    }
  }
  return Array.from(map.values());
}

let lastSearchContext = null; // remember coords or manual location

function persistControls() {
  sessionStorage.setItem("miso_sort", currentSort);
  sessionStorage.setItem("miso_open_now", String(openNow));
  sessionStorage.setItem("miso_radius", String(currentRadius));
}

async function loadYelpResults() {
  showSkeletons();

  const base = mapAnswersToParams();
  // Allow price override cleared by empty state button
  const priceOverride = sessionStorage.getItem("miso_price_override");
  const price = (priceOverride === "") ? undefined : base.price;

  // Controls UI wiring
  const sortBest = document.getElementById("sort-best");
  const sortRating = document.getElementById("sort-rating");
  const sortDistance = document.getElementById("sort-distance");
  const openNowBox = document.getElementById("open-now");
  const widenBtn = document.getElementById("btn-widen");

  function setActive(btn) {
    [sortBest, sortRating, sortDistance].forEach(b => {
      if (!b) return;
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      b.className = "answer-btn text-sm sm:text-base px-4 py-3 sm:px-5 sm:py-3 rounded-xl";
    });
  }
  if (currentSort === "best_match") setActive(sortBest);
  if (currentSort === "rating") setActive(sortRating);
  if (currentSort === "distance") setActive(sortDistance);

  if (openNowBox) { openNowBox.checked = openNow; openNowBox.onchange = () => { openNow = openNowBox.checked; persistControls(); reloadYelp(); }; }
  if (widenBtn) widenBtn.onclick = () => { currentRadius = Math.min(16000, (currentRadius || 8000) * 2); persistControls(); reloadYelp(); };
  sortBest && (sortBest.onclick = () => { currentSort = "best_match"; persistControls(); reloadYelp(); setActive(sortBest); });
  sortRating && (sortRating.onclick = () => { currentSort = "rating"; persistControls(); reloadYelp(); setActive(sortRating); });
  sortDistance && (sortDistance.onclick = () => { currentSort = "distance"; persistControls(); reloadYelp(); setActive(sortDistance); });

  // Try geolocation first (if we don't already have a context)
  const locBox = document.getElementById("location-fallback");
  const manualInput = document.getElementById("manual-location");
  const useBtn = document.getElementById("use-location-btn");

  if (!lastSearchContext) {
    lastSearchContext = await new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    });
  }

  if (!lastSearchContext) {
    // Show manual location box on loading screen
    locBox?.classList.remove("hidden");
    const triggerSearch = async () => {
      const location = (manualInput.value || "").trim();
      if (!location) return;
      lastSearchContext = { location };
      await reloadYelp(); // run the search now that we have a location
    };
    useBtn?.addEventListener("click", triggerSearch);
    manualInput?.addEventListener("keydown", (ev) => { if (ev.key === "Enter") triggerSearch(); });
    return; // wait for user input
  }

  // We have a context (coords or location). Fetch across expanded terms in parallel.
  const queries = base.terms.map(term => callYelp({
    ...(lastSearchContext.latitude ? { latitude: lastSearchContext.latitude, longitude: lastSearchContext.longitude } : { location: lastSearchContext.location }),
    term,
    price,
    radius: base.radius,
    open_now: openNow,
    sort_by: currentSort,
    limit: 20
  }));

  try {
    const results = await Promise.allSettled(queries);
    const lists = results.filter(r => r.status === "fulfilled").map(r => r.value);
    const merged = mergeBusinesses(lists);

    // Optional: light re-sort client-side to respect sort choice if needed
    if (currentSort === "rating") merged.sort((a,b) => (b.rating||0) - (a.rating||0));
    if (currentSort === "distance") merged.sort((a,b) => (a.distance||Infinity) - (b.distance||Infinity));

    renderBusinesses(merged);
  } catch (e) {
    const list = document.getElementById("results-list");
    list.innerHTML = `<div class="p-4 border rounded-xl bg-white text-sm text-red-600">Error: ${e.message}</div>`;
  }
}

async function reloadYelp() {
  showSkeletons();
  await loadYelpResults();
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
    // Keep filter state persistent

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
