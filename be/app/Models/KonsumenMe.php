<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class KonsumenMe extends Model
{
    // use LogsActivity;
    // public function getActivitylogOptions(): LogOptions
    // {
    //     return LogOptions::defaults()
    //         ->useLogName('konsumen me')
    //         ->logOnly(['fk_me', 'fk_konsumen'])
    //         ->logOnlyDirty()
    //         ->dontSubmitEmptyLogs();
    // }
    protected $fillable = [
        'fk_me',
        'fk_konsumen',
    ];

    public function me()
    {
        return $this->belongsTo(User::class, 'fk_me');
    }

    public function konsumen()
    {
        return $this->belongsTo(Konsumen::class, 'fk_konsumen');
    }
}
