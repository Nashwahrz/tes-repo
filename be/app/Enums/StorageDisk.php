<?php

namespace App\Enums;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

enum StorageDisk: string
{
    case Local  = 'local';
    case Public = 'public';

    public function disk(): Filesystem
    {
        return Storage::disk($this->value);
    }
}

