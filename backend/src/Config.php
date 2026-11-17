<?php
declare(strict_types=1);

namespace LanThit;

use InvalidArgumentException;
use RuntimeException;

final class Config
{
    public static function load(?string $localPath = null): array
    {
        $root = dirname(__DIR__);
        $config = require $root . '/config/config.example.php';
        $configuredPath = getenv('LANTHIT_CONFIG_FILE');
        $localPath = $localPath ?? ($configuredPath !== false && $configuredPath !== '' ? $configuredPath : $root . '/config/local.php');
        if (is_file($localPath)) {
            $local = require $localPath;
            if (!is_array($local)) {
                throw new RuntimeException('The private configuration file must return an array.');
            }
            $config = array_replace_recursive($config, $local);
        } elseif ($configuredPath !== false && $configuredPath !== '') {
            throw new RuntimeException('The specified private configuration file is missing.');
        }

        $variables = [
            'APP_ENV' => ['app', 'environment'],
            'APP_NAME' => ['app', 'name'],
            'DB_HOST' => ['database', 'host'],
            'DB_PORT' => ['database', 'port'],
            'DB_NAME' => ['database', 'name'],
            'DB_USER' => ['database', 'username'],
            'DB_PASSWORD' => ['database', 'password'],
            'DB_SOCKET' => ['database', 'unix_socket'],
            'DB_SSL_CA' => ['database', 'ssl_ca'],
            'OPENAI_API_KEY' => ['openai', 'api_key'],
            'OPENAI_MODEL' => ['openai', 'model'],
        ];
        foreach ($variables as $variable => [$group, $key]) {
            $value = getenv($variable);
            if ($value !== false) {
                $config[$group][$key] = $value;
            }
        }
        if (!in_array($config['app']['environment'], ['local', 'test', 'production'], true)) {
            throw new InvalidArgumentException('APP_ENV must be local, test, or production.');
        }
        $port = filter_var($config['database']['port'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 65535]]);
        if ($port === false) {
            throw new InvalidArgumentException('DB_PORT must be an integer from 1 to 65535.');
        }
        $config['database']['port'] = $port;
        if ($config['app']['environment'] === 'production' && $config['database']['password'] === '') {
            throw new InvalidArgumentException('A database password is required in production.');
        }
        return $config;
    }
}
