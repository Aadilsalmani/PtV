const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

admin.initializeApp();
const db = admin.firestore();

const app = express();

// Helper slugify (same rules you already use)
function slugify(name) {
  if (!name) return '';
  return name.toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')           // spaces to dashes
    .replace(/-+/g, '-');           // collapse multiple dashes
}

// Build XML safe
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Route: sitemap-places.xml
app.get('/sitemap-places.xml', async (req, res) => {
  try {
    // read all places (consider pagination if > 50k)
    const snapshot = await db.collection('places').get();
    const base = 'https://thep2v.com/places/';

    // start xml
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    snapshot.forEach(doc => {
      const data = doc.data();
      // prefer slug field; fallback to generated slug from Name
      const slug = (data.slug && data.slug.toString().trim()) || slugify(data.Name || '');
      if (!slug) return; // skip if nothing
      const loc = base + encodeURIComponent(slug);
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(loc)}</loc>\n`;
      // optional: add lastmod if you store it
      if (data.slug_generated_at) {
        try {
          const dt = new Date(data.slug_generated_at);
          if (!isNaN(dt)) {
            xml += `    <lastmod>${dt.toISOString().split('T')[0]}</lastmod>\n`;
          }
        } catch (e) {}
      }
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    // respond as XML, with cache headers (short TTL so updates propagate)
    res.set('Content-Type', 'application/xml; charset=utf-8');
    // allow Google's crawler to cache for a while; you can change max-age
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600'); 
    res.status(200).send(xml);
  } catch (err) {
    console.error('sitemap generator error', err);
    res.status(500).send('Internal Server Error');
  }
});

// Export as a single function (region optional)
exports.sitemap = functions.region('asia-south1').https.onRequest(app);
