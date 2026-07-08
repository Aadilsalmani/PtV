const GEMINI_MODEL = "gemini-2.5-flash";

exports.handler = async function (event) {

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({
                error: "Only POST requests are allowed."
            })
        };
    }

    try {

        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Prompt is required."
                })
            };
        }

        const systemPrompt = `
You are Ainment AI.

Recommend real movies and TV series only.

Return ONLY valid JSON.

Return exactly this format:

{
  "recommendations":[
    {
      "title":"",
      "type":"",
      "year":"",
      "reason":""
    }
  ]
}

Rules:

- Recommend 5 titles.
- Never invent movies.
- Keep reasons under 40 words.
- No markdown.
- No extra text.
`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({

                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],

                    system_instruction: {
                        parts: [
                            {
                                text: systemPrompt
                            }
                        ]
                    }

                })
            }
        );

        const data = await response.json();

        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return {

            statusCode: 200,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                response: text
            })

        };

    }

    catch (err) {

        return {

            statusCode: 500,

            body: JSON.stringify({

                error: err.message

            })

        };

    }

};