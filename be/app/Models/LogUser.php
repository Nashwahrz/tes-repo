<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogUser extends Model
{
    protected $table = 'log_users';

    protected $fillable = [
        'id_user',
        'ip_address',
        'browser',
        'platform',
        'device',
        'city',
        'region',
        'country',
        'latitude',
        'longitude',
        'logged_in_at',
    ];

    protected $casts = [
        'logged_in_at' => 'datetime',
        'latitude'     => 'float',
        'longitude'    => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
