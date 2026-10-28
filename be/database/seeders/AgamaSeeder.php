<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class AgamaSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/master_agama.xlsx');

        if (! is_file($path)) {
            $this->command?->error("File tidak ditemukan: {$path}");
            return;
        }

        $reader = IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(true);
        $sheetRows = $reader->load($path)->getActiveSheet()->toArray(null, true, false, false);

        $rows = [];

        foreach ($sheetRows as $i => $cols) {
            $kode    = $this->clean($cols[0] ?? '');
            $name    = rtrim($this->clean($cols[1] ?? ''), '.');

            if ($kode === '' && $name === '') {
                continue; 
            }

            if ($i === 0 && strtolower($kode) === 'kode') {
                continue; 
            }

            if ($kode === '' || $name === '') {
                $this->command?->warn('Baris ' . ($i + 1) . ' dilewati (data kurang).');
                continue;
            }



         
            $rows[$kode] = [
                'kode'                => $kode,
                'name'                => $name,
                'created_at'          => now(),
                'updated_at'          => now(),
            ];
        }

        DB::transaction(function () use ($rows) {
            foreach (array_chunk(array_values($rows), 500) as $chunk) {
                DB::table('master.agamas')->upsert(
                    $chunk,
                    ['kode'],
                    ['name', 'updated_at']
                );
            }
        });

        $this->command?->info(count($rows) . ' agama di-seed.');
    }

    private function clean(mixed $value): string
    {
        if (is_float($value) && floor($value) === $value) {
            $value = (int) $value;
        }

        return trim(str_replace("\xC2\xA0", ' ', (string) $value));
    }
}