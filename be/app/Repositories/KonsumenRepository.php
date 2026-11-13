<?php

namespace App\Repositories;

use App\Enums\SignedUrlLifetime;
use App\Enums\StatusKonsumen;
use App\Models\Konsumen;
use App\Models\KonsumenMe;
use App\Models\TempKonsumen;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Spatie\Activitylog\Models\Activity;

class KonsumenRepository
{
    public const SUMBER_TEMP = 'temp';
    public const SUMBER_KONSUMEN = 'konsumen';
    public const TYPE_TETAP = 'tetap';

    // public function all(): Collection
    // {
    //     return Konsumen::with(['konsumenMes.me'])->get();
    // }

    public function findById(int $id): ?Konsumen
    {
        return Konsumen::with(['konsumenMes.me'])->find($id);
    }

    public function findByNik(string $nik): ?Konsumen
    {
        return Konsumen::with(['konsumenMes.me'])->where('nik', $nik)->first();
    }

    public function searchByNik(string $keyword, int $limit = 10): Collection
    {
        return Konsumen::with(['konsumenMes.me'])
            ->where(function ($q) use ($keyword) {
                $q->where('nik', 'ILIKE', "%{$keyword}%")
                  ->orWhere('konsumen_name', 'ILIKE', "%{$keyword}%");
            })
            ->limit($limit)
            ->get();
    }

    // public function create(array $data): Konsumen
    // {
    //     return Konsumen::create($data);
    // }

    // public function update(Konsumen $konsumen, array $data): Konsumen
    // {
    //     $konsumen->update($data);
    //     return $konsumen->fresh(['konsumenMes.me']);
    // }

    public function delete(Konsumen $konsumen): bool
    {
        return (bool) $konsumen->delete();
    }

    public function paginate(int $perPage = 10, ?string $search = null, ?int $userId = null): LengthAwarePaginator
    {
        $userId ??= auth()->id();
        abort_if(! $userId, 403);

        return $this->paginateCombined(perPage: $perPage, search: $search, userId: $userId);
    }

    public function paginateAll(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return $this->paginateCombined(perPage: $perPage, search: $search, userId: null);
    }

    public function paginateDealerAll(int $perPage = 10, ?string $search = null, ?int $userId = null, ?int $dealerId = null): LengthAwarePaginator
    {
        abort_if(! $dealerId, 403);
        return $this->paginateCombined(perPage: $perPage, search: $search, userId: $userId, dealerId: $dealerId);
    }

    public function paginateCombined(
        int $perPage = 10,
        ?string $search = null,
        ?int $userId = null,
        ?int $dealerId = null
    ): LengthAwarePaginator {
        $tempTable = (new TempKonsumen())->getTable();
        $konsumenTable = (new Konsumen())->getTable();
        $konsumenMeTable = (new KonsumenMe())->getTable();
        $userTable = (new User())->getTable();

        $statusDiterima = StatusKonsumen::Diterima->value;
        $sumberTemp = self::SUMBER_TEMP;
        $sumberKonsumen = self::SUMBER_KONSUMEN;
        $typeTetap = self::TYPE_TETAP;

        $tempQuery = DB::table("{$tempTable} as t")
            ->leftJoin("{$userTable} as u", 'u.id', '=', 't.fk_me')
            ->leftJoin("{$userTable} as v", 'v.id', '=', 't.verified_by')
            ->select([
                't.id',
                DB::raw('t.id as id_temp'),
                't.fk_konsumen',
                't.fk_me',
                't.type',
                't.nik',
                't.konsumen_name',
                't.fk_temp_lahir',
                't.birth_date',
                't.gender',
                't.ktp_address',
                't.domicile_address',
                't.latitude',
                't.longitude',
                't.rt',
                't.rw',
                't.fk_kelurahan',
                't.fk_kecamatan',
                't.fk_kabupaten_kota',
                't.fk_provinsi',
                't.fk_agama',
                't.marital_status',
                't.fk_pekerjaan',
                't.nationality',
                't.phone',
                't.email',
                't.foto_ktp',
                't.status',
                't.note',
                't.verified_by',
                't.verified_at',
                't.created_at',
                't.updated_at',
                DB::raw("'{$sumberTemp}' as sumber"),
                'u.name as me_name',
                'u.email as me_email',
                'u.fk_dealer as me_fk_dealer',
                'v.name as verifikator_name'
            ])
            ->when($userId, fn ($q) => $q->where('t.fk_me', $userId))
            ->when($dealerId, fn ($q) => $q->where('u.fk_dealer', $dealerId))
            ->whereIn('t.status', [StatusKonsumen::Pending->value, StatusKonsumen::Revisi->value, StatusKonsumen::Ditolak->value]);

        $konsumenQuery = DB::table("{$konsumenTable} as k")
            ->join("{$konsumenMeTable} as km", 'km.fk_konsumen', '=', 'k.id')
            ->leftJoin("{$userTable} as u", 'u.id', '=', 'km.fk_me')
            ->select([
                'k.id',
                DB::raw('NULL::bigint as id_temp'),
                DB::raw('k.id as fk_konsumen'),
                'km.fk_me',
                DB::raw("'{$typeTetap}' as type"),
                'k.nik',
                'k.konsumen_name',
                'k.fk_temp_lahir',
                'k.birth_date',
                'k.gender',
                'k.ktp_address',
                'k.domicile_address',
                'k.latitude',
                'k.longitude',
                'k.rt',
                'k.rw',
                'k.fk_kelurahan',
                'k.fk_kecamatan',
                'k.fk_kabupaten_kota',
                'k.fk_provinsi',
                'k.fk_agama',
                'k.marital_status',
                'k.fk_pekerjaan',
                'k.nationality',
                'k.phone',
                'k.email',
                'k.foto_ktp',
                DB::raw("'{$statusDiterima}' as status"),
                DB::raw('NULL::text as note'),
                DB::raw('NULL::bigint as verified_by'),
                DB::raw('NULL::timestamp as verified_at'),
                'k.created_at',
                'k.updated_at',
                DB::raw("'{$sumberKonsumen}' as sumber"),
                'u.name as me_name',
                'u.email as me_email',
                'u.fk_dealer as me_fk_dealer',
                DB::raw('NULL::varchar as verifikator_name')
            ])
            ->when($userId, fn ($q) => $q->where('km.fk_me', $userId))
            ->when($dealerId, fn ($q) => $q->where('u.fk_dealer', $dealerId))
            ->whereNotIn('k.id', function ($query) use ($userId, $tempTable) {
                $query->select('fk_konsumen')
                    ->from($tempTable)
                    ->when($userId, fn ($q) => $q->where('fk_me', $userId))
                    ->whereNotNull('fk_konsumen')
                    ->whereIn('status', [StatusKonsumen::Pending->value, StatusKonsumen::Revisi->value]);
            });

        $union = $tempQuery->unionAll($konsumenQuery);

        $paginator = DB::query()
            ->fromSub($union, 'combined')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('konsumen_name', 'ILIKE', "%{$search}%")
                      ->orWhere('nik', 'ILIKE', "%{$search}%")
                      ->orWhere('phone', 'ILIKE', "%{$search}%")
                      ->orWhere('status', 'ILIKE', "%{$search}%");
                });
            })
            ->orderByDesc('updated_at')
            ->paginate($perPage);

        $paginator->getCollection()->transform(function ($item) {
            $item->me = (object) [
                'id'        => $item->fk_me,
                'name'      => $item->me_name,
                'email'     => $item->me_email,
                'fk_dealer' => $item->me_fk_dealer,
            ];
            $item->verified_by = $item->verifikator_name ? (object) [
                'id'   => $item->verified_by,
                'name' => $item->verifikator_name,
            ] : null;
            $item->verifiedBy = $item->verified_by;
            $isTemp = ($item->sumber ?? null) === self::SUMBER_TEMP || !empty($item->id_temp);
            $routeParams = ['id' => $item->id];
            if ($isTemp) {
                $routeParams['type'] = self::SUMBER_TEMP;
            }

            $item->foto_ktp_url = $item->foto_ktp ? URL::temporarySignedRoute(
                'konsumens.foto-ktp',
                now()->addMinutes(SignedUrlLifetime::FotoKtp->value),
                $routeParams,
                false
            ) : null;

            return $item;
        });

        return $paginator;
    }

    
}
