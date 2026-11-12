<?php

namespace App\Enums;

enum LogAction: string
{
    case Created = 'CREATED';
    case Updated = 'UPDATED';
    case Deleted = 'DELETED';
    case StatusChanged = 'STATUS_CHANGED';
    case PasswordChanged = 'PASSWORD_CHANGED';
    // case Login = 'LOGIN';
    // case Logout = 'LOGOUT';

    public function label(): string
    {
        return match ($this) {
            self::Created => 'Tambah Data',
            self::Updated => 'Ubah Data',
            self::Deleted => 'Hapus Data',
            self::StatusChanged => 'Ubah Status',
            self::PasswordChanged => 'Ubah Password',
            // self::Login => 'Login',
            // self::Logout => 'Logout',
        };
    }
}

