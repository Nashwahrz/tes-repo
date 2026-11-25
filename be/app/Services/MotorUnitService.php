<?php

namespace App\Services;

use App\Models\MotorUnit;
use App\Models\MotorUnitMovement;
use App\Repositories\MotorStockRepository;
use App\Repositories\MotorUnitRepository;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class MotorUnitService
{
    public function __construct(
        protected MotorStockRepository $stockRepo,
        protected MotorUnitRepository $unitRepo
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

            $stock = $this->stockRepo->findOrCreate($data['dealer_id'], $itemCode);

            $unit = MotorUnit::query()->create([
                'motor_stock_id' => $stock->id,
                'dealer_id'      => $data['dealer_id'],
                'item_code'      => $itemCode,
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

            return $unit->fresh(['stock', 'motor', 'dealer']);
        });
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

            return $unit->fresh(['stock', 'motor', 'dealer', 'dikunciOleh']);
        });
    }

    /**
     * Kunci unit saat dipilih di proses penjualan (status menjadi RESERVED / Dalam Proses).
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
                'status'         => MotorUnit::STATUS_RESERVED,
                'dikunci_oleh'   => $userId,
                'dikunci_sampai' => $dikunciSampai,
            ]);

            $this->recordMovement(
                unit: $unit,
                jenisPergerakan: MotorUnitMovement::TYPE_RESERVE,
                statusAwal: $statusAwal,
                statusAkhir: MotorUnit::STATUS_RESERVED,
                userId: $userId,
                catatan: $catatan ?? 'Unit dikunci untuk proses penjualan',
            );

            $unit->stock?->syncFromUnits();

            return $unit->fresh(['stock', 'motor', 'dealer', 'dikunciOleh']);
        });
    }

    /**
     * Lepas kunci unit jika penjualan dibatalkan sehingga kembali AVAILABLE.
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
                'status'         => MotorUnit::STATUS_AVAILABLE,
                'dikunci_oleh'   => null,
                'dikunci_sampai' => null,
            ]);

            $this->recordMovement(
                unit: $unit,
                jenisPergerakan: MotorUnitMovement::TYPE_RELEASE,
                statusAwal: $statusAwal,
                statusAkhir: MotorUnit::STATUS_AVAILABLE,
                userId: $userId,
                catatan: $catatan ?? 'Kunci unit dilepas kembali ke AVAILABLE',
            );

            $unit->stock?->syncFromUnits();

            return $unit->fresh(['stock', 'motor', 'dealer', 'dikunciOleh']);
        });
    }

    /**
     * Finalisasi penjualan unit (status menjadi SOLD) & update tabel motor_stocks.
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
                'dikunci_oleh'    => $unit->dikunci_oleh ?? $userId,
                'tanggal_terjual' => now(),
            ]);

            $this->recordMovement(
                unit: $unit,
                jenisPergerakan: MotorUnitMovement::TYPE_SELL,
                statusAwal: $statusAwal,
                statusAkhir: MotorUnit::STATUS_SOLD,
                userId: $userId,
                catatan: $catatan ?? 'Penjualan unit selesai (SOLD)',
            );

            $unit->stock?->syncFromUnits();

            return $unit->fresh(['stock', 'motor', 'dealer', 'dikunciOleh']);
        });
    }

    /**
     * Hapus unit fisik (hanya jika belum berstatus SOLD) & sync ke motor_stocks.
     */
    public function deleteUnit(int $unitId, ?int $userId = null): bool
    {
        return DB::transaction(function () use ($unitId, $userId): bool {
            /** @var MotorUnit|null $unit */
            $unit = MotorUnit::query()->where('id', $unitId)->lockForUpdate()->first();

            if (! $unit) {
                throw new RuntimeException('Unit fisik motor tidak ditemukan.');
            }

            if ($unit->status === MotorUnit::STATUS_SOLD) {
                throw new RuntimeException('Unit yang sudah terjual (SOLD) tidak dapat dihapus.');
            }

            $stock = $unit->stock;

            $this->recordMovement(
                unit: $unit,
                jenisPergerakan: MotorUnitMovement::TYPE_DELETE,
                statusAwal: $unit->status,
                statusAkhir: 'DIHAPUS',
                userId: $userId,
                catatan: 'Penghapusan unit fisik dari stok',
            );

            $deleted = (bool) $unit->delete();

            $stock?->syncFromUnits();

            return $deleted;
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
            'dealer_id'        => $unit->dealer_id,
            'item_code'        => $unit->item_code,
            'jenis_pergerakan' => $jenisPergerakan,
            'status_awal'      => $statusAwal,
            'status_akhir'     => $statusAkhir,
            'user_id'          => $userId,
            'catatan'          => $catatan,
            'created_at'       => now(),
        ]);
    }
}
