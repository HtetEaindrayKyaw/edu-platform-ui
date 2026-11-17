<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
try {
    $pdo = require dirname(__DIR__) . '/config/database.php';
    $server = $pdo->query('SELECT VERSION() AS server_version, @@session.time_zone AS timezone, @@character_set_connection AS charset')->fetch();
    $version = $pdo->query("SELECT version FROM schema_migrations WHERE version = '001_initial'")->fetchColumn();
    if ($version !== '001_initial') {
        throw new RuntimeException('Missing schema marker.');
    }
    echo json_encode(['status' => 'ok', 'schema' => $version, 'database' => $server], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR), PHP_EOL;
} catch (Throwable $error) {
    // Only a class and numeric/SQLSTATE code: never print credentials or DSNs.
    fwrite(STDERR, 'Database check failed. Verify private configuration, server access, and schema import. [' . get_class($error) . ':' . $error->getCode() . ']' . PHP_EOL);
    exit(1);
}
