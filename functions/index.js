const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const fs = require('fs');
const path = require('path');
const useragent = require('useragent');

admin.initializeApp();

// Path to a copy of your SPA index.html (we'll copy this into functions/static/index.html before deploy)
const INDEX_HTML_PATH = path.join(__dirname, 'static', 'index.html');

const app = express();
app.disable('x-powered-by');

// Basic bot detection - common crawlers (FB, Twitter, WhatsApp, Googlebot, Slack, LinkedIn, etc.)
function isBot(req) {
  const ua = req.headers['user-agent'] || '';
  const agent = useragent.parse(ua).toString().toLowerCase();
  const botSignatures = [
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'slackbot',
    'linkedin', 'googlebot', 'bingbot', 'applebot', 'whatsapp',
    'telegrambot', 'discordbot', 'pinterest'
  ];
  const lower = ua.toLowerCase();
  return botSignatures.some(sig => lower.indexOf(sig) !== -1) || /bot|crawl|spider|preview|fetch/i.test(lower);
}

function slugifyName(name) {
  return (name || '').toString().trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

async function findPlaceBySlugOrCoords({ placeSlug, lat, lon }) {
  const db = admin.firestore();
  // If you have slug stored in Firestore, query by that directly:
  if (placeSlug) {
    // Try exact slug match first (assuming doc has 'slug' field)
    try {
      const q = await db.collection('places').where('slug','==',placeSlug).limit(1).get();
      if (!q.empty) return q.docs[0].data();
    } catch (e) { /* fallthrough */ }

    // fallback: fetch small set and match by computed slug (works for small datasets)
    const snap = await db.collection('places').get();
    for (const d of snap.docs) {
      const data = d.data();
      if (slugifyName(data.Name) === placeSlug) return data;
    }
    return null;
  }

  if (lat && lon) {
    // fallback: find place within small tolerance (simple nearest)
    const snap = await db.collection('places').get();
    let best = null;
    const latNum = parseFloat(lat), lonNum = parseFloat(lon);
    function dist(a,b,c,d){
      return (a-c)*(a-c)+(b-d)*(b-d);
    }
    let bestDist = Infinity;
    for (const d of snap.docs) {
      const p = d.data();
      const plat = parseFloat(p.Latitude), plon = parseFloat(p.Longitude);
      if (isFinite(plat) && isFinite(plon)) {
        const dd = dist(latNum, lonNum, plat, plon);
        if (dd < bestDist) { bestDist = dd; best = p; }
      }
    }
    return best;
  }

  return null;
}

function buildMetaHtml({ title, description, image, url }) {
  const safe = (s) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safe(title)}</title>
<meta name="description" content="${safe(description)}">

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="${safe(title)}" />
<meta property="og:description" content="${safe(description)}" />
<meta property="og:url" content="${safe(url)}" />
<meta property="og:image" content="${safe(image)}" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safe(title)}" />
<meta name="twitter:description" content="${safe(description)}" />
<meta name="twitter:image" content="${safe(image)}" />

</head>
<body>
  <!-- Minimal body for crawlers. SPA will still handle full UX. -->
  <h1>${safe(title)}</h1>
  <p>${safe(description)}</p>

  <script>
    // Optional: pass place data to your SPA if needed
    window.__SSR_PLACE = ${JSON.stringify({ title, description, image, url })};
  </script>
</body>
</html>`;
}

// Top-level function handler
app.get('*', async (req, res) => {
  try {
    const bot = isBot(req);
    const placeSlug = (req.query.place || '').toString().trim().toLowerCase();
    const lat = req.query.lat, lon = req.query.lon;
    if (bot) {
      // Crawler requested — return prerendered HTML
      let place = null;
      if (placeSlug || (lat && lon)) {
        place = await findPlaceBySlugOrCoords({ placeSlug, lat, lon });
      }

      if (place) {
        const name = place.Name || 'Place on The P2V';
        const description = place.ShortDescription || `${name} — Found on The P2V. Explore nearby attractions and plan visits on an interactive map.`;
        const image = (place.OgImage || place.Image || 'https://thep2v.com/icons/og-preview.png');
        // build canonical URL (with query)
        const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const html = buildMetaHtml({ title: `${name} — The P2V`, description, image, url });
        // Cache headers for crawlers (helps performance)
        res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
        return res.status(200).send(html);
      } else {
        // no place found — return site-wide meta (still better than nothing)
        const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const html = buildMetaHtml({
          title: 'The P2V — Explore & Track Places to Visit',
          description: 'Discover, plan, and track the best places to visit near you on The P2V interactive map.',
          image: 'https://thep2v.com/icons/og-preview.png',
          url
        });
        res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
        return res.status(200).send(html);
      }
    }

    // Not a bot -> Serve your SPA index.html (so normal users get the app)
    // Ensure you copied your production SPA's index.html into functions/static/index.html
    if (fs.existsSync(INDEX_HTML_PATH)) {
      res.set('Cache-Control', 'public, max-age=0, s-maxage=3600'); // short client cache, longer CDN
      return res.status(200).send(fs.readFileSync(INDEX_HTML_PATH, 'utf8'));
    } else {
      // If index not available, give a clear error
      return res.status(500).send('Missing SPA index.html in functions/static/index.html. Copy it before deployment.');
    }

  } catch (err) {
    console.error('SSR error', err);
    res.status(500).send('Server error');
  }
});

exports.ssr = functions.https.onRequest(app);
