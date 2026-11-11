<?php

namespace App\Enums;

enum RateLimiterKey: string
{
    case OtpSend   = 'otp-send';
    case OtpVerify = 'otp-verify';
    case Login     = 'login';
    case ScanKtp   = 'scan-ktp';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

