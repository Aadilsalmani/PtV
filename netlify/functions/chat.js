/**
 * Netlify Function: chat
 * ─────────────────────────────────────────────────────────────────────────
 * Proxies chat requests from the Nomad AI front-end (nomad.html) to the
 * Gemini API. The Gemini API key lives only in Netlify's environment
 * variables — never in the browser, never committed to the repo.
 *
 * Endpoint once deployed:
 *   https://YOUR-SITE-NAME.netlify.app/.netlify/functions/chat
 *
 * One-time setup (no credit card required):
 *   1. Netlify dashboard → Site configuration → Environment variables
 *   2. Add variable: GEMINI_API_KEY = <your key from aistudio.google.com/apikey>
 *   3. Redeploy (or trigger deploy) so the function picks it up
 */

// gemini-2.0-flash was shut down June 1 2026 — 2.5-flash is the current
// free-tier model as of this writing. Change here if you need to swap.
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

exports.handler = async function (event) {
  // CORS — adjust origin to your real domain once you have one.
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Browsers send a preflight OPTIONS request before POST — must answer it.
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: { message: "Method not allowed. Use POST." } })
    };
  }

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();

  // Safe diagnostics — logs shape/length only, NEVER the actual key value.
  // View these in Netlify dashboard → Functions → chat → real-time logs,
  // or via `netlify functions:log chat` with the CLI.
  console.log("GEMINI_API_KEY present:", !!apiKey);
  if (apiKey) {
    console.log("GEMINI_API_KEY length:", apiKey.length);
    console.log("GEMINI_API_KEY starts with 'AIza':", apiKey.startsWith("AIza"));
    console.log("GEMINI_API_KEY has surrounding whitespace:", apiKey !== apiKey.trim());
  }

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: { message: "GEMINI_API_KEY is not set in Netlify environment variables." }
      })
    };
  }

  try {
    const { systemPrompt, contents } = JSON.parse(event.body || "{}");

    if (!Array.isArray(contents) || contents.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: { message: "Missing 'contents' array in request body." } })
      };
    }

    const body = {
      ...(systemPrompt
        ? { system_instruction: { parts: [{ text: systemPrompt }] } }
        : {}),
      contents,
      generationConfig: {
        temperature: 0.7,
        // Gemini 2.5 Flash is a "thinking" model by default — its internal
        // reasoning tokens count against maxOutputTokens, which was causing
        // responses to get cut off (finishReason: MAX_TOKENS) on anything
        // non-trivial. This app doesn't need multi-step reasoning, so we
        // disable thinking entirely for faster, cheaper, uncut responses.
        thinkingConfig: { thinkingBudget: 0 },
        // Raised from 1024 as a safety margin in case thinkingBudget is
        // ever partially ignored by the API (a known intermittent quirk).
        maxOutputTokens: 2048
      }
    };

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(body)
    });

    const data = await geminiRes.json();

    // Pass Gemini's status code + body straight through so the client can
    // branch on it (e.g. 429 = rate limited, 400 = bad request).
    return {
      statusCode: geminiRes.status,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error("chat function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: { message: "Internal server error in chat function." } })
    };
  }
};