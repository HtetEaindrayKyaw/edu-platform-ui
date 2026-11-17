<?php
declare(strict_types=1);

// The ONLY public PHP entry point. Do not expose the backend root as a web root.
ini_set('display_errors', '0');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$requestId = bin2hex(random_bytes(16));
header('X-Request-ID: ' . $requestId);

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
}

// Query route works on shared hosting without mod_rewrite:
// /api/index.php?route=health
$route = $_GET['route'] ?? '';
if (!is_string($route) || $route !== 'health') {
    respond(404, ['error' => ['code' => 'NOT_FOUND', 'message' => 'Endpoint not found.', 'request_id' => $requestId]]);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    respond(405, ['error' => ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'Use GET.', 'request_id' => $requestId]]);
    exit;
}
try {
    // cPanel: keep backend outside public_html; edit this absolute path in the copy
    // deployed to public_html/api/index.php. Locally this default locates the backend.
    $privateRoot = getenv('LANTHIT_BACKEND_ROOT') ?: dirname(__DIR__);
    $config = require $privateRoot . '/bootstrap.php';
    $pdo = \LanThit\Database::connect($config['database']);
    $ready = $pdo->query("SELECT version FROM schema_migrations WHERE version = '001_initial'")->fetchColumn();
    if ($ready !== '001_initial') {
        throw new RuntimeException('Schema not ready.');
    }
    respond(200, ['status' => 'ok']);
} catch (Throwable $error) {
    error_log('LanThit health failure request=' . $requestId . ' type=' . get_class($error) . ' code=' . $error->getCode());
    respond(503, ['error' => ['code' => 'SERVICE_UNAVAILABLE', 'message' => 'Service is temporarily unavailable.', 'request_id' => $requestId]]);
}
