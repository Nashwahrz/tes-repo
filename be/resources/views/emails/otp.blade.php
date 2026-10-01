<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP Verifikasi</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7f6;
            margin: 0;
            padding: 0;
            color: #333333;
        }
        .container {
            max-width: 520px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.06);
            overflow: hidden;
            border: 1px solid #eef2f5;
        }
        .header {
            background: linear-gradient(135deg, #6de449ff 0%, #abf07dff 100%);
            color: #ffffff;
            text-align: center;
            padding: 30px 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .body-content {
            padding: 30px;
            line-height: 1.6;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #2c3e50;
        }
        .otp-box {
            background-color: #f0f4f8;
            border: 2px dashed #78e660ff;
            border-radius: 8px;
            text-align: center;
            padding: 20px;
            margin: 25px 0;
        }
        .otp-code {
            font-size: 34px;
            font-weight: 700;
            letter-spacing: 8px;
            color: rgba(7, 153, 9, 1)ff;
            margin: 0;
            font-family: 'Courier New', Courier, monospace;
        }
        .expiry-text {
            font-size: 13px;
            color: #7f8c8d;
            margin-top: 8px;
            margin-bottom: 0;
        }
        .warning {
            font-size: 13px;
            color: #e74c3c;
            background: #fdf2f2;
            padding: 12px;
            border-radius: 6px;
            margin-top: 20px;
        }
        .footer {
            background: #f9fbfd;
            border-top: 1px solid #eef2f5;
            text-align: center;
            padding: 18px;
            font-size: 12px;
            color: #95a5a6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verifikasi Akun</h1>
        </div>
        <div class="body-content">
            <p class="greeting">Halo, {{ $name }}!</p>
            <p>Gunakan kode OTP berikut untuk melakukan verifikasi akun Anda:</p>
            
            <div class="otp-box">
                <p class="otp-code">{{ $otp }}</p>
                <p class="expiry-text">Kode ini berlaku selama <strong>{{ $expiryMinutes }} menit</strong>.</p>
            </div>

            <div class="warning">
                <strong>Penting:</strong> Jangan berikan kode OTP ini kepada siapa pun, termasuk pihak yang mengatasnamakan kami.
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #555;">Jika Anda tidak meminta kode ini, silakan abaikan email ini.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
        </div>
    </div>
</body>
</html>
