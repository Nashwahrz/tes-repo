<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class PekerjaanSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/master_pekerjaan.xlsx');

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
            $status    = $this->clean($cols[2] ?? '');
            $sequence    = $this->clean($cols[3] ?? '');
            $type_header    = $this->clean($cols[4] ?? '');
            $sector_job    = $this->clean($cols[5] ?? '');
            $id_parent    = $this->clean($cols[6] ?? '');

            if ($kode === '' && $name === '') {
                continue; 
            }

            if (strtolower($kode) === 'id_md') {
                continue;
            }

            if ($kode === '' || $name === '') {
                $this->command?->warn('Baris ' . ($i + 1) . ' dilewati (data kurang).');
                continue;
            }

            foreach (['status' => $status, 'sequence' => $sequence, 'id_parent' => $id_parent] as $field => $val) {
                if (! is_numeric($val)) {
                    $this->command?->warn('Baris ' . ($i + 1) . " dilewati ({$field} tidak valid: '{$val}').");
                    continue 2;
                }
            }


            $rows[$kode] = [
                'pekerjaan_code'                => $kode,
                'pekerjaan_name'                => $name,
                'sequence'                => $sequence,
                'type_header'                => $type_header,
                'sector_job'                => $sector_job,
                'id_parent'                => $id_parent,
                'status'                => $status,
                'created_at'          => now(),
                'updated_at'          => now(),
            ];
        }

        DB::transaction(function () use ($rows) {
            foreach (array_chunk(array_values($rows), 500) as $chunk) {
                DB::table('master.pekerjaans')->upsert(
                    $chunk,
                    ['pekerjaan_code'],
                    ['pekerjaan_name', 'sequence', 'type_header', 'sector_job', 'id_parent', 'status', 'updated_at']
                );
            }
        });

        $this->command?->info(count($rows) . ' pekerjaan di-seed.');
    }

    private function clean(mixed $value): string
    {
        if (is_float($value) && floor($value) === $value) {
            $value = (int) $value;
        }

        return trim(str_replace("\xC2\xA0", ' ', (string) $value));
    }
}