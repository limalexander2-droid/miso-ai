// netlify/functions/yelp-search.js
const YELP_API = "https://api.yelp.com/v3/businesses/search";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    let {
      latitude,
      longitude,
      location,
      term = "restaurants",
      price,
      radius = 8000,
      open_now = true,
      sort_by = "best_match",
      transactions = []
    } = body;

    if (!process.env.YELP_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing YELP_API_KEY in environment" }) };
    }

    // Always ensure we have *some* usable location
    const safeLocation =
      (location && String(location).trim()) ||
      (latitude && longitude ? null : "San Antonio, TX"); // change default if you want

    const buildParams = (overrides = {}) => {
      const p = new URLSearchParams();

      // location handling
      if (latitude && longitude) {
        p.set("latitude", String(latitude));
        p.set("longitude", String(longitude));
      } else {
        p.set("location", overrides.location ?? safeLocation);
      }

      // core search fields
      p.set("term", overrides.term ?? term);
      p.set("radius", String(overrides.radius ?? radius));
      p.set("limit", String(overrides.limit ?? 20));
      p.set("sort_by", overrides.sort_by ?? sort_by);

      // optional filters
      const usePrice = overrides.hasOwnProperty("price") ? overrides.price : price;
      if (usePrice) p.set("price", usePrice);

      const useOpen = overrides.hasOwnProperty("open_now") ? overrides.open_now : open_now;
      if (typeof useOpen === "boolean") p.set("open_now", String(useOpen));

      const useTx = overrides.hasOwnProperty("includeTransactions") ? overrides.includeTransactions : true;
      if (useTx && transactions?.length) p.set("transactions", transactions.join(","));

      return p.toString();
    };

    const doFetch = async (qs) => {
      const res = await fetch(`${YELP_API}?${qs}`, {
        headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` }
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Yelp error ${res.status}: ${txt || res.statusText}`);
      }
      return res.json();
    };

    // First try: user's exact filters
    let data = await doFetch(buildParams());

    // Fallback 1: widen radius, DROP price/open_now/transactions
    if (!data?.businesses?.length) {
      data = await doFetch(buildParams({
        radius: Math.min(16000, (radius || 8000) * 2),
        price: undefined,
        open_now: undefined,
        includeTransactions: false,
        sort_by // keep same sort preference
      }));
    }

    // Fallback 2: very broad term + wide radius, no hard filters
    if (!data?.businesses?.length) {
      data = await doFetch(buildParams({
        term: "restaurants",
        radius: Math.min(16000, (radius || 8000) * 2),
        price: undefined,
        open_now: undefined,
        includeTransactions: false
      }));
    }

    const businesses = (data.businesses || []).map(b => ({
      id: b.id,
      name: b.name,
      url: b.url,
      image_url: b.image_url,
      rating: b.rating,
      review_count: b.review_count,
      price: b.price,
      categories: (b.categories || []).map(c => c.title),
      distance: b.distance,
      is_closed: b.is_closed,
      phone: b.display_phone,
      address: b.location?.display_address?.join(", "),
      coords: b.coordinates
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ businesses }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
