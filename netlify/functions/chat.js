exports.handler = async (event) => {

  // ── CORS headers (applied to every response) ──────────────────────────────
  const CORS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: "Method not allowed" };
  }

  try {

    const { message, userLocation, nearbyPlaces } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing message" })
      };
    }

    const systemPrompt = `You are Nomad, The P2V AI Travel Assistant.

You are an intelligent travel guide, not just a database search tool.

RESPONSIBILITIES:
- Recommend nearby attractions, activities, food, nightlife, shopping, nature spots, culture, and entertainment
- Create itineraries and suggest hidden gems
- Use real-world travel knowledge alongside The P2V database

RULES:
- Do NOT limit recommendations only to provided database places
- Recommend famous or relevant places outside the database when helpful
- Prioritize answering the user's actual intent naturally
- Add local insights and practical travel suggestions

STRICT FORMAT (follow exactly):
- Use ## for section headings
- Use * for bullet points
- Use **bold** for place names and key highlights
- Short paragraphs only (2-3 sentences max)
- Never use numbered lists
- Never use markdown tables or code blocks
- Never use nested bullets
- Maximum 5 bullets per section
- Keep responses compact and mobile-friendly

Avoid sounding robotic, repeating places, or generating walls of text.`;

    const userPrompt = `USER QUESTION: ${message}

USER LOCATION: ${JSON.stringify(userLocation)}

Nearby places from The P2V database (optional context):
${JSON.stringify(nearbyPlaces?.slice(0, 10))}`;

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt   }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      }
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", groqRes.status, errText);
      throw new Error(`Groq API returned ${groqRes.status}`);
    }

    const data  = await groqRes.json();
    // ✅ Use the actual reply, not hardcoded "test"
    const reply = data?.choices?.[0]?.message?.content || "No response.";

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      // ✅ Field is "summary" — matches what nomad/index.html reads
      body: JSON.stringify({ summary: reply })
    };

  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
};