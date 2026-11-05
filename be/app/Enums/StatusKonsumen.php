<?php

namespace App\Enums;

enum StatusKonsumen:string
{
    case Pending  = 'pending';
    case Diterima = 'diterima';
    case Ditolak  = 'ditolak';
    case Revisi   = 'revisi';

    public function label(): string
    {
        return match($this) {
            StatusKonsumen::Pending  => 'Menunggu Verifikasi',
            StatusKonsumen::Diterima => 'Diterima',
            StatusKonsumen::Revisi   => 'Revisi',
            StatusKonsumen::Ditolak  => 'Ditolak',
        };
    }

}
