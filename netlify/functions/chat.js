exports.handler = async (event) => {

  // CORS support
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  try {

    const { messages } = JSON.parse(event.body);

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
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,

      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },

      body: JSON.stringify(data)
    };

  } catch (error) {

    return {
      statusCode: 500,

      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        error: error.message
      })
    };
  }
};