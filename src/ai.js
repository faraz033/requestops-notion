// AI is used for exactly one thing: filling in eventName / eventDate / venue
// when a student leaves those blank and just writes free text instead.
// If the structured fields are already filled, no AI call happens at all --
// "if an if statement could have done it, an if statement should have done it."

const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_URL = process.env.AI_API_URL;
const AI_MODEL = process.env.AI_MODEL;

function looksMessy({ eventName, eventDate, venue, description }) {
  const structuredFilled = eventName && eventDate && venue;
  const hasFreeText = description && description.trim().length > 15;
  return !structuredFilled && hasFreeText;
}

async function extractFieldsFromText(description) {
  if (!AI_API_KEY) {
    console.log("[ai] AI_API_KEY not set — skipping extraction.");
    return null;
  }

  const prompt = `Extract event-permission request details from this student message.
Return ONLY valid JSON, no prose, no markdown fences, matching exactly this shape:
{"eventName": string, "eventDate": string (YYYY-MM-DD, best guess if unclear), "venue": string}

Message:
"""${description}"""`;

  try {
    // Groq uses an OpenAI-compatible API shape -- different from Anthropic's,
    // so the request/response format here is specific to Groq.
    const res = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.error("[ai] extraction call failed:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;

    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[ai] extraction failed:", err.message);
    return null;
  }
}

module.exports = { looksMessy, extractFieldsFromText };