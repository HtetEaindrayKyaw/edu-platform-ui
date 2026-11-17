<?php
declare(strict_types=1);

namespace LanThit;

use InvalidArgumentException;
use PDO;
use RuntimeException;

final class Database
{
    public static function connect(array $config): PDO
    {
        if (!extension_loaded('pdo_mysql')) {
            throw new RuntimeException('Enable the pdo_mysql PHP extension.');
        }
        $name = $config['name'] ?? '';
        $host = $config['host'] ?? '';
        $user = $config['username'] ?? '';
        if (!is_string($name) || !preg_match('/\A[A-Za-z0-9_]{1,64}\z/D', $name)) {
            throw new InvalidArgumentException('Set a valid database name.');
        }
        if (!is_string($user) || $user === '') {
            throw new InvalidArgumentException('Set a dedicated database username.');
        }
        $port = filter_var($config['port'] ?? 3306, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 65535]]);
        if ($port === false) {
            throw new InvalidArgumentException('Invalid database port.');
        }
        $socket = $config['unix_socket'] ?? '';
        if ($socket !== '') {
            if (!is_string($socket) || !preg_match('~\A/[^;\x00\r\n]+\z~D', $socket)) {
                throw new InvalidArgumentException('Use an absolute Unix socket path.');
            }
            $dsn = "mysql:unix_socket={$socket};dbname={$name};charset=utf8mb4";
        } else {
            if (!is_string($host) || !preg_match('/\A[A-Za-z0-9_.:\-]+\z/D', $host)) {
                throw new InvalidArgumentException('Invalid database hostname.');
            }
            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
        }
        $timeout = filter_var($config['connect_timeout_seconds'] ?? 5, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 30]]);
        if ($timeout === false) {
            throw new InvalidArgumentException('Invalid connection timeout.');
        }
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
            PDO::ATTR_PERSISTENT => false,
            PDO::ATTR_TIMEOUT => $timeout,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => false,
        ];
        $ca = $config['ssl_ca'] ?? '';
        if ($ca !== '') {
            if (!is_string($ca) || !is_readable($ca)) {
                throw new InvalidArgumentException('The database TLS CA file is not readable.');
            }
            $options[PDO::MYSQL_ATTR_SSL_CA] = $ca;
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
        }
        $pdo = new PDO($dsn, $user, (string) ($config['password'] ?? ''), $options);
        self::assertSupportedVersion((string) $pdo->getAttribute(PDO::ATTR_SERVER_VERSION));
        $pdo->exec("SET SESSION time_zone = '+00:00'");
        $pdo->exec("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
        return $pdo;
    }

    public static function assertSupportedVersion(string $version): void
    {
        if (stripos($version, 'MariaDB') !== false) {
            // Some drivers include a 5.5.5 compatibility prefix.
            if (!preg_match('/(\d+\.\d+\.\d+)-MariaDB/i', $version, $matches) || version_compare($matches[1], '10.4.0', '<')) {
                throw new RuntimeException('This schema requires MariaDB 10.4 or newer.');
            }
            return;
        }
        if (!preg_match('/\A(\d+\.\d+\.\d+)/', $version, $matches) || version_compare($matches[1], '8.0.16', '<')) {
            throw new RuntimeException('This schema requires MySQL 8.0.16 or newer.');
        }
    }
}
