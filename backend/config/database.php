<?php
declare(strict_types=1);

// Usage from a PRIVATE server-side script:
// $pdo = require '/home/CPANEL_USER/lanthit-backend/config/database.php';
// $stmt = $pdo->prepare('SELECT id, display_name FROM users WHERE email = :email');
// $stmt->execute(['email' => $normalizedEmail]);
// Do not select password hashes, answer keys, or private AI data into public responses.
$config = require dirname(__DIR__) . '/bootstrap.php';
return \LanThit\Database::connect($config['database']);
