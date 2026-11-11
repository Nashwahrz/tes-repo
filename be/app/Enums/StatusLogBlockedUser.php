<?php

namespace App\Enums;

enum StatusLogBlockedUser: string
{
    case Aktif       = 'aktif';
    case Dibuka      = 'dibuka';
    case Kedaluwarsa = 'kedaluwarsa';

    public function label(): string
    {
        return match ($this) {
            self::Aktif       => 'Aktif',
            self::Dibuka      => 'Dibuka',
            self::Kedaluwarsa => 'Kedaluwarsa',
        };
    }

    public static function tryFromQuery(?string $value): ?self
    {
        if (!$value) {
            return null;
        }

        $normalized = strtolower(trim($value));

        return match ($normalized) {
            'aktif', 'active'             => self::Aktif,
            'dibuka', 'unlocked'          => self::Dibuka,
            'kedaluwarsa', 'expired'      => self::Kedaluwarsa,
            default                       => self::tryFrom($normalized),
        };
    }
}

