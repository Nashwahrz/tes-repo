<?php

namespace App\Repositories;

use App\Enums\LogKonsumenAction;
use App\Enums\StatusKonsumen;
use App\Models\LogActivityKonsumen;
use Illuminate\Pagination\LengthAwarePaginator;

class LogActivityKonsumenRepository
{
    public function paginate(
        int $perPage = 10,
        ?string $search = null,
        ?StatusKonsumen $status = null,
        ?LogKonsumenAction $action = null
    ): LengthAwarePaginator {
        return LogActivityKonsumen::query()
            ->with(['konsumen', 'tempKonsumen', 'me:id,name,email', 'causer:id,name,email'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($action, fn ($q) => $q->where('action', $action))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nik', 'ILIKE', "%{$search}%")
                        ->orWhere('konsumen_name', 'ILIKE', "%{$search}%")
                        ->orWhere('me_name', 'ILIKE', "%{$search}%")
                        ->orWhere('causer_name', 'ILIKE', "%{$search}%")
                        ->orWhere('description', 'ILIKE', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    // public function paginateByKonsumenId(int $konsumenId, int $perPage = 10): LengthAwarePaginator
    // {
    //     return LogActivityKonsumen::query()
    //         ->where('fk_konsumen', $konsumenId)
    //         ->with(['me:id,name,email', 'causer:id,name,email'])
    //         ->latest('id')
    //         ->paginate($perPage)
    //         ->withQueryString();
    // }

    // public function paginateByTempId(int $tempId, int $perPage = 10): LengthAwarePaginator
    // {
    //     return LogActivityKonsumen::query()
    //         ->where('fk_temp_konsumen', $tempId)
    //         ->with(['me:id,name,email', 'causer:id,name,email'])
    //         ->latest('id')
    //         ->paginate($perPage)
    //         ->withQueryString();
    // }

    public function create(array $data): LogActivityKonsumen
    {
        return LogActivityKonsumen::create($data);
    }
}

