<?php

namespace App\Enums;

enum TokenLifetime: int
{
    case AuthToken = 1440;

    public function minutes(): int
    {
        return $this->value;
    }
}

