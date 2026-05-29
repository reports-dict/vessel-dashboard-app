<?php

return [

    'default' => env('LDAP_CONNECTION', 'default'),

    'connections' => [

        'default' => [
            'hosts'            => explode(',', env('LDAP_DEFAULT_HOSTS', '127.0.0.1')),
            'username'         => env('LDAP_DEFAULT_USERNAME'),
            'password'         => env('LDAP_DEFAULT_PASSWORD'),
            'port'             => (int) env('LDAP_DEFAULT_PORT', 389),
            'base_dn'          => env('LDAP_DEFAULT_BASE_DN'),
            'timeout'          => (int) env('LDAP_DEFAULT_TIMEOUT', 5),
            'use_tls'          => (bool) env('LDAP_DEFAULT_TLS', false),
            'use_sasl'         => (bool) env('LDAP_DEFAULT_SASL', false),
            'sasl_options'     => [],
        ],

    ],

    'logging' => [
        'enabled'  => env('LDAP_LOGGING', true),
        'channel'  => env('LOG_CHANNEL', 'stack'),
        'level'    => env('LDAP_LOGGING_LEVEL', 'info'),
    ],

    'cache' => [
        'enabled'  => env('LDAP_CACHE', false),
        'driver'   => env('LDAP_CACHE_DRIVER', 'file'),
    ],

];
