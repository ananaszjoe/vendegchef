const MAX_BODY_BYTES = 30_000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "";
    const corsHeaders = buildCorsHeaders(origin, allowedOrigin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: originAllowed(origin, allowedOrigin) ? 204 : 403, headers: corsHeaders });
    }

    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);
    if (!originAllowed(origin, allowedOrigin)) return json({ error: "Origin not allowed" }, 403, corsHeaders);

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ error: "Request too large" }, 413, corsHeaders);

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, corsHeaders);
    }

    const validationError = validate(payload);
    if (validationError) return json({ error: validationError }, 400, corsHeaders);

    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields: toAirtableFields(payload) }], typecast: true }),
      },
    );

    if (!airtableResponse.ok) {
      console.error("Airtable error", airtableResponse.status, await airtableResponse.text());
      return json({ error: "Unable to save submission" }, 502, corsHeaders);
    }

    return json({ ok: true }, 201, corsHeaders);
  },
};

function validate(value) {
  if (!value || typeof value !== "object") return "Missing submission";
  if (!/^\S+@\S+\.\S+$/.test(String(value.email || ""))) return "Invalid email";
  if (!value.location || String(value.location).length > 100) return "Invalid location";
  if (Number(value.peopleCount) < 1 || Number(value.peopleCount) > 12) return "Invalid people count";
  if (!value.portionSize || !value.priceBracket || !value.orderFrequency) return "Missing required preference";
  if (!Array.isArray(value.cuisines) || value.cuisines.length === 0) return "Choose a cuisine";
  if (!isRating(value.spiceTolerance)) return "Invalid spice tolerance";
  if (!value.priorities || Object.values(value.priorities).some((rating) => !isRating(rating))) return "Invalid priorities";
  if (value.consent !== true) return "Consent is required";
  return null;
}

function isRating(value) {
  return Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 5;
}

function toAirtableFields(value) {
  return {
    Name: String(value.name || ""),
    Email: String(value.email),
    Location: String(value.location),
    "People count": Number(value.peopleCount),
    "Portion size": String(value.portionSize),
    "Price bracket": String(value.priceBracket),
    "Order frequency": String(value.orderFrequency),
    Cuisines: value.cuisines.map(String),
    "Disliked foods": String(value.dislikedFoods || ""),
    "Allergies and intolerances": String(value.allergies || ""),
    "Spice tolerance": Number(value.spiceTolerance),
    "Ingredient quality": Number(value.priorities.ingredientQuality),
    "Nutrient balance": Number(value.priorities.nutritionBalance),
    "Packaging quality": Number(value.priorities.packagingQuality),
    "Finish-at-home kit": Number(value.priorities.finishAtHomeKit),
    "Menu diversity": Number(value.priorities.menuDiversity),
    "Price importance": Number(value.priorities.price),
    "Delivery convenience": Number(value.priorities.deliveryConvenience),
    Ideas: String(value.ideas || ""),
    Consent: true,
    "Submitted at": String(value.submittedAt || new Date().toISOString()),
    Source: String(value.source || "vendegchef-interest-survey"),
  };
}

function originAllowed(origin, allowedOrigin) {
  return Boolean(origin && allowedOrigin && origin === allowedOrigin);
}

function buildCorsHeaders(origin, allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": originAllowed(origin, allowedOrigin) ? origin : allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}
