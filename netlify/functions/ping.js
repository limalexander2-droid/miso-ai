// netlify/functions/ping.js
export const handler = async () => {
  try {
    const res = await fetch("https://api.github.com/rate_limit");
    const data = await res.json();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ ok: true, limit: data?.resources?.core?.limit })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: e.message })
    };
  }
};
