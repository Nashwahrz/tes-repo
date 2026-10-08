<?php

namespace App\Enums;

enum JenisKelamin:string
{
    case LakiLaki  = 'Laki-laki';
    case Perempuan = 'Perempuan';

    public function label(): string
    {
        return match($this) {
            JenisKelamin::LakiLaki  => 'Laki-laki',
            JenisKelamin::Perempuan => 'Perempuan',
        };
    }

}
