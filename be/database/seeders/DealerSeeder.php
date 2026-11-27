<?php

namespace Database\Seeders;

use App\Models\Dealer;
use Illuminate\Database\Seeder;

class DealerSeeder extends Seeder
{
    public function run(): void
    {
        $dealers = [
            [
                'dealer_name' => 'Hayati Padang Utama',
                'address'     => 'Jl. Pemuda No. 35, Olo, Kec. Padang Barat, Kota Padang, Sumatera Barat',
                'latitude'    => -0.947100,
                'longitude'   => 100.354300,
            ],
            [
                'dealer_name' => 'Hayati Bukittinggi',
                'address'     => 'Jl. Soekarno Hatta No. 12, Aur Kuning, Kec. Aur Birugo Tigo Baleh, Kota Bukittinggi, Sumatera Barat',
                'latitude'    => -0.305500,
                'longitude'   => 100.369200,
            ],
            [
                'dealer_name' => 'Hayati Payakumbuh',
                'address'     => 'Jl. Jenderal Sudirman No. 88, Labuh Baru, Kec. Payakumbuh Utara, Kota Payakumbuh, Sumatera Barat',
                'latitude'    => -0.220200,
                'longitude'   => 100.630900,
            ],
            [
                'dealer_name' => 'Hayati Solok',
                'address'     => 'Jl. Lintas Sumatera No. 45, Tanah Garam, Kec. Lubuk Sikarah, Kota Solok, Sumatera Barat',
                'latitude'    => -0.789300,
                'longitude'   => 100.654800,
            ],
            [
                'dealer_name' => 'Hayati Pariaman',
                'address'     => 'Jl. Imam Bonjol No. 19, Kampung Baru, Kec. Pariaman Tengah, Kota Pariaman, Sumatera Barat',
                'latitude'    => -0.626400,
                'longitude'   => 100.120500,
            ],
        ];

        foreach ($dealers as $dealer) {
            Dealer::withoutGlobalScopes()->updateOrCreate(
                ['dealer_name' => $dealer['dealer_name']],
                $dealer
            );
        }

        $this->command?->info(count($dealers) . ' data dealer berhasil di-seed.');
    }
}
