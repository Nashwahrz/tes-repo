<?php

namespace App\Repositories;

use App\Models\Otp;
use App\Models\User;
use Carbon\Carbon;

class OtpRepository
{
    public function createOtp(User $user, int $length = 6, int $expiryMinutes = 5): Otp
    {
      
        $this->deleteUserOtps($user->id);

        $min = 10 ** ($length - 1);
        $max = (10 ** $length) - 1;
        $otpCode = (string) random_int($min, $max);

        return Otp::create([
            'id_user'    => $user->id,
            'otp'        => $otpCode,
            'expires_at' => Carbon::now()->addMinutes($expiryMinutes),
        ]);
    }

    public function findValidOtp(int $userId, string $otp): ?Otp
    {
        return Otp::where('id_user', $userId)
            ->where('otp', $otp)
            ->where('expires_at', '>', Carbon::now())
            ->latest()
            ->first();
    }

  
    public function deleteUserOtps(int $userId): int
    {
        return Otp::where('id_user', $userId)->delete();
    }
}
