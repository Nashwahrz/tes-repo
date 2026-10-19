<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pekerjaan extends Model
{
    protected $table = 'master.pekerjaans';
    protected $fillable = [
        'name'
    ];
}
