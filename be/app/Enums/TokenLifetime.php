<?php

namespace App\Enums;

enum TokenLifetime: int
{
    case AuthToken = 30;

    public function minutes(): int
    {
        return $this->value;
    }
}

