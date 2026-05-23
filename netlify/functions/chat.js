exports.handler = async (event) => {

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://thep2v.com",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  try {

    const body = JSON.parse(event.body);

    const {
      message,
      userLocation,
      nearbyPlaces
    } = body;

    const systemPrompt = `
You are Nomad, an AI travel assistant for The P2V.

You help users:
- discover nearby places
- create itineraries
- recommend attractions
- suggest activities
- provide local insights

Formatting rules:
- Use short sections
- Use bullet points
- Use markdown formatting
- Keep responses mobile-friendly
`;

    const userPrompt = `
USER MESSAGE:
${message}

USER LOCATION:
${JSON.stringify(userLocation)}

NEARBY PLACES:
${JSON.stringify(nearbyPlaces)}
`;

    const response = await fetch(
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
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],

          temperature: 0.7,
          max_tokens: 1000
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content
      || "No response.";

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://thep2v.com",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reply: "test"
      })
    };

  } catch (error) {

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://thep2v.com",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};