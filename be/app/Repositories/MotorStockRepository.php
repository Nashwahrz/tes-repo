<?php

namespace App\Repositories;

use App\Enums\RoleEnum;
use App\Models\MotorStock;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class MotorStockRepository
{
    /**
     * Ambil daftar stok motor terpaginasi langsung dari tabel motor_stocks.
     */
    public function index(
        int $perPage = 10,
        ?string $search = null,
        ?int $dealerId = null,
        ?string $itemCode = null
    ): LengthAwarePaginator {
        $query = MotorStock::query()
            ->with([
                'motor:id,item_code,type_code,type_description,color_code,color_description,market_name,class',
                'dealer:id,dealer_name,address',
            ]);

        $this->applyDealerScope($query, $dealerId);

        if ($itemCode !== null && trim($itemCode) !== '') {
            $query->where('item_code', strtoupper(trim($itemCode)));
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('item_code', 'ILIKE', "%{$term}%")
                    ->orWhereHas('motor', function ($mq) use ($term) {
                        $mq->where('type_code', 'ILIKE', "%{$term}%")
                            ->orWhere('market_name', 'ILIKE', "%{$term}%")
                            ->orWhere('color_description', 'ILIKE', "%{$term}%");
                    })
                    ->orWhereHas('dealer', function ($dq) use ($term) {
                        $dq->where('dealer_name', 'ILIKE', "%{$term}%");
                    });
            });
        }

        return $query->latest('id')->paginate($perPage)->withQueryString();
    }

    /**
     * Cari baris stok motor berdasarkan ID (beserta daftar unit fisiknya).
     */
    public function findById(int|string $id, bool $withUnits = false): ?MotorStock
    {
        $relations = ['motor', 'dealer'];
        if ($withUnits) {
            $relations['units'] = fn ($q) => $q->with('dikunciOleh:id,name,username')->latest('id');
        }

        $query = MotorStock::query()->with($relations);
        $this->applyDealerScope($query);

        return $query->find($id);
    }

    /**
     * Cari atau buat baris di tabel motor_stocks untuk dealer & item_code motor tertentu.
     */
    public function findOrCreate(int $dealerId, string $itemCode): MotorStock
    {
        return MotorStock::firstOrCreate(
            ['dealer_id' => $dealerId, 'item_code' => strtoupper(trim($itemCode))],
            ['stok_tersedia' => 0, 'stok_dalam_proses' => 0, 'stok_gudang' => 0, 'stok_terjual' => 0]
        );
    }

    private function applyDealerScope($query, ?int $filterDealerId = null): void
    {
        if (Auth::check()) {
            $user = Auth::user();
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
