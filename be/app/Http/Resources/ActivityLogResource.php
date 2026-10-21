<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/** @mixin \Spatie\Activitylog\Models\Activity */
class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $users = $this->relationLoaded('users_map')
            ? $this->getRelation('users_map')
            : collect();

        return [
            'id'         => $this->id,
            'log_name'   => $this->log_name,
            'aksi'       => $this->event,
            'deskripsi'  => $this->description,
            'subject_id' => $this->subject_id,
            'konsumen'   => $this->subject?->name,
            'oleh'       => $this->causer_id
                ? ['id' => $this->causer_id, 'name' => $this->causer->name]
                : null,
            'waktu'      => $this->created_at?->toIso8601String(),
            'data_lama'  => $this->mapUsers($this->properties->get('old'), $users),
            'data_baru'  => $this->mapUsers($this->properties->get('attributes'), $users),
        ];
    }

    private function mapUsers(?array $data, Collection $users): ?array
    {
        if ($data === null) {
            return null;
        }

        if (array_key_exists('id_me', $data)) {
            $id = $data['id_me'];
            $data['me'] = $id ? ['id' => $id, 'name' => $users[$id] ?? null] : null;
            unset($data['id_me']);
        }

        if (array_key_exists('diverifikasi_oleh', $data)) {
            $id = $data['diverifikasi_oleh'];
            $data['diverifikator'] = $id ? ['id' => $id, 'name' => $users[$id] ?? null] : null;
            unset($data['diverifikasi_oleh']);
        }

        return $data;
    }
}