<?php

namespace App\Enums;

enum StatusUser: string
{
    case Pending   = 'pending';
    case Aktif     = 'aktif';
    case Ditolak  = 'ditolak';

    public function label(): string
    {
        return match($this) {
            StatusUser::Pending  => 'Menunggu Verifikasi',
            StatusUser::Aktif    => 'Aktif',
            StatusUser::Ditolak => 'Ditolak',
        };
    }
}
