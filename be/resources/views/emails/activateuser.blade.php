<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aktivasi Akun</title>
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
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            border: 1px solid #eef2f5;
        }
        .header {
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
        .badge {
            display: inline-block;
            padding: 3px 12px;
            border-radius: 20px;
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
        }
        .notice {
            font-size: 13px;
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
    @php
        $statusText = strtolower(trim((string) ($status ?? '')));

        if (in_array($statusText, ['aktif'])) {
            $color  = '#2e9e1f';
            $bg     = '#f0faee';
            $label  = 'Aktif';
            $pesan  = 'Selamat, akun Anda telah diaktifkan.';
            $catatan = 'Silakan login menggunakan email dan password yang telah didaftarkan.';
        } else {
            $color  = '#d93025';
            $bg     = '#fdf2f2';
            $label  = 'Ditolak';
            $pesan  = 'Mohon maaf, pengajuan aktivasi akun Anda ditolak.';
            $catatan = 'Silakan hubungi atasan atau administrator untuk informasi lebih lanjut.';
        } 
    @endphp

    <div class="container">
        <div class="header" style="background-color: {{ $color }};">
            <h1>Aktivasi Akun</h1>
        </div>

        <div class="body-content">
            <p class="greeting">Halo, {{ $name }}!</p>

            <p>{{ $pesan }}</p>

            <p>
                Status akun Anda:
                <span class="badge" style="background-color: {{ $color }};">{{ $label }}</span>
            </p>

            <p>
                Anda terdaftar di <strong>{{ $dealer ?? '-' }}</strong>
                dengan atasan <strong>{{ $atasan ?? '-' }}</strong>.
            </p>

            <div class="notice" style="color: {{ $color }}; background-color: {{ $bg }};">
                <strong>Penting:</strong> {{ $catatan }}
            </div>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} {{ config('app.name') }}. Hak cipta dilindungi.
        </div>
    </div>
</body>
</html>