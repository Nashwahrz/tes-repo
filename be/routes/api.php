<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DealerController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\RoleMenuController;
use App\Http\Controllers\RolePermissionController;
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
        
        Route::prefix('dealers')->middleware('menu.access:dealers')->group(function () {
            Route::get('/', [DealerController::class, 'index'])->middleware('permission:dealers.lihat');
            Route::post('/', [DealerController::class, 'store'])->middleware('permission:dealers.tambah');
            Route::get('/{id}', [DealerController::class, 'show'])->middleware('permission:dealers.lihat');
            Route::put('/{id}', [DealerController::class, 'update'])->middleware('permission:dealers.ubah');
            Route::delete('/{id}', [DealerController::class, 'destroy'])->middleware('permission:dealers.hapus');
        });

        Route::prefix('users')->middleware('menu.access:users')->group(function () {
            Route::get('/', [UserController::class, 'index'])->middleware('permission:users.lihat');
            Route::get('/pending', [UserController::class, 'pendingUsers'])->middleware('permission:users.lihat');
            Route::get('/aktif', [UserController::class, 'aktifUsers'])->middleware('permission:users.lihat');
            Route::get('/ditolak', [UserController::class, 'ditolakUsers'])->middleware('permission:users.lihat');
            Route::get('/nonaktif', [UserController::class, 'nonaktifUsers'])->middleware('permission:users.lihat');
            Route::put('/{id}', [UserController::class, 'activate'])->middleware('permission:users.aktivasi');
        });

        Route::prefix('role-menus')->group(function () {
            Route::get('/user-menus', [RoleMenuController::class, 'userMenus']);

            Route::middleware(['menu.access:role-menus', 'permission:role-menus.kelola'])->group(function () {
                Route::get('/', [RoleMenuController::class, 'index']);
                Route::get('/menus', [RoleMenuController::class, 'getMenus']);
                Route::get('/{roleId}', [RoleMenuController::class, 'show']);
                Route::put('/{roleId}', [RoleMenuController::class, 'update']);
            });
        });

        Route::prefix('role-permissions')->group(function () {
            Route::get('/user-permissions', [RolePermissionController::class, 'userPermissions']);

            Route::middleware(['menu.access:role-menus', 'permission:role-permissions.kelola'])->group(function () {
                Route::get('/', [RolePermissionController::class, 'index']);
                Route::get('/permissions', [RolePermissionController::class, 'getPermissions']);
                Route::get('/{roleId}', [RolePermissionController::class, 'show']);
                Route::put('/{roleId}', [RolePermissionController::class, 'update']);
            });
        });

    });