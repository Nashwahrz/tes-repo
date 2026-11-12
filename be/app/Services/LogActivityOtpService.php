<?php

namespace App\Services;

use App\Enums\LogOtpAction;
use App\Enums\OtpPurpose;
use App\Models\LogActivityOtp;
use App\Models\User;
use App\Repositories\LogActivityOtpRepository;
use Illuminate\Support\Facades\Request;

class LogActivityOtpService
{
    public function __construct(
        protected ?LogActivityOtpRepository $repository = null
    ) {
        $this->repository = $repository ?? app(LogActivityOtpRepository::class);
    }

    public function logRequested(User $user, OtpPurpose $purpose): LogActivityOtp
    {
        $desc = sprintf(
            'Permintaan OTP untuk %s berhasil dikirim ke email %s.',
            $purpose->label(),
            $user->email
        );

        return $this->record([
            'fk_user'     => $user->id,
            'email'       => $user->email,
            'purpose'     => $purpose,
            'action'      => LogOtpAction::Requested,
            'description' => $desc,
        ]);
    }

    public function logVerified(User $user, OtpPurpose $purpose): LogActivityOtp
    {
        $desc = sprintf(
            'Verifikasi OTP untuk %s berhasil dilakukan oleh user %s (%s).',
            $purpose->label(),
            $user->name,
            $user->email
        );

        return $this->record([
            'fk_user'     => $user->id,
            'email'       => $user->email,
            'purpose'     => $purpose,
            'action'      => LogOtpAction::Verified,
            'description' => $desc,
        ]);
    }

    public function logFailed(User $user, OtpPurpose $purpose, string $reason): LogActivityOtp
    {
        $desc = sprintf(
            'Gagal verifikasi OTP untuk %s pada email %s. Alasan: %s.',
            $purpose->label(),
            $user->email,
            $reason
        );

        return $this->record([
            'fk_user'     => $user->id,
            'email'       => $user->email,
            'purpose'     => $purpose,
            'action'      => LogOtpAction::Failed,
            'description' => $desc,
        ]);
    }

    public function record(array $data): LogActivityOtp
    {
        return $this->repository->create([
            'fk_user'     => $data['fk_user']     ?? null,
            'email'       => $data['email'],
            'purpose'     => $data['purpose'],
            'action'      => $data['action'],
            'description' => $data['description'] ?? null,
            'ip_address'  => $data['ip_address']  ?? Request::ip(),
            'user_agent'  => $data['user_agent']  ?? Request::userAgent(),
            'created_at'  => now(),
        ]);
    }
}

