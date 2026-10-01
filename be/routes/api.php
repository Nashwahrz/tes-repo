<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserManagementController;
use App\Http\Middleware\EnsureManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', EnsureManager::class])->prefix('users')->group(function () {
    Route::get('/', [UserManagementController::class, 'index']);
    Route::patch('/{user}/status', [UserManagementController::class, 'updateStatus']);
});
