<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MotorSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/master_motor.utc');

        if (! is_file($path)) {
            $this->command?->error("File tidak ditemukan: {$path}");
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false || empty($lines)) {
            $this->command?->error("File UTC kosong atau tidak dapat dibaca: {$path}");
            return;
        }

        $now  = now();
        $rows = [];

        foreach ($lines as $i => $line) {
            $line = preg_replace('/^\xEF\xBB\xBF/', '', trim($line));
            if ($line === '') {
                continue;
            }

            $cols = explode(';', $line);
            if (count($cols) < 9) {
                $this->command?->warn('Baris ' . ($i + 1) . ' dilewati (jumlah kolom kurang).');
                continue;
            }

            $itemCode         = strtoupper(trim((string) ($cols[0] ?? '')));
            $typeCode         = strtoupper(trim((string) ($cols[1] ?? '')));
            $typeDescription  = trim((string) ($cols[2] ?? ''));
            $colorCode        = strtoupper(trim((string) ($cols[3] ?? '')));
            $colorDescription = trim((string) ($cols[4] ?? ''));
            $marketName       = trim((string) ($cols[5] ?? ''));
            $class            = trim((string) ($cols[6] ?? ''));
            $startDate        = $this->parseDate($cols[7] ?? '');
            $endDate          = $this->parseDate($cols[8] ?? '');

            if ($itemCode === '' || $typeCode === '' || $colorCode === '' || $startDate === null) {
                $this->command?->warn('Baris ' . ($i + 1) . ' dilewati (data utama tidak lengkap).');
                continue;
            }

            $rows[$itemCode] = [
                'item_code'         => substr($itemCode, 0, 6),
                'type_code'         => substr($typeCode, 0, 3),
                'type_description'  => substr($typeDescription !== '' ? $typeDescription : $marketName, 0, 25),
                'color_code'        => substr($colorCode, 0, 2),
                'color_description' => substr($colorDescription, 0, 15),
                'market_name'       => substr($marketName, 0, 25),
                'class'             => substr($class, 0, 1),
                'start_date'        => $startDate,
                'end_date'          => $endDate,
                'created_at'        => $now,
                'updated_at'        => $now,
            ];
        }

        DB::transaction(function () use ($rows) {
            foreach (array_chunk(array_values($rows), 500) as $chunk) {
                DB::table('master.motors')->upsert(
                    $chunk,
                    ['item_code'],
                    [
                        'type_code',
                        'type_description',
                        'color_code',
                        'color_description',
                        'market_name',
                        'class',
                        'start_date',
                        'end_date',
                        'updated_at',
                    ]
                );
            }
        });

        $this->command?->info(count($rows) . ' master motor di-seed dari master_motor.utc.');
    }

    private function parseDate(?string $raw): ?string
    {
        if (! $raw) {
            return null;
        }

        $raw = trim($raw);
        if ($raw === '' || $raw === '0' || $raw === '00000000') {
            return null;
        }

        try {
            if (preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $raw)) {
                return Carbon::createFromFormat('n/j/Y', $raw)->format('Y-m-d');
            }

            if (preg_match('/^(\d{2})(\d{2})(\d{4})$/', $raw, $m)) {
                return sprintf('%04d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
            }

            return Carbon::parse($raw)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }
}
