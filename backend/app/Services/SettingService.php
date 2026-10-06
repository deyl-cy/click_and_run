<?php

namespace App\Services;

use App\Models\Setting;

class SettingService
{
    /**
     * Setting key => default value.
     */
    public const DEFAULTS = [
        'default_confidence' => 30,
        'idle_timeout_minutes' => 15,
        'lab_name' => 'PhilRice Genebank',
    ];

    /**
     * Extra minutes the server keeps a token alive beyond the idle limit.
     */
    public const SERVER_GRACE_MINUTES = 5;

    public static function all(): array
    {
        $stored = Setting::query()
            ->whereIn('key', array_keys(self::DEFAULTS))
            ->pluck('value', 'key')
            ->all();

        $settings = [];

        foreach (self::DEFAULTS as $key => $default) {
            $value = $stored[$key] ?? $default;

            $settings[$key] = is_int($default)
                ? (int) $value
                : (string) $value;
        }

        return $settings;
    }

    public static function get(string $key)
    {
        return self::all()[$key] ?? null;
    }

    public static function update(array $values): array
    {
        foreach ($values as $key => $value) {
            if (!array_key_exists($key, self::DEFAULTS)) {
                continue;
            }

            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value]
            );
        }

        return self::all();
    }

    public static function reset(): array
    {
        Setting::query()
            ->whereIn('key', array_keys(self::DEFAULTS))
            ->delete();

        return self::all();
    }

    /**
     * Minutes a login token stays valid without activity.
     */
    public static function sessionMinutes(): int
    {
        return (int) self::get('idle_timeout_minutes')
            + self::SERVER_GRACE_MINUTES;
    }
}
