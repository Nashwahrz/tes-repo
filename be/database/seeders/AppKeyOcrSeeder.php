<?php

namespace Database\Seeders;

use DB;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AppKeyOcrSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();
        DB::table('setting.app_key_ocrs')->updateOrInsert(
            ['api_key' => 'jdjkshhs8787'],
            [
                'url'=> 'https://api.ocr.space/parse/image',
                'api_key' => 'jdjkshhs8787',
                'keterangan' => 'ini adalah key ocr',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }
}
