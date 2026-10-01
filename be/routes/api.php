<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OtpController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::prefix('otp')->group(function () {
    Route::post('/send', [OtpController::class, 'sendOtp']);
    Route::post('/verify', [OtpController::class, 'verifyOtp']);
});