<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    rr_json(405, ['error' => 'Method not allowed.']);
}

rr_json(200, ['live' => rr_is_live(), 'countries' => rr_countries()]);
