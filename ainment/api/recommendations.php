<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rr_json(405, ['error' => 'Method not allowed.']);
}

$profile = rr_clean_profile(rr_json_body());
if (!rr_is_live()) {
    rr_json(200, [
        'mode' => 'showcase',
        'country' => $profile['country'],
        'results' => rr_demo_recommendations($profile),
    ]);
}

try {
    rr_json(200, [
        'mode' => 'live',
        'country' => $profile['country'],
        'results' => rr_live_recommendations($profile),
    ]);
} catch (Throwable $error) {
    error_log('ReelRoute live recommendation error: ' . $error->getMessage());
    rr_json(200, [
        'mode' => 'showcase',
        'country' => $profile['country'],
        'notice' => 'Live AI enrichment timed out, so preview recommendations are shown.',
        'results' => rr_demo_recommendations($profile),
    ]);
}
