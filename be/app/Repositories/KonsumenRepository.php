<?php

namespace App\Repositories;

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
    public function all(): Collection
    {
        return Konsumen::with(['konsumenMes.me'])->get();
    }

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
                  ->orWhere('name', 'ILIKE', "%{$keyword}%");
            })
            ->limit($limit)
            ->get();
    }

    public function create(array $data): Konsumen
    {
        return Konsumen::create($data);
    }

    public function update(Konsumen $konsumen, array $data): Konsumen
    {
        $konsumen->update($data);
        return $konsumen->fresh(['konsumenMes.me']);
    }

    public function delete(Konsumen $konsumen): bool
    {
        return (bool) $konsumen->delete();
    }

    public function paginate(int $perPage = 10, ?string $search = null, ?int $userId = null): LengthAwarePaginator
    {
        $userId ??= auth()->id();

        return $this->paginateCombined(perPage: $perPage, search: $search, userId: $userId);
    }

    public function paginateAll(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return $this->paginateCombined(perPage: $perPage, search: $search, userId: null);
    }

    public function paginateDealerAll(int $perPage = 10, ?string $search = null, ?int $userId = null, ?int $dealerId = null): LengthAwarePaginator
    {
        return $this->paginateCombined(perPage: $perPage, search: $search, userId: $userId, dealerId: $dealerId);
    }

    public function paginateCombined(
        int $perPage = 10,
        ?string $search = null,
        ?int $userId = null,
        ?int $dealerId = null
    ): LengthAwarePaginator {
        $tempQuery = DB::table('temp.temp_konsumens as t')
            ->leftJoin('users as u', 'u.id', '=', 't.id_me')
            ->leftJoin('users as v', 'v.id', '=', 't.diverifikasi_oleh')
            ->select([
                't.id',
                DB::raw('t.id as id_temp'),
                't.id_konsumen',
                't.id_me',
                't.tipe',
                't.nik',
                't.name',
                't.kode_tmp_lahir',
                't.tgl_lahir',
                't.jenis_kelamin',
                't.alamat_ktp',
                't.alamat_domisili',
                't.latitude',
                't.longitude',
                't.rt',
                't.rw',
                't.kode_kelurahan',
                't.kode_kecamatan',
                't.kode_kabupaten_kota',
                't.kode_provinsi',
                't.kode_agama',
                't.status_perkawinan',
                't.kode_pekerjaan',
                't.kewarganegaraan',
                't.no_telp',
                't.email',
                't.foto_ktp',
                't.status',
                't.catatan as catatan_penolakan',
                't.diverifikasi_oleh',
                't.diverifikasi_at',
                't.created_at',
                't.updated_at',
                DB::raw("'temp' as sumber"),
                'u.name as me_name',
                'u.email as me_email',
                'u.id_dealer as me_id_dealer',
                'v.name as verifikator_name'
            ])
            ->when($userId, fn ($q) => $q->where('t.id_me', $userId))
            ->when($dealerId, fn ($q) => $q->where('u.id_dealer', $dealerId))
            ->whereIn('t.status', [StatusKonsumen::Pending->value, StatusKonsumen::Revisi->value, StatusKonsumen::Ditolak->value]);

        $konsumenQuery = DB::table('konsumens as k')
            ->join('konsumen_mes as km', 'km.id_konsumen', '=', 'k.id')
            ->leftJoin('users as u', 'u.id', '=', 'km.id_me')
            ->select([
                'k.id',
                DB::raw('NULL::bigint as id_temp'),
                DB::raw('k.id as id_konsumen'),
                'km.id_me',
                DB::raw("'tetap' as tipe"),
                'k.nik',
                'k.name',
                'k.kode_tmp_lahir',
                'k.tgl_lahir',
                'k.jenis_kelamin',
                'k.alamat_ktp',
                'k.alamat_domisili',
                'k.latitude',
                'k.longitude',
                'k.rt',
                'k.rw',
                'k.kode_kelurahan',
                'k.kode_kecamatan',
                'k.kode_kabupaten_kota',
                'k.kode_provinsi',
                'k.kode_agama',
                'k.status_perkawinan',
                'k.kode_pekerjaan',
                'k.kewarganegaraan',
                'k.no_telp',
                'k.email',
                'k.foto_ktp',
                DB::raw("'diterima' as status"),
                DB::raw('NULL::text as catatan_penolakan'),
                DB::raw('NULL::bigint as diverifikasi_oleh'),
                DB::raw('NULL::timestamp as diverifikasi_at'),
                'k.created_at',
                'k.updated_at',
                DB::raw("'konsumen' as sumber"),
                'u.name as me_name',
                'u.email as me_email',
                'u.id_dealer as me_id_dealer',
                DB::raw('NULL::varchar as verifikator_name')
            ])
            ->when($userId, fn ($q) => $q->where('km.id_me', $userId))
            ->when($dealerId, fn ($q) => $q->where('u.id_dealer', $dealerId))
            ->whereNotIn('k.id', function ($query) use ($userId) {
                $query->select('id_konsumen')
                    ->from('temp.temp_konsumens')
                    ->when($userId, fn ($q) => $q->where('id_me', $userId))
                    ->whereNotNull('id_konsumen')
                    ->whereIn('status', [StatusKonsumen::Pending->value, StatusKonsumen::Revisi->value]);
            });

        $union = $tempQuery->unionAll($konsumenQuery);

        $paginator = DB::query()
            ->fromSub($union, 'combined')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                      ->orWhere('nik', 'ILIKE', "%{$search}%")
                      ->orWhere('no_telp', 'ILIKE', "%{$search}%")
                      ->orWhere('status', 'ILIKE', "%{$search}%");
                });
            })
            ->orderByDesc('updated_at')
            ->paginate($perPage);

        $paginator->getCollection()->transform(function ($item) {
            $item->me = (object) [
                'id'        => $item->id_me,
                'name'      => $item->me_name,
                'email'     => $item->me_email,
                'id_dealer' => $item->me_id_dealer,
            ];
            $item->verified_by = $item->verifikator_name ? (object) [
                'id'   => $item->diverifikasi_oleh,
                'name' => $item->verifikator_name,
            ] : null;
            $item->verifiedBy = $item->verified_by;
            $isTemp = ($item->sumber ?? null) === 'temp' || !empty($item->id_temp);
            $routeParams = ['id' => $item->id];
            if ($isTemp) {
                $routeParams['type'] = 'temp';
            }

            $item->foto_ktp_url = $item->foto_ktp ? URL::temporarySignedRoute(
                'konsumens.foto-ktp',
                now()->addMinutes(10),
                $routeParams,
                false
            ) : null;

            return $item;
        });

        return $paginator;
    }

    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', Konsumen::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                $q->whereHasMorph('subject', [Konsumen::class], function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                      ->orWhere('nik', 'ILIKE', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage);

        return $logs;
    }
    
}
