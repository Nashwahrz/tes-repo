<?php

namespace App\Enums;

use Illuminate\Contracts\Filesystem\Filesystem;

enum StoragePath: string
{
    case Ktp = 'ktp';

 
    public function disk(): StorageDisk
    {
        return match ($this) {
            self::Ktp => StorageDisk::Local,
        };
    }

    public function filesystem(): Filesystem
    {
        return $this->disk()->disk();
    }
}

