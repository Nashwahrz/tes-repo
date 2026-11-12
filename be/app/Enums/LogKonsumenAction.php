<?php

namespace App\Enums;

enum LogKonsumenAction: string
{
    case Submitted = 'SUBMITTED';
    case Verified  = 'VERIFIED';
    case Revised   = 'REVISED';
    case Rejected  = 'REJECTED';
    case Updated   = 'UPDATED';
    case Linked    = 'LINKED';

    public function label(): string
    {
        return match ($this) {
            self::Submitted => 'Pengajuan Dibuat',
            self::Verified  => 'Pengajuan Disetujui (Diterima)',
            self::Revised   => 'Permintaan Revisi',
            self::Rejected  => 'Pengajuan Ditolak',
            self::Updated   => 'Data Pengajuan Diperbarui',
            self::Linked    => 'Ditambahkan ke Daftar Konsumen ME',
        };
    }
}

