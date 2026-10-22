<?php

namespace App\Repositories;

use App\Models\EmailSmtp;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class EmailSmtpRepository
{
    public function all(): Collection
    {
        return EmailSmtp::all();
    }
   
    public function findById(int $id): ?EmailSmtp
    {
        return EmailSmtp::find($id);
    }

   
    public function create(array $data): EmailSmtp
    {
        if (!empty($data['is_active'])) {
            EmailSmtp::where('is_active', true)->update(['is_active' => false]);
        }

        $emailSmtp = EmailSmtp::create($data);
        Cache::forget('active_email_smtp');
        return $emailSmtp;
    }

    
    public function update(EmailSmtp $emailSmtp, array $data): EmailSmtp
    {
        if (!empty($data['is_active'])) {
            EmailSmtp::where('id', '!=', $emailSmtp->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $emailSmtp->update($data);
        Cache::forget('active_email_smtp');
        return $emailSmtp->fresh();
    }

  
    public function delete(EmailSmtp $emailSmtp): bool
    {   
        $result = (bool) $emailSmtp->delete();
        Cache::forget('active_email_smtp');
        return $result;
    }
    // public function paginate(int $perPage = null, ?string $search = null): LengthAwarePaginator
    // {
    //     return EmailSmtp::query()
    //         ->when($search, fn ($q) => $q->where('name', 'ILIKE', "%{$search}%"))
    //         ->latest('id')
    //         ->paginate($perPage)
    //         ->withQueryString();
    // }
}
