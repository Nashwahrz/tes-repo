<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailSmtp extends Model
{
    protected $table = 'setting.email_smtp';
    protected $fillable = [
        'mail_mailer',
        'mail_host',
        'mail_port',
        'mail_username',
        'mail_password',
        'mail_encryption',
        'mail_from_address',
        'mail_from_name',
        'is_active',
    ];
}
