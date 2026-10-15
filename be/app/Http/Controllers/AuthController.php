<?php

namespace App\Http\Controllers;

use App\Enums\OtpPurpose;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Responses\LoginResponse;
use App\Http\Requests\RegisterRequest;
use App\Http\Responses\OtpResponse;
use App\Http\Responses\RegisterResponse;
use App\Mail\SendOtpMail;
use App\Models\User;
use App\Repositories\OtpRepository;
use App\Repositories\UserRepository;
use App\Services\LoginLogService;
use Hash;
use Illuminate\Http\Request;
use Illuminate\Database\UniqueConstraintViolationException;
use Throwable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Enums\StatusUser;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
     public function __construct(
        private UserRepository $users,
        private OtpRepository $otpRepository,
        private OtpResponse $otpResponse,
        private RegisterResponse $registerResponse,
        private LoginResponse $loginResponse,
        private LoginLogService $loginLogService,
    ) {}

    public function register(RegisterRequest $request)
    {
        try {
            $user = $this->users->create($request->validated());

            $expiryMinutes = 5;
            $otpCode = $this->otpRepository->generateOtpCode();
            $this->otpRepository->createOtp($user, OtpPurpose::Register, $otpCode, $expiryMinutes);
            Mail::to($user->email)->send(new SendOtpMail($user, $otpCode, $expiryMinutes));

            return $this->registerResponse->success($user);
        } catch (UniqueConstraintViolationException $e) {
            return $this->registerResponse->emailTaken();
        } catch (Throwable $e) {
            Log::error('Register gagal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->registerResponse->serverError();
        }
    }
    
    public function login(LoginRequest $request)
    {
        try {
            $ip    = $request->ip();
            $email = $request->input('email');

            if ($this->loginLogService->isLocked($ip, $email)) {
                $seconds = $this->loginLogService->secondsUntilUnlock($ip, $email);
                return $this->loginResponse->tooManyAttempts(
                    $seconds,
                    $this->loginLogService->maxAttempts()
                );
            }

            if (!Auth::attempt($request->only('email', 'password'))) {
                $this->loginLogService->incrementAttempts($ip, $email);

                if ($this->loginLogService->isLocked($ip, $email)) {
                    $seconds = $this->loginLogService->secondsUntilUnlock($ip, $email);
                    return $this->loginResponse->tooManyAttempts(
                        $seconds,
                        $this->loginLogService->maxAttempts()
                    );
                }
 
                return $this->loginResponse->unauthorized();
            }

            $user = Auth::user();

            if (!$user->email_verifikasi) {
                Auth::logout();

                $expiryMinutes = 5;
                $otpCode = $this->otpRepository->generateOtpCode();
                $this->otpRepository->createOtp($user, OtpPurpose::Register, $otpCode, $expiryMinutes);
                Mail::to($user->email)->send(new SendOtpMail($user, $otpCode, $expiryMinutes));

                return $this->loginResponse->emailNotVerified($user->email);
            }
            
            if ($user->status !== StatusUser::Aktif) {
                Auth::logout();
                return match ($user->status) {
                    StatusUser::Ditolak  => $this->loginResponse->reject(),
                    StatusUser::Nonaktif => $this->loginResponse->nonaktif(),
                    default              => $this->loginResponse->inactive(), // Pending
                };
            }

           
            $this->loginLogService->clearAttempts($ip, $email);
            $this->loginLogService->log($user, $request);

            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->loginResponse->success($user, $token);
        } catch (Throwable $e) {
            Log::error('Login error: ' . $e->getMessage());
            return $this->loginResponse->serverError();
        }
    }
        
    public function resetPassword(ResetPasswordRequest $request)
    {
        try {
            $isValidToken = $this->otpRepository->isValidPasswordResetToken(
                $request->email,
                $request->reset_token,
                expiryMinutes: 15 
            );

            if (!$isValidToken) {
                return $this->otpResponse->invalidResetToken();
            }

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return $this->otpResponse->userNotFound();
            }

            $user->password = $request->password;
            $user->save();

            $this->otpRepository->deletePasswordResetToken($request->email);

            return $this->otpResponse->passwordResetSuccess();

        } catch (Throwable $e) {
            Log::error('Reset password error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->otpResponse->serverError();
        }
    }


}
