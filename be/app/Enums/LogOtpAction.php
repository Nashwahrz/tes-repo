<?php

namespace App\Enums;

enum LogOtpAction: string
{
    case Requested = 'REQUESTED';
    case Verified  = 'VERIFIED';
    case Failed    = 'FAILED';

    public function label(): string
    {
        return match ($this) {
            self::Requested => 'Diminta',
            self::Verified  => 'Berhasil Diverifikasi',
            self::Failed    => 'Gagal Diverifikasi',
        };
    }
}

