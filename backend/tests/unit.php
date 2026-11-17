<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/Config.php';
require_once dirname(__DIR__) . '/src/Database.php';

use LanThit\Config;
use LanThit\Database;

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$count = 0;
function check(bool $condition, string $label): void {
    global $count;
    if (!$condition) { throw new RuntimeException('FAIL: ' . $label); }
    $count++;
    echo 'PASS: ', $label, PHP_EOL;
}
function rejected(callable $action, string $label): void {
    try { $action(); } catch (InvalidArgumentException $error) { check(true, $label); return; }
    throw new RuntimeException('FAIL: ' . $label);
}

// Only this CLI process is affected. No secret values are printed or saved.
putenv('APP_ENV=test');
putenv('DB_NAME=lanthit_unit_test');
putenv('DB_USER=test_user');
putenv('DB_PASSWORD=');
putenv('DB_PORT=3306');
putenv('LANTHIT_CONFIG_FILE');
$config = Config::load(__DIR__ . '/absent.local.php');
check($config['database']['name'] === 'lanthit_unit_test', 'environment overrides example configuration');
check($config['openai']['model'] === (getenv('OPENAI_MODEL') ?: 'gpt-4o'), 'requested GPT-4o model is configurable');
check($config['database']['port'] === 3306, 'port normalized to integer');
putenv('DB_PORT=3306;dbname=other');
rejected(fn() => Config::load(), 'invalid port rejected');
putenv('DB_PORT=3306');
putenv('APP_ENV=production');
rejected(fn() => Config::load(), 'empty production database password rejected');
putenv('APP_ENV=test');
rejected(fn() => Database::connect(array_replace($config['database'], ['name' => 'test;host=elsewhere'])), 'database DSN injection rejected before connecting');
rejected(fn() => Database::connect(array_replace($config['database'], ['host' => 'localhost;dbname=other'])), 'hostname DSN injection rejected before connecting');
rejected(fn() => Database::connect(array_replace($config['database'], ['unix_socket' => 'relative.sock'])), 'relative socket rejected before connecting');
Database::assertSupportedVersion('8.0.16');
check(true, 'MySQL minimum version accepted');
Database::assertSupportedVersion('5.5.5-10.4.32-MariaDB');
check(true, 'MariaDB compatibility prefix parsed correctly');
foreach (['5.7.44', '8.0.15', '10.3.39-MariaDB', 'unknown'] as $version) {
    try {
        Database::assertSupportedVersion($version);
    } catch (RuntimeException $error) {
        check(true, 'unsupported database version rejected: ' . $version);
        continue;
    }
    throw new RuntimeException('Unsupported database version accepted.');
}

$schema = json_decode(file_get_contents(dirname(__DIR__) . '/ai/schemas/essay-feedback.v1.json'), true, 512, JSON_THROW_ON_ERROR);
$visit = function (array $node) use (&$visit): void {
    if (($node['type'] ?? '') === 'object') {
        check(($node['additionalProperties'] ?? null) === false, 'AI schema object forbids unknown properties');
        $properties = array_keys($node['properties']);
        $required = $node['required'];
        sort($properties); sort($required);
        check($properties === $required, 'AI schema requires all declared fields');
        foreach ($node['properties'] as $child) { $visit($child); }
    }
    if (isset($node['items'])) { $visit($node['items']); }
};
$visit($schema);
echo $count, ' unit checks passed.', PHP_EOL;
