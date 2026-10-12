<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailWhitelist extends Model
{
    protected $fillable = [
        'domain',
        'is_active',
        'created_by',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}


