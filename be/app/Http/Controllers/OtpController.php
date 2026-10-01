<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Http\Responses\OtpResponse;
use App\Models\User;
use App\Repositories\OtpRepository;
use App\Services\OtpService;
use Illuminate\Support\Facades\Log;
use Throwable;

class OtpController extends Controller
{
    public function __construct(
        private OtpRepository $otpRepository,
        private OtpService $otpService,
        private OtpResponse $otpResponse
    ) {}

    /**
     * Send OTP to user's email.
     */
    public function sendOtp(SendOtpRequest $request)
    {
        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return $this->otpResponse->userNotFound();
            }

            $this->otpService->send($user);

            return $this->otpResponse->sent($user->email);
        } catch (Throwable $e) {
            Log::error('Pengiriman OTP gagal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->otpResponse->serverError();
        }
    }

    /**
     * Verify the OTP code.
     */
    public function verifyOtp(VerifyOtpRequest $request)
    {
        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return $this->otpResponse->userNotFound();
            }

            $validOtp = $this->otpRepository->findValidOtp($user->id, $request->otp);

            if (!$validOtp) {
                return $this->otpResponse->invalidOrExpired();
            }

            // Mark user email as verified
            $user->email_verifikasi = true;
            $user->save();

            // Clear used OTP
            $this->otpRepository->deleteUserOtps($user->id);

            return $this->otpResponse->verified($user);
        } catch (Throwable $e) {
            Log::error('Verifikasi OTP gagal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->otpResponse->serverError();
        }
    }
}
