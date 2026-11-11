<?php

namespace App\Enums;

enum StatusMasterData: int
{
    case Aktif    = 1;
    case NonAktif = 0;

    public function label(): string
    {
        return match ($this) {
            self::Aktif    => 'Aktif',
            self::NonAktif => 'Non-Aktif',
        };
    }

    public static function fromBoolean(mixed $status): self
    {
        return filter_var($status, FILTER_VALIDATE_BOOLEAN) ? self::Aktif : self::NonAktif;
    }

    public static function labelFromBoolean(mixed $status): string
    {
        return self::fromBoolean($status)->label();
    }
}

