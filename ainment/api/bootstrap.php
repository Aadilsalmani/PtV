<?php
declare(strict_types=1);

function rr_settings(): array
{
    $settings = [
        'GROQ_API_KEY' => getenv('GROQ_API_KEY') ?: '',
        'TMDB_API_TOKEN' => getenv('TMDB_API_TOKEN') ?: '',
        'GROQ_MODEL' => getenv('GROQ_MODEL') ?: 'llama-3.3-70b-versatile',
    ];
    $settings = array_merge($settings, rr_env_file_settings(dirname(__DIR__) . '/.env'));
    $local = __DIR__ . '/config.local.php';
    if (is_file($local)) {
        $fileSettings = require $local;
        if (is_array($fileSettings)) {
            $settings = array_merge($settings, $fileSettings);
        }
    }
    return $settings;
}

function rr_env_file_settings(string $path): array
{
    if (!is_file($path)) {
        return [];
    }
    $settings = [];
    $allowed = ['GROQ_API_KEY', 'TMDB_API_TOKEN', 'GROQ_MODEL'];
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $trimmed, 2);
        $key = trim($key);
        if (!in_array($key, $allowed, true)) {
            continue;
        }
        $settings[$key] = trim($value, " \t\n\r\0\x0B\"'");
    }
    return $settings;
}

function rr_is_live(): bool
{
    $settings = rr_settings();
    return !empty($settings['GROQ_API_KEY']) && !empty($settings['TMDB_API_TOKEN']);
}

function rr_countries(): array
{
    return [
        ['code' => 'IN', 'name' => 'India'],
        ['code' => 'US', 'name' => 'United States'],
        ['code' => 'GB', 'name' => 'United Kingdom'],
        ['code' => 'CA', 'name' => 'Canada'],
        ['code' => 'AU', 'name' => 'Australia'],
        ['code' => 'SG', 'name' => 'Singapore'],
        ['code' => 'AE', 'name' => 'United Arab Emirates'],
        ['code' => 'DE', 'name' => 'Germany'],
        ['code' => 'FR', 'name' => 'France'],
        ['code' => 'JP', 'name' => 'Japan'],
        ['code' => 'KR', 'name' => 'South Korea'],
        ['code' => 'BR', 'name' => 'Brazil'],
    ];
}

function rr_demo_titles(): array
{
    return [
        [
            'title' => 'Dune: Part Two', 'type' => 'Movie', 'year' => '2024',
            'genre' => 'Science Fiction', 'runtime' => '2h 46m',
            'tone' => ['epic', 'thoughtful', 'action', 'sci-fi'], 'trailerId' => 'Way9Dexny3w',
            'blurb' => 'Power, prophecy and enormous scale for a night when you want to disappear into another world.',
            'providers' => ['US' => ['Max', 'Prime Video'], 'IN' => ['JioHotstar'], 'GB' => ['NOW']],
        ],
        [
            'title' => 'Fallout', 'type' => 'Series', 'year' => '2024',
            'genre' => 'Adventure', 'runtime' => '1 season',
            'tone' => ['dark comedy', 'action', 'sci-fi', 'quirky'], 'trailerId' => 'V-mugKDQDlg',
            'blurb' => 'A bright-eyed vault dweller meets a cheerfully brutal wasteland in a sharp genre adventure.',
            'providers' => ['US' => ['Prime Video'], 'IN' => ['Prime Video'], 'GB' => ['Prime Video']],
        ],
        [
            'title' => 'Stranger Things', 'type' => 'Series', 'year' => '2016',
            'genre' => 'Mystery', 'runtime' => '4 seasons',
            'tone' => ['nostalgic', 'thrilling', 'friendship', 'mystery'], 'trailerId' => 'b9EkMc79ZSU',
            'blurb' => 'A warm, suspenseful group adventure with monsters, synths and fiercely loyal friends.',
            'providers' => ['US' => ['Netflix'], 'IN' => ['Netflix'], 'GB' => ['Netflix']],
        ],
        [
            'title' => 'RRR', 'type' => 'Movie', 'year' => '2022',
            'genre' => 'Action Drama', 'runtime' => '3h 7m',
            'tone' => ['spectacle', 'friendship', 'action', 'uplifting'], 'trailerId' => 'NgBoMJy386M',
            'blurb' => 'An unapologetically maximal action friendship saga built for an energetic movie night.',
            'providers' => ['US' => ['Netflix'], 'IN' => ['Netflix', 'ZEE5'], 'GB' => ['Netflix']],
        ],
        [
            'title' => 'Interstellar', 'type' => 'Movie', 'year' => '2014',
            'genre' => 'Science Fiction', 'runtime' => '2h 49m',
            'tone' => ['emotional', 'thoughtful', 'sci-fi', 'epic'], 'trailerId' => 'zSWdZVtXT7E',
            'blurb' => 'A soaring, emotional space odyssey for viewers who want ideas and heart in equal measure.',
            'providers' => ['US' => ['Prime Video'], 'IN' => ['Prime Video'], 'GB' => ['Paramount+']],
        ],
        [
            'title' => 'Wednesday', 'type' => 'Series', 'year' => '2022',
            'genre' => 'Mystery Comedy', 'runtime' => '1 season',
            'tone' => ['quirky', 'mystery', 'funny', 'dark comedy'], 'trailerId' => 'Di310WS8zLk',
            'blurb' => 'Deadpan wit, school secrets and supernatural twists in a beautifully odd binge.',
            'providers' => ['US' => ['Netflix'], 'IN' => ['Netflix'], 'GB' => ['Netflix']],
        ],
    ];
}

function rr_fallback_providers(string $country): array
{
    $regions = [
        'IN' => ['Netflix', 'Prime Video', 'JioHotstar', 'Sony LIV', 'ZEE5', 'Apple TV', 'YouTube', 'Discovery+'],
        'US' => ['Netflix', 'Prime Video', 'Disney Plus', 'Hulu', 'Max', 'Peacock', 'Paramount Plus', 'Apple TV', 'YouTube'],
        'GB' => ['Netflix', 'Prime Video', 'Disney Plus', 'NOW', 'ITVX', 'BBC iPlayer', 'Apple TV', 'YouTube'],
        'CA' => ['Netflix', 'Prime Video', 'Disney Plus', 'Crave', 'CBC Gem', 'Apple TV', 'YouTube'],
        'AU' => ['Netflix', 'Prime Video', 'Disney Plus', 'Stan', 'BINGE', 'ABC iview', 'Apple TV', 'YouTube'],
        'SG' => ['Netflix', 'Prime Video', 'Disney Plus', 'Viu', 'meWATCH', 'Apple TV', 'YouTube'],
        'AE' => ['Netflix', 'Prime Video', 'Disney Plus', 'Shahid VIP', 'STARZPLAY', 'Apple TV', 'YouTube'],
        'DE' => ['Netflix', 'Prime Video', 'Disney Plus', 'WOW', 'Joyn', 'RTL+', 'Apple TV', 'YouTube'],
        'FR' => ['Netflix', 'Prime Video', 'Disney Plus', 'Max', 'Canal+', 'france.tv', 'Apple TV', 'YouTube'],
        'JP' => ['Netflix', 'Prime Video', 'Disney Plus', 'U-NEXT', 'Hulu', 'ABEMA', 'Apple TV', 'YouTube'],
        'KR' => ['Netflix', 'Disney Plus', 'TVING', 'Wavve', 'Watcha', 'Coupang Play', 'Apple TV', 'YouTube'],
        'BR' => ['Netflix', 'Prime Video', 'Disney Plus', 'Globoplay', 'Max', 'Apple TV', 'YouTube'],
    ];
    return $regions[$country] ?? $regions['IN'];
}

function rr_available_providers(string $country): array
{
    if (!rr_is_live()) {
        return rr_fallback_providers($country);
    }
    $settings = rr_settings();
    $movie = rr_tmdb('/watch/providers/movie', ['watch_region' => $country], $settings);
    $tv = rr_tmdb('/watch/providers/tv', ['watch_region' => $country], $settings);
    $providers = [];
    foreach (array_merge($movie['results'] ?? [], $tv['results'] ?? []) as $provider) {
        $name = (string) ($provider['provider_name'] ?? '');
        if (!$name) {
            continue;
        }
        $priority = (int) ($provider['display_priority'] ?? 9999);
        if (!isset($providers[$name]) || $priority < $providers[$name]) {
            $providers[$name] = $priority;
        }
    }
    asort($providers);
    return array_slice(array_keys($providers), 0, 18);
}

function rr_json(int $status, array $data): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function rr_json_body(): array
{
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || strlen($raw) > 20000) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function rr_clean_profile(array $body): array
{
    $countryCodes = array_column(rr_countries(), 'code');
    $country = isset($body['country']) && in_array($body['country'], $countryCodes, true) ? $body['country'] : 'IN';
    $type = isset($body['type']) && in_array($body['type'], ['any', 'movie', 'tv'], true) ? $body['type'] : 'any';
    $platforms = [];
    if (isset($body['platforms']) && is_array($body['platforms'])) {
        foreach (array_slice($body['platforms'], 0, 8) as $platform) {
            $platforms[] = substr((string) $platform, 0, 40);
        }
    }
    return [
        'country' => $country,
        'type' => $type,
        'mood' => substr((string) ($body['mood'] ?? 'surprising and absorbing'), 0, 120),
        'interests' => substr((string) ($body['interests'] ?? ''), 0, 500),
        'language' => substr((string) ($body['language'] ?? 'Any language'), 0, 40),
        'time' => substr((string) ($body['time'] ?? 'Any length'), 0, 40),
        'platforms' => $platforms,
    ];
}

function rr_matches_platforms(array $providers, array $wanted): bool
{
    foreach ($providers as $provider) {
        foreach ($wanted as $choice) {
            if (stripos($provider, $choice) !== false || stripos($choice, $provider) !== false) {
                return true;
            }
        }
    }
    return false;
}

function rr_platform_link(string $provider, string $title): array
{
    $query = rawurlencode($title);
    $normalized = strtolower($provider);
    $url = 'https://www.google.com/search?q=' . $query . '+watch+on+' . rawurlencode($provider);
    if (strpos($normalized, 'netflix') !== false) {
        $url = 'https://www.netflix.com/search?q=' . $query;
    } elseif (strpos($normalized, 'prime') !== false) {
        $url = 'https://www.primevideo.com/search/ref=atv_nb_sr?phrase=' . $query;
    } elseif (strpos($normalized, 'hotstar') !== false) {
        $url = 'https://www.hotstar.com/in/search?q=' . $query;
    } elseif (strpos($normalized, 'youtube') !== false) {
        $url = 'https://www.youtube.com/results?search_query=' . $query;
    } elseif (strpos($normalized, 'max') !== false) {
        $url = 'https://www.max.com/search?q=' . $query;
    }
    return ['provider' => $provider, 'url' => $url];
}

function rr_demo_recommendations(array $profile): array
{
    $keywords = strtolower($profile['mood'] . ' ' . $profile['interests']);
    $ranked = [];
    foreach (rr_demo_titles() as $item) {
        if ($profile['type'] !== 'any' && ($profile['type'] === 'movie') !== ($item['type'] === 'Movie')) {
            continue;
        }
        $providers = $item['providers'][$profile['country']] ?? $item['providers']['US'] ?? [];
        if ($profile['platforms'] && !rr_matches_platforms($providers, $profile['platforms'])) {
            continue;
        }
        $score = 0;
        foreach ($item['tone'] as $word) {
            $score += strpos($keywords, $word) !== false ? 2 : 0;
        }
        $score += $profile['platforms'] && rr_matches_platforms($providers, $profile['platforms']) ? 2 : 0;
        $item['providers'] = $providers;
        $item['watchLinks'] = array_map(fn($provider) => rr_platform_link($provider, $item['title']), $providers);
        $item['providerLink'] = null;
        $ranked[] = ['rank' => $score, 'item' => $item];
    }
    usort($ranked, fn($left, $right) => $right['rank'] <=> $left['rank']);
    return array_map(fn($row) => $row['item'], array_slice($ranked, 0, 6));
}

function rr_http_json(string $url, array $headers = [], string $method = 'GET', ?array $payload = null, int $timeout = 10): array
{
    if (!function_exists('curl_init')) {
        throw new RuntimeException('PHP cURL is required for live recommendations.');
    }
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CUSTOMREQUEST => $method,
    ]);
    if ($payload !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
    }
    $raw = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if (!is_string($raw) || $status < 200 || $status >= 300) {
        throw new RuntimeException('External API request failed (' . $status . '). ' . $error);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new RuntimeException('External API returned invalid JSON.');
    }
    return $data;
}

function rr_country_name(string $code): string
{
    foreach (rr_countries() as $country) {
        if ($country['code'] === $code) {
            return $country['name'];
        }
    }
    return $code;
}

function rr_ask_groq(array $profile, array $settings): array
{
    $countryName = rr_country_name($profile['country']);
    $prompt = implode("\n", [
        'Viewer country: ' . $countryName . ' (' . $profile['country'] . ').',
        'Mood: ' . $profile['mood'] . '. Format: ' . $profile['type'] . '. Language preference: ' . $profile['language'] . '.',
        'Available time: ' . $profile['time'] . '. Platforms preferred: ' . ($profile['platforms'] ? implode(', ', $profile['platforms']) : 'any') . '.',
        'Taste details: ' . ($profile['interests'] ?: 'open to discovery') . '.',
        'Recommend 14 real movies or TV series likely to fit. Mix obvious hits, lesser-known gems, different genres, and regional options when relevant. TMDB will separately verify regional streaming availability.',
        'Return only JSON: {"picks":[{"title":"...","type":"movie|tv","reason":"one enticing sentence under 22 words"}]}.',
    ]);
    $data = rr_http_json(
        'https://api.groq.com/openai/v1/chat/completions',
        ['Authorization: Bearer ' . $settings['GROQ_API_KEY'], 'Content-Type: application/json'],
        'POST',
        [
            'model' => $settings['GROQ_MODEL'],
            'temperature' => 0.65,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => 'You are ReelRoute, an insightful film curator. Recommend real watchable entertainment without inventing titles or providers.'],
                ['role' => 'user', 'content' => $prompt],
            ],
        ],
        25
    );
    $content = $data['choices'][0]['message']['content'] ?? '{}';
    $parsed = json_decode($content, true);
    return is_array($parsed['picks'] ?? null) ? $parsed['picks'] : [];
}

function rr_tmdb(string $path, array $parameters, array $settings): array
{
    $query = array_merge(['language' => 'en-US'], $parameters);
    $url = 'https://api.themoviedb.org/3' . $path . '?' . http_build_query($query);
    return rr_http_json($url, ['Authorization: Bearer ' . $settings['TMDB_API_TOKEN'], 'Accept: application/json']);
}

function rr_enrich_with_tmdb(array $pick, string $region, array $settings): ?array
{
    $mediaType = ($pick['type'] ?? '') === 'tv' ? 'tv' : 'movie';
    $search = rr_tmdb('/search/' . $mediaType, ['query' => (string) ($pick['title'] ?? ''), 'include_adult' => 'false'], $settings);
    $title = $search['results'][0] ?? null;
    if (!is_array($title)) {
        return null;
    }
    $videos = rr_tmdb('/' . $mediaType . '/' . $title['id'] . '/videos', [], $settings);
    $watches = rr_tmdb('/' . $mediaType . '/' . $title['id'] . '/watch/providers', [], $settings);
    $offers = $watches['results'][$region] ?? [];
    $rawProviders = array_merge(
        $offers['flatrate'] ?? [],
        $offers['free'] ?? [],
        $offers['ads'] ?? [],
        $offers['rent'] ?? [],
        $offers['buy'] ?? []
    );
    $providers = [];
    foreach ($rawProviders as $provider) {
        if (!empty($provider['provider_name'])) {
            $providers[] = $provider['provider_name'];
        }
    }
    $providers = array_values(array_unique($providers));
    $trailer = null;
    foreach ($videos['results'] ?? [] as $video) {
        if (($video['site'] ?? '') === 'YouTube' && ($video['type'] ?? '') === 'Trailer' && !empty($video['official'])) {
            $trailer = $video;
            break;
        }
    }
    if ($trailer === null) {
        foreach ($videos['results'] ?? [] as $video) {
            if (($video['site'] ?? '') === 'YouTube' && ($video['type'] ?? '') === 'Trailer') {
                $trailer = $video;
                break;
            }
        }
    }
    $displayTitle = $mediaType === 'movie' ? ($title['title'] ?? '') : ($title['name'] ?? '');
    $hasRegionalOffer = count($providers) > 0;
    $platformMatched = false;
    if (isset($pick['platforms']) && is_array($pick['platforms'])) {
        $platformMatched = rr_matches_platforms($providers, $pick['platforms']);
    }
    $watchProviders = $providers;
    if (!$watchProviders && isset($pick['platforms']) && is_array($pick['platforms'])) {
        $watchProviders = $pick['platforms'];
    }
    return [
        'title' => $displayTitle,
        'type' => $mediaType === 'movie' ? 'Movie' : 'Series',
        'genre' => rr_primary_genre($title['genre_ids'][0] ?? null),
        'year' => substr((string) ($title[$mediaType === 'movie' ? 'release_date' : 'first_air_date'] ?? ''), 0, 4),
        'blurb' => (string) ($pick['reason'] ?? $title['overview'] ?? ''),
        'overview' => (string) ($title['overview'] ?? ''),
        'score' => isset($title['vote_average']) ? number_format((float) $title['vote_average'], 1) : null,
        'poster' => !empty($title['poster_path']) ? 'https://image.tmdb.org/t/p/w500' . $title['poster_path'] : null,
        'trailerId' => $trailer['key'] ?? null,
        'providers' => $providers,
        'availability' => $hasRegionalOffer ? ($platformMatched ? 'verified' : 'regional') : 'discovery',
        'availabilityLabel' => $hasRegionalOffer ? ($platformMatched ? 'Verified on selected services' : 'Available in your region') : 'Discovery pick',
        'providerLink' => $offers['link'] ?? null,
        'watchLinks' => array_map(fn($provider) => rr_platform_link($provider, $displayTitle), $watchProviders),
    ];
}

function rr_primary_genre($id): string
{
    $genres = [
        12 => 'Adventure', 14 => 'Fantasy', 16 => 'Animation', 18 => 'Drama',
        27 => 'Horror', 28 => 'Action', 35 => 'Comedy', 36 => 'History',
        37 => 'Western', 53 => 'Thriller', 80 => 'Crime', 99 => 'Documentary',
        878 => 'Science Fiction', 9648 => 'Mystery', 10402 => 'Music',
        10749 => 'Romance', 10751 => 'Family', 10752 => 'War',
        10759 => 'Action & Adventure', 10762 => 'Kids', 10763 => 'News',
        10764 => 'Reality', 10765 => 'Sci-Fi & Fantasy', 10766 => 'Soap',
        10767 => 'Talk', 10768 => 'War & Politics',
    ];
    return $genres[(int) $id] ?? 'Recommended for You';
}

function rr_live_recommendations(array $profile): array
{
    $settings = rr_settings();
    $verified = [];
    $regional = [];
    $discovery = [];
    foreach (array_slice(rr_ask_groq($profile, $settings), 0, 10) as $pick) {
        $pick['platforms'] = $profile['platforms'];
        try {
            $result = rr_enrich_with_tmdb($pick, $profile['country'], $settings);
        } catch (Throwable $error) {
            error_log('ReelRoute skipped title "' . ($pick['title'] ?? 'unknown') . '": ' . $error->getMessage());
            continue;
        }
        if (!$result || empty($result['trailerId'])) {
            continue;
        }
        if ($result['availability'] === 'verified') {
            $verified[] = $result;
        } elseif ($result['availability'] === 'regional') {
            $regional[] = $result;
        } else {
            $discovery[] = $result;
        }
        if ((count($verified) + count($regional) + count($discovery)) >= 10) {
            break;
        }
    }
    $results = array_slice(array_merge($verified, $regional, $discovery), 0, 10);
    if (!$results) {
        throw new RuntimeException('No matching titles with provider and trailer data found.');
    }
    return $results;
}
