<?php

namespace App\Repositories;

use App\Enums\RoleEnum;
use App\Models\Penjualan;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class PenjualanRepository
{
    /**
     * Ambil daftar transaksi penjualan terpaginasi dengan pencarian dan filter.
     */
    public function index(
        int $perPage = 10,
        ?string $search = null,
        ?int $dealerId = null,
        ?string $status = null,
        ?string $from = null,
        ?string $to = null
    ): LengthAwarePaginator {
        $query = Penjualan::query()
            ->with([
                'dealer:id,dealer_name,address',
                'konsumen:id,nik,konsumen_name,ktp_address,domicile_address',
                'motorUnit:id,nomor_rangka,nomor_mesin,status,item_code',
                'motor:id,item_code,type_code,type_description,color_code,color_description,market_name,class',
                'sales:id,name,username',
                'kasir:id,name,username',
            ]);

        $this->applyDealerScope($query, $dealerId);

        if ($status !== null && trim($status) !== '') {
            $query->where('status', strtoupper(trim($status)));
        }

        if ($from !== null && trim($from) !== '') {
            $query->whereDate('tanggal_transaksi', '>=', trim($from));
        }

        if ($to !== null && trim($to) !== '') {
            $query->whereDate('tanggal_transaksi', '<=', trim($to));
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('no_transaksi', 'ILIKE', "%{$term}%")
                    ->orWhere('item_code', 'ILIKE', "%{$term}%")
                    ->orWhereHas('konsumen', function ($kq) use ($term) {
                        $kq->where('konsumen_name', 'ILIKE', "%{$term}%")
                            ->orWhere('nik', 'ILIKE', "%{$term}%");
                    })
                    ->orWhereHas('motorUnit', function ($uq) use ($term) {
                        $uq->where('nomor_rangka', 'ILIKE', "%{$term}%")
                            ->orWhere('nomor_mesin', 'ILIKE', "%{$term}%");
                    })
                    ->orWhereHas('motor', function ($mq) use ($term) {
                        $mq->where('market_name', 'ILIKE', "%{$term}%")
                            ->orWhere('type_code', 'ILIKE', "%{$term}%");
                    })
                    ->orWhereHas('dealer', function ($dq) use ($term) {
                        $dq->where('dealer_name', 'ILIKE', "%{$term}%");
                    });
            });
        }

        return $query->latest('id')->paginate($perPage)->withQueryString();
    }

    /**
     * Ambil detail 1 transaksi penjualan berdasarkan ID.
     */
    public function findById(int|string $id): ?Penjualan
    {
        $query = Penjualan::query()->with([
            'dealer',
            'konsumen',
            'motorUnit',
            'motor',
            'sales:id,name,username',
            'kasir:id,name,username',
        ]);

        $this->applyDealerScope($query);

        return $query->find($id);
    }

    /**
     * Ringkasan KPI penjualan (jumlah transaksi, unit terjual, total nilai, per status).
     */
    public function getSummary(?int $dealerId = null, ?string $from = null, ?string $to = null): array
    {
        $query = Penjualan::query();
        $this->applyDealerScope($query, $dealerId);

        if ($from !== null && trim($from) !== '') {
            $query->whereDate('tanggal_transaksi', '>=', trim($from));
        }

        if ($to !== null && trim($to) !== '') {
            $query->whereDate('tanggal_transaksi', '<=', trim($to));
        }

        $stats = $query->selectRaw("
            COUNT(*) as total_transaksi,
            SUM(CASE WHEN status = 'MENUNGGU_PEMBAYARAN' THEN 1 ELSE 0 END) as menunggu_count,
            SUM(CASE WHEN status = 'LUNAS' THEN 1 ELSE 0 END) as lunas_count,
            SUM(CASE WHEN status = 'BATAL' THEN 1 ELSE 0 END) as batal_count,
            COALESCE(SUM(CASE WHEN status != 'BATAL' THEN total_harga ELSE 0 END), 0) as total_nilai_valid,
            COALESCE(SUM(CASE WHEN status = 'LUNAS' THEN total_harga ELSE 0 END), 0) as total_nilai_lunas
        ")->first();

        return [
            'total_transaksi'   => (int) ($stats->total_transaksi ?? 0),
            'menunggu_count'    => (int) ($stats->menunggu_count ?? 0),
            'lunas_count'       => (int) ($stats->lunas_count ?? 0),
            'batal_count'       => (int) ($stats->batal_count ?? 0),
            'unit_terjual'      => (int) ($stats->lunas_count ?? 0),
            'total_nilai_valid' => (float) ($stats->total_nilai_valid ?? 0),
            'total_nilai_lunas' => (float) ($stats->total_nilai_lunas ?? 0),
        ];
    }

    /**
     * Generate nomor transaksi unik harian: TRX-YYYYMMDD-XXXX.
     */
    public function generateNoTransaksi(string $tanggal): string
    {
        $prefix = 'TRX-' . date('Ymd', strtotime($tanggal)) . '-';

        $lastNo = Penjualan::query()
            ->where('no_transaksi', 'LIKE', "{$prefix}%")
            ->orderByDesc('no_transaksi')
            ->lockForUpdate()
            ->value('no_transaksi');

        $nextSeq = 1;
        if ($lastNo) {
            $parts   = explode('-', $lastNo);
            $lastSeq = (int) end($parts);
            $nextSeq = $lastSeq + 1;
        }

        return $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
    }

    private function applyDealerScope($query, ?int $filterDealerId = null): void
    {
        if (Auth::check()) {
            $user     = Auth::user();
            $roleName = $user->relationLoaded('role')
                ? $user->role?->role_name
                : $user->role()->value('role_name');

            if ($roleName !== RoleEnum::SuperAdmin->value && $user->fk_dealer) {
                $query->where('dealer_id', $user->fk_dealer);
                return;
            }
        }

        if ($filterDealerId !== null && $filterDealerId > 0) {
            $query->where('dealer_id', $filterDealerId);
        }
    }
}
