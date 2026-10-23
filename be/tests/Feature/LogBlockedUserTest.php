<?php

namespace Tests\Feature;

use App\Enums\StatusUser;
use App\Models\ConfigurasiRateLimit;
use App\Models\LogBlockedUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LogBlockedUserTest extends TestCase
{
    public function test_failed_login_creates_blocked_log_and_can_be_unblocked_by_admin(): void
    {
        $email = 'blocked_test_user@example.com';
        $correctPassword = 'password123';
        $wrongPassword = 'wrongpassword';

        // Ensure user exists
        $user = User::withoutGlobalScopes()->where('email', $email)->first();
        if (!$user) {
            $user = User::withoutGlobalScopes()->create([
                'name' => 'Blocked Test User',
                'email' => $email,
                'password' => Hash::make($correctPassword),
                'email_verifikasi' => true,
                'status' => StatusUser::Aktif,
                'id_role' => 1,
            ]);
        }

        // Clean cache
        app(\App\Services\LoginLogService::class)->clearAttempts('127.0.0.1', $email);

        $loginConfig = ConfigurasiRateLimit::where('name', 'login')->first();
        $maxAttempts = $loginConfig ? $loginConfig->request_per_minutes : 5;

        // Perform failed logins until locked
        for ($i = 1; $i <= $maxAttempts; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => $email,
                'password' => $wrongPassword,
            ]);

            if ($i < $maxAttempts) {
                $response->assertStatus(401);
            } else {
                $response->assertStatus(429);
            }
        }

        // Verify record in log_blocked_users exists
        $blockedRecord = LogBlockedUser::where('email', $email)
            ->where('type', 'login')
            ->where('is_unblocked', false)
            ->latest('id')
            ->first();

        $this->assertNotNull($blockedRecord, 'Log blocked user should be recorded in database');
        $this->assertEquals('aktif', $blockedRecord->status);
        $this->assertTrue($blockedRecord->is_active_blocked);

        // Authenticate as Admin
        Sanctum::actingAs($user);

        // Test GET /api/log-blocked-users
        $listResponse = $this->getJson('/api/log-blocked-users');
        $listResponse->assertStatus(200);
        $listResponse->assertJsonStructure([
            'success',
            'data' => [
                'data',
            ],
        ]);

        // Test GET /api/log-blocked-users/active
        $activeResponse = $this->getJson('/api/log-blocked-users/active');
        $activeResponse->assertStatus(200);

        // Test Unblock by ID
        $unblockResponse = $this->postJson("/api/log-blocked-users/{$blockedRecord->id}/unblock");
        $unblockResponse->assertStatus(200);
        $unblockResponse->assertJson([
            'success' => true,
            'message' => 'Blokir akun berhasil dibuka.',
        ]);

        // Verify status is now 'dibuka'
        $blockedRecord->refresh();
        $this->assertTrue($blockedRecord->is_unblocked);
        $this->assertEquals('dibuka', $blockedRecord->status);
        $this->assertFalse($blockedRecord->is_active_blocked);

        // Reset auth guard to web before testing login again
        \Illuminate\Support\Facades\Auth::shouldUse('web');

        // Now user can attempt login with correct password successfully!
        $loginAgain = $this->postJson('/api/login', [
            'email' => $email,
            'password' => $correctPassword,
        ]);
        $loginAgain->assertStatus(200);

        // Clean up
        app(\App\Services\LoginLogService::class)->clearAttempts('127.0.0.1', $email);
        $blockedRecord->delete();
        $user->delete();
    }

    public function test_unblock_by_target_email(): void
    {
        $admin = User::withoutGlobalScopes()->where('id', 1)->first();
        Sanctum::actingAs($admin);

        // Record a mock block
        $blocked = app(\App\Repositories\LogBlockedUserRepository::class)->recordBlock(
            '192.168.1.100',
            'target_to_unblock@example.com',
            'otp-send',
            'Percobaan OTP',
            600,
            5
        );

        $this->assertFalse($blocked->is_unblocked);

        $response = $this->postJson('/api/log-blocked-users/unblock', [
            'email' => 'target_to_unblock@example.com',
            'ip'    => '192.168.1.100',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        $blocked->refresh();
        $this->assertTrue($blocked->is_unblocked);

        $blocked->delete();
    }
}
