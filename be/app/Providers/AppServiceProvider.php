<?php

namespace App\Providers;

use App\Http\Responses\ConfigurasiRateLimitResponse;
use App\Models\ConfigurasiRateLimit;
use App\Models\EmailSmtp;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
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
        $this->configureMail();

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

    private function configureMail(): void
    {
        try {
            if (Schema::hasTable('setting.email_smtp')) {
                $smtp = Cache::remember('active_email_smtp', 3600, function () {
                    return EmailSmtp::where('is_active', true)->first();
                });

                if ($smtp) {
                    $encryption = in_array(strtolower((string) $smtp->mail_encryption), ['null', '', 'none'], true)
                        ? null
                        : $smtp->mail_encryption;

                    config([
                        'mail.default'                 => $smtp->mail_mailer ?: 'smtp',
                        'mail.mailers.smtp.transport'  => $smtp->mail_mailer ?: 'smtp',
                        'mail.mailers.smtp.host'       => $smtp->mail_host,
                        'mail.mailers.smtp.port'       => (int) $smtp->mail_port,
                        'mail.mailers.smtp.encryption' => $encryption,
                        'mail.mailers.smtp.username'   => $smtp->mail_username,
                        'mail.mailers.smtp.password'   => $smtp->mail_password,
                        'mail.mailers.smtp.verify_peer'=> false,
                        'mail.from.address'            => $smtp->mail_from_address,
                        'mail.from.name'               => $smtp->mail_from_name,
                    ]);
                }
            }
        } catch (\Throwable $e) {
           
        }
    }
}

