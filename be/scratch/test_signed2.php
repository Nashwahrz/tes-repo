<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$urlWithout = Illuminate\Support\Facades\URL::temporarySignedRoute('konsumens.foto-ktp', now()->addMinutes(10), ['id' => 32], false);
echo "URL without type: " . $urlWithout . "\n";
$req = Illuminate\Http\Request::create($urlWithout, 'GET');
echo "Valid relative: " . ($req->hasValidRelativeSignature() ? 'YES' : 'NO') . "\n";

