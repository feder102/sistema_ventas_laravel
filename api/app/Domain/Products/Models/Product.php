<?php

declare(strict_types=1);

namespace App\Domain\Products\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    protected $fillable = [
        'codigo_barras',
        'descripcion',
        'precio_compra',
        'precio_venta',
        'existencia',
    ];

    protected function casts(): array
    {
        return [
            'precio_compra' => 'decimal:2',
            'precio_venta'  => 'decimal:2',
            'existencia'    => 'decimal:2',
        ];
    }

    public function getUtilidadAttribute(): string
    {
        return number_format((float) $this->precio_venta - (float) $this->precio_compra, 2);
    }
}
