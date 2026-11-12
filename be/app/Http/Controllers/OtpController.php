<?php

namespace App\Http\Controllers;

use App\Enums\LogOtpAction;
use App\Enums\OtpPurpose;
use App\Http\Requests\SendOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Http\Resources\LogActivityOtpResource;
use App\Http\Responses\LogActivityOtpResponse;
use App\Http\Responses\OtpResponse;
use App\Mail\SendOtpMail;
use App\Mail\SendOtpMailResetPassword;
use App\Models\User;
use App\Repositories\LogActivityOtpRepository;
use App\Repositories\OtpRepository;
use App\Services\LogActivityOtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OtpController extends Controller
{
    public function __construct(
        private OtpRepository $otpRepository,
        private OtpResponse $otpResponse,
        private ?LogActivityOtpService $logActivityOtpService = null,
        private ?LogActivityOtpRepository $logActivityOtpRepository = null,
        private ?LogActivityOtpResponse $logActivityOtpResponse = null,
        private ?PaginateController $paginateController = null
    ) {
        $this->logActivityOtpService    = $logActivityOtpService ?? app(LogActivityOtpService::class);
        $this->logActivityOtpRepository = $logActivityOtpRepository ?? app(LogActivityOtpRepository::class);
        $this->logActivityOtpResponse   = $logActivityOtpResponse ?? app(LogActivityOtpResponse::class);
        $this->paginateController       = $paginateController ?? app(PaginateController::class);
    }

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

            if ($user->email_verification) {
                return $this->otpResponse->alreadyVerified();
            }

            $expiryMinutes = 5;
            $otpCode = $this->otpRepository->generateOtpCode();
            $this->otpRepository->createOtp($user, OtpPurpose::Register, $otpCode, $expiryMinutes);

            Mail::to($user->email)->send(new SendOtpMail($user, $otpCode, $expiryMinutes));

            $this->logActivityOtpService->logRequested($user, OtpPurpose::Register);

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
    
            if ($user->email_verification == false) {
                return $this->otpResponse-> notreadyVerified();
            }

            $expiryMinutes = 5;
            $otpCode = $this->otpRepository->generateOtpCode();
            $this->otpRepository->createOtp($user, OtpPurpose::ResetPassword, $otpCode, $expiryMinutes);

            Mail::to($user->email)->send(new SendOtpMailResetPassword($user, $otpCode, $expiryMinutes));

            $this->logActivityOtpService->logRequested($user, OtpPurpose::ResetPassword);

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
                $this->logActivityOtpService->logFailed($user, OtpPurpose::Register, 'Kode OTP salah atau sudah kadaluarsa');
                return $this->otpResponse->invalidOrExpired();
            }
            if ($validOtp->purpose != OtpPurpose::Register) {
                $this->logActivityOtpService->logFailed($user, OtpPurpose::Register, 'Tujuan OTP tidak sesuai');
                return $this->otpResponse->purposeMismatch();
            }

            $user->email_verification = true;
            $user->save();

            $this->otpRepository->deleteUserOtps($user->id);

            $this->logActivityOtpService->logVerified($user, OtpPurpose::Register);

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
            if ($user->email_verification == false) {
                return $this->otpResponse-> notreadyVerified();
            }

            $validOtp = $this->otpRepository->findValidOtp($user->id, $request->otp);

            if (!$validOtp) {
                $this->logActivityOtpService->logFailed($user, OtpPurpose::ResetPassword, 'Kode OTP salah atau sudah kadaluarsa');
                return $this->otpResponse->invalidOrExpired();
            }
            if ($validOtp->purpose != OtpPurpose::ResetPassword) {
                $this->logActivityOtpService->logFailed($user, OtpPurpose::ResetPassword, 'Tujuan OTP tidak sesuai');
                return $this->otpResponse->purposeMismatch();
            }

            $this->otpRepository->deleteUserOtps($user->id);

            $this->logActivityOtpService->logVerified($user, OtpPurpose::ResetPassword);

            $plainToken = $this->otpRepository->createPasswordResetToken($user->email);

            return $this->otpResponse->resetTokenIssued($plainToken);

        } catch (Throwable $e) {
            Log::error('Verifikasi OTP Reset Password gagal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->otpResponse->serverError();
        }
    }

    public function logs(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $search  = $request->query('search');
            $purpose = $request->query('purpose') ? OtpPurpose::tryFrom($request->query('purpose')) : null;
            $action  = $request->query('action') ? LogOtpAction::tryFrom($request->query('action')) : null;

            $logs = $this->logActivityOtpRepository->paginate($perPage, $search, $purpose, $action);

            $transformed = $logs->through(
                fn ($log) => (new LogActivityOtpResource($log))->resolve()
            );

            return $this->logActivityOtpResponse->list(
                $transformed,
                'Daftar log aktivitas OTP berhasil diambil.'
            );
        } catch (Throwable $e) {
            Log::error('Gagal mengambil log OTP: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->logActivityOtpResponse->serverError();
        }
    }
}
