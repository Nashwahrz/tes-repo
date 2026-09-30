<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Http\Responses\RegisterResponse;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Database\UniqueConstraintViolationException;
use Throwable;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
     public function __construct(
        private UserRepository $users,
        private RegisterResponse $response,
    ) {}

    public function register(RegisterRequest $request)
    {
        try {
            $user = $this->users->create($request->validated());
            return $this->response->success($user);
        } catch (UniqueConstraintViolationException $e) {
            return $this->response->emailTaken();
        } catch (Throwable $e) {
            Log::error('Register gagal: ' . $e->getMessage());
            return $this->response->serverError();
        }
    }

}
