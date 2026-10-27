<?php

namespace App\Repositories;

use App\Models\AppKeyOcr;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class AppKeyOcrRepository
{
    public function all(): Collection
    {
        return AppKeyOcr::all();
    }
   
    public function update(AppKeyOcr $appKeyOcr, array $data): AppKeyOcr
    {
        $appKeyOcr->update($data);
        Cache::forget('active_app_key_ocr');
        return $appKeyOcr->fresh();
    }
    public function findById(int $id): ?AppKeyOcr
    {
        return AppKeyOcr::find($id);
    }

    public function getActive(): ?AppKeyOcr
    {
        return Cache::remember('active_app_key_ocr', 3600, function () {
            return AppKeyOcr::where('is_active', true)->first();
        });
    }
}
