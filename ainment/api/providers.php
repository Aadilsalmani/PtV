<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    rr_json(405, ['error' => 'Method not allowed.']);
}

$country = strtoupper(substr((string) ($_GET['country'] ?? 'IN'), 0, 2));
if (!in_array($country, array_column(rr_countries(), 'code'), true)) {
    $country = 'IN';
}

try {
    rr_json(200, [
        'country' => $country,
        'source' => rr_is_live() ? 'tmdb' : 'fallback',
        'providers' => rr_available_providers($country),
    ]);
} catch (Throwable $error) {
    error_log('ReelRoute provider lookup error: ' . $error->getMessage());
    rr_json(200, [
        'country' => $country,
        'source' => 'fallback',
        'providers' => rr_fallback_providers($country),
    ]);
}
