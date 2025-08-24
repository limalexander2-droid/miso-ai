/* ==============================
   FEATURE FLAGS
============================== */
const FLAGS = {
  enableBackButton: true,
  capTopResults: true,
  tenCapCount: 10,
  analytics: true,
  relaxWhenEmpty: true,
  cacheLastResults: true
, 
  enableFastPath: false
, 
  enableGroupMode: false
};

/* ==============================
   SETTINGS
============================== */
const ENABLE_ANIM = false;
const LAST_PREFS_KEY = "miso_last_prefs_v1";
const SAVED_KEY = "miso_saved_places_v1";
const LAST_RESULTS_KEY = "miso_last_results_v1";

/* ==============================
   STATE + DOM
============================== */
let currentQuestion = 0;
let answers = [];
let quizStarted = false;
let firstSatisfyingFired = false;

const container = document.getElementById("question-container");
const answerButtons = document.getElementById("answer-buttons");
const resultContainer = document.getElementById("result");
const loadingContainer = document.getElementById("loading");
const quizContainer = document.getElementById("quiz");

const backBtn = document.getElementById("back-btn");
const skipBtn = document.getElementById("skip-btn");
const fastPath = document.getElementById("fast-path");
const useLastBtn = document.getElementById("use-last-btn");
const groupModeChk = document.getElementById("group-mode");

const loadingMessages = [
  { emoji: "🍣", text: "Plating your cravings…" },
  { emoji: "🍜", text: "Asking the kitchen for something special…" },
  { emoji: "🥢", text: "Warming up the noodles…" }
];

/* ==============================
   ANALYTICS
============================== */
window.__misoEvents = window.__misoEvents || [];
function track(event, payload = {}) {
  if (!FLAGS.analytics) return;
  try { window.__misoEvents.push({ event, t: Date.now(), ...payload }); } catch {}
}

/* ==============================
   QUESTIONS (≤7)
============================== */
const questions = [
  { question: "What vibe tonight?", options: ["Cozy / comfort", "Healthy / light", "Indulgent", "Adventurous", "No strong preference"] },
  { question: "Leaning toward…", options: ["Spicy", "Sweet", "Hot & hearty", "Fresh", "Surprise me"] },
  { question: "Diet or goals?", options: ["Weight Loss", "Vegetarian / Vegan", "Gluten-Free", "Low-Carb / Keto", "High-Protein", "None"] },
  { question: "Budget range?", options: ["Under $10", "$10–$20", "$20–$40", "Any budget"] },
  { question: "How far will you go?", options: ["Walkable", "Short drive (<10m)", "15–30m", "Anywhere"] },
  { question: "How are you eating today?", options: ["Dine-in", "Takeout", "Delivery", "Drive-thru", "Doesn’t matter"] },
  { question: "Who’s eating?", options: ["Just me", "A few friends", "Date night", "Big group / family", "Doesn’t matter"] }
];

/* ==============================
   EMOJI MAPPER + PROGRESS
============================== */
const emojiMap = [
  { match: /vibe|mood/i, emoji: '🥗' },
  { match: /leaning|spicy|sweet|hearty|fresh/i, emoji: '🍔' },
  { match: /diet|goals|keto|protein|gluten|vegan|vegetarian/i, emoji: '🥦' },
  { match: /budget|range/i, emoji: '💸' },
  { match: /far|drive|walk/i, emoji: '🗺️' },
  { match: /eating|dine|delivery|takeout/i, emoji: '🍽️' },
  { match: /who|friends|date|group/i, emoji: '👥' }
];
function setQuestionEmoji(text) {
  const el = document.getElementById('question-emoji');
  const title = document.getElementById('question-title');
  const hit = emojiMap.find(e => e.match.test(text));
  if (el) el.textContent = hit ? hit.emoji : '🍽️';
  if (title) title.textContent = text;
}
function updateQuestionProgress() {
  const bar = document.getElementById("question-progress");
  const total = questions.length || 1;
  const percent = Math.min(100, Math.round((currentQuestion / total) * 100));
  bar.style.width = `${percent}%`;
  bar.parentElement?.setAttribute("aria-valuenow", String(percent));
  const progressIndicator = document.getElementById("progress-indicator");
  progressIndicator.textContent = `Question ${currentQuestion + 1} of ${total}`;
}

/* ==============================
   QUIZ FLOW
============================== */
function showQuestion() {
  resultContainer.classList.add("hidden");
  quizContainer.classList.remove("hidden");

  if (!quizStarted) { quizStarted = true; track("quiz_start"); }

  const q = questions[currentQuestion];
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
    button.addEventListener("pointerup", () => selectAnswer(option), { once: true });
    answerButtons.appendChild(button);
  });

  // Back button
  if (FLAGS.enableBackButton) {
    backBtn.style.display = "inline-flex";
    backBtn.disabled = currentQuestion === 0;
    backBtn.setAttribute("aria-disabled", currentQuestion === 0 ? "true" : "false");
  } else {
    backBtn.style.display = "none";
  }

  // Skip
  skipBtn.disabled = currentQuestion >= questions.length;
  updateQuestionProgress();
}

function selectAnswer(answer) {
  answers.push({ question: questions[currentQuestion].question, answer });
  currentQuestion += 1;
  updateQuestionProgress();

  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    track("quiz_complete", { total_q: questions.length });
    saveLastPrefs();
    showResults();
  }
}
function skipQuestion() {
  answers.push({ question: questions[currentQuestion].question, answer: "Skip" });
  currentQuestion += 1;
  if (currentQuestion < questions.length) showQuestion();
  else { track("quiz_complete", { total_q: questions.length, skipped: true }); saveLastPrefs(); showResults(); }
}
function goBackOne() {
  if (!FLAGS.enableBackButton) return;
  if (currentQuestion === 0) return;
  currentQuestion -= 1;
  answers.pop();
  track("quiz_back", { to_q_index: currentQuestion });
  showQuestion();
}
backBtn?.addEventListener("click", goBackOne);
skipBtn?.addEventListener("click", skipQuestion);

/* ==============================
   LAST SETTINGS (fast path)
============================== */
function loadLastPrefs() {
  try { return JSON.parse(localStorage.getItem(LAST_PREFS_KEY) || "null"); } catch { return null; }
}
function saveLastPrefs() {
  if (!FLAGS.enableFastPath) return;
  const prefs = { answers, ts: Date.now(), group: !!groupModeChk?.checked };
  try { localStorage.setItem(LAST_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}
function maybeShowFastPath() {
  if (!FLAGS.enableFastPath) return;
  const last = loadLastPrefs();
  if (last && Array.isArray(last.answers) && last.answers.length) {
    fastPath?.classList.remove("hidden");
    useLastBtn?.addEventListener("click", () => {
      answers = last.answers || [];
      currentQuestion = questions.length;
      groupModeChk.checked = !!last.group;
      showResults();
      track("used_last_settings");
    }, { once: true });
  }
}

/* ==============================
   ANSWERS -> SEARCH PARAMS
============================== */
function expandedSearchTerms(rawTerms) {
  const TERM_BANK = {
    sweet: { keywords: ['dessert','ice cream','gelato','bakery','boba','milk tea'], categories: ['desserts','icecream','gelato','bakeries','bubbletea'] },
    spicy: { keywords: ['spicy','sichuan','thai','indian','hot chicken'], categories: ['szechuan','thai','indpak'] },
    hearty: { keywords: ['ramen','noodles','burgers','sandwiches'], categories: ['ramen','noodles','burgers'] },
    fresh: { keywords: ['salad','poke','mediterranean','grill'], categories: ['salad','poke','mediterranean'] },
    healthy: { keywords: ['healthy','bowl','grain bowl'], categories: ['salad','healthmarkets'] },
    vegetarian: { keywords: ['vegetarian'], categories: ['vegetarian'] },
    vegan: { keywords: ['vegan'], categories: ['vegan'] },
    'gluten free': { keywords: ['gluten free'], categories: ['gluten_free'] },
    keto: { keywords: ['keto'], categories: [] },
    protein: { keywords: ['high protein','grill'], categories: [] },
  };

  const kws = new Set();
  const cats = new Set();
  rawTerms.forEach(t => {
    const key = String(t).toLowerCase().trim();
    if (key) kws.add(key);
    Object.entries(TERM_BANK).forEach(([k, val]) => {
      if (key.includes(k)) {
        val.keywords.forEach(x => kws.add(x));
        val.categories.forEach(x => cats.add(x));
      }
    });
  });

  return { keywords: [...kws].slice(0, 8), categories: [...cats].slice(0, 8) };
}

function mapAnswersToParams() {
  const find = (qText) => answers.find(a => a.question.includes(qText))?.answer || "";
  const mood = find("What vibe");
  const craving = find("Leaning toward");
  const diet = find("Diet or goals");
  const budget = find("Budget range");
  const distance = find("How far");
  const method = find("How are you eating");
  const who = find("Who’s eating");

  let tokens = [];
  if (/healthy/i.test(mood)) tokens.push("healthy");
  if (/comfort|hearty/i.test(craving)) tokens.push("hearty");
  if (/Spicy/.test(craving)) tokens.push("spicy");
  if (/Sweet/.test(craving)) tokens.push("sweet");
  if (/Fresh/.test(craving)) tokens.push("fresh");
  if (/Adventurous/i.test(mood)) tokens.push("international");

  if (/Vegetarian/.test(diet)) tokens.push("vegetarian");
  if (/Vegan/.test(diet)) tokens.push("vegan");
  if (/Gluten-Free/.test(diet)) tokens.push("gluten free");
  if (/Keto/.test(diet)) tokens.push("keto");
  if (/High-Protein/.test(diet)) tokens.push("protein");

  let price = undefined;
  if (budget === "Under $10") price = "1";
  else if (budget === "$10–$20") price = "1,2";
  else if (budget === "$20–$40") price = "2,3";
  else price = "1,2,3,4";

  let radius = 8000;
  if (distance === "Walkable") radius = 800;
  else if (distance.includes("<10")) radius = 3000;
  else if (distance.includes("15–30")) radius = 8000;
  else if (distance.includes("Anywhere")) radius = 16000;

  let transactions = [];
  if (method === "Delivery") transactions = ["delivery"];
  else if (method === "Takeout") transactions = ["pickup"];

  const { keywords, categories } = expandedSearchTerms(tokens);

  const groupMode = FLAGS.enableGroupMode && !!groupModeChk?.checked || /group|big/i.test(who);
  return { keywords, categories, price, radius, transactions, groupMode };
}

/* ==============================
   RESULTS RENDER + SAVES
============================== */
function getSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}
function setSaved(list) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch {}
}
function isSaved(id) {
  return getSaved().some(x => x.id === id);
}
function toggleSave(b) {
  const list = getSaved();
  const idx = list.findIndex(x => x.id === b.id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push({ id: b.id, name: b.name, url: b.url || "", address: b.address || "", ts: Date.now() });
  setSaved(list);
}

function hoursOrCallLine(b) {
  if (b.has_hours) {
    if (b.open_status === "open") return "⏰ Open now";
    if (b.open_status === "closed") return "⏰ Closed now";
    return "⏰ Hours available";
  }
  if (b.phone) return `Hours not listed — tap to call 📞`;
  return "Hours not listed";
}

function googleMapsHref(b) {
  try {
    if (b.coordinates && typeof b.coordinates.latitude === "number" && typeof b.coordinates.longitude === "number") {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.coordinates.latitude + "," + b.coordinates.longitude)}`;
    }
    const q = [b.name, b.address].filter(Boolean).join(" ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  } catch { return ""; }
}

function renderBusinesses(businesses = []) {
  const list = document.getElementById("results-list");
  list.innerHTML = "";

  if (FLAGS.capTopResults) businesses = (businesses || []).slice(0, FLAGS.tenCapCount);

  if (!businesses.length) {
    list.innerHTML = `<div class="p-4 border border-gray-200 rounded-xl bg-white shadow-sm"><p class="text-gray-700 text-sm">No matching restaurants found. Try widening the distance or clearing price filters.</p></div>`;
    return;
  }

  businesses.forEach((b, i) => {
    const miles = typeof b.distance === "number" ? (b.distance / 1609.34).toFixed(1) : "";
    const cats = Array.isArray(b.categories) ? b.categories.map(c => (typeof c === "string" ? c : (c.title || c.alias || ""))).filter(Boolean).join(", ") : "";
    const saved = isSaved(b.id || "");

    const card = document.createElement("div");
    card.className = "relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition flex gap-4";
    card.innerHTML = `
      ${i === 0 ? `<div class="top-pick-badge">Top Pick</div>` : ""}
      <img src="${b.image_url || ""}" alt="${b.name}" class="w-28 h-20 object-cover rounded-lg bg-gray-100" onerror="this.style.display='none'"/>
      <div class="flex-1">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-lg font-semibold text-gray-900">${b.name}</h3>
          ${b.price ? `<span class="text-sm text-gray-600">💲 ${b.price}</span>` : ""}
        </div>
        <div class="text-sm text-gray-700 mt-1">
          ${b.rating ? `⭐ ${b.rating} · ` : ""}${b.review_count ? `${b.review_count} reviews` : ""}
        </div>
        <div class="text-xs text-gray-600 mt-1">${cats}</div>
        <div class="text-xs text-gray-600 mt-1">📍 ${b.address || ""} ${miles ? ` · ${miles} mi` : ""}</div>
        <div class="flex flex-wrap gap-3 items-center text-xs text-gray-700 mt-2">
          <span>${hoursOrCallLine(b)}</span>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <a href="${googleMapsHref(b)}" target="_blank" rel="noopener noreferrer"
            class="px-3 py-2 rounded-lg text-white text-sm font-semibold cta" aria-label="Open ${b.name} in Maps">Open in Maps</a>
          ${b.url ? `<a href="${b.url}" target="_blank" rel="noopener noreferrer" class="px-3 py-2 rounded-lg border text-sm" aria-label="View ${b.name} on Yelp">Yelp</a>` : ""}
          ${b.phone ? `<a href="tel:${(b.phone||'').replace(/[^\\d+]/g,'')}" class="px-3 py-2 rounded-lg border text-sm" aria-label="Call ${b.name}">Call</a>` : ""}
          <button data-save="${b.id}" class="px-3 py-2 rounded-lg border text-sm ${saved ? 'bg-yellow-50 border-yellow-300' : ''}" aria-pressed="${saved ? 'true':'false'}">${saved ? 'Saved ♥' : 'Save ♥'}</button>
        </div>
      </div>
    `;

    // Click tracking
    card.querySelectorAll("a[href]").forEach(link => {
      link.addEventListener("click", () => {
        track("result_click", { biz_id: b.id || "", action: /google/.test(link.href) ? "maps" : ( /yelp/.test(link.href) ? "yelp" : "call" ), position: i+1 });
        if (!firstSatisfyingFired) { firstSatisfyingFired = true; track("first_satisfying_choice", { biz_id: b.id || "", position: i+1 }); }
      }, { passive: true });
    });

    // Save toggle
    card.querySelector(`[data-save="${b.id}"]`)?.addEventListener("click", (ev) => {
      toggleSave(b);
      renderBusinesses(businesses); // re-render to reflect button state
      track("result_save_toggle", { biz_id: b.id || "", saved: isSaved(b.id || "") });
    });

    list.appendChild(card);
  });

  track("results_render", { count: businesses.length });
}

/* ==============================
   SAVED DIALOG
============================== */
const savedDialog = document.getElementById("saved-dialog");
const savedList = document.getElementById("saved-list");
const viewSavedBtn = document.getElementById("view-saved-btn");
const closeSavedBtn = document.getElementById("close-saved");
const clearSavedBtn = document.getElementById("clear-saved");

viewSavedBtn?.addEventListener("click", () => { renderSaved(); savedDialog.showModal(); });
closeSavedBtn?.addEventListener("click", () => savedDialog.close());
clearSavedBtn?.addEventListener("click", () => { setSaved([]); renderSaved(); });

function renderSaved() {
  const list = getSaved();
  savedList.innerHTML = "";
  if (!list.length) {
    savedList.innerHTML = `<div class="p-3 text-sm text-gray-600">No saved places yet.</div>`;
    return;
  }
  list.sort((a,b) => b.ts - a.ts).forEach((s) => {
    const row = document.createElement("div");
    row.className = "p-3 border rounded-xl bg-white";
    row.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="font-medium">${s.name}</div>
        <div class="text-xs text-gray-500">${new Date(s.ts).toLocaleString()}</div>
      </div>
      <div class="text-xs text-gray-600 mt-1">${s.address || ""}</div>
      <div class="mt-2 flex gap-2">
        ${s.url ? `<a href="${s.url}" target="_blank" class="chip">Yelp</a>` : ""}
      </div>
    `;
    savedList.appendChild(row);
  });
}

/* ==============================
   SHARE TOP 3 (Group-friendly)
============================== */
const shareBtn = document.getElementById("share-top-btn");
async function shareTop3() {
  const top3 = (window.__lastBusinesses || []).slice(0, 3);
  if (!top3.length) return;
  const lines = top3.map((b,i) => `${i+1}. ${b.name} (${b.price || '—'} · ${b.rating || '—'}⭐) — ${b.address || ''}`);
  const text = `My top picks from Miso:\n` + lines.join("\n");
  try {
    if (navigator.share && typeof navigator.share === "function") {
      await navigator.share({ title: "Miso picks", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Top picks copied to clipboard!");
    }
    track("share_top3");
  } catch { /* user cancelled */ }
}
shareBtn?.addEventListener("click", shareTop3);

/* ==============================
   SEARCH + FILTERS
============================== */
let currentSort = "best_match";
let openNow = true;
let currentRadius = 8000;
let lastGeo = null;
let lastLocation = null;
let baseParams = null;
let filterState = { highRated: false, budget: false, nearby: false };

function readFilters() {
  filterState.highRated = !!document.getElementById("filter-highrated")?.checked;
  filterState.budget = !!document.getElementById("filter-budget")?.checked;
  filterState.nearby = !!document.getElementById("filter-nearby")?.checked;
  openNow = !!document.getElementById("open-now")?.checked;
  return filterState;
}

function isHotelLike(b) {
  const rawCats = Array.isArray(b.categories) ? b.categories : [];
  const asText = rawCats.map(c => (typeof c === 'string' ? c : (c.alias || c.title || ''))).join(' , ').toLowerCase();
  const name = (b.name || '').toLowerCase();
  const banned = /\b(hotel|motels?|hostels?|lodging|resorts?|bed\s*&\s*breakfast|b&b|guest\s*house|inns?)\b/;
  return banned.test(asText) || banned.test(name);
}
function isActuallyOpen(b) {
  if (typeof b.open_status === "string") return b.open_status === "open";
  if (typeof b.is_open_now === "boolean") return b.is_open_now;
  if (b.hours && b.hours[0] && typeof b.hours[0].is_open_now === "boolean") return b.hours[0].is_open_now;
  return false;
}

function applyClientFilters(items) {
  let list = [...items].filter(b => !isHotelLike(b));
  if (openNow) list = list.filter(isActuallyOpen);
  if (filterState.highRated) list = list.filter(b => (b.rating || 0) >= 4.5);
  if (filterState.budget) list = list.filter(b => !b.price || b.price.length <= 2);
  if (FLAGS.capTopResults) list = list.slice(0, FLAGS.tenCapCount);
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

function uniqById(items) {
  const map = new Map();
  items.forEach(b => { if (b && b.id && !map.has(b.id)) map.set(b.id, b); });
  return [...map.values()];
}
function buildQuerySet(baseParams) {
  const qs = [];
  const kw = (baseParams.keywords || []).slice(0, 6);
  const catSet = new Set((baseParams.categories || []).slice(0, 5));
  catSet.add('restaurants');
  const catList = [...catSet];
  if (catList.length) qs.push({ categories: catList.join(",") });
  if (kw.length) qs.push({ term: kw.slice(0, 3).join(" ") });
  kw.slice(0, 4).forEach(w => qs.push({ term: w }));
  qs.push({ term: "restaurants" });
  const seen = new Set();
  return qs.filter(q => { const k = q.term ? `t:${q.term}` : `c:${q.categories}`; if (seen.has(k)) return false; seen.add(k); return true; });
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
  if (!all.length && FLAGS.relaxWhenEmpty) {
    const relaxed = { ...base, open_now: false, radius: Math.min(32000, (base.radius || 8000) * 2) };
    const relaxedSet = [...querySet, { term: "food" }, { term: "dinner" }, { term: "lunch" }, { term: "dessert" }];
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

async function doSearch(overrides = {}) {
  readFilters();
  const groupMode = FLAGS.enableGroupMode && !!groupModeChk?.checked;
  const sort_for_group = groupMode ? "rating" : (filterState.nearby ? "distance" : currentSort);
  const base = {
    sort_by: sort_for_group,
    open_now: openNow,
    radius: currentRadius,
    limit: 20,
    price: baseParams?.price,
    transactions: baseParams?.transactions,
    ...overrides
  };

  if (lastGeo) { base.latitude = lastGeo.latitude; base.longitude = lastGeo.longitude; }
  else if (lastLocation) { base.location = lastLocation; }

  showSkeletons();
  try {
    const querySet = buildQuerySet(baseParams || { keywords: ['restaurants'], categories: [] });
    const results = await mergedSearch(base, querySet, 20);
    let filtered = applyClientFilters(results);

    // Cache last results for offline-friendly fallback
    if (FLAGS.cacheLastResults) {
      try { localStorage.setItem(LAST_RESULTS_KEY, JSON.stringify({ ts: Date.now(), results: results })); } catch {}
    }

    // Keep in memory for Share Top 3
    window.__lastBusinesses = filtered;

    renderBusinesses(filtered);
    track("results_shown", { count: filtered.length });
  } catch (e) {
    // Offline-friendly fallback
    const cached = (() => { try { return JSON.parse(localStorage.getItem(LAST_RESULTS_KEY) || "null"); } catch { return null; } })();
    const list = document.getElementById("results-list");
    if (cached?.results?.length) {
      const note = `<div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 mb-2">Network issue. Showing last saved results from this device.</div>`;
      list.innerHTML = note;
      window.__lastBusinesses = cached.results;
      renderBusinesses(applyClientFilters(cached.results));
    } else {
      list.innerHTML = `<div class="p-4 border rounded-xl bg-white text-sm text-red-600">Error: ${e.message} <button id="retry-btn" class="ml-2 underline">Retry</button></div>`;
      document.getElementById("retry-btn")?.addEventListener("click", () => doSearch(overrides));
    }
    track("results_error", { message: String(e && e.message || e) });
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
   RESULTS INIT
============================== */
async function initYelpResults(t0 = performance.now()) {
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

  openNow = !!openChk?.checked;
  openChk?.addEventListener("change", () => { openNow = !!openChk.checked; doSearch(); });

  widenBtn?.addEventListener("click", () => { currentRadius = Math.min(32000, Math.round(currentRadius * 1.5)); doSearch(); });
  hiChk?.addEventListener("change", () => doSearch());
  budChk?.addEventListener("change", () => doSearch());
  nearChk?.addEventListener("change", () => doSearch());

  baseParams = mapAnswersToParams();

  // Try geolocation; fallback to manual
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
  } else {
    const locBox = document.getElementById("location-fallback");
    locBox?.classList.remove("hidden");
    const manualInput = locBox.querySelector("#manual-location");
    const useBtn = locBox.querySelector("#use-location-btn");
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

  const t1 = performance.now();
  track("results_latency_ms", { ms: Math.max(0, Math.round(t1 - t0)) });
}

/* ==============================
   LOADING + SHOW RESULTS
============================== */
function showResults() {
  const qBar = document.getElementById("question-progress");
  if (qBar) { qBar.style.transition = "width 200ms ease-out"; qBar.style.width = "100%"; qBar.parentElement?.setAttribute("aria-valuenow", "100"); }
  quizContainer.classList.add("hidden");

  const sound = document.getElementById("miso-sound");
  sound?.play().catch(() => {});

  loadingContainer.classList.remove("hidden");
  const progressBar = document.getElementById("progress-bar");
  if (progressBar) {
    progressBar.style.transition = "none"; progressBar.style.width = "0%"; void progressBar.offsetWidth;
    progressBar.style.transition = "width 2.2s ease-in-out"; progressBar.style.width = "100%";
  }
  const loadingText = loadingContainer.querySelector("p");
  const loadingEmoji = document.getElementById("loading-emoji");
  let i = 0;
  function stepMsg(){ const {emoji,text}=loadingMessages[i]; if (loadingText) loadingText.textContent=text; if (loadingEmoji) loadingEmoji.textContent=emoji; i=(i+1)%loadingMessages.length; }
  stepMsg();
  const intId = setInterval(stepMsg, 900);

  setTimeout(async () => {
    clearInterval(intId);
    loadingContainer.classList.add("hidden");
    resultContainer.classList.remove("hidden");
    await initYelpResults(performance.now());
  }, 2200);
}

/* ==============================
   RESTART
============================== */
document.getElementById("restart-btn")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  currentQuestion = 0;
  answers = [];
  quizStarted = false;
  firstSatisfyingFired = false;

  document.getElementById("question-progress")?.parentElement?.setAttribute("aria-valuenow", "0");
  document.getElementById("progress-bar")?.parentElement?.setAttribute("aria-valuenow", "0");

  const qBar = document.getElementById("question-progress");
  if (qBar) { qBar.style.transition = "none"; qBar.style.width = "0%"; void qBar.offsetWidth; qBar.style.transition = ""; }
  const lb = document.getElementById("progress-bar");
  if (lb) { lb.style.transition = "none"; lb.style.width = "0%"; void lb.offsetWidth; }

  resultContainer.classList.add("hidden");
  loadingContainer.classList.add("hidden");
  quizContainer.classList.remove("hidden");

  currentSort = "best_match";
  openNow = true;
  document.getElementById("open-now").checked = true;
  currentRadius = 8000;
  lastGeo = null;
  lastLocation = null;
  baseParams = null;
  filterState = { highRated: false, budget: false, nearby: false };

  showQuestion();
  updateQuestionProgress();
});

/* ==============================
   INIT
============================== */
maybeShowFastPath();
showQuestion();
updateQuestionProgress();
