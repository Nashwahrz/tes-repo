<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$url = Illuminate\Support\Facades\URL::temporarySignedRoute('konsumens.foto-ktp', now()->addMinutes(10), ['id' => 32, 'type' => 'temp'], false);
echo "URL: " . $url . "\n";

$req = Illuminate\Http\Request::create($url, 'GET');
echo "Valid relative: " . ($req->hasValidRelativeSignature() ? 'YES' : 'NO') . "\n";
echo "Valid absolute: " . ($req->hasValidSignature() ? 'YES' : 'NO') . "\n";

$urlWithoutType = preg_replace('/type=temp&?/', '', $url);
$req2 = Illuminate\Http\Request::create($urlWithoutType, 'GET');
echo "Without type query in request valid: " . ($req2->hasValidRelativeSignature() ? 'YES' : 'NO') . "\n";

