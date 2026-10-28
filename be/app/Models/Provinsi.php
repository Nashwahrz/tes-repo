<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Provinsi extends Model
{
    protected $table = 'master.provinsis';

    protected $fillable = [
        'kode',
        'name',
        'status'
    ];
}
