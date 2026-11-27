<?php

namespace App\Services;

use App\Models\Motor;
use App\Models\MotorPrice;
use App\Models\MotorUnit;
use App\Models\MotorUnitMovement;
use App\Models\TempMotor;
use App\Repositories\MotorPriceRepository;
use App\Repositories\MotorStockRepository;
use App\Repositories\MotorUnitRepository;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;

class MotorUnitService
{
    public function __construct(
        protected MotorStockRepository $stockRepo,
        protected MotorUnitRepository $unitRepo,
        protected MotorPriceRepository $priceRepo
    ) {}

    /**
     * Input unit motor fisik baru (penerimaan dari AHM):
     * Berelasi ke master.motors menggunakan item_code dan otomatis men-SUM ke motor_stocks.
     */
    public function addUnit(array $data, ?int $userId = null): MotorUnit
    {
        return DB::transaction(function () use ($data, $userId): MotorUnit {
            $itemCode    = strtoupper(trim((string) $data['item_code']));
            $nomorRangka = strtoupper(trim((string) $data['nomor_rangka']));
            $nomorMesin  = strtoupper(trim((string) $data['nomor_mesin']));

            if (MotorUnit::query()->where('nomor_rangka', $nomorRangka)->lockForUpdate()->exists()) {
                throw new RuntimeException("Unit dengan nomor rangka {$nomorRangka} sudah terdaftar.");
            }

            if (MotorUnit::query()->where('nomor_mesin', $nomorMesin)->lockForUpdate()->exists()) {
                throw new RuntimeException("Unit dengan nomor mesin {$nomorMesin} sudah terdaftar.");
            }

            $stock = $this->stockRepo->findOrCreate(null, $itemCode);
            $motorPriceId = $this->resolveMotorPriceId(
                $itemCode,
                $nomorRangka,
                isset($data['motor_price_id']) ? (int) $data['motor_price_id'] : null
            );

            $unit = MotorUnit::query()->create([
                'motor_stock_id' => $stock->id,
                'item_code'      => $itemCode,
                'motor_price_id' => $motorPriceId,
                'nomor_rangka'   => $nomorRangka,
                'nomor_mesin'    => $nomorMesin,
                'status'         => MotorUnit::STATUS_AVAILABLE,
            ]);

            $this->recordMovement(
                unit: $unit,
                jenisPergerakan: MotorUnitMovement::TYPE_STOCK_IN,
                statusAwal: null,
                statusAkhir: MotorUnit::STATUS_AVAILABLE,
                userId: $userId,
                catatan: $data['catatan'] ?? 'Penerimaan unit fisik motor baru dari AHM',
            );

            $stock->syncFromUnits();

            return $unit->fresh(['stock', 'motor', 'motorPrice']);
        });
    }

    /**
     * Import data penerimaan unit fisik motor secara massal dari file Excel (.xlsx / .xls).
     * Format kolom wajib: item_code, nomor_rangka, nomor_mesin
     * Format kolom opsional: motor_price_id, catatan
     */
    public function importFromExcel(string $filePath, ?int $userId = null): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $worksheet   = $spreadsheet->getActiveSheet();
        $rows        = $worksheet->toArray(null, true, true, true);

        if (empty($rows)) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['File Excel kosong.'],
                'imported' => [],
            ];
        }

        $header           = array_shift($rows);
        $normalizedHeader = array_map(fn ($h) => strtolower(trim((string) $h)), $header);
        $expectedHeader   = ['item_code', 'nomor_rangka', 'nomor_mesin'];
        $actualHeader     = array_values(array_filter($normalizedHeader, fn ($h) => $h !== ''));

        if (array_slice($actualHeader, 0, count($expectedHeader)) !== $expectedHeader) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['Header Excel tidak sesuai format. Harus: ' . implode(', ', $expectedHeader) . ' (opsional: motor_price_id, catatan)'],
                'imported' => [],
            ];
        }

        $columnMap = array_flip($normalizedHeader);

        $rules = [
            'item_code'      => ['required', 'string', 'max:6', Rule::exists(Motor::class, 'item_code')],
            'nomor_rangka'   => ['required', 'string', 'max:50'],
            'nomor_mesin'    => ['required', 'string', 'max:50'],
            'motor_price_id' => ['nullable', 'integer', Rule::exists(MotorPrice::class, 'id')],
            'catatan'        => ['nullable', 'string', 'max:500'],
        ];

        $messages = [
            'item_code.required'      => 'Kode item motor wajib diisi.',
            'item_code.max'           => 'Kode item motor maksimal 6 karakter.',
            'item_code.exists'        => 'Kode item motor tidak ditemukan di master motor.',
            'nomor_rangka.required'   => 'Nomor rangka wajib diisi.',
            'nomor_rangka.max'        => 'Nomor rangka maksimal 50 karakter.',
            'nomor_mesin.required'    => 'Nomor mesin wajib diisi.',
            'nomor_mesin.max'         => 'Nomor mesin maksimal 50 karakter.',
            'motor_price_id.integer'  => 'ID master harga harus berupa angka.',
            'motor_price_id.exists'   => 'Master harga motor tidak ditemukan.',
            'catatan.max'             => 'Catatan maksimal 500 karakter.',
        ];

        $success  = 0;
        $failed   = 0;
        $errors   = [];
        $imported = [];

        foreach ($rows as $rowIndex => $row) {
            $rowNumber = $rowIndex + 1;

            $itemCode    = strtoupper(trim((string) ($row[$columnMap['item_code']] ?? '')));
            $nomorRangka = strtoupper(trim((string) ($row[$columnMap['nomor_rangka']] ?? '')));
            $nomorMesin  = strtoupper(trim((string) ($row[$columnMap['nomor_mesin']] ?? '')));
            $priceRaw    = isset($columnMap['motor_price_id']) ? trim((string) ($row[$columnMap['motor_price_id']] ?? '')) : '';
            $catatanRaw  = isset($columnMap['catatan']) ? trim((string) ($row[$columnMap['catatan']] ?? '')) : '';

            if ($itemCode === '' && $nomorRangka === '' && $nomorMesin === '') {
                continue;
            }

            $rowData = [
                'item_code'      => $itemCode,
                'nomor_rangka'   => $nomorRangka,
                'nomor_mesin'    => $nomorMesin,
                'motor_price_id' => $priceRaw !== '' ? (is_numeric($priceRaw) ? (int) $priceRaw : $priceRaw) : null,
                'catatan'        => $catatanRaw !== '' ? $catatanRaw : null,
            ];

            $validator = Validator::make($rowData, $rules, $messages);

            if ($validator->fails()) {
                $failed++;
                $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                continue;
            }

            try {
                $imported[] = $this->addUnit($rowData, $userId);
                $success++;
            } catch (RuntimeException $e) {
                $failed++;
                $errors[] = "Baris {$rowNumber}: " . $e->getMessage();
            }
        }

        return [
            'success'  => $success,
            'failed'   => $failed,
            'errors'   => $errors,
            'imported' => $imported,
        ];
    }

    /**
     * Perbarui data unit fisik motor & sinkronkan stok jika status berubah.
     */
    public function updateUnit(int $unitId, array $data, ?int $userId = null): MotorUnit
    {
        return DB::transaction(function () use ($unitId, $data, $userId): MotorUnit {
            /** @var MotorUnit|null $unit */
            $unit = MotorUnit::query()->where('id', $unitId)->lockForUpdate()->first();

            if (! $unit) {
                throw new RuntimeException('Unit fisik motor tidak ditemukan.');
            }

            $updatePayload = [];

            if (array_key_exists('motor_price_id', $data)) {
                $updatePayload['motor_price_id'] = $data['motor_price_id'];
            }

            if (isset($data['nomor_rangka'])) {
                $newRangka = strtoupper(trim((string) $data['nomor_rangka']));
                if ($newRangka !== $unit->nomor_rangka && MotorUnit::query()->where('nomor_rangka', $newRangka)->where('id', '!=', $unit->id)->lockForUpdate()->exists()) {
                    throw new RuntimeException("Unit dengan nomor rangka {$newRangka} sudah terdaftar.");
                }
                $updatePayload['nomor_rangka'] = $newRangka;
            }

            if (isset($data['nomor_mesin'])) {
                $newMesin = strtoupper(trim((string) $data['nomor_mesin']));
                if ($newMesin !== $unit->nomor_mesin && MotorUnit::query()->where('nomor_mesin', $newMesin)->where('id', '!=', $unit->id)->lockForUpdate()->exists()) {
                    throw new RuntimeException("Unit dengan nomor mesin {$newMesin} sudah terdaftar.");
                }
                $updatePayload['nomor_mesin'] = $newMesin;
            }

            $statusAwal = $unit->status;
            if (isset($data['status']) && $data['status'] !== $unit->status) {
                $statusAkhir = strtoupper(trim((string) $data['status']));
                $updatePayload['status'] = $statusAkhir;

                $this->recordMovement(
                    unit: $unit,
                    jenisPergerakan: MotorUnitMovement::TYPE_STATUS_CHANGE,
                    statusAwal: $statusAwal,
                    statusAkhir: $statusAkhir,
                    userId: $userId,
                    catatan: $data['catatan'] ?? "Perubahan status unit dari {$statusAwal} ke {$statusAkhir}",
                );
            }

            if (!empty($updatePayload)) {
                $unit->update($updatePayload);
                $unit->stock?->syncFromUnits();
            }

            return $unit->fresh(['stock', 'motor', 'tempMotor.dikunciOleh']);
        });
    }

    /**
     * Kunci unit saat dipilih di proses penjualan (status menjadi RESERVED / Dalam Proses).
     * Data pengunci disimpan ke tabel temp.temp_motors.
     */
    public function reserveUnit(
        int $unitId,
        ?int $userId = null,
        ?CarbonInterface $dikunciSampai = null,
        ?string $catatan = null
    ): MotorUnit {
        return DB::transaction(function () use ($unitId, $userId, $dikunciSampai, $catatan): MotorUnit {
            /** @var MotorUnit|null $unit */
            $unit = MotorUnit::query()->where('id', $unitId)->lockForUpdate()->first();

            if (! $unit) {
                throw new RuntimeException('Unit fisik motor tidak ditemukan.');
            }

            if ($unit->status !== MotorUnit::STATUS_AVAILABLE) {
                throw new RuntimeException("Unit dengan nomor mesin {$unit->nomor_mesin} tidak dapat dikunci karena sedang berstatus {$unit->status}.");
            }

            $statusAwal = $unit->status;

            $unit->update([
                'status' => MotorUnit::STATUS_RESERVED,
            ]);

            TempMotor::updateOrCreate(
                ['master_unit_id' => $unit->id],
                [
                    'dikunci_oleh'   => $userId,
                    'dikunci_sampai' => $dikunciSampai,
                    'catatan'        => $catatan,
                ]
            );

            $this->recordMovement(
                unit: $unit,
                jenisPergerakan: MotorUnitMovement::TYPE_RESERVE,
                statusAwal: $statusAwal,
                statusAkhir: MotorUnit::STATUS_RESERVED,
                userId: $userId,
                catatan: $catatan ?? 'Unit dikunci untuk proses penjualan',
            );

            $unit->stock?->syncFromUnits();

            return $unit->fresh(['stock', 'motor', 'tempMotor.dikunciOleh']);
        });
    }

    /**
     * Lepas kunci unit jika penjualan dibatalkan sehingga kembali AVAILABLE,
     * dan hapus data kunci dari temp.temp_motors.
     */
    public function releaseUnit(
        int $unitId,
        ?int $userId = null,
        ?string $catatan = null
    ): MotorUnit {
        return DB::transaction(function () use ($unitId, $userId, $catatan): MotorUnit {
            /** @var MotorUnit|null $unit */
            $unit = MotorUnit::query()->where('id', $unitId)->lockForUpdate()->first();

            if (! $unit) {
                throw new RuntimeException('Unit fisik motor tidak ditemukan.');
            }

            if ($unit->status !== MotorUnit::STATUS_RESERVED) {
                throw new RuntimeException("Kunci unit tidak dapat dilepas dari status {$unit->status}.");
            }

            $statusAwal = $unit->status;

            $unit->update([
                'status' => MotorUnit::STATUS_AVAILABLE,
            ]);

            TempMotor::query()->where('master_unit_id', $unit->id)->delete();

            $this->recordMovement(
                unit: $unit,
                jenisPergerakan: MotorUnitMovement::TYPE_RELEASE,
                statusAwal: $statusAwal,
                statusAkhir: MotorUnit::STATUS_AVAILABLE,
                userId: $userId,
                catatan: $catatan ?? 'Kunci unit dilepas kembali ke AVAILABLE',
            );

            $unit->stock?->syncFromUnits();

            return $unit->fresh(['stock', 'motor', 'tempMotor']);
        });
    }

    /**
     * Finalisasi penjualan unit (status menjadi SOLD), hapus kunci di temp.temp_motors, & update motor_stocks.
     */
    public function sellUnit(
        int $unitId,
        ?int $userId = null,
        ?string $catatan = null
    ): MotorUnit {
        return DB::transaction(function () use ($unitId, $userId, $catatan): MotorUnit {
            /** @var MotorUnit|null $unit */
            $unit = MotorUnit::query()->where('id', $unitId)->lockForUpdate()->first();

            if (! $unit) {
                throw new RuntimeException('Unit fisik motor tidak ditemukan.');
            }

            if (! in_array($unit->status, [MotorUnit::STATUS_AVAILABLE, MotorUnit::STATUS_RESERVED], true)) {
                throw new RuntimeException("Unit dengan status {$unit->status} tidak dapat dijual.");
            }

            $statusAwal = $unit->status;

            $unit->update([
                'status'          => MotorUnit::STATUS_SOLD,
                'tanggal_terjual' => now(),
            ]);

            TempMotor::query()->where('master_unit_id', $unit->id)->delete();

            $this->recordMovement(
                unit: $unit,
                jenisPergerakan: MotorUnitMovement::TYPE_SELL,
                statusAwal: $statusAwal,
                statusAkhir: MotorUnit::STATUS_SOLD,
                userId: $userId,
                catatan: $catatan ?? 'Penjualan unit selesai (SOLD)',
            );

            $unit->stock?->syncFromUnits();

            return $unit->fresh(['stock', 'motor']);
        });
    }

    private function recordMovement(
        MotorUnit $unit,
        string $jenisPergerakan,
        ?string $statusAwal,
        string $statusAkhir,
        ?int $userId,
        ?string $catatan,
    ): void {
        MotorUnitMovement::query()->create([
            'motor_unit_id'    => $unit->id,
            'motor_stock_id'   => $unit->motor_stock_id,
            'dealer_id'        => null,
            'item_code'        => $unit->item_code,
            'jenis_pergerakan' => $jenisPergerakan,
            'status_awal'      => $statusAwal,
            'status_akhir'     => $statusAkhir,
            'user_id'          => $userId,
            'catatan'          => $catatan,
            'created_at'       => now(),
        ]);
    }

    /**
     * Tentukan motor_price_id secara otomatis dari VIN (digit ke-10 ISO 3779) atau fallback tahun berjalan.
     */
    private function resolveMotorPriceId(string $itemCode, string $nomorRangka, ?int $givenPriceId = null): ?int
    {
        if ($givenPriceId !== null && $givenPriceId > 0) {
            return $givenPriceId;
        }

        $tahunProduksi = $this->detectProductionYearFromVin($nomorRangka);
        $price = $this->priceRepo->findByItemAndYear($itemCode, $tahunProduksi);

        return $price?->id;
    }

    /**
     * Ekstrak tahun produksi dari digit ke-10 Nomor Rangka (VIN 17 karakter).
     */
    private function detectProductionYearFromVin(string $nomorRangka): int
    {
        $vin = strtoupper(trim($nomorRangka));
        if (strlen($vin) === 17) {
            $yearCode = $vin[9];
            $map = [
                'L' => 2020,
                'M' => 2021,
                'N' => 2022,
                'P' => 2023,
                'R' => 2024,
                'S' => 2025,
                'T' => 2026,
                'V' => 2027,
                'W' => 2028,
                'X' => 2029,
                'Y' => 2030,
            ];

            if (isset($map[$yearCode])) {
                return $map[$yearCode];
            }
        }

        return (int) date('Y');
    }
}
