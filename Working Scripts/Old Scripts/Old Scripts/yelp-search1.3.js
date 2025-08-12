// netlify/functions/yelp-search.js
const API = "https://api.yelp.com/v3";
const SEARCH = `${API}/businesses/search`;

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    if (!process.env.YELP_API_KEY) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Missing YELP_API_KEY in environment" }) };
    }

    const body = JSON.parse(event.body || "{}");
    let {
      latitude,
      longitude,
      location,
      term = "restaurants",
      price,
      radius = 8000,
      open_now = false,
      sort_by = "best_match",
      limit = 20,
    } = body;

    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.set("latitude", String(latitude));
      params.set("longitude", String(longitude));
    } else {
      const safeLocation = (location && String(location).trim()) || "San Antonio, TX";
      params.set("location", safeLocation);
    }
    if (term) params.set("term", term);
    if (radius) params.set("radius", String(radius));
    params.set("limit", String(limit));
    params.set("sort_by", sort_by);
    if (price) params.set("price", price);
    if (open_now === true) params.set("open_now", "true");

    const sRes = await fetch(`${SEARCH}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` },
    });
    if (!sRes.ok) {
      const txt = await sRes.text().catch(() => "");
      return { statusCode: sRes.status, headers: corsHeaders, body: JSON.stringify({ error: txt || "Yelp search failed" }) };
    }
    const sData = await sRes.json();
    const base = Array.isArray(sData.businesses) ? sData.businesses : [];
    if (!base.length) {
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ businesses: [] }) };
    }

    const ids = base.map(b => b.id).slice(0, 30);
    const details = await Promise.all(ids.map(id =>
      fetch(`${API}/businesses/${id}`, { headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` } })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    ));
    const dMap = new Map(details.filter(Boolean).map(d => [d.id, d]));

    const normalized = base.map(b => {
      const d = dMap.get(b.id);
      const hasHours = !!(d && Array.isArray(d.hours) && d.hours[0]);
      const isOpenNow = hasHours ? d.hours[0].is_open_now === true : null;

      let open_status = "unknown";
      if (isOpenNow === true) open_status = "open";
      else if (isOpenNow === false) open_status = "closed";

      const address =
        d?.location?.display_address?.join(", ")
        ?? b.location?.display_address?.join(", ")
        ?? "";
      const phone =
        d?.display_phone
        ?? b.display_phone
        ?? b.phone
        ?? "";

      return {
        id: b.id,
        name: b.name,
        url: b.url,
        image_url: b.image_url,
        rating: b.rating,
        review_count: b.review_count,
        price: b.price,
        categories: (b.categories || []).map(c => c.title),
        distance: b.distance,
        phone,
        address,
        coords: b.coordinates,
        open_status,
        has_hours: hasHours,
      };
    });

    const businesses = open_now ? normalized.filter(n => n.open_status === "open") : normalized;

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ businesses }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
