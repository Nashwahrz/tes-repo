<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Responses\LoginResponse;
use App\Http\Requests\RegisterRequest;
use App\Http\Responses\RegisterResponse;
use App\Mail\SendOtpMail;
use App\Repositories\OtpRepository;
use App\Repositories\UserRepository;
use App\Services\LoginLogService;
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
        private RegisterResponse $registerResponse,
        private LoginResponse $loginResponse,
        private LoginLogService $loginLogService,
    ) {}

    #[OA\Post(
        path: '/api/auth/register',
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'John Doe'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'secret123'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'User registered successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
            new OA\Response(response: 500, description: 'Server error'),
        ]
    )]
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
    
    #[OA\Post(
        path: '/api/auth/login',
        summary: 'Login user and get token',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'secret123'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Login successful, returns token'),
            new OA\Response(response: 401, description: 'Invalid credentials'),
            new OA\Response(response: 429, description: 'Too many attempts'),
            new OA\Response(response: 500, description: 'Server error'),
        ]
    )]
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
                $otp = $this->otpRepository->createOtp($user, 6, $expiryMinutes);
                Mail::to($user->email)->send(new SendOtpMail($user, $otp->otp, $expiryMinutes));

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

}
