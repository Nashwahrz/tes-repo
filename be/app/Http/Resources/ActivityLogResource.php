<?php

namespace App\Http\Resources;

use App\Models\Konsumen;
use App\Models\TempKonsumen;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/** @mixin \Spatie\Activitylog\Models\Activity */
class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $users     = $this->relationLoaded('users_map') ? $this->getRelation('users_map') : collect();
        $konsumens = $this->relationLoaded('konsumens_map') ? $this->getRelation('konsumens_map') : collect();

        return [
            'id'        => $this->id,
            'log_name'  => $this->log_name,
            'aksi'      => $this->event,
            'deskripsi' => $this->description,
            'subject'   => $this->subject_id ? [
                'id'   => $this->subject_id,
                'name' => $this->subject?->name,
            ] : null,
            'oleh'      => $this->causer_id
                ? ['id' => $this->causer_id, 'name' => $this->causer?->name]
                : null,
            'waktu'     => $this->created_at?->toIso8601String(),
            'data_lama' => $this->mapData($this->properties->get('old'), $users, $konsumens),
            'data_baru' => $this->mapData($this->properties->get('attributes'), $users, $konsumens),
        ];
    }

    private function mapData(?array $data, Collection $users, Collection $konsumens): ?array
    {
        if ($data === null) {
            return null;
        }

        if (array_key_exists('fk_me', $data)) {
            $id = $data['fk_me'];
            $data['me'] = $id ? ['id' => $id, 'name' => $users[$id] ?? null] : null;
            unset($data['fk_me']);
        }

        if (array_key_exists('fk_konsumen', $data)) {
            $id = $data['fk_konsumen'];
            $data['konsumen'] = $id ? ['id' => $id, 'name' => $konsumens[$id] ?? null] : null;
            unset($data['fk_konsumen']);
        }

        if (array_key_exists('verifief_by', $data)) {
            $id = $data['verifief_by'];
            $data['diverifikator'] = $id ? ['id' => $id, 'name' => $users[$id] ?? null] : null;
            unset($data['verifief_by']);
        }


        // if (array_key_exists('foto_ktp', $data)) {
        //     $data['foto_ktp'] = $data['foto_ktp'] ? 'ada' : null;
        // }

        return $data;
    }
}