<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    rr_json(405, ['error' => 'Method not allowed.']);
}

$raw = strtoupper((string) ($_SERVER['HTTP_CF_IPCOUNTRY'] ?? $_SERVER['HTTP_X_VERCEL_IP_COUNTRY'] ?? $_SERVER['HTTP_CLOUDFRONT_VIEWER_COUNTRY'] ?? ''));
foreach (rr_countries() as $country) {
    if ($country['code'] === $raw) {
        rr_json(200, ['country' => $country['code'], 'name' => $country['name'], 'detected' => true]);
    }
}

rr_json(200, ['country' => 'IN', 'name' => 'India', 'detected' => false]);
