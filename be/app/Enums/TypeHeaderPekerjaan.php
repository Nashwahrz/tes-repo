<?php

namespace App\Enums;

enum TypeHeaderPekerjaan: string
{
    case Header = 'H';
    case Detail = 'D';

    public function isHeader(): bool
    {
        return $this === self::Header;
    }

    public function isDetail(): bool
    {
        return $this === self::Detail;
    }
}

