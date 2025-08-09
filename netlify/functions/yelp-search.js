import fetch from "node-fetch";

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
    const {
      latitude,
      longitude,
      location,
      term = "restaurants",
      price,
      radius = 8000,
      open_now = true,
      sort_by = "best_match",
      transactions = []
    } = JSON.parse(event.body || "{}");

    if (!process.env.YELP_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing YELP_API_KEY in environment" }) };
    }

    const buildParams = (overrides = {}) => {
      const p = new URLSearchParams();
      if (location && !latitude && !longitude) p.set("location", location);
      if (latitude && longitude) {
        p.set("latitude", String(latitude));
        p.set("longitude", String(longitude));
      }
      p.set("term", overrides.term ?? term);
      p.set("radius", String(overrides.radius ?? radius));
      p.set("limit", "20");
      p.set("sort_by", overrides.sort_by ?? sort_by);
      if (price || overrides.price) p.set("price", overrides.price ?? price);
      if (open_now !== undefined) p.set("open_now", String(overrides.open_now ?? open_now));
      if (transactions?.length) p.set("transactions", transactions.join(","));
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

    // First try
    let data = await doFetch(buildParams());

    // If no results, widen search
    if (!data?.businesses?.length) {
      data = await doFetch(buildParams({
        radius: Math.min(16000, radius * 2 || 8000),
        price: undefined
      }));
    }

    // If still no results, broad fallback
    if (!data?.businesses?.length) {
      data = await doFetch(buildParams({
        term: "restaurants",
        radius: Math.min(16000, radius * 2 || 8000),
        price: undefined
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
