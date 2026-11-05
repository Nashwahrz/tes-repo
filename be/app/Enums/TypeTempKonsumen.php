<?php

namespace App\Enums;

enum TypeTempKonsumen: string
{
    case Tambah   = 'tambah';
    case Edit     = 'edit';
    case Revisi = 'revisi';
    public function label(): string
    {
        return match ($this) {
            TypeTempKonsumen::Tambah => 'Tambah',
            TypeTempKonsumen::Edit => 'Edit',
            TypeTempKonsumen::Revisi =>'Revisi'
        };
    }
}
