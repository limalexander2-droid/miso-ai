// ESM Netlify Function: /.netlify/functions/yelp-search.js
// Works when your repo's package.json has "type": "module" (default on many setups).
// Uses Node 18+ global fetch; no node-fetch import required.

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const {
      term, categories, location, latitude, longitude,
      radius = 8000, price, sort_by = "best_match",
      open_now = true, transactions, limit = 20
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
    if (Array.isArray(transactions) && transactions.length) params.set("attributes", transactions.join(","));
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
      const address = (b.location && (b.location.address1 || b.location.display_address?.join(", "))) || "";
      const is_open_now = b.hours?.[0]?.is_open_now ?? !b.is_closed;
      const open_status = typeof b.is_closed === "boolean"
        ? (b.is_closed ? "closed" : "open")
        : (typeof is_open_now === "boolean" ? (is_open_now ? "open" : "closed") : "unknown");
      const has_hours = Array.isArray(b.hours) || typeof b.is_closed === "boolean";

      return {
        id: b.id, name: b.name, url: b.url,
        rating: b.rating, review_count: b.review_count,
        price: b.price, phone: b.display_phone || b.phone,
        distance: b.distance, image_url: b.image_url,
        categories: b.categories, coordinates: b.coordinates,
        address, is_open_now, open_status, has_hours
      };
    }).filter(b => {
      const catText = (b.categories || []).map(c => (c.alias || c.title || "")).join(" , ").toLowerCase();
      const name = (b.name || "").toLowerCase();
      return !(banned.test(catText) || banned.test(name));
    });

    // Safety cap to 10
    return { statusCode: 200, body: JSON.stringify({ businesses: businesses.slice(0, 10) }) };
  } catch (err) {
    return { statusCode: 500, body: String(err && err.message || err) };
  }
}
