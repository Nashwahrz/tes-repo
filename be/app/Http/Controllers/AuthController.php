<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Responses\LoginResponse;
use App\Http\Requests\RegisterRequest;
use App\Http\Responses\RegisterResponse;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Database\UniqueConstraintViolationException;
use Throwable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Enums\StatusUser;
use App\Services\OtpService;
use App\Http\Responses\OtpResponse;

class AuthController extends Controller
{
     public function __construct(
        private UserRepository $users,
        private RegisterResponse $registerResponse,
        private LoginResponse $loginResponse,
        private OtpService $otpService,
        private OtpResponse $otpResponse,
    ) {}

    public function register(RegisterRequest $request)
    {
        try {
            $user = $this->users->create($request->validated());
            return $this->registerResponse->success($user);
        } catch (UniqueConstraintViolationException $e) {
            return $this->registerResponse->emailTaken();
        } catch (Throwable $e) {

            Log::error('Register gagal: ' . $e->getMessage());
            return $this->registerResponse->serverError();

        }
    }
    
    public function login(LoginRequest $request)
    {
        try {
            if (!Auth::attempt($request->only('email', 'password'))) {
                return $this->loginResponse->unauthorized();
            }

            $user = Auth::user();

            // Email belum diverifikasi: kirim OTP seperti alur register
            if (!$user->email_verifikasi) {
                Auth::logout();

                try {
                    $this->otpService->send($user);
                    $otpSent = true;
                } catch (Throwable $e) {
                    Log::error('Pengiriman OTP saat login gagal: ' . $e->getMessage());
                    $otpSent = false;
                }

                return $this->otpResponse->requiresVerification($user->email, $otpSent);
            }

            if ($user->status !== StatusUser::Aktif) {
                Auth::logout();
                return match ($user->status) {
                    StatusUser::Ditolak  => $this->loginResponse->reject(),
                    default              => $this->loginResponse->inactive(), // Pending
                };
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->loginResponse->success($user, $token);
        } catch (Throwable $e) {
            Log::error('Login error: ' . $e->getMessage());
            return $this->loginResponse->serverError();

        }
    }

}
