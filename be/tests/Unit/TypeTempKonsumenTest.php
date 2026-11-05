<?php

namespace Tests\Unit;

use App\Enums\TypeTempKonsumen;
use App\Models\TempKonsumen;
use PHPUnit\Framework\TestCase;

class TypeTempKonsumenTest extends TestCase
{
    public function test_enum_values_and_labels()
    {
        $this->assertEquals('tambah', TypeTempKonsumen::Tambah->value);
        $this->assertEquals('edit', TypeTempKonsumen::Edit->value);
        $this->assertEquals('baru', TypeTempKonsumen::Baru->value);

        $this->assertEquals('Tambah', TypeTempKonsumen::Tambah->label());
        $this->assertEquals('Edit', TypeTempKonsumen::Edit->label());
        $this->assertEquals('Tambah', TypeTempKonsumen::Baru->label());

        $this->assertTrue(TypeTempKonsumen::Tambah->isTambah());
        $this->assertFalse(TypeTempKonsumen::Tambah->isEdit());

        $this->assertTrue(TypeTempKonsumen::Edit->isEdit());
        $this->assertFalse(TypeTempKonsumen::Edit->isTambah());
    }

    public function test_model_casts_tipe_to_enum()
    {
        $model = new TempKonsumen();
        $model->tipe = 'tambah';
        $this->assertInstanceOf(TypeTempKonsumen::class, $model->tipe);
        $this->assertEquals(TypeTempKonsumen::Tambah, $model->tipe);

        $model->tipe = TypeTempKonsumen::Edit;
        $this->assertInstanceOf(TypeTempKonsumen::class, $model->tipe);
        $this->assertEquals(TypeTempKonsumen::Edit, $model->tipe);

        $array = $model->toArray();
        $this->assertEquals('edit', $array['tipe']);
    }
}

