/**
 * Cloud Function: askNomad
 * ─────────────────────────────────────────────────────────────────────────
 * Proxies chat requests from the Nomad AI front-end to the Gemini API.
 * The Gemini API key lives only here (Secret Manager), never in the
 * browser/client bundle.
 *
 * Deploy with:
 *   firebase deploy --only functions:askNomad
 *
 * Set the secret once (one-time, interactive prompt):
 *   firebase functions:secrets:set GEMINI_API_KEY
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// gemini-2.0-flash was shut down June 1 2026 — 2.5-flash is the current
// free-tier model as of this writing. Change here if you need to swap.
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Restrict to your own domains in production. Add/replace with your actual
// Firebase Hosting domain(s) once deployed.
const ALLOWED_ORIGINS = [
  /\.web\.app$/,
  /\.firebaseapp\.com$/,
  "https://thep2v.com",
  "http://127.0.0.1:5500",
  "http://localhost:5500"
];

exports.askNomad = onRequest(
  {
    secrets: [GEMINI_API_KEY],
    cors: ALLOWED_ORIGINS,
    region: "us-central1"
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: { message: "Method not allowed. Use POST." } });
      return;
    }

    try {
      const { systemPrompt, contents } = req.body || {};

      if (!Array.isArray(contents) || contents.length === 0) {
        res.status(400).json({ error: { message: "Missing 'contents' array in request body." } });
        return;
      }

      const body = {
        ...(systemPrompt
          ? { system_instruction: { parts: [{ text: systemPrompt }] } }
          : {}),
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      };

      const geminiRes = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY.value()
        },
        body: JSON.stringify(body)
      });

      const data = await geminiRes.json();

      // Pass Gemini's status code through so the client can branch on it
      // (e.g. 429 = rate limited, 400 = bad request).
      res.status(geminiRes.status).json(data);

    } catch (err) {
      console.error("askNomad error:", err);
      res.status(500).json({ error: { message: "Internal server error in askNomad function." } });
    }
  }
);