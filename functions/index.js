const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");

admin.initializeApp();
const db = admin.firestore();

const app = express();

function slugify(name) {
  if (!name) return "";
  return name.toString().trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

app.get("/sitemap-places.xml", async (req, res) => {
  try {
    const snapshot = await db.collection("places").get();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    snapshot.forEach(doc => {
      const data = doc.data();
      const slug = data.slug || slugify(data.Name);
      xml += "  <url>\n";
      xml += `    <loc>https://thep2v.com/?place=${slug}</loc>\n`;
      xml += "    <changefreq>weekly</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    });

    xml += "</urlset>";

    res.set("Content-Type", "application/xml");
    res.status(200).send(xml);

  } catch (error) {
    res.status(500).send("Error generating sitemap");
  }
});

exports.sitemap = functions.https.onRequest(app);
