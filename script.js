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
  bar.parentElement?.setAttribute("aria-valuenow", String(percent));
}

// Quiz Questions
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

function showQuestion() {
  resultContainer.classList.add("hidden");
  document.getElementById("resultsRoot")?.classList.add("hidden"); // keep wrapper hidden during quiz
  quizContainer.classList.remove("hidden");

  const progressIndicator = document.getElementById("progress-indicator");
  progressIndicator.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;

  const question = questions[currentQuestion];
  container.innerHTML = `<div class="card fade-in"><div class="question">${question.question}</div></div>`;
  answerButtons.innerHTML = "";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.innerText = option;
    button.className = `bg-white text-gray-700 text-sm sm:text-base px-4 py-2 sm:px-5 sm:py-3 rounded-xl shadow-sm border border-gray-200
      hover:bg-rose-100 hover:text-rose-700 transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2`;
    button.addEventListener("click", () => selectAnswer(option));
    answerButtons.appendChild(button);
  });

  updateQuestionProgress();
}

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

function buildYelpParams(answers) {
  const params = { term: "restaurants", radius: 8000, open_now: true, sort_by: "best_match", limit: 20 };
  const timeAns = answers.find(a => a.question.startsWith("How much time"));
  if (timeAns) {
    if (timeAns.answer.includes("Less than 15")) params.radius = 2000;
    else if (timeAns.answer.includes("About 30")) params.radius = 5000;
  }
  const priceAns = answers.find(a => a.question.startsWith("How much are you looking"));
  if (priceAns) {
    if (priceAns.answer.includes("Under $10")) params.price = "1";
    else if (priceAns.answer.includes("$10–$20")) params.price = "1,2";
    else if (priceAns.answer.includes("$20–$40")) params.price = "2,3";
    else params.price = "2,3,4";
  }
  const craveAns = answers.find(a => a.question.startsWith("Are you craving"));
  if (craveAns) {
    const map = {
      "Spicy": ["spicy", "thai", "sichuan", "hot chicken", "tacos"],
      "Sweet": ["dessert", "ice cream", "frozen yogurt", "gelato", "bakery"],
      "Hot and hearty": ["ramen", "barbecue", "burgers", "pasta"],
      "Fresh and light": ["salad", "poke", "mediterranean", "sushi"],
      "No specific craving": ["restaurants"]
    };
    params.term = (map[craveAns.answer] || ["restaurants"]).join(", ");
  }
  const dietAns = answers.find(a => a.question.startsWith("Any dietary goals"));
  if (dietAns) {
    if (dietAns.answer.includes("Vegetarian")) params.term += ", vegetarian, vegan";
    if (dietAns.answer.includes("Gluten-Free")) params.term += ", gluten-free";
    if (dietAns.answer.includes("Low-Carb")) params.term += ", keto";
    if (dietAns.answer.includes("High-Protein")) params.term += ", steakhouse, grill";
    if (dietAns.answer.includes("Weight")) params.term += ", healthy";
  }
  const methodAns = answers.find(a => a.question.startsWith("How would you like to eat"));
  if (methodAns && methodAns.answer.includes("Drive-thru")) params.term += ", drive-thru";
  return params;
}

function getGeolocation(timeoutMs = 3000) {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    let done = false;
    const timer = setTimeout(() => { if (!done) resolve(null); }, timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => { done = true; clearTimeout(timer); resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); },
      () => { done = true; clearTimeout(timer); resolve(null); },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: timeoutMs }
    );
  });
}

let lastGeo = null;
let lastBaseParams = null;
let lastLocationLabel = null;

function collectActivePriceFilters() {
  const buttons = Array.from(document.querySelectorAll('.filter-price.active'));
  const vals = buttons.map(b => b.getAttribute('data-price'));
  return vals.length ? vals.join(',') : undefined;
}

function applyFilterButtonStyles() {
  document.querySelectorAll('.filter-price').forEach(btn => {
    if (btn.classList.contains('active')) {
      btn.classList.add('bg-rose-50', 'text-rose-700', 'border-rose-200');
    } else {
      btn.classList.remove('bg-rose-50', 'text-rose-700', 'border-rose-200');
    }
  });
}

async function refetchWithFilters() {
  if (!lastBaseParams) return;
  const openNow = document.getElementById('filter-open')?.checked || false;
  const sortBy = document.getElementById('filter-sort')?.value || 'best_match';
  const radiusSel = parseInt(document.getElementById('filter-radius')?.value || '8000', 10);
  const priceSel = collectActivePriceFilters();

  const body = { ...lastBaseParams, open_now: openNow, sort_by: sortBy, radius: radiusSel };
  if (priceSel) body.price = priceSel;
  if (lastGeo) Object.assign(body, lastGeo); else body.location = lastBaseParams.location || 'San Angelo, TX';

  const display = document.getElementById("results-display");
  if (display) display.innerHTML = '<div class="text-gray-600">Updating results…</div>';

  try {
    const res = await fetch("/.netlify/functions/yelp-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    renderYelpResults(data.businesses || [], lastLocationLabel);
  } catch (e) {
    if (display) display.innerHTML = '<div class="text-red-700">Error refreshing results.</div>';
  }
}

function renderYelpResults(list, where) {
  const display = document.getElementById("results-display");
  if (!display) return;

  if (!Array.isArray(list) || list.length === 0) {
    display.innerHTML = `
      <div class="text-center">
        <p class="mb-2">No matching places found ${where ? `near <strong>${where}</strong>` : "near you"}.</p>
        <p class="text-sm text-gray-600">Try widening the distance, loosening price limits, or picking a different craving.</p>
      </div>`;
    return;
  }

  display.innerHTML = list.map(b => {
    const miles = typeof b.distance === "number" ? (b.distance / 1609.34).toFixed(1) + " mi" : "";
    const cat = (b.categories || []).slice(0, 3).join(", ");
    const price = b.price ? ` • ${b.price}` : "";
    const statusBadge =
      b.open_status === "open" ? `<span class="text-green-700 bg-green-100 text-xs px-2 py-1 rounded-md">Open now</span>` :
      b.open_status === "closed" ? `<span class="text-red-700 bg-red-100 text-xs px-2 py-1 rounded-md">Closed</span>` :
      (b.has_hours ? `<span class="text-blue-700 bg-blue-100 text-xs px-2 py-1 rounded-md">Hours available</span>` :
                     `<span class="text-gray-700 bg-gray-100 text-xs px-2 py-1 rounded-md">Hours not listed</span>`);

    const callBtn = b.phone ? `<a href="tel:${b.phone.replace(/[^+\d]/g,'')}" class="inline-block text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Call</a>` : "";

    return `
      <article class="restaurant-card flex items-start gap-3 p-3 mb-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div class="card-image flex-shrink-0">
          <img src="${b.image_url || ''}" alt="" class="w-20 h-20 object-cover rounded-lg bg-gray-100" onerror="this.style.display='none'"/>
        </div>
        <div class="card-text flex-1 min-w-0 text-sm">
          <div class="flex items-start justify-between gap-2">
            <a href="${b.url}" target="_blank" rel="noopener" class="font-semibold text-rose-700 hover:underline leading-tight break-words">${b.name}</a>
            <div class="card-actions flex flex-wrap items-center gap-2 flex-shrink-0 self-start">
              ${statusBadge}
              ${callBtn}
            </div>
          </div>
          <div class="card-meta text-gray-600">${cat}${price}${miles ? ` • ${miles}` : ""}</div>
          <div class="card-address text-gray-700">${b.address || ""}</div>
          <div class="text-gray-700">${(b.rating ?? "–")}★ (${b.review_count ?? 0} reviews)</div>
        </div>
      </article>`;
  }).join("");
}

async function showResults() {
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
    if (window.loadingAriaInterval) { clearInterval(window.loadingAriaInterval); window.loadingAriaInterval = null; }
    window.loadingAriaInterval = setInterval(() => {
      const pct = Math.min(100, Math.round((performance.now() - start) / duration * 100));
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

  const yelpParams = buildYelpParams(answers);
  lastBaseParams = { ...yelpParams };

  let geo = null;
  try { geo = await Promise.race([getGeolocation(2000), new Promise(res => setTimeout(() => res(null), 2000))]); } catch (_) { geo = null; }

  const body = { ...yelpParams, ...(geo ? { latitude: geo.latitude, longitude: geo.longitude } : { location: "San Angelo, TX" }) };

  let apiResult = { businesses: [] };
  try {
    const res = await fetch("/.netlify/functions/yelp-search", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    apiResult = await res.json();
  } catch (err) {
    apiResult = { error: String(err), businesses: [] };
  }

  setTimeout(() => {
    if (window.messageInterval) { clearInterval(window.messageInterval); window.messageInterval = null; }
    loadingContainer.classList.add("hidden");
    document.getElementById("resultsRoot")?.classList.remove("hidden"); // ← show wrapper
    resultContainer.classList.remove("hidden");                         // ← show inner section

    const filterBar = document.getElementById("filters");
    if (filterBar) filterBar.classList.remove("hidden");

    lastGeo = geo;
    lastLocationLabel = geo ? "your location" : "San Angelo, TX";

    const priceButtons = document.querySelectorAll(".filter-price");
    priceButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        btn.classList.toggle("active");
        applyFilterButtonStyles();
        refetchWithFilters();
      });
    });
    document.getElementById("filter-price-clear")?.addEventListener("click", () => {
      document.querySelectorAll(".filter-price.active").forEach(b => b.classList.remove("active"));
      applyFilterButtonStyles();
      refetchWithFilters();
    });
    document.getElementById("filter-open")?.addEventListener("change", refetchWithFilters);
    document.getElementById("filter-sort")?.addEventListener("change", refetchWithFilters);
    document.getElementById("filter-radius")?.addEventListener("change", refetchWithFilters);

    const display = document.getElementById("results-display");
    if (!display) return;

    if (apiResult && apiResult.error) {
      display.innerHTML = `
        <div class="text-left text-sm bg-white p-4 rounded-xl shadow-inner border border-red-200">
          <p class="text-red-700 font-medium mb-1">We couldn’t fetch live results.</p>
          <pre class="whitespace-pre-wrap text-xs text-gray-700">${apiResult.error}</pre>
          <p class="text-gray-600 mt-2">Tip: ensure your Netlify function is deployed and YELP_API_KEY is set.</p>
        </div>`;
      return;
    }
    const where = geo ? "your location" : "San Angelo, TX";
    renderYelpResults(apiResult.businesses || [], where);
  }, 2800);
}

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

    document.getElementById("resultsRoot")?.classList.add("hidden"); // ← hide wrapper again
    resultContainer.classList.add("hidden");
    loadingContainer.classList.add("hidden");
    quizContainer.classList.remove("hidden");

    showQuestion();
    updateQuestionProgress();

    const progressIndicator = document.getElementById("progress-indicator");
    if (progressIndicator) progressIndicator.textContent = `Question 1 of ${questions.length}`;
  });
}

showQuestion();
updateQuestionProgress();
