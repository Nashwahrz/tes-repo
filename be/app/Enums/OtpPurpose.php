<?php

namespace App\Enums;

enum OtpPurpose: string
{
    case Register      = 'register';
    case ResetPassword = 'reset_password';


    public function label(): string
    {
        return match($this) {
            OtpPurpose::Register => 'Register',
            OtpPurpose::ResetPassword => 'Reset Password',
        };
    }

}
