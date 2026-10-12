<?php

namespace App\Repositories;


use App\Models\EmailWhitelist;
use Illuminate\Database\Eloquent\Collection;

class EmailWhitelistRepository 
{
    public function all(): Collection
    {
        return EmailWhitelist::all();
    }

    public function findById(int $id): ?EmailWhiteList
    {
        return EmailWhitelist::find($id);
    }

   
    public function create(array $data): EmailWhitelist
    {
        return EmailWhitelist::create($data);
    }

    
    public function update(EmailWhitelist $email, array $data): EmailWhitelist
    {
        $email->update($data);
        return $email->fresh();
    }

  
    public function delete(EmailWhitelist $email): bool
    {
        return (bool) $email->delete();
    }
}
