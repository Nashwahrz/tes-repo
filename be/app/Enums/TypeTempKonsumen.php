<?php

namespace App\Enums;

enum TypeTempKonsumen: string
{
    case Tambah   = 'tambah';
    case Edit     = 'edit';
    public function label(): string
    {
        return match ($this) {
            TypeTempKonsumen::Tambah => 'Tambah',
            TypeTempKonsumen::Edit => 'Edit',
        };
    }
}
