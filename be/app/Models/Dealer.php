<?php

namespace App\Models;

use App\Models\Scopes\DealerModelScope;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

#[ScopedBy([DealerModelScope::class])]
class Dealer extends Model
{
    // use LogsActivity;
    protected $table = 'master.dealers';

    // public function getActivitylogOptions(): LogOptions
    // {
    //     return LogOptions::defaults()
    //         ->useLogName('dealers')
    //         ->logOnly(['dealer_name', 'address', 'latitude', 'longitude'])
    //         ->logOnlyDirty()
    //         ->dontSubmitEmptyLogs();
    // }
    protected $fillable = [
        'dealer_name',
        'address',
        'latitude',
        'longitude',
    ];
}
