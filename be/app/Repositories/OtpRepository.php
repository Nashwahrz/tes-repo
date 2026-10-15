<?php

namespace App\Repositories;

use App\Enums\OtpPurpose;
use App\Models\Otp;
use App\Models\User;
use Carbon\Carbon;
use Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OtpRepository
{
    public function generateOtpCode(int $length = 6): string
    {
        return str_pad((string) random_int(0, (10 ** $length) - 1), $length, '0', STR_PAD_LEFT);
    }

    public function createOtp(User $user, OtpPurpose $purpose, string $otpCode, int $expiryMinutes = 5): Otp
    {
        $this->deleteUserOtps($user->id);

        return Otp::create([
            'id_user'    => $user->id,
            'purpose'    => $purpose,
            'otp'        => Hash::make($otpCode),
            'expires_at' => Carbon::now()->addMinutes($expiryMinutes),
        ]);
    }

    public function findValidOtp(int $userId, string $otp): ?Otp
    {
        $record = Otp::where('id_user', $userId)
            ->where('expires_at', '>', Carbon::now())
            ->latest()
            ->first();

        if ($record && Hash::check($otp, $record->otp)) {
            return $record;
        }

        return null;
    }

  
    public function deleteUserOtps(int $userId): int
    {
        return Otp::where('id_user', $userId)->delete();
    }

    public function createPasswordResetToken(string $email): string
    {
        $plainToken = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token'      => Hash::make($plainToken),
                'created_at' => Carbon::now(),
            ]
        );

        return $plainToken;
    }

    public function isValidPasswordResetToken(string $email, string $token, int $expiryMinutes = 15): bool
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if (!$record) {
            return false;
        }

        if (Carbon::parse($record->created_at)->addMinutes($expiryMinutes)->isPast()) {
            $this->deletePasswordResetToken($email);
            return false;
        }

        return Hash::check($token, $record->token);
    }

    public function deletePasswordResetToken(string $email): int
    {
        return DB::table('password_reset_tokens')->where('email', $email)->delete();
    }


}
