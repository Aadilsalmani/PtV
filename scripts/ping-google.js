// node scripts/ping-google.js
const https = require('https');
const sitemap = 'https://thep2v.com/sitemaps/sitemap-index.xml';
https.get(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`, res => {
  console.log('Pinged Google sitemap:', res.statusCode);
}).on('error', e => console.error('Ping failed:', e));
