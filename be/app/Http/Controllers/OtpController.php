<?php

namespace App\Http\Controllers;

use App\Enums\OtpPurpose;
use App\Http\Requests\SendOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Http\Responses\OtpResponse;
use App\Mail\SendOtpMail;
use App\Mail\SendOtpMailResetPassword;
use App\Models\User;
use App\Repositories\OtpRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OtpController extends Controller
{
    public function __construct(
        private OtpRepository $otpRepository,
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

            if ($user->email_verifikasi) {
                return $this->otpResponse->alreadyVerified();
            }

            $expiryMinutes = 5;
            $otpCode = $this->otpRepository->generateOtpCode();
            $this->otpRepository->createOtp($user, OtpPurpose::Register, $otpCode, $expiryMinutes);

            Mail::to($user->email)->send(new SendOtpMail($user, $otpCode, $expiryMinutes));

            return $this->otpResponse->sent($user->email);
        } catch (Throwable $e) {
            Log::error('Pengiriman OTP gagal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->otpResponse->serverError();
        }
    }

    public function sendOtpResetPassword(SendOtpRequest $request)
    {
        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return $this->otpResponse->userNotFound();
            }
    
            if ($user->email_verifikasi == false) {
                return $this->otpResponse-> notreadyVerified();
            }

            $expiryMinutes = 5;
            $otpCode = $this->otpRepository->generateOtpCode();
            $this->otpRepository->createOtp($user, OtpPurpose::ResetPassword, $otpCode, $expiryMinutes);

            Mail::to($user->email)->send(new SendOtpMailResetPassword($user, $otpCode, $expiryMinutes));

            return $this->otpResponse->sent($user->email);
        } catch (Throwable $e) {
            Log::error('Pengiriman OTP gagal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->otpResponse->serverError();
        }
    }


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
            if ($validOtp->purpose != OtpPurpose::Register) {
                return $this->otpResponse->purposeMismatch();
            }

            $user->email_verifikasi = true;
            $user->save();

            $this->otpRepository->deleteUserOtps($user->id);

            return $this->otpResponse->verified($user);
        } catch (Throwable $e) {
            Log::error('Verifikasi OTP gagal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->otpResponse->serverError();
        }
    }
        
    public function verifyOtpResetPassword(VerifyOtpRequest $request)
    {
        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return $this->otpResponse->userNotFound();
            }
            if ($user->email_verifikasi == false) {
                return $this->otpResponse-> notreadyVerified();
            }

            $validOtp = $this->otpRepository->findValidOtp($user->id, $request->otp);

            if (!$validOtp) {
                return $this->otpResponse->invalidOrExpired();
            }
            if ($validOtp->purpose != OtpPurpose::ResetPassword) {
                return $this->otpResponse->purposeMismatch();
            }

            $this->otpRepository->deleteUserOtps($user->id);

            $plainToken = $this->otpRepository->createPasswordResetToken($user->email);

            return $this->otpResponse->resetTokenIssued($plainToken);

        } catch (Throwable $e) {
            Log::error('Verifikasi OTP Reset Password gagal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->otpResponse->serverError();
        }
    }
}
