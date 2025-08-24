/* ==============================
   SETTINGS
============================== */
const ENABLE_ANIM = false; // keep taps snappy

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
  if (!ENABLE_ANIM) return; // no-op for speed
  parentEl.querySelectorAll('button').forEach(btn => {
    btn.classList.add('tap-anim','ripple');
    btn.addEventListener('click', e => {
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--ripple-x', (e.clientX - rect.left) + 'px');
      btn.style.setProperty('--ripple-y', (e.clientY - rect.top) + 'px');
      btn.classList.add('rippling');
      setTimeout(() => btn.classList.remove('rippling'), 250);
    });
  });
}

async function transitionQuestion(renderFn) {
  if (!ENABLE_ANIM) { renderFn(); return; }
  const q = document.getElementById('question-container');
  const head = document.getElementById('question-header');
  [q, head].forEach(node => node?.classList.remove('slide-in'));
  [q, head].forEach(node => node?.classList.add('slide-out'));
  await new Promise(r => setTimeout(r, 160)); // slightly faster
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
        hover:bg-gray-100 hover:text-slate-900 transition-all duration-150 ease-out
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
      `;
      // pointerup fires faster than click on mobile; once prevents double-activation
      button.addEventListener("pointerup", () => selectAnswer(option), { once: true });
      answerButtons.appendChild(button);
    });
    attachButtonEffects(answerButtons);
  };

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
   RESULTS + LOADING
============================== */
function showResults() {
  const qBar = document.getElementById("question-progress");
  if (qBar) { qBar.style.transition = "width 200ms ease-out"; qBar.style.width = "100%"; qBar.parentElement?.setAttribute("aria-valuenow", "100"); }

  quizContainer.classList.add("hidden");
  const sound = document.getElementById("miso-sound");
  if (sound) sound.play().catch(() => {});
  loadingContainer.classList.remove("hidden");

  const progressBar = document.getElementById("progress-bar");
  if (progressBar) {
    progressBar.style.transition = "none"; progressBar.style.width = "0%"; void progressBar.offsetWidth;
    progressBar.style.transition = "width 2.2s ease-in-out"; progressBar.style.width = "100%";
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
    loadingContainer.classList.add("hidden");
    resultContainer.classList.remove("hidden");
    await initYelpResults();
  }, 2200);
}

/* ==============================
   SMART TERM EXPANSION (keywords + Yelp categories)
============================== */
function expandedSearchTerms(rawTerms) {
  const TERM_BANK = {
    sweet: {
      keywords: ['dessert','ice cream','frozen yogurt','gelato','bakery','boba','milk tea'],
      categories: ['desserts','icecream','frozenyogurt','gelato','bakeries','bubbletea']
    },
    spicy: {
      keywords: ['spicy','sichuan','thai','indian','hot chicken'],
      categories: ['szechuan','thai','indpak']
    },
    noodles: {
      keywords: ['ramen','pho','udon','noodles'],
      categories: ['ramen','vietnamese','noodles']
    },
    healthy: {
      keywords: ['healthy','salad','poke','mediterranean','grill'],
      categories: ['salad','poke','mediterranean','healthmarkets']
    },
    breakfast: {
      keywords: ['breakfast','brunch','coffee','bakery'],
      categories: ['breakfast_brunch','cafes','coffee','bakeries']
    },
    bbq: {
      keywords: ['bbq','barbecue','smokehouse','brisket'],
      categories: ['bbq']
    },
    burgers: {
      keywords: ['burger','smashburger'],
      categories: ['burgers','tradamerican']
    },
    pizza: {
      keywords: ['pizza','slice'],
      categories: ['pizza']
    },
    tacos: {
      keywords: ['taco','taqueria'],
      categories: ['tacos','mexican']
    },
    seafood: {
      keywords: ['seafood','oyster','sushi','poke'],
      categories: ['seafood','sushi','poke']
    },
    comfort: {
      keywords: ['comfort food','chicken and waffles','meatloaf','mac and cheese'],
      categories: ['comfortfood','southern']
    },
    international: {
      keywords: ['international','global'],
      categories: ['thai','indpak','mexican','chinese','japanese','korean','mediterranean','italian','vietnamese']
    },
    vegetarian: { keywords: ['vegetarian'], categories: ['vegetarian'] },
    vegan: { keywords: ['vegan'], categories: ['vegan'] },
    'gluten free': { keywords: ['gluten free'], categories: ['gluten_free'] },
    keto: { keywords: ['keto'], categories: [] },
    protein: { keywords: ['protein bowls','grill'], categories: [] },
  };

  const kws = new Set();
  const cats = new Set();
  rawTerms.forEach(t => {
    const key = String(t).toLowerCase().trim();
    if (key) kws.add(key); // keep raw token
    Object.entries(TERM_BANK).forEach(([k, val]) => {
      if (key.includes(k)) {
        val.keywords.forEach(x => kws.add(x));
        val.categories.forEach(x => cats.add(x));
      }
    });
  });

  return {
    keywords: [...kws].slice(0, 8),
    categories: [...cats].slice(0, 8),
  };
}

/* ==============================
   MAP ANSWERS -> keywords + categories
============================== */
function mapAnswersToParams() {
  const find = (qText) => answers.find(a => a.question.includes(qText))?.answer || "";

  const craving = find("Are you craving anything specific?");
  const mood = find("What’s your current mood?");
  const diet = find("Any dietary goals or restrictions?");
  const budget = find("How much are you looking to spend?");
  const distance = find("How far are you willing to go?");
  const method = find("How would you like to eat today?");

  // topic tokens from answers
  let baseTokens = [];
  if (craving === "Spicy") baseTokens.push("spicy");
  else if (craving === "Sweet") baseTokens.push("sweet");
  else if (craving === "Hot and hearty") baseTokens.push("comfort");
  else if (craving === "Fresh and light") baseTokens.push("healthy");
  else baseTokens.push("restaurants"); // safe default

  if (/healthy/i.test(mood)) baseTokens.push("healthy");
  if (/Adventurous/i.test(mood)) baseTokens.push("international");
  if (/Indulgent/i.test(mood)) baseTokens.push("sweet");

  if (/Vegetarian/.test(diet)) baseTokens.push("vegetarian");
  if (/Vegan/.test(diet)) baseTokens.push("vegan");
  if (/Gluten-Free/.test(diet)) baseTokens.push("gluten free");
  if (/Low-Carb|Keto/.test(diet)) baseTokens.push("keto");
  if (/High-Protein/.test(diet)) baseTokens.push("protein");

  // price
  let price = undefined;
  if (budget === "Under $10") price = "1";
  else if (budget === "$10–$20") price = "1,2";
  else if (budget === "$20–$40") price = "2,3";
  else if (budget === "Money’s not a concern") price = "1,2,3,4";

  // radius
  let radius = 8000;
  if (distance === "Walking distance") radius = 800;
  else if (distance.includes("under 10")) radius = 3000;
  else if (distance.includes("15–30")) radius = 8000;
  else if (distance.includes("anywhere")) radius = 16000;

  // transactions
  let transactions = [];
  if (method === "Delivery") transactions = ["delivery"];
  else if (method === "Takeout") transactions = ["pickup"];

  const { keywords, categories } = expandedSearchTerms(baseTokens);

  return { keywords, categories, price, radius, transactions };
}

/* ==============================
   RESULTS RENDERING
============================== */
function hoursOrCallLine(b) {
  if (b.has_hours) {
    if (b.open_status === "open") return "⏰ Open now";
    if (b.open_status === "closed") return "⏰ Closed now";
    return "⏰ Hours available";
  }
  if (b.phone) return `Hours not listed — tap to call 📞`;
  return "Hours not listed";
}

function toggleWidenFab(show) {
  const fab = document.getElementById("try-radius-fab");
  if (!fab) return;
  fab.classList.toggle("hidden", !show);
}

function renderBusinesses(businesses = []) {
  const list = document.getElementById("results-list");
  list.innerHTML = "";

  // ✅ Cap to 10 results
  businesses = (businesses || []).slice(0, 10);

  if (!businesses.length) {
    toggleWidenFab(true);
    list.innerHTML = `<div class="p-4 border border-gray-200 rounded-xl bg-white shadow-sm"><p class="text-gray-700 text-sm">No matching restaurants found. Try widening the distance or clearing price filters.</p></div>`;
    return;
  }

  toggleWidenFab(false);

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
          ${hoursOrCallLine(b)} ${b.phone ? `• <a href="tel:${b.phone.replace(/[^\d+]/g,'')}" class="underline">Call</a>` : ""}
        </div>
      </div>
    `;
    if (i === 0) a.classList.add("ring-2","ring-yellow-400");
    list.appendChild(a);
  });
}

/* ==============================
   YELP INTEGRATION + CONTROLS
============================== */
let currentSort = "best_match";
let openNow = false;         // default off for better hit rate; user can toggle on
let currentRadius = 8000;
let lastGeo = null;
let lastLocation = null;
let baseParams = null;
let filterState = { highRated: false, budget: false, nearby: false };

function readFilters() {
  filterState.highRated = !!document.getElementById("filter-highrated")?.checked;
  filterState.budget = !!document.getElementById("filter-budget")?.checked;
  filterState.nearby = !!document.getElementById("filter-nearby")?.checked;
  return filterState;
}

// Block lodging-type businesses from results
function isHotelLike(b) {
  const rawCats = Array.isArray(b.categories) ? b.categories : [];
  const asText = rawCats
    .map(c => (typeof c === 'string' ? c : (c.alias || c.title || '')))
    .join(' , ')
    .toLowerCase();
  const name = (b.name || '').toLowerCase();

  // Be careful not to match "Cinnabon" etc — use word boundaries
  const banned = /\b(hotel|motels?|hostels?|lodging|resorts?|bed\s*&\s*breakfast|b&b|guest\s*house|inns?)\b/;
  return banned.test(asText) || banned.test(name);
}

// ✅ New: True only if the business is currently open
function isActuallyOpen(b) {
  if (typeof b.open_status === "string") return b.open_status === "open"; // normalized by backend
  if (typeof b.is_open_now === "boolean") return b.is_open_now;          // Yelp passthrough
  if (b.hours && b.hours[0] && typeof b.hours[0].is_open_now === "boolean") return b.hours[0].is_open_now;
  return false; // unknown -> treat as closed when filtering for openNow
}

function applyClientFilters(items) {
  let list = [...items];

  // drop hotels/inns/lodging
  list = list.filter(b => !isHotelLike(b));

  // ✅ Strict “Open now” filter from UI toggle
  if (openNow) list = list.filter(isActuallyOpen);

  if (filterState.highRated) list = list.filter(b => (b.rating || 0) >= 4.5);
  if (filterState.budget) list = list.filter(b => !b.price || b.price.length <= 2);
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

/* ===== Multi-query helpers: build small valid queries and merge results ===== */
function uniqById(items) {
  const map = new Map();
  items.forEach(b => { if (b && b.id && !map.has(b.id)) map.set(b.id, b); });
  return [...map.values()];
}

// Build a few valid query variants (term OR categories per request)
function buildQuerySet(baseParams) {
  const qs = [];
  const kw = (baseParams.keywords || []).slice(0, 6);

  // Always include "restaurants" in category searches
  const catSet = new Set((baseParams.categories || []).slice(0, 5));
  catSet.add('restaurants');
  const catList = [...catSet];
  if (catList.length) qs.push({ categories: catList.join(",") });

  // 1) primary combined keyword term
  if (kw.length) qs.push({ term: kw.slice(0, 3).join(" ") });

  // 2) single-strong keywords
  kw.slice(0, 4).forEach(w => qs.push({ term: w }));

  // 3) generic fallback
  qs.push({ term: "restaurants" });

  // de-dup
  const seen = new Set();
  return qs.filter(q => {
    const k = q.term ? `t:${q.term}` : `c:${q.categories}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function mergedSearch(base, querySet, targetCount = 20) {
  let all = [];
  for (const q of querySet) {
    const results = await callYelp({ ...base, ...q });
    if (results?.length) {
      all = uniqById(all.concat(results));
      if (all.length >= targetCount) break;
    }
  }
  // If still empty, relax once (open_now off + wider radius + broader terms)
  if (!all.length) {
    const relaxed = { ...base, open_now: false, radius: Math.min(32000, (base.radius || 8000) * 2) };
    const relaxedSet = [...querySet, { term: "food" }, { term: "dinner" }, { term: "lunch" }, { term: "dessert" }, { term: "ice cream" }];
    for (const q of relaxedSet) {
      const results = await callYelp({ ...relaxed, ...q });
      if (results?.length) {
        all = uniqById(all.concat(results));
        if (all.length >= targetCount) break;
      }
    }
  }
  return all;
}

/* Main search that uses the multi-query strategy */
async function doSearch(overrides = {}) {
  readFilters();

  const base = {
    sort_by: filterState.nearby ? "distance" : currentSort,
    open_now: openNow,
    radius: currentRadius,
    limit: 20,
    price: baseParams?.price,
    transactions: baseParams?.transactions,
    ...overrides
  };

  if (lastGeo) {
    base.latitude = lastGeo.latitude;
    base.longitude = lastGeo.longitude;
    delete base.location;
  } else if (lastLocation) {
    base.location = lastLocation;
    delete base.latitude; delete base.longitude;
  }

  const querySet = buildQuerySet(baseParams || { keywords: ['restaurants'], categories: [] });

  showSkeletons();
  try {
    const results = await mergedSearch(base, querySet, 20);
    const filtered = applyClientFilters(results);
    renderBusinesses(filtered);
    toggleWidenFab(!filtered.length);
  } catch (e) {
    const list = document.getElementById("results-list");
    list.innerHTML = `<div class="p-4 border rounded-xl bg-white text-sm text-red-600">Error: ${e.message}</div>`;
    toggleWidenFab(true);
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

/* ==============================
   INIT RESULTS (controls + location + first fetch)
============================== */
async function initYelpResults() {
  // Controls
  const bestBtn = document.getElementById("sort-best");
  const ratingBtn = document.getElementById("sort-rating");
  const distanceBtn = document.getElementById("sort-distance");
  const openChk = document.getElementById("open-now");
  const widenBtn = document.getElementById("btn-widen");
  const widenFab = document.getElementById("try-radius-fab");
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

  // Sync initial "Open now" from checkbox, then react to changes
  openNow = !!openChk?.checked;
  openChk?.addEventListener("change", () => { openNow = !!openChk.checked; doSearch(); });

  widenBtn?.addEventListener("click", () => { currentRadius = Math.min(32000, Math.round(currentRadius * 1.5)); doSearch(); });
  widenFab?.addEventListener("click", () => { currentRadius = Math.min(32000, Math.round(currentRadius * 1.5)); doSearch(); });
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

  // Manual fallback UI
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
    openNow = false;
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
