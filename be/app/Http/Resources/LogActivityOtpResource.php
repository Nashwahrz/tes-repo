<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\LogActivityOtp */
class LogActivityOtpResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'action'       => $this->action?->value ?? (string) $this->action,
            'action_label' => $this->action?->label() ?? (string) $this->action,
            'purpose'     => $this->purpose?->value ?? (string) $this->purpose,
            'purpose_label' => $this->purpose?->label() ?? (string) $this->purpose,
            'description'  => $this->description,
            'user'       => $this->user ? [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
            ] : null,
            'email'      => $this->email,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'created_at'      => $this->created_at?->toIso8601String(),
        ];
    }
}

