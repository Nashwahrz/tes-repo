<?php

namespace App\Repositories;

use App\Enums\RoleEnum;
use App\Models\MotorUnit;
use App\Models\MotorUnitMovement;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class MotorUnitRepository
{
    /**
     * Ambil daftar unit fisik motor terpaginasi (filter nomor rangka, nomor mesin, item_code, dealer, status).
     */
    public function index(
        int $perPage = 10,
        ?string $search = null,
        ?int $dealerId = null,
        ?string $itemCode = null,
        ?int $stockId = null,
        ?string $status = null
    ): LengthAwarePaginator {
        $query = MotorUnit::query()
            ->with([
                'stock',
                'motor:id,item_code,type_code,type_description,color_code,color_description,market_name,class',
                'motorPrices' => fn ($q) => $q->where('status', true)->orderByDesc('tahun_produksi'),
                'dealer:id,dealer_name,address',
                'tempMotor.dikunciOleh:id,name,email',
            ]);

        $this->applyDealerScope($query, $dealerId);

        if ($itemCode !== null && trim($itemCode) !== '') {
            $query->where('item_code', strtoupper(trim($itemCode)));
        }

        if ($stockId !== null && $stockId > 0) {
            $query->where('motor_stock_id', $stockId);
        }

        if ($status !== null && $status !== '') {
            $query->where('status', strtoupper(trim($status)));
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('nomor_rangka', 'ILIKE', "%{$term}%")
                    ->orWhere('nomor_mesin', 'ILIKE', "%{$term}%")
                    ->orWhere('item_code', 'ILIKE', "%{$term}%")
                    ->orWhereHas('motor', function ($mq) use ($term) {
                        $mq->where('type_code', 'ILIKE', "%{$term}%")
                            ->orWhere('market_name', 'ILIKE', "%{$term}%");
                    })
                    ->orWhereHas('dealer', function ($dq) use ($term) {
                        $dq->where('dealer_name', 'ILIKE', "%{$term}%");
                    });
            });
        }

        return $query->latest('id')->paginate($perPage)->withQueryString();
    }

    /**
     * Cari unit fisik berdasarkan ID.
     */
    public function findById(int|string $id, bool $withMovements = false): ?MotorUnit
    {
        $relations = [
            'stock',
            'motor',
            'motorPrices' => fn ($q) => $q->where('status', true)->orderByDesc('tahun_produksi'),
            'dealer',
            'tempMotor.dikunciOleh:id,name,email',
        ];

        if ($withMovements) {
            $relations['movements'] = fn ($q) => $q->with('user:id,name,email')->latest('id');
        }

        $query = MotorUnit::query()->with($relations);
        $this->applyDealerScope($query);

        return $query->find($id);
    }

    /**
     * Cari unit fisik berdasarkan Nomor Rangka.
     */
    public function findByNomorRangka(string $nomorRangka): ?MotorUnit
    {
        return MotorUnit::query()
            ->with(['stock', 'motor', 'dealer', 'tempMotor.dikunciOleh:id,name,email'])
            ->where('nomor_rangka', strtoupper(trim($nomorRangka)))
            ->first();
    }

    /**
     * Cari unit fisik berdasarkan Nomor Mesin.
     */
    public function findByNomorMesin(string $nomorMesin): ?MotorUnit
    {
        return MotorUnit::query()
            ->with(['stock', 'motor', 'dealer', 'tempMotor.dikunciOleh:id,name,email'])
            ->where('nomor_mesin', strtoupper(trim($nomorMesin)))
            ->first();
    }

    /**
     * Ambil riwayat mutasi / pergerakan unit fisik.
     */
    public function getMovements(int $motorUnitId, int $perPage = 15): LengthAwarePaginator
    {
        return MotorUnitMovement::query()
            ->with(['user:id,name,email', 'motor:id,item_code,market_name', 'dealer:id,dealer_name'])
            ->where('motor_unit_id', $motorUnitId)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Ambil seluruh log pergerakan unit fisik motor lintas unit (terpaginasi & terfilter).
     */
    public function getAllMovements(
        int $perPage = 15,
        ?string $search = null,
        ?int $dealerId = null,
        ?string $itemCode = null,
        ?string $jenisPergerakan = null,
        ?int $motorUnitId = null
    ): LengthAwarePaginator {
        $query = MotorUnitMovement::query()
            ->with([
                'unit:id,nomor_rangka,nomor_mesin,status',
                'user:id,name,email',
                'motor:id,item_code,type_code,market_name,color_description',
                'dealer:id,dealer_name',
            ]);

        $this->applyDealerScope($query, $dealerId);

        if ($motorUnitId !== null && $motorUnitId > 0) {
            $query->where('motor_unit_id', $motorUnitId);
        }

        if ($itemCode !== null && trim($itemCode) !== '') {
            $query->where('item_code', strtoupper(trim($itemCode)));
        }

        if ($jenisPergerakan !== null && trim($jenisPergerakan) !== '') {
            $query->where('jenis_pergerakan', strtoupper(trim($jenisPergerakan)));
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('item_code', 'ILIKE', "%{$term}%")
                    ->orWhere('jenis_pergerakan', 'ILIKE', "%{$term}%")
                    ->orWhere('catatan', 'ILIKE', "%{$term}%")
                    ->orWhereHas('unit', function ($uq) use ($term) {
                        $uq->where('nomor_rangka', 'ILIKE', "%{$term}%")
                            ->orWhere('nomor_mesin', 'ILIKE', "%{$term}%");
                    })
                    ->orWhereHas('motor', function ($mq) use ($term) {
                        $mq->where('market_name', 'ILIKE', "%{$term}%")
                            ->orWhere('type_code', 'ILIKE', "%{$term}%");
                    })
                    ->orWhereHas('dealer', function ($dq) use ($term) {
                        $dq->where('dealer_name', 'ILIKE', "%{$term}%");
                    })
                    ->orWhereHas('user', function ($usq) use ($term) {
                        $usq->where('name', 'ILIKE', "%{$term}%");
                    });
            });
        }

        return $query->latest('id')->paginate($perPage)->withQueryString();
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
