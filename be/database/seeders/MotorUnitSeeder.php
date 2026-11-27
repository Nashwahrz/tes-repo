<?php

namespace Database\Seeders;

use App\Models\Dealer;
use App\Models\Motor;
use App\Models\MotorStock;
use App\Models\MotorUnit;
use App\Models\MotorUnitMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class MotorUnitSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/motor_unit.xlsx');

        if (! is_file($path)) {
            $this->command?->error("File tidak ditemukan: {$path}");
            return;
        }

        $validItemCodes = Motor::query()
            ->pluck('item_code')
            ->map(fn ($code) => strtoupper(trim((string) $code)))
            ->flip();

        $validDealerIds = Dealer::withoutGlobalScopes()
            ->pluck('id')
            ->flip();

        $actorId = User::query()->value('id');

        $reader = IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(true);
        $sheetRows = $reader->load($path)->getActiveSheet()->toArray(null, true, false, false);

        $seededCount      = 0;
        $skippedCount     = 0;
        $affectedStockIds = [];

        DB::transaction(function () use (
            $sheetRows,
            $validItemCodes,
            $validDealerIds,
            $actorId,
            &$seededCount,
            &$skippedCount,
            &$affectedStockIds
        ) {
            foreach ($sheetRows as $i => $cols) {
                $dealerId     = $this->clean($cols[0] ?? '');
                $itemCode     = strtoupper($this->clean($cols[1] ?? ''));
                $nomorRangka  = strtoupper($this->clean($cols[2] ?? ''));
                $nomorMesin   = strtoupper($this->clean($cols[3] ?? ''));
                $status       = strtoupper($this->clean($cols[4] ?? 'AVAILABLE'));

                if ($dealerId === '' && $itemCode === '' && $nomorRangka === '' && $nomorMesin === '') {
                    continue;
                }

                // Lewati baris header
                if ($i === 0 && strtolower($dealerId) === 'dealer_id') {
                    continue;
                }

                if ($itemCode === '' || $nomorRangka === '' || $nomorMesin === '') {
                    $this->command?->warn('Baris ' . ($i + 1) . ' dilewati (data kurang).');
                    $skippedCount++;
                    continue;
                }

                if (! $validItemCodes->has($itemCode)) {
                    $this->command?->warn('Baris ' . ($i + 1) . " dilewati (item_code '{$itemCode}' tidak ditemukan di master.motors).");
                    $skippedCount++;
                    continue;
                }

                $dealerIdInt = is_numeric($dealerId) ? (int) $dealerId : null;
                if ($dealerIdInt !== null && ! $validDealerIds->has($dealerIdInt)) {
                    $this->command?->warn('Baris ' . ($i + 1) . " dilewati (dealer_id '{$dealerIdInt}' tidak ditemukan di master.dealers).");
                    $skippedCount++;
                    continue;
                }

                // Lewati jika nomor rangka atau nomor mesin sudah ada
                if (MotorUnit::query()->where('nomor_rangka', $nomorRangka)->orWhere('nomor_mesin', $nomorMesin)->exists()) {
                    continue;
                }

                $stock = MotorStock::firstOrCreate(
                    ['dealer_id' => $dealerIdInt, 'item_code' => $itemCode],
                    ['stok_tersedia' => 0, 'stok_dalam_proses' => 0, 'stok_gudang' => 0, 'stok_terjual' => 0]
                );

                $unitStatus = $status !== '' ? $status : MotorUnit::STATUS_AVAILABLE;

                $unit = MotorUnit::query()->create([
                    'motor_stock_id' => $stock->id,
                    'dealer_id'      => $dealerIdInt,
                    'item_code'      => $itemCode,
                    'nomor_rangka'   => $nomorRangka,
                    'nomor_mesin'    => $nomorMesin,
                    'status'         => $unitStatus,
                ]);

                MotorUnitMovement::query()->create([
                    'motor_unit_id'    => $unit->id,
                    'motor_stock_id'   => $stock->id,
                    'dealer_id'        => $dealerIdInt,
                    'item_code'        => $itemCode,
                    'jenis_pergerakan' => MotorUnitMovement::TYPE_STOCK_IN,
                    'status_awal'      => null,
                    'status_akhir'     => $unitStatus,
                    'user_id'          => $actorId,
                    'catatan'          => 'Seed data unit motor dari Excel',
                    'created_at'       => now(),
                ]);

                $affectedStockIds[$stock->id] = $stock;
                $seededCount++;
            }

            foreach ($affectedStockIds as $stock) {
                $stock->syncFromUnits();
            }
        });

        $this->command?->info("{$seededCount} unit motor di-seed ({$skippedCount} baris dilewati).");
    }

    private function clean(mixed $value): string
    {
        if (is_float($value) && floor($value) === $value) {
            $value = (int) $value;
        }

        return trim(str_replace("\xC2\xA0", ' ', (string) $value));
    }
}
