<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Products\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $purchase = fake()->randomFloat(2, 1, 100);

        return [
            'codigo_barras' => fake()->unique()->ean13(),
            'descripcion'   => fake()->words(3, true),
            'precio_compra' => $purchase,
            'precio_venta'  => round($purchase * fake()->randomFloat(2, 1.1, 2.5), 2),
            'existencia'    => fake()->randomFloat(2, 0, 100),
        ];
    }
}
