<?php

namespace App\Enums;

enum SignedUrlLifetime: int
{
    case FotoKtp = 10;

    public function minutes(): int
    {
        return $this->value;
    }
}

