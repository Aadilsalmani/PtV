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
You are Ainment, an AI-powered movie and TV series recommendation engine.

Your task is to recommend real movies and TV series based on the user's preferences.

Return ONLY valid JSON.

Do not use markdown.

Do not include explanations outside JSON.

Return exactly this structure:

{
  "recommendations":[
    {
      "title":"",
      "type":"",
      "year":"",
      "genre":"",
      "reason":""
    }
  ]
}

Rules:

- Recommend between 5 and 10 titles.
- Only recommend real movies or TV series.
- title = official title.
- type = Movie or TV Series.
- year = release year.
- genre = comma-separated genres.
- reason = one short sentence explaining why it matches the user's request.
- Keep reasons under 40 words.
- Never invent titles.
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
                                    text: `User request:

                    ${prompt}`
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

        let recommendations;

        try {

            recommendations = JSON.parse(text);

        } catch (error) {

            return {

                statusCode: 500,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    error: "Gemini returned invalid JSON.",

                    raw: text

                })

            };

        }

        return {

            statusCode: 200,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(recommendations)

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