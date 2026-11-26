<?php

namespace App\Services;

use App\Models\Konsumen;
use App\Models\MotorUnit;
use App\Models\Penjualan;
use App\Repositories\PenjualanRepository;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PenjualanService
{
    public function __construct(
        protected PenjualanRepository $repository,
        protected MotorUnitService $motorUnitService
    ) {}

    /**
     * Buat transaksi penjualan baru dan otomatis mengunci (RESERVED) unit fisik motor yang dipilih.
     */
    public function create(array $data, int $salesId): Penjualan
    {
        return DB::transaction(function () use ($data, $salesId): Penjualan {
            $dealerId = (int) $data['dealer_id'];
            $tanggal  = $data['tanggal_transaksi'] ?? now()->format('Y-m-d');

            /** @var MotorUnit|null $unit */
            $unit = MotorUnit::query()
                ->where('id', $data['motor_unit_id'])
                ->lockForUpdate()
                ->first();

            if (! $unit) {
                throw new RuntimeException('Unit fisik motor tidak ditemukan.');
            }

            if ((int) $unit->dealer_id !== $dealerId) {
                throw new RuntimeException('Unit fisik motor yang dipilih tidak berada di dealer transaksi ini.');
            }

            if ($unit->status !== MotorUnit::STATUS_AVAILABLE) {
                throw new RuntimeException("Unit dengan nomor mesin {$unit->nomor_mesin} tidak tersedia (status saat ini: {$unit->status}).");
            }

            /** @var Konsumen|null $konsumen */
            $konsumen = Konsumen::query()->find($data['konsumen_id']);
            if (! $konsumen) {
                throw new RuntimeException('Data konsumen tidak ditemukan.');
            }

            if ($konsumen->fk_dealer && (int) $konsumen->fk_dealer !== $dealerId) {
                throw new RuntimeException('Konsumen yang dipilih tidak terdaftar pada dealer transaksi ini.');
            }

            $noTransaksi = $this->repository->generateNoTransaksi($tanggal);

            // Kunci unit motor secara otomatis (RESERVED) + sinkronisasi stok
            $this->motorUnitService->reserveUnit(
                unitId: $unit->id,
                userId: $salesId,
                dikunciSampai: null,
                catatan: "Dikunci untuk transaksi penjualan {$noTransaksi}"
            );

            $hargaOtr   = (float) $data['harga_otr'];
            $diskon     = (float) ($data['diskon'] ?? 0);
            $uangMuka   = (float) ($data['uang_muka'] ?? 0);
            $totalHarga = max(0, $hargaOtr - $diskon);
            $metode     = strtoupper(trim((string) $data['metode_pembayaran']));

            $penjualan = Penjualan::query()->create([
                'no_transaksi'       => $noTransaksi,
                'tanggal_transaksi'  => $tanggal,
                'dealer_id'          => $dealerId,
                'konsumen_id'        => $konsumen->id,
                'motor_unit_id'      => $unit->id,
                'item_code'          => $unit->item_code,
                'sales_id'           => $salesId,
                'metode_pembayaran'  => $metode,
                'harga_otr'          => $hargaOtr,
                'diskon'             => $diskon,
                'uang_muka'          => $uangMuka,
                'total_harga'        => $totalHarga,
                'nama_leasing'       => $metode === Penjualan::METODE_KREDIT ? ($data['nama_leasing'] ?? null) : null,
                'tenor_bulan'        => $metode === Penjualan::METODE_KREDIT ? ($data['tenor_bulan'] ?? null) : null,
                'angsuran_per_bulan' => $metode === Penjualan::METODE_KREDIT ? ($data['angsuran_per_bulan'] ?? null) : null,
                'status'             => Penjualan::STATUS_MENUNGGU,
                'catatan'            => $data['catatan'] ?? null,
            ]);

            return $penjualan->fresh(['dealer', 'konsumen', 'motorUnit', 'motor', 'sales', 'kasir']);
        });
    }

    /**
     * Selesaikan pembayaran (LUNAS) dan otomatis ubah status unit fisik menjadi SOLD.
     */
    public function lunas(int $penjualanId, int $kasirId, ?string $catatan = null): Penjualan
    {
        return DB::transaction(function () use ($penjualanId, $kasirId, $catatan): Penjualan {
            /** @var Penjualan|null $penjualan */
            $penjualan = Penjualan::query()
                ->where('id', $penjualanId)
                ->lockForUpdate()
                ->first();

            if (! $penjualan) {
                throw new RuntimeException('Data transaksi penjualan tidak ditemukan.');
            }

            if ($penjualan->status !== Penjualan::STATUS_MENUNGGU) {
                throw new RuntimeException("Transaksi {$penjualan->no_transaksi} tidak dapat dilunasi karena berstatus {$penjualan->status}.");
            }

            // Finalisasi penjualan unit fisik (SOLD) + sinkronisasi motor_stocks
            $this->motorUnitService->sellUnit(
                unitId: $penjualan->motor_unit_id,
                userId: $kasirId,
                catatan: $catatan ?? "Penjualan lunas ({$penjualan->no_transaksi})"
            );

            $penjualan->update([
                'status'        => Penjualan::STATUS_LUNAS,
                'kasir_id'      => $kasirId,
                'tanggal_lunas' => now(),
                'catatan'       => $catatan ?? $penjualan->catatan,
            ]);

            return $penjualan->fresh(['dealer', 'konsumen', 'motorUnit', 'motor', 'sales', 'kasir']);
        });
    }

    /**
     * Batalkan transaksi penjualan dan otomatis lepas kunci unit fisik kembali ke AVAILABLE.
     */
    public function batal(int $penjualanId, int $actorId, ?string $alasanBatal = null): Penjualan
    {
        return DB::transaction(function () use ($penjualanId, $actorId, $alasanBatal): Penjualan {
            /** @var Penjualan|null $penjualan */
            $penjualan = Penjualan::query()
                ->where('id', $penjualanId)
                ->lockForUpdate()
                ->first();

            if (! $penjualan) {
                throw new RuntimeException('Data transaksi penjualan tidak ditemukan.');
            }

            if ($penjualan->status !== Penjualan::STATUS_MENUNGGU) {
                throw new RuntimeException("Transaksi {$penjualan->no_transaksi} tidak dapat dibatalkan karena berstatus {$penjualan->status}.");
            }

            // Lepas kunci unit fisik kembali ke AVAILABLE + sinkronisasi motor_stocks
            $this->motorUnitService->releaseUnit(
                unitId: $penjualan->motor_unit_id,
                userId: $actorId,
                catatan: $alasanBatal
                    ? "Transaksi {$penjualan->no_transaksi} dibatalkan: {$alasanBatal}"
                    : "Transaksi {$penjualan->no_transaksi} dibatalkan"
            );

            $penjualan->update([
                'status'       => Penjualan::STATUS_BATAL,
                'alasan_batal' => $alasanBatal,
            ]);

            return $penjualan->fresh(['dealer', 'konsumen', 'motorUnit', 'motor', 'sales', 'kasir']);
        });
    }
}
