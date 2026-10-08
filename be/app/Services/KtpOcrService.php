<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class KtpOcrService
{
    private string $apiKey;
    private string $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.ocr_space.key');
        $this->apiUrl = config('services.ocr_space.url');
    }


    public function extractKtp(UploadedFile $file): array
    {
        $response = Http::asMultipart()->post($this->apiUrl, [
            [
                'name'     => 'apikey',
                'contents' => $this->apiKey,
            ],
            [
                'name'     => 'file',
                'contents' => fopen($file->getRealPath(), 'r'),
                'filename' => $file->getClientOriginalName(),
            ],
            [
                'name'     => 'language',
                'contents' => 'auto',
            ],
            [
                'name'     => 'OCREngine',
                'contents' => '2',
            ],
            [
                'name'     => 'isOverlayRequired',
                'contents' => 'false',
            ],
            [
                'name'     => 'isTable',
                'contents' => 'true',
            ],
            

        ]);

        if (!$response->successful()) {
            Log::error('OCR.space request failed', ['response' => $response->body()]);
            throw new Exception('Gagal menghubungi layanan OCR.');
        }

        $result = $response->json();

        if (!empty($result['IsErroredOnProcessing']) && $result['IsErroredOnProcessing'] === true) {
            $msg = $result['ErrorMessage'][0] ?? 'Gagal memproses gambar KTP.';
            throw new Exception($msg);
        }

        $parsedText = $result['ParsedResults'][0]['ParsedText'] ?? '';

        return $this->parseKtpText($parsedText);
    }

    private function parseKtpText(string $rawText): array
    {
        $data = [
            'raw_text'          => $rawText,
            'nik'               => null,
            'name'              => null,
            'tmp_lahir'         => null,
            'tgl_lahir'         => null,
            'jenis_kelamin'     => null,
            'alamat'            => null,
            'rt'                => null,
            'rw'                => null,
            'desa_kelurahan'    => null,
            'kecamatan'         => null,
            'kabupaten_kota'    => null,
            'provinsi'          => null,
            'agama'             => null,
            'status_perkawinan' => null,
            'pekerjaan'         => null,
            'kewarganegaraan'   => 'WNI',
        ];

        if (preg_match('/PROVINSI\s+([^\n\r]+)/i', $rawText, $match)) {
            $data['provinsi'] = trim(preg_replace('/[^a-zA-Z\s]/', '', $match[1]));
        }
        if (preg_match('/(?:KOTA|KABUPATEN)\s+([^\n\r]+)/i', $rawText, $match)) {
            $data['kabupaten_kota'] = trim(preg_replace('/[^a-zA-Z\s]/', '', $match[1]));
        }
        if (preg_match('/(?:NIK|N1K)?\s*[:\s]?\s*([0-9]{16})/i', $rawText, $match)) {
            $data['nik'] = $match[1];
        }
        if (preg_match('/Nama\s*[:\s]+([^\n\r]+)/i', $rawText, $match)) {
            $data['name'] = trim(preg_replace('/[^a-zA-Z\s\.\,\']/', '', $match[1]));
        }
        if (preg_match('/(?:Tempat|Tpt)[\/\s]*Tgl\s*Lahir\s*[:\s]+([^,]+),\s*([0-9]{2}[-\/][0-9]{2}[-\/][0-9]{4})/i', $rawText, $match)) {
            $data['tmp_lahir'] = trim($match[1]);
            $tgl = str_replace('/', '-', trim($match[2]));
            $data['tgl_lahir'] = date('Y-m-d', strtotime($tgl));
        }
        if (preg_match('/LAKI-LAKI|LAKI/i', $rawText)) {
            $data['jenis_kelamin'] = 'Laki-laki';
        } elseif (preg_match('/PEREMPUAN/i', $rawText)) {
            $data['jenis_kelamin'] = 'Perempuan';
        }
        if (preg_match('/Alamat\s*[:\s]+([^\n\r]+)/i', $rawText, $match)) {
            $data['alamat'] = trim($match[1]);
        }
        if (preg_match('/RT[\/\s]*RW\s*[:\s]+([0-9]{1,3})\s*[\/\-]\s*([0-9]{1,3})/i', $rawText, $match)) {
            $data['rt'] = str_pad($match[1], 3, '0', STR_PAD_LEFT);
            $data['rw'] = str_pad($match[2], 3, '0', STR_PAD_LEFT);
        }
        if (preg_match('/(?:Kel\/Desa|Kelurahan|Desa)\s*[:\s]+([^\n\r]+)/i', $rawText, $match)) {
            $data['desa_kelurahan'] = trim(preg_replace('/[^a-zA-Z0-9\s]/', '', $match[1]));
        }
        if (preg_match('/Kecamatan\s*[:\s]+([^\n\r]+)/i', $rawText, $match)) {
            $data['kecamatan'] = trim(preg_replace('/[^a-zA-Z0-9\s]/', '', $match[1]));
        }
        if (preg_match('/Agama\s*[:\s]+([^\n\r]+)/i', $rawText, $match)) {
            $agamaText = strtoupper(trim($match[1]));
            if (str_contains($agamaText, 'ISLAM')) $data['agama'] = 'Islam';
            elseif (str_contains($agamaText, 'KRISTEN') || str_contains($agamaText, 'PROTESTAN')) $data['agama'] = 'Kristen';
            elseif (str_contains($agamaText, 'KATOLIK')) $data['agama'] = 'Katolik';
            elseif (str_contains($agamaText, 'HINDU')) $data['agama'] = 'Hindu';
            elseif (str_contains($agamaText, 'BUDDHA')) $data['agama'] = 'Buddha';
            elseif (str_contains($agamaText, 'KONGHUCU')) $data['agama'] = 'Konghucu';
        }
        if (preg_match('/Status\s*Perkawinan\s*[:\s]+([^\n\r]+)/i', $rawText, $match)) {
            $statusText = strtoupper(trim($match[1]));
            if (str_contains($statusText, 'BELUM')) $data['status_perkawinan'] = 'Belum Kawin';
            elseif (str_contains($statusText, 'KAWIN')) $data['status_perkawinan'] = 'Kawin';
            elseif (str_contains($statusText, 'CERAI HIDUP')) $data['status_perkawinan'] = 'Cerai Hidup';
            elseif (str_contains($statusText, 'CERAI MATI')) $data['status_perkawinan'] = 'Cerai Mati';
        }
        if (preg_match('/Pekerjaan\s*[:\s]+([^\n\r]+)/i', $rawText, $match)) {
            $data['pekerjaan'] = trim(preg_replace('/[^a-zA-Z0-9\s\/\-\.]/', '', $match[1]));
        }
        if (preg_match('/Kewarganegaraan\s*[:\s]+([^\n\r]+)/i', $rawText, $match)) {
            $data['kewarganegaraan'] = str_contains(strtoupper($match[1]), 'WNA') ? 'WNA' : 'WNI';
        }
        return $data;
    }
}

