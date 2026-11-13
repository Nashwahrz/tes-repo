<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\LogActivityConfigurasiRateLimit */
class LogActivityConfigurasiRateLimitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'action'       => $this->action?->value ?? (string) $this->action,
            'action_label' => method_exists($this->action, 'label') ? $this->action->label() : (string) $this->action,
            'description'  => $this->description,
            'rate_limit'   => [
                'id'   => $this->fk_rate_limit,
                'name' => $this->rate_limit_name ?? $this->rateLimit?->name,
            ],
            'causer'       => [
                'id'    => $this->fk_causer,
                'name'  => $this->causer_name ?? $this->causer?->name ?? 'Sistem',
                'email' => $this->causer?->email,
            ],
            'old_data'     => $this->old_data,
            'new_data'     => $this->new_data,
            'ip_address'   => $this->ip_address,
            'user_agent'   => $this->user_agent,
            'created_at'   => $this->created_at?->toIso8601String(),
        ];
    }
}

