<?php

namespace App\Services;

use App\Mail\SendOtpMail;
use App\Models\User;
use App\Repositories\OtpRepository;
use Illuminate\Support\Facades\Mail;

class OtpService
{
    public const EXPIRY_MINUTES = 5;

    public function __construct(private OtpRepository $otpRepository) {}

    /**
     * Buat OTP baru untuk user lalu kirim ke emailnya.
     */
    public function send(User $user): void
    {
        $otp = $this->otpRepository->createOtp($user, 6, self::EXPIRY_MINUTES);

        Mail::to($user->email)->send(new SendOtpMail($user, $otp->otp, self::EXPIRY_MINUTES));
    }
}
