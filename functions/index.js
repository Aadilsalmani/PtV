
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

require('dotenv').config();

admin.initializeApp();

const db = admin.firestore();

const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json({ limit: '1mb' }));



  app.set('trust proxy', true);

  // Helper: escape for HTML
  function esc(s) { return (s || '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  app.get('/places/:slug', async (req, res) => {
    try {
      const slug = req.params.slug;
      if (!slug) return res.status(400).send('Missing slug');

      // Query Firestore (adapt collection name)
      const q = await db.collection('places').where('slug', '==', slug).limit(1).get();
      if (q.empty) {
        // 404 page (help SEO too)
        return res.status(404).send(`<html><head><title>Not found — The P2V</title></head><body><h1>Not Found</h1></body></html>`);
      }
      const doc = q.docs[0].data();

      const name = doc.Name || 'The P2V';
      const desc = (doc.Description && doc.Description.substring(0,200)) || (`Explore ${name} on The P2V — find nearby places, directions and details.`);
      const image = doc.ogImage || 'https://thep2v.com/icons/og-preview.png';
      const lat = doc.Latitude || '';
      const lon = doc.Longitude || '';
      const placeUrl = `https://thep2v.com/?place=${encodeURIComponent(slug)}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;

      // Minimal HTML with proper meta + visible content for crawlers (and a client redirect for real users)
      const html = `<!doctype html><html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${esc(name)} — The P2V</title>
    <meta name="description" content="${esc(desc)}"/>
    <meta property="og:type" content="website"/>
    <meta property="og:title" content="${esc(name)} — The P2V"/>
    <meta property="og:description" content="${esc(desc)}"/>
    <meta property="og:image" content="${esc(image)}"/>
    <meta property="og:url" content="${escapeHtmlIfNeeded(placeUrl)}"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <link rel="canonical" href="${esc(placeUrl)}"/>
    <script>/* If user agent is browser, send them to SPA entry so UX stays same */ 
      if (typeof window !== 'undefined') {
        // optional: small delay so scrapers still get meta
        setTimeout(()=>{ window.location.href = "${escapeForJS(placeUrl)}"; }, 50);
      }
    </script>
  </head>
  <body>
    <h1>${esc(name)}</h1>
    <p>${esc(doc.CountryState || '')}</p>
    <p>Popularity: ${esc(doc.Popularity || '')}</p>
    <p>Coordinates: ${esc(lat)}, ${esc(lon)}</p>
    <p><a href="${esc(placeUrl)}">Open in TheP2V</a></p>
  </body>
  </html>`;

      res.set('Cache-Control', 'public, max-age=600, s-maxage=1200'); // cache for a bit
      res.status(200).send(html);

    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });




  app.use(express.json({ limit: '1mb' }));

  app.post('/ai/chat', async (req, res) => {

    try {

      const {
        message,
        nearbyPlaces = [],
        userLocation = null,
        tripPreferences = {}
      } = req.body;

      if (!message) {
        return res.status(400).json({
          error: 'Missing message'
        });
      }

      // SYSTEM PROMPT
      const systemPrompt = `
      You are The P2V AI Travel Assistant.

      You are an intelligent travel guide, not just a database search tool.

      Your responsibilities:
      - Recommend nearby attractions
      - Suggest activities, food, nightlife, shopping, nature, photography spots, culture, and entertainment
      - Create itineraries
      - Suggest hidden gems
      - Use real-world travel knowledge
      - Use The P2V database as supporting context

      IMPORTANT RULES:
      - Do NOT limit recommendations only to provided database places
      - You may recommend famous or relevant places outside the database
      - Use nearby database places only when relevant
      - Prioritize answering the user's actual intent
      - Add local insights and practical travel suggestions
      - Keep responses concise, mobile-friendly, and well-structured
      

      Formatting rules:
      - Use short paragraphs
      - Use headings with ##
      - Use bullet lists with *
      - Mention distances naturally
      - Highlight place names with **bold**
      - Never generate giant walls of text
      - Keep mobile readability in mind      
      
      STRICT RESPONSE FORMAT:
      - Use ONLY:
        ## Headings
        * Bullet lists
        **bold**
        Short paragraphs

      - Never use numbered lists
      - Never use markdown tables
      - Never use code blocks
      - Never use nested bullets
      - Keep sections compact
      - Keep mobile readability in mind
      - Maximum 5 bullets per section



      Good responses should include:
      - Activities
      - Local experiences
      - Food suggestions
      - Timing suggestions
      - Transportation suggestions
      - Nearby attractions
      - Optional hidden gems

      Avoid:
      - Repeating the same places every response
      - Giving only database listings
      - Sounding robotic
      `;

      // USER PROMPT
      const userPrompt = `
      USER QUESTION:
      ${message}

      USER LOCATION:
      ${JSON.stringify(userLocation)}

      IMPORTANT:
      Answer the user's actual request naturally.

      Nearby database places are OPTIONAL supporting context.

      You may use your own travel knowledge to:
      - recommend activities
      - suggest famous places
      - suggest food spots
      - suggest nightlife
      - suggest local experiences
      - suggest hidden gems

      Nearby database places:
      ${JSON.stringify(nearbyPlaces.slice(0, 8))}
      `;

      // GROQ API CALL
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',

            // IMPORTANT
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },

          body: JSON.stringify({

            model: 'llama-3.3-70b-versatile',

            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],

            temperature: 0.7,
            max_tokens: 1000

          })
        }
      );

      // DEBUG
      console.log("STATUS:", response.status);

      // RAW TEXT
      const rawText = await response.text();

      console.log("RAW RESPONSE:");
      console.log(rawText);

      // PARSE JSON
      const data = JSON.parse(rawText);

      // EXTRACT MESSAGE
      const assistantMessage =
        data?.choices?.[0]?.message?.content
        || "No response received.";

      // SEND TO FRONTEND
      res.json({
        summary: assistantMessage
      });

    } catch (err) {

      console.error("AI CHAT ERROR:");
      console.error(err);

      res.status(500).json({
        error: 'AI request failed'
      });
    }
  });




  // export
  exports.placeHandler = functions.https.onRequest(app);

  // small helpers
  function escapeHtmlIfNeeded(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escapeForJS(s){ return (s||'').toString().replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,''); }
