// netlify/functions/yelp-details.js
// Fetches fresh hours/status for a Yelp business by ID.
// Requires an environment variable: YELP_API_KEY

export async function handler(event) {
  try {
    // CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: corsHeaders()
      };
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method Not Allowed" });
    }

    const key = process.env.YELP_API_KEY;
    if (!key) {
      return json(500, { error: "Missing YELP_API_KEY env var" });
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const id = (body && body.id) ? String(body.id) : "";
    if (!id) return json(400, { error: "Missing 'id' in body" });

    const url = `https://api.yelp.com/v3/businesses/${encodeURIComponent(id)}`;
    const resp = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${key}`,
        "Accept": "application/json"
      }
    });

    // Yelp returns 404 for unknown IDs
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return json(resp.status, { error: "Yelp error", details: text });
    }

    const data = await resp.json();

    // Return only the fields we actually need, but include all for debugging
    return json(200, {
      id: data.id,
      name: data.name,
      is_closed: data.is_closed,
      is_open_now: (Array.isArray(data.hours) && data.hours[0]) ? data.hours[0].is_open_now : undefined,
      hours: data.hours || null,
      raw: data // keep raw for debugging, remove if you prefer
    });
  } catch (e) {
    return json(500, { error: "Unhandled error", details: String(e && e.message || e) });
  }
}

// --- helpers ---
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    },
    body: JSON.stringify(obj)
  };
}
