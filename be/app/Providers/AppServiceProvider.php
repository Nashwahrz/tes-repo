<?php

namespace App\Providers;

use App\Http\Responses\ConfigurasiRateLimitResponse;
use App\Models\ConfigurasiRateLimit;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Scramble::configure()
            ->withDocumentTransformers(function (OpenApi $openApi) {
                $openApi->secure(
                    SecurityScheme::http('bearer')
                );
            });

        RateLimiter::for('otp-send', function (Request $request) {
            $config = ConfigurasiRateLimit::where('name', 'otp-send')->first();

            if ($config && ! $config->is_active) {
                return Limit::none();
            }

            $minutes = $config?->minutes ?? 0;
            $requestPerMinutes = $config?->request_per_minutes ?? 0;

            $responseCallback = function (Request $request, array $headers) {
                return app(ConfigurasiRateLimitResponse::class)->tooManyAttempts($request, $headers);
            };

            return [
                Limit::perMinutes($minutes, $requestPerMinutes)
                    ->by('ip:' . $request->ip())
                    ->response($responseCallback),
                Limit::perMinutes($minutes, $requestPerMinutes)
                    ->by('email:' . strtolower((string) $request->input('email')))
                    ->response($responseCallback),
            ];
        });
        RateLimiter::for('otp-verify', function (Request $request) {
            $config = ConfigurasiRateLimit::where('name', 'otp-verify')->first();

            if ($config && ! $config->is_active) {
                return Limit::none();
            }

            $minutes = $config?->minutes ?? 0;
            $requestPerMinutes = $config?->request_per_minutes ?? 0;

            $responseCallback = function (Request $request, array $headers) {
                return app(ConfigurasiRateLimitResponse::class)->tooManyAttempts($request, $headers);
            };

            return [
                Limit::perMinutes($minutes, $requestPerMinutes)
                    ->by('ip:' . $request->ip())
                    ->response($responseCallback),
                Limit::perMinutes($minutes, $requestPerMinutes)
                    ->by('email:' . strtolower((string) $request->input('email')))
                    ->response($responseCallback),
            ];
        });
        RateLimiter::for('scan-ktp', function (Request $request) {
            $config = ConfigurasiRateLimit::where('name', 'scan-ktp')->first();

            if ($config && ! $config->is_active) {
                return Limit::none();
            }

            $minutes = $config?->minutes ?? 0;
            $requestPerMinutes = $config?->request_per_minutes ?? 0;

            $responseCallback = function (Request $request, array $headers) {
                return app(ConfigurasiRateLimitResponse::class)->tooManyAttempts($request, $headers);
            };

            return Limit::perMinutes($minutes, $requestPerMinutes)
                ->by('user:' . ($request->user()?->id ?? $request->ip()))
                ->response($responseCallback);
        });
    }
}
