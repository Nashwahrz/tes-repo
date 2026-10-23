<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmailSmtpSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();
        DB::table('setting.email_smtp')->updateOrInsert(
        ['mail_username' => 'ickykuuhaku@gmail.com'],   
        [
            'mail_mailer'       => 'smtp',
            'mail_host'         => 'smtp.gmail.com',
            'mail_port'         => '587',
            'mail_password'     => 'dkgsajdgaggad',
            'mail_encryption'   => 'tls',
            'mail_from_address' => 'ickykuuhaku@gmail.com',
            'mail_from_name'    => 'PT Hayati Pratama Mandiri',
            'is_active'         => true,
            'created_at'        => $now,
            'updated_at'        => $now,
        ]
    );
    }
}
