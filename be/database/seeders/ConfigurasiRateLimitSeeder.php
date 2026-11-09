<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ConfigurasiRateLimitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        $data = [
            [
                'name'                => 'login',
                'request_per_minutes' => 5,
                'minutes'             => 15,
                'status'           => true,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
            [
                'name'                => 'otp-send',
                'request_per_minutes' => 3,
                'minutes'             => 10,
                'status'           => true,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
            [
                'name'                => 'otp-verify',
                'request_per_minutes' => 5,
                'minutes'             => 1,
                'status'           => true,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
            [
                'name'                => 'scan-ktp',
                'request_per_minutes' => 10,
                'minutes'             => 1,
                'status'           => true,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
        ];

        DB::table('setting.configurasi_rate_limits')->upsert(
            $data,
            ['name'],
            ['request_per_minutes', 'minutes', 'status', 'updated_at']
        );
    }
}