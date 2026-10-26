<?php

namespace App\Repositories;

use App\Models\UrlIpLogin;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class UrlIpLoginRepository
{
    public function all(): Collection
    {
        return UrlIpLogin::all();
    }
   
    public function update(UrlIpLogin $urlIpLogin, array $data): UrlIpLogin
    {
        $urlIpLogin->update($data);
        Cache::forget('active_url_ip_login');
        return $urlIpLogin->fresh();
    }
    public function findById(int $id): ?UrlIpLogin
    {
        return UrlIpLogin::find($id);
    }

    public function getActive(): ?UrlIpLogin
    {
        return Cache::remember('active_url_ip_login', 3600, function () {
            return UrlIpLogin::where('is_active', true)->first();
        });
    }
}
