<?php
declare(strict_types=1);

// Copy to local.php OUTSIDE the public document root; fill in your cPanel values.
// Environment variables take precedence over local.php. Never use VITE_* for secrets.
return [
    'app' => [
        'environment' => 'production', // local, test, production
        'name' => 'IGCSE LanThit',
        'timezone' => 'UTC', // Database and API timestamps are UTC.
    ],
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => '', // Full cPanel-prefixed database name.
        'username' => '', // Dedicated database user; not the cPanel login/root.
        'password' => '',
        'unix_socket' => '', // Optional on Linux; takes precedence over host/port.
        'ssl_ca' => '', // CA path for a remote DB using certificate-verified TLS.
        'connect_timeout_seconds' => 5,
    ],
    'openai' => [
        'api_key' => '', // Reserved for a later server-side AI implementation.
        'model' => 'gpt-4o', // Preserve the requested model; configurable by operator.
        'request_timeout_seconds' => 20,
    ],
];
