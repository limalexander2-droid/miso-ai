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
   PROGRESS BAR
============================== */
function updateQuestionProgress() {
  const bar = document.getElementById("question-progress");
  if (!bar) return;
  const percent = Math.min(100, Math.round((currentQuestion / questions.length) * 100));
  bar.style.width = `${percent}%`;
  bar.parentElement?.setAttribute("aria-valuenow", String(percent));
}

/* ==============================
   QUESTIONS
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
   MAPPING DATA
============================== */
const cravingMap = {
  "Spicy": [
    "spicy","thai","korean","sichuan","indian","mexican","cajun","creole",
    "jamaican","jerk chicken","caribbean","hot chicken","malaysian","indonesian",
    "chinese hot pot","buffalo wings","peruvian aji","ethiopian"
  ],
  "Sweet": [
    "dessert","bakery","ice cream","donuts","cookies","cakes","cupcakes","pies",
    "pastry","macarons","churros","gelato","milk tea","bubble tea","milkshakes",
    "pudding","chocolate"
  ],
  "Hot and hearty": [
    "ramen","pho","bbq","stew","noodles","burgers","lasagna","meatloaf",
    "fried chicken","chili","hot pot","curry","beef stew","gnocchi","baked pasta","gumbo"
  ],
  "Fresh and light": [
    "salad","poke","mediterranean","sushi","spring rolls","grilled fish",
    "ceviche","caprese","hummus","wraps","grain bowl","greek salad",
    "fresh juice","smoothie bar"
  ],
  "No specific craving": []
};
const moodMap = {
  "Energized / healthy": [
    "healthy","salad","grain bowls","poke","mediterranean","greek","vegan",
    "vegetarian","gluten free","wraps","smoothie","juice bar","lean protein","grill","buddha bowl"
  ],
  "Cozy / comfort food": [
    "comfort food","diner","bbq","mac and cheese","fried chicken","mashed potatoes",
    "pot pie","ramen","grilled cheese","biscuits and gravy","shepherd's pie","pancakes","waffles"
  ],
  "Indulgent / treat yourself": [
    "dessert","ice cream","cake","steakhouse","lobster","seafood","chocolate",
    "pastry","donuts","milkshake","cheesecake","truffle","fondue","fine dining"
  ],
  "Adventurous": [
    "ethiopian","peruvian","filipino","mongolian","laotian","pakistani","nepalese",
    "afghan","argentinian","brazilian","moroccan","syrian","tapas","fusion cuisine","food truck"
  ],
  "Chill / no strong cravings": ["restaurants"]
};
const dietMap = {
  "Weight loss / low-cal": ["healthy","salad"],
  "Vegetarian / Vegan": ["vegetarian","vegan"],
  "Gluten-Free": ["gluten free"],
  "Low-Carb / Keto": ["keto","grill","protein"],
  "High-Protein": ["grill","protein","bowl"],
  "No restrictions": []
};
const occasionMap = {
  "Just a regular meal": [],
  "Quick lunch break": ["fast casual","counter service","grab and go"],
  "Date night": ["romantic","wine bar","italian"],
  "Post-workout": ["protein","bowl","grill"],
  "Comfort after a long day": ["comfort food","noodles","soup"],
  "Celebration": ["steakhouse","seafood","cocktail bar","fine dining"]
};

/* ==============================
   MAPPING FUNCTION
============================== */
function mapAnswersToYelp(answers) {
  const get = (q) => answers.find(a => a.question.startsWith(q))?.answer || "";
  const mood = get("What’s your current mood?");
  const craving = get("Are you craving anything specific?");
  const diet = get("Any dietary goals or restrictions?");
  const occasion = get("Any special occasion or vibe?");
  const eatMethod = get("How would you like to eat today?");
  const budget = get("How much are you looking to spend?");
  const distance = get("How far are you willing to go?");

  const parts = [
    ...(moodMap[mood] || []),
    ...(cravingMap[craving] || []),
    ...(dietMap[diet] || []),
    ...(occasionMap[occasion] || [])
  ].filter(Boolean);

  const price = {
    "Under $10": "1",
    "$10–$20": "1,2",
    "$20–$40": "2,3",
    "Money’s not a concern": "3,4"
  }[budget] || "1,2,3";

  const radius = {
    "Walking distance": 1200,
    "Short drive (under 10 mins)": 3200,
    "15–30 mins": 10000,
    "I'll go anywhere": 16000
  }[distance] || 8000;

  const transactions = [];
  if (eatMethod === "Delivery") transactions.push("delivery");
  if (eatMethod === "Takeout" || eatMethod === "Drive-thru") transactions.push("pickup");

  let sort_by = "best_match";
  if (occasion === "Date night" || occasion === "Celebration") sort_by = "rating";
  if (occasion === "Quick lunch break") sort_by = "distance";

  const term = (parts.length ? [...new Set(parts)] : ["restaurants"])
  .slice(0, 6) // limit to first 6 keywords to keep search focused
  .join(" ");
  const negativeHints = [];
  if (mood === "Energized / healthy" || diet !== "No restrictions") {
    negativeHints.push("fast food","fried chicken","donut","ice cream","burger");
  }
  return { term, price, radius, open_now: true, sort_by, transactions, negativeHints };
}

/* ==============================
   NEGATIVE HINT PRIORITY
============================== */
function prioritizeMatches(businesses = [], negativeHints = []) {
  if (!negativeHints?.length) return businesses;
  const bad = (s="") => negativeHints.some(h => s.toLowerCase().includes(h));
  return businesses
    .map(b => {
      const hay = [
        b.name,
        b.categories?.join(" "),
        b.address || ""
      ].join(" ").toLowerCase();
      return { b, penalty: bad(hay) ? 1 : 0 };
    })
    .sort((a, z) => a.penalty - z.penalty)
    .map(x => x.b);
}

/* ==============================
   QUIZ LOGIC
============================== */
function showQuestion() {
  resultContainer.classList.add("hidden");
  quizContainer.classList.remove("hidden");
  document.getElementById("progress-indicator").textContent =
    `Question ${currentQuestion + 1} of ${questions.length}`;
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
  if (currentQuestion < questions.length) showQuestion();
  else showResults();
}

/* ==============================
   GEOLOCATION
============================== */
function getUserLocationOrPrompt() {
  return new Promise((resolve) => {
    const ask = (msg = "Enter your city or ZIP to find restaurants nearby:") => {
      const val = prompt(msg);
      if (val && val.trim().length >= 3) {
        resolve({ location: val.trim() });
      } else {
        // Fallback default so we never send an empty location
        resolve({ location: "San Antonio, TX" }); // <- change to your area if you want
      }
    };

    if (!navigator.geolocation) return ask();

    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => ask(), // on deny/fail, ask for city/ZIP
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  });
}


/* ==============================
   RENDER RESTAURANTS
============================== */
function renderRestaurants(biz = []) {
  const host = document.getElementById("restaurant-results");
  if (!host) return;
  if (!biz.length) {
    host.innerHTML = `<div class="p-4 border rounded-xl bg-white text-gray-600">No matches found.</div>`;
    return;
  }
  host.innerHTML = biz.map(b => {
    const miles = b.distance ? (b.distance / 1609.34).toFixed(1) + " mi" : "";
    const cats = b.categories?.slice(0,3).join(" • ") || "";
    const open = b.is_closed ? "Closed" : "Open now";
    const price = b.price || "";
    const img = b.image_url || "https://via.placeholder.com/600x400?text=Food";
    const gmaps = b.coords?.latitude && b.coords?.longitude
      ? `https://www.google.com/maps?q=${b.coords.latitude},${b.coords.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + " " + (b.address||""))}`;
    return `
      <article class="flex gap-3 p-3 border rounded-xl bg-white shadow-sm">
        <img src="${img}" alt="${b.name}" class="w-24 h-24 object-cover rounded-lg">
        <div class="flex-1 text-left">
          <h3 class="text-lg font-semibold">${b.name}</h3>
          <div class="text-sm text-gray-600">
            <span>${b.rating ?? "–"}★</span> • <span>${price}</span> • <span>${cats}</span>
            ${miles ? ` • <span>${miles}</span>` : ""} • <span class="${b.is_closed ? "text-red-600" : "text-green-600"}">${open}</span>
          </div>
          <div class="text-xs text-gray-500 truncate">${b.address || ""}</div>
          <div class="mt-2 flex gap-2">
            <a href="${b.url}" target="_blank" class="text-white text-xs font-semibold py-1 px-3 rounded-lg" style="background-color: var(--miso-accent);">View on Yelp</a>
            <a href="${gmaps}" target="_blank" class="text-rose-700 text-xs font-semibold py-1 px-3 rounded-lg border">Directions</a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

/* ==============================
   SHOW RESULTS
============================== */
async function showResults() {
  // Finish quiz progress
  const qBar = document.getElementById("question-progress");
  if (qBar) {
    qBar.style.width = "100%";
    qBar.parentElement?.setAttribute("aria-valuenow", "100");
  }

  // Show loading screen + play sound
  quizContainer.classList.add("hidden");
  document.getElementById("miso-sound")?.play().catch(() => {});
  loadingContainer.classList.remove("hidden");
  const progressBar = document.getElementById("progress-bar");
  if (progressBar) progressBar.style.width = "100%";

  // Animated loading text/emoji
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
  const messageInterval = setInterval(updateLoadingMessage, 800);

  // Compose Yelp payload
  const yelpParams = mapAnswersToYelp(answers);
  const loc = await getUserLocationOrPrompt();
  const payload = { ...yelpParams, ...loc };

  // Fire Yelp request in background
  const fetchPromise = fetch("/.netlify/functions/yelp-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then((res) => res.json())
    .then((data) => data.businesses || [])
    .catch(() => []);

  // Wait ~2.8s for UX, then reveal results
  setTimeout(async () => {
    clearInterval(messageInterval);
    loadingContainer.classList.add("hidden");
    resultContainer.classList.remove("hidden");

    // 🔁 Force results header/subtitle (replace the loading copy)
    const h2 = resultContainer.querySelector("h2");
    const sub = resultContainer.querySelector("p");
    if (h2) h2.textContent = "Here are your matches";
    if (sub) sub.textContent = "Based on your picks and location.";

    // 📋 Show or hide the selected-answers summary
    const display = document.getElementById("results-display");
    if (display) {
      if (typeof SHOW_ANSWER_SUMMARY !== "undefined" && SHOW_ANSWER_SUMMARY) {
        display.classList.remove("hidden");
        display.innerHTML = answers
          .map(a => `<p><strong>${a.question}</strong><br><span class="text-rose-600">→ ${a.answer}</span></p>`)
          .join("<hr class='my-2' />");
        display.scrollTop = 0;
      } else {
        display.classList.add("hidden");
        display.innerHTML = "";
      }
    }

    // Render businesses
    const businesses = await fetchPromise;
    renderRestaurants(prioritizeMatches(businesses, yelpParams.negativeHints));
  }, 2800);
}


/* ==============================
   RESTART
============================== */
document.getElementById("restart-btn")?.addEventListener("click", () => {
  currentQuestion = 0; answers = [];
  resultContainer.classList.add("hidden");
  loadingContainer.classList.add("hidden");
  quizContainer.classList.remove("hidden");
  showQuestion();
  updateQuestionProgress();
});

/* ==============================
   INIT
============================== */
showQuestion();
updateQuestionProgress();
