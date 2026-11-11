<?php

namespace App\Enums;

enum SectorJob: string
{
    case Formal = 'Formal';
    case Informal = 'Informal';
    case TidakBekerja = 'Tidak Bekerja';

    public function isFormal(): bool
    {
        return $this === self::Formal;
    }

    public function isInformal(): bool
    {
        return $this === self::Informal;
    }

    public function isTidakBekerja(): bool
    {
        return $this === self::TidakBekerja;
    }
}

