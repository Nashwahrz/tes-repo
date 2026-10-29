<?php

use App\Http\Controllers\AgamaController;
use App\Http\Controllers\AppKeyOcrController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConfigurasiRateLimitController;
use App\Http\Controllers\DealerController;
use App\Http\Controllers\EmailSmtpController;
use App\Http\Controllers\EmailWhiteListController;
use App\Http\Controllers\KabupatenKotaController;
use App\Http\Controllers\KecamatanController;
use App\Http\Controllers\KelurahanController;
use App\Http\Controllers\KonsumenController;
use App\Http\Controllers\LogBlockedUserController;
use App\Http\Controllers\LogUserController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\PekerjaanController;
use App\Http\Controllers\ProvinsiController;
use App\Http\Controllers\RoleMenuController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\UrlIpLoginController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::prefix('otp')->group(function () {
        Route::post('/send', [OtpController::class, 'sendOtp'])->middleware('throttle:otp-send');
        Route::post('/send-reset-password', [OtpController::class, 'sendOtpResetPassword'])->middleware('throttle:otp-send');
        Route::post('/verify', [OtpController::class, 'verifyOtp'])->middleware('throttle:otp-verify');
        Route::post('/verify-reset-password', [OtpController::class, 'verifyOtpResetPassword'])->middleware('throttle:otp-verify');
    });
    Route::get('/konsumens/{id}/foto-ktp', [KonsumenController::class, 'fotoKtp'])
            ->name('konsumens.foto-ktp')
            ->middleware('signed:relative');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::prefix('dealers')->middleware('menu.access:dealers')->group(function () {
            Route::get('/', [DealerController::class, 'index'])->middleware('permission:dealers.lihat');
            Route::post('/', [DealerController::class, 'store'])->middleware('permission:dealers.tambah');
            Route::get('/{id}', [DealerController::class, 'show'])->middleware('permission:dealers.lihat');
            Route::put('/{id}', [DealerController::class, 'update'])->middleware('permission:dealers.ubah');
            Route::delete('/{id}', [DealerController::class, 'destroy'])->middleware('permission:dealers.hapus');
        });
        Route::prefix('agamas')->middleware('menu.access:agamas')->group(function () {
            Route::get('/', [AgamaController::class, 'index'])->middleware('permission:agamas.lihat');
            Route::get('/aktif', [AgamaController::class, 'indexAktif'])->middleware('permission:agamas.lihat-aktif');
            Route::get('/non-aktif', [AgamaController::class, 'indexNonAktif'])->middleware('permission:agamas.lihat-non-aktif');
            Route::post('/', [AgamaController::class, 'store'])->middleware('permission:agamas.tambah');
            Route::get('/{id}', [AgamaController::class, 'show'])->middleware('permission:agamas.lihat');
            Route::put('/{id}', [AgamaController::class, 'update'])->middleware('permission:agamas.ubah');
            Route::put('/{id}/status', [AgamaController::class, 'status'])->middleware('permission:agamas.ubah');
            // Route::delete('/{id}', [AgamaController::class, 'destroy'])->middleware('permission:agamas.hapus');
        });
        Route::prefix('pekerjaans')->middleware('menu.access:pekerjaans')->group(function () {
            Route::get('/', [PekerjaanController::class, 'index'])->middleware('permission:pekerjaans.lihat');
            Route::get('/aktif', [PekerjaanController::class, 'indexAktif'])->middleware('permission:pekerjaans.lihat-aktif');
            Route::get('/non-aktif', [PekerjaanController::class, 'indexNonAktif'])->middleware('permission:pekerjaans.lihat-non-aktif');
            Route::post('/', [PekerjaanController::class, 'store'])->middleware('permission:pekerjaans.tambah');
            Route::get('/{id}', [PekerjaanController::class, 'show'])->middleware('permission:pekerjaans.lihat');
            Route::put('/{id}', [PekerjaanController::class, 'update'])->middleware('permission:pekerjaans.ubah');
            Route::put('/{id}/status', [PekerjaanController::class, 'status'])->middleware('permission:pekerjaans.ubah');
            // Route::delete('/{id}', [PekerjaanController::class, 'destroy'])->middleware('permission:pekerjaans.hapus');
        });
        Route::prefix('provinsis')->middleware('menu.access:provinsis')->group(function () {
            Route::get('/', [ProvinsiController::class, 'index'])->middleware('permission:provinsis.lihat');
            Route::get('/aktif', [ProvinsiController::class, 'indexAktif'])->middleware('permission:provinsis.lihat-aktif');
            Route::get('/non-aktif', [ProvinsiController::class, 'indexNonAktif'])->middleware('permission:provinsis.lihat-non-aktif');
            Route::post('/', [ProvinsiController::class, 'store'])->middleware('permission:provinsis.tambah');
            Route::get('/{id}', [ProvinsiController::class, 'show'])->middleware('permission:provinsis.lihat');
            Route::put('/{id}', [ProvinsiController::class, 'update'])->middleware('permission:provinsis.ubah');
            Route::put('/{id}/status', [ProvinsiController::class, 'status'])->middleware('permission:provinsis.ubah');
            // Route::delete('/{id}', [ProvinsiController::class, 'destroy'])->middleware('permission:provinsis.hapus');
        });
         Route::prefix('kabupaten-kotas')->middleware('menu.access:kabupaten-kotas')->group(function () {
            Route::get('/', [KabupatenKotaController::class, 'index'])->middleware('permission:kabupaten-kotas.lihat');
            Route::post('/', [KabupatenKotaController::class, 'store'])->middleware('permission:kabupaten-kotas.tambah');
            Route::get('/aktif', [KabupatenKotaController::class, 'indexAktif'])->middleware('permission:kabupaten-kotas.lihat-aktif');
            Route::get('/non-aktif', [KabupatenKotaController::class, 'indexNonAktif'])->middleware('permission:kabupaten-kotas.lihat-non-aktif');
            Route::get('/{id}', [KabupatenKotaController::class, 'show'])->middleware('permission:kabupaten-kotas.lihat');
            Route::put('/{id}', [KabupatenKotaController::class, 'update'])->middleware('permission:kabupaten-kotas.ubah');
            Route::put('/{id}/status', [KabupatenKotaController::class, 'status'])->middleware('permission:kabupaten-kotas.ubah');
            // Route::delete('/{id}', [KabupatenKotaController::class, 'destroy'])->middleware('permission:kabupaten-kotas.hapus');
        });

        Route::prefix('kecamatans')->middleware('menu.access:kecamatans')->group(function () {
            Route::get('/', [KecamatanController::class, 'index'])->middleware('permission:kecamatans.lihat');
            Route::post('/', [KecamatanController::class, 'store'])->middleware('permission:kecamatans.tambah');
            Route::get('/aktif', [KecamatanController::class, 'indexAktif'])->middleware('permission:kecamatans.lihat-aktif');
            Route::get('/non-aktif', [KecamatanController::class, 'indexNonAktif'])->middleware('permission:kecamatans.lihat-non-aktif');
            Route::get('/{id}', [KecamatanController::class, 'show'])->middleware('permission:kecamatans.lihat');
            Route::put('/{id}', [KecamatanController::class, 'update'])->middleware('permission:kecamatans.ubah');
            Route::put('/{id}/status', [KecamatanController::class, 'status'])->middleware('permission:kecamatans.ubah');
            // Route::delete('/{id}', [KecamatanController::class, 'destroy'])->middleware('permission:kecamatans.hapus');
        });
        Route::prefix('kelurahans')->middleware('menu.access:kelurahans')->group(function () {
            Route::get('/', [KelurahanController::class, 'index'])->middleware('permission:kelurahans.lihat');
            Route::get('/aktif', [KelurahanController::class, 'indexAktif'])->middleware('permission:kelurahans.lihat-aktif');
            Route::get('/non-aktif', [KelurahanController::class, 'indexNonAktif'])->middleware('permission:kelurahans.lihat-non-aktif');
            Route::post('/', [KelurahanController::class, 'store'])->middleware('permission:kelurahans.tambah');
            Route::get('/{id}', [KelurahanController::class, 'show'])->middleware('permission:kelurahans.lihat');
            Route::put('/{id}', [KelurahanController::class, 'update'])->middleware('permission:kelurahans.ubah');
            Route::put('/{id}/status', [KelurahanController::class, 'status'])->middleware('permission:kelurahans.ubah');
            // Route::delete('/{id}', [KelurahanController::class, 'destroy'])->middleware('permission:kelurahans.hapus');
        });
        Route::prefix('configurasi-rate-limits')->middleware('menu.access:configurasi-rate-limits')->group(function () {
            Route::get('/', [ConfigurasiRateLimitController::class, 'index'])->middleware('permission:configurasi-rate-limits.lihat');
         //   Route::post('/', [ConfigurasiRateLimitController::class, 'store'])->middleware('permission:configurasi-rate-limits.tambah');
            Route::get('/{id}', [ConfigurasiRateLimitController::class, 'show'])->middleware('permission:configurasi-rate-limits.lihat');
            Route::put('/{id}', [ConfigurasiRateLimitController::class, 'update'])->middleware('permission:configurasi-rate-limits.ubah');
          //  Route::delete('/{id}', [ConfigurasiRateLimitController::class, 'destroy'])->middleware('permission:configurasi-rate-limits.hapus');
        });

        Route::prefix('log-blocked-users')->group(function () {
            Route::get('/', [LogBlockedUserController::class, 'index']);
            // Route::get('/active', [LogBlockedUserController::class, 'active']);
            // Route::post('/unblock', [LogBlockedUserController::class, 'unblock']);
            Route::post('/{id}/unblock', [LogBlockedUserController::class, 'unblockById']);
            
        });

        Route::prefix('email-smtps')->middleware('menu.access:email-smtps')->group(function () {
            Route::get('/', [EmailSmtpController::class, 'index'])->middleware('permission:email-smtps.lihat');
            Route::post('/', [EmailSmtpController::class, 'store'])->middleware('permission:email-smtps.tambah');
            Route::get('/{id}', [EmailSmtpController::class, 'show'])->middleware('permission:email-smtps.lihat');
            Route::put('/{id}', [EmailSmtpController::class, 'update'])->middleware('permission:email-smtps.ubah');
            Route::delete('/{id}', [EmailSmtpController::class, 'destroy'])->middleware('permission:email-smtps.hapus');
        });

        Route::prefix('url-ip-logins')->middleware('menu.access:url-ip-logins')->group(function () {
            Route::get('/', [UrlIpLoginController::class, 'index'])->middleware('permission:url-ip-logins.lihat');
            Route::get('/{id}', [UrlIpLoginController::class, 'show'])->middleware('permission:url-ip-logins.lihat');
            Route::put('/{id}', [UrlIpLoginController::class, 'update'])->middleware('permission:url-ip-logins.ubah');
        });
        Route::prefix('app-key-ocrs')->middleware('menu.access:app-key-ocrs')->group(function () {
            Route::get('/', [AppKeyOcrController::class, 'index'])->middleware('permission:app-key-ocrs.lihat');
            Route::get('/{id}', [AppKeyOcrController::class, 'show'])->middleware('permission:app-key-ocrs.lihat');
            Route::put('/{id}', [AppKeyOcrController::class, 'update'])->middleware('permission:app-key-ocrs.ubah');
        });

        Route::prefix('users')->middleware('menu.access:users')->group(function () {
            Route::get('/', [UserController::class, 'index'])->middleware('permission:users.lihat');
            Route::get('/pending', [UserController::class, 'pendingUsers'])->middleware('permission:users.lihat');
            Route::get('/aktif', [UserController::class, 'aktifUsers'])->middleware('permission:users.lihat');
            Route::get('/ditolak', [UserController::class, 'ditolakUsers'])->middleware('permission:users.lihat');
            Route::get('/nonaktif', [UserController::class, 'nonaktifUsers'])->middleware('permission:users.lihat');
            Route::get('/atasan-options', [UserController::class, 'getAtasanOptions'])->middleware('permission:users.lihat');
            Route::put('/{id}', [UserController::class, 'activate'])->middleware('permission:users.aktivasi');
        });
        Route::prefix('log-users')->middleware('menu.access:log-users')->group(function () {
            Route::get('/', [LogUserController::class, 'index'])->middleware('permission:log-users.lihat');
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
        Route::prefix('konsumens')->middleware('menu.access:konsumens')->group(function () {
            Route::post('/scan-ktp', [KonsumenController::class, 'scanKtp'])->middleware('permission:konsumens.scan', 'throttle:scan-ktp');
            Route::post('/check-nik', [KonsumenController::class, 'checkNik'])->middleware('permission:konsumens.lihat');
            Route::get('/', [KonsumenController::class, 'index'])->middleware('permission:konsumens.lihat');
            Route::get('/all', [KonsumenController::class, 'indexAll'])->middleware('permission:konsumens.lihat-semua');
            Route::post('/', [KonsumenController::class, 'store'])->middleware('permission:konsumens.tambah');
            Route::get('/status', [KonsumenController::class, 'status'])->middleware('permission:konsumens.lihat');
            Route::get('/logs', [KonsumenController::class, 'logs'])->middleware('permission:konsumens.logs');
            Route::get('/{id}', [KonsumenController::class, 'show'])->middleware('permission:konsumens.lihat');
            // Route::put('/{id}', [KonsumenController::class, 'update'])->middleware('permission:konsumens.ubah');
            Route::put('/{id}', [KonsumenController::class, 'update'])
                    ->whereNumber('id')
                    ->middleware('permission:konsumens.ubah');
            Route::post('/{id}/update', [KonsumenController::class, 'update'])
                    ->whereNumber('id')
                    ->middleware('permission:konsumens.ubah');
            Route::delete('/{id}', [KonsumenController::class, 'destroy'])->middleware('permission:konsumens.hapus');
            Route::put('/activate/{id}', [KonsumenController::class, 'activate'])->middleware('permission:konsumens.aktivasi');
           
        });
        Route::prefix('email-whitelists')->middleware('menu.access:email-whitelists')->group(function () {
            Route::get('/', [EmailWhiteListController::class, 'index'])->middleware('permission:email-whitelists.lihat');
            Route::post('/', [EmailWhiteListController::class, 'store'])->middleware('permission:email-whitelists.tambah');
            Route::get('/{id}', [EmailWhiteListController::class, 'show'])->middleware('permission:email-whitelists.lihat');
            Route::put('/{id}', [EmailWhiteListController::class, 'update'])->middleware('permission:email-whitelists.ubah');
            Route::delete('/{id}', [EmailWhiteListController::class, 'destroy'])->middleware('permission:email-whitelists.hapus');
        });

    });