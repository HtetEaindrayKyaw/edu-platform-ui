<?php
declare(strict_types=1);

// Dependency-free Core PHP foundation. No sessions or authentication are implemented yet.
require_once __DIR__ . '/src/Config.php';
require_once __DIR__ . '/src/Database.php';
date_default_timezone_set('UTC');

return \LanThit\Config::load();
