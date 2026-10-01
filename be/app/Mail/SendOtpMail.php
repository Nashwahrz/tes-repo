<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $otp,
        public int $expiryMinutes = 5
    ) {}

  
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kode Verifikasi OTP Anda',
        );
    }

   
    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
            with: [
                'name' => $this->user->name,
                'otp' => $this->otp,
                'expiryMinutes' => $this->expiryMinutes,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
