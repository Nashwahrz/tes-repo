<?php

namespace App\Enums;

enum RoleEnum: string
{
    case SuperAdmin = 'Super Admin';
    case Kacab      = 'Kacab';
    case Adh        = 'ADH';
    case Me         = 'ME';
    case Kasir      = 'Kasir';

    public function label(): string
    {
        return $this->value;
    }
}

