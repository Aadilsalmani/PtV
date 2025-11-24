const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

admin.initializeApp(); // Cloud Functions uses default credentials
const db = admin.firestore();

const app = express();
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

// export
exports.placeHandler = functions.https.onRequest(app);

// small helpers
function escapeHtmlIfNeeded(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escapeForJS(s){ return (s||'').toString().replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,''); }
