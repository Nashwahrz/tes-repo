<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DealerController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::prefix('otp')->group(function () {
    Route::post('/send', [OtpController::class, 'sendOtp']);
    Route::post('/verify', [OtpController::class, 'verifyOtp']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('dealers', DealerController::class);
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/pending', [UserController::class, 'pendingUsers']);
        Route::get('/aktif', [UserController::class, 'aktifUsers']);
        Route::get('/ditolak', [UserController::class, 'ditolakUsers']);
        Route::get('/nonaktif', [UserController::class, 'nonaktifUsers']);
        Route::put('/{id}', [UserController::class, 'activate']);
    });
});