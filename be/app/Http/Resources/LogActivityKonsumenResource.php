<?php

namespace App\Http\Resources;

use App\Enums\SignedUrlLifetime;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

/** @mixin \App\Models\LogActivityKonsumen */
class LogActivityKonsumenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'action'             => $this->action?->value ?? (string) $this->action,
            'action_label'       => $this->action?->label() ?? (string) $this->action,
            'status'           => $this->status?->value ?? (string) $this->status,
            'status_label'     => $this->status?->label() ?? (string) $this->status,
            'type'             => $this->type?->value ?? (string) $this->type,
            'nik'              => $this->nik,
            'konsumen_name'    => $this->konsumen_name,
            'description'        => $this->description,
            'note'          => $this->note,
            'fk_konsumen'      => $this->fk_konsumen,
            'fk_temp_konsumen' => $this->fk_temp_konsumen,
            'fk_me'               => $this->fk_me ? [
                'id'   => $this->fk_me,
                'name' => $this->me_name ?? $this->me?->name,
            ] : null,
            'causer'             => $this->fk_causer ? [
                'id'   => $this->fk_causer,
                'name' => $this->causer_name ?? $this->causer?->name,
            ] : null,
            'old_data'        => $this->enrichFotoKtpUrl($this->old_data, 'old'),
            'new_data'        => $this->enrichFotoKtpUrl($this->new_data, 'new'),
            'ip_address'       => $this->ip_address,
            'user_agent'       => $this->user_agent,
            'created_at'            => $this->created_at?->toIso8601String(),
        ];
    }

    protected function enrichFotoKtpUrl(?array $data, string $target = 'new'): ?array
    {
        if ($data === null) {
            return null;
        }

        if (array_key_exists('foto_ktp', $data) && !empty($data['foto_ktp'])) {
            $data['foto_ktp_url'] = URL::temporarySignedRoute(
                'konsumens.foto-ktp',
                now()->addMinutes(SignedUrlLifetime::FotoKtp->value),
                ['id' => $this->id, 'type' => 'log', 'target' => $target],
                false
            );
        } else {
            unset($data['foto_ktp_url']);
        }

        return $data;
    }
}
