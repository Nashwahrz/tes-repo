<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\LogActivityMenu */
class LogActivityMenuResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'action'       => $this->action?->value ?? (string) $this->action,
            'action_label' => method_exists($this->action, 'label') ? $this->action->label() : (string) $this->action,
            'description'  => $this->description,
            'role'         => $this->fk_role ? [
                'id'   => $this->fk_role,
                'name' => $this->role_name ?? $this->role?->role_name,
            ] : null,
            'menu'         => $this->fk_menu ? [
                'id'   => $this->fk_menu,
                'name' => $this->menu_name ?? $this->menu?->menu_name,
            ] : null,
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

