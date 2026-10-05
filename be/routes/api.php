<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DealerController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\RoleMenuController;
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
        
    Route::apiResource('dealers', DealerController::class)->middleware('menu.access:dealers');

    Route::prefix('users')->middleware('menu.access:users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/pending', [UserController::class, 'pendingUsers']);
        Route::get('/aktif', [UserController::class, 'aktifUsers']);
        Route::get('/ditolak', [UserController::class, 'ditolakUsers']);
        Route::get('/nonaktif', [UserController::class, 'nonaktifUsers']);
        Route::put('/{id}', [UserController::class, 'activate']);
    });

    Route::prefix('role-menus')->group(function () {
        Route::get('/user-menus', [RoleMenuController::class, 'userMenus']);

        Route::middleware('menu.access:role-menus')->group(function () {
            Route::get('/', [RoleMenuController::class, 'index']);
            Route::get('/menus', [RoleMenuController::class, 'getMenus']);
            Route::get('/{roleId}', [RoleMenuController::class, 'show']);
            Route::put('/{roleId}', [RoleMenuController::class, 'update']);
            });
        });
    });