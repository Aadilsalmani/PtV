REELROUTE - PHP SHARED HOSTING UPLOAD PACKAGE
==============================================

Upload this complete ReelRoute folder into your existing website's public root:

  public_html/
    ReelRoute/
      index.html
      app.js
      styles.css
      api/

The app will be available at:

  https://mywebsite.com/ReelRoute/index.html

LIVE GROQ + TMDB SETUP
----------------------

1. In ReelRoute/api, duplicate config.local.example.php.
2. Rename the duplicate to config.local.php.
3. Edit config.local.php and enter your own:
   - GROQ_API_KEY
   - TMDB_API_TOKEN (TMDB API Read Access Token)
4. Upload config.local.php to ReelRoute/api on your server.

The included api/.htaccess blocks direct browser access to config.local.php
on Apache/cPanel hosting. Do not publish or share config.local.php.
The included ReelRoute/.htaccess also blocks any accidental .env file from
being downloadable. For this PHP package, keep live credentials only in
api/config.local.php.

If the two credentials are not configured, ReelRoute intentionally runs in
Showcase mode with sample results rather than live streaming availability.

LOCAL PREVIEW NOTE
------------------

Opening the folder with VS Code Live Server (usually 127.0.0.1:5500) does
not execute PHP. The interface will show Static preview mode and sample
results, but live Groq/TMDB requests cannot run there.

To test the PHP endpoints locally with XAMPP PHP, open PowerShell in the
folder containing ReelRoute and run:

  C:\xampp\php\php.exe -S 127.0.0.1:8091 -t .

Then open:

  http://127.0.0.1:8091/ReelRoute/index.html

HOSTING REQUIREMENTS
--------------------

- PHP 7.4 or newer.
- PHP cURL extension enabled for live Groq and TMDB requests.
- Apache/cPanel hosting should permit .htaccess rules.

FILES TO UPLOAD
---------------

Upload all files under this ReelRoute folder, including:

  ReelRoute/index.html
  ReelRoute/app.js
  ReelRoute/styles.css
  ReelRoute/.htaccess
  ReelRoute/api/.htaccess
  ReelRoute/api/bootstrap.php
  ReelRoute/api/config.php
  ReelRoute/api/location.php
  ReelRoute/api/providers.php
  ReelRoute/api/recommendations.php
  ReelRoute/api/config.local.php       (only after you configure it)

SECURITY NOTE
-------------

API keys remain server-side in PHP. Never paste them into HTML or JavaScript.
