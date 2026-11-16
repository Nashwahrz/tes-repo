<?php

namespace App\Enums;

use Illuminate\Contracts\Filesystem\Filesystem;

enum StoragePath: string
{
    case Ktp       = 'ktp';
    case UserPhoto = 'user_photos';

 
    public function disk(): StorageDisk
    {
        return match ($this) {
            self::Ktp       => StorageDisk::Local,
            self::UserPhoto => StorageDisk::Public,
        };
    }

    public function filesystem(): Filesystem
    {
        return $this->disk()->disk();
    }
}

