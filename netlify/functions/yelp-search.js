// Netlify function: /.netlify/functions/yelp-search
// Minimal proxy to Yelp Fusion (or your chosen API).
// - Normalizes hours info into { open_status, has_hours }
// - Filters out lodging/hotel categories (defense-in-depth)
// - Caps to 10 results client-aligned
//
// Set YELP_API_KEY in Netlify env.

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
    const body = JSON.parse(event.body || "{}");
    const {
      term, categories, location, latitude, longitude, radius = 8000,
      price, sort_by = "best_match", open_now = true, limit = 20, transactions
    } = body;

    const params = new URLSearchParams();
    if (term) params.set("term", String(term));
    if (categories) params.set("categories", String(categories));
    if (location) params.set("location", String(location));
    if (latitude && longitude) { params.set("latitude", String(latitude)); params.set("longitude", String(longitude)); }
    if (radius) params.set("radius", Math.min(Number(radius), 40000));
    if (price) params.set("price", String(price));
    if (sort_by) params.set("sort_by", String(sort_by));
    if (open_now) params.set("open_now", "true");
    if (transactions && Array.isArray(transactions) && transactions.length) params.set("attributes", transactions.join(","));
    params.set("limit", String(Math.min(Number(limit) || 20, 50)));

    const resp = await fetch(`https://api.yelp.com/v3/businesses/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` }
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return { statusCode: resp.status, body: txt };
    }
    const data = await resp.json();

    // Normalize + filter
    const banned = /\b(hotel|motels?|hostels?|lodging|resorts?|bed\s*&\s*breakfast|b&b|guest\s*house|inns?)\b/i;
    const businesses = (data.businesses || []).map((b) => {
      const has_hours = Array.isArray(b.hours) || typeof b.is_closed === "boolean";
      const open_status = typeof b.is_closed === "boolean" ? (b.is_closed ? "closed" : "open") :
        (b.hours && b.hours[0] && typeof b.hours[0].is_open_now === "boolean" ? (b.hours[0].is_open_now ? "open" : "closed") : "unknown");
      const address = (b.location && (b.location.address1 || b.location.display_address?.join(", "))) || "";
      return {
        id: b.id, name: b.name, url: b.url,
        rating: b.rating, review_count: b.review_count,
        price: b.price, phone: b.display_phone || b.phone,
        distance: b.distance, image_url: b.image_url,
        categories: b.categories,
        coordinates: b.coordinates,
        address,
        is_open_now: b.hours?.[0]?.is_open_now ?? !b.is_closed,
        open_status, has_hours
      };
    }).filter(b => {
      const catText = (b.categories || []).map(c => (c.alias || c.title || "")).join(" , ").toLowerCase();
      const name = (b.name || "").toLowerCase();
      return !(banned.test(catText) || banned.test(name));
    });

    // Cap to 10 as a safety net
    const capped = businesses.slice(0, 10);

    return { statusCode: 200, body: JSON.stringify({ businesses: capped }) };
  } catch (err) {
    return { statusCode: 500, body: String(err && err.message || err) };
  }
};
