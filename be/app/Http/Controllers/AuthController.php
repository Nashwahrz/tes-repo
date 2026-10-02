<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Responses\LoginResponse;
use App\Http\Requests\RegisterRequest;
use App\Http\Responses\RegisterResponse;
use App\Mail\SendOtpMail;
use App\Repositories\OtpRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Database\UniqueConstraintViolationException;
use Throwable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Enums\StatusUser;

class AuthController extends Controller
{
     public function __construct(
        private UserRepository $users,
        private OtpRepository $otpRepository,
        private RegisterResponse $registerResponse,
        private LoginResponse $loginResponse,
    ) {}

    public function register(RegisterRequest $request)
    {
        try {
            $user = $this->users->create($request->validated());

            $expiryMinutes = 5;
            $otp = $this->otpRepository->createOtp($user, 6, $expiryMinutes);

            Mail::to($user->email)->send(new SendOtpMail($user, $otp->otp, $expiryMinutes));

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
            if (!Auth::attempt($request->only('email', 'password'))) {
                return $this->loginResponse->unauthorized();
            }

            $user = Auth::user();

            if (!$user->email_verifikasi) {
                Auth::logout();

                $expiryMinutes = 5;
                $otp = $this->otpRepository->createOtp($user, 6, $expiryMinutes);
                Mail::to($user->email)->send(new SendOtpMail($user, $otp->otp, $expiryMinutes));

                return $this->loginResponse->emailNotVerified($user->email);
            }

            if ($user->status !== StatusUser::Aktif) {
                Auth::logout();
                return match ($user->status) {
                    StatusUser::Ditolak => $this->loginResponse->reject(),
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
