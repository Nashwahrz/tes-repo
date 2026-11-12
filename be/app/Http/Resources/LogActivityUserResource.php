<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LogActivityUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'action'        => $this->action?->value ?? $this->action,
            'description'   => $this->description,
            'user_target' => [
                'id'    => $this->fk_user,
                'name'  => $this->user_name ?? $this->user?->name,
                'email' => $this->user?->email,
            ],
            'causer'        => [
                'id'   => $this->fk_causer,
                'name' => $this->causer_name ?? $this->causer?->name ?? 'Sistem',
            ],
            'old_data'   => $this->old_data,
            'new_data'   => $this->new_data,
            'ip_address'  => $this->ip_address,
            'user_agent'  => $this->user_agent,
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}

