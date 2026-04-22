<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Customers\Models\Customer;
use App\Domain\Products\Models\Product;
use App\Domain\Sales\Models\Sale;
use App\Domain\Sales\Models\SaleItem;
use App\Domain\Users\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Idempotent: safe to run on every container startup
        User::firstOrCreate(['email' => 'admin@pos.local'], [
            'name'     => 'Admin',
            'password' => Hash::make('password'),
        ]);

        User::firstOrCreate(['email' => 'cajero1@pos.local'], [
            'name'     => 'Cajero 1',
            'password' => Hash::make('password'),
        ]);

        $customers = [
            ['nombre' => 'Juan Pérez',       'telefono' => '555-1001'],
            ['nombre' => 'María García',      'telefono' => '555-1002'],
            ['nombre' => 'Carlos López',      'telefono' => '555-1003'],
            ['nombre' => 'Ana Martínez',      'telefono' => '555-1004'],
            ['nombre' => 'Roberto Hernández', 'telefono' => '555-1005'],
        ];

        foreach ($customers as $data) {
            Customer::firstOrCreate(['nombre' => $data['nombre']], $data);
        }

        $products = [
            ['codigo_barras' => '7501055300906', 'descripcion' => 'Coca-Cola 600ml',        'precio_compra' => 9.00,  'precio_venta' => 15.00, 'existencia' => 48],
            ['codigo_barras' => '7501055390013', 'descripcion' => 'Pepsi 600ml',             'precio_compra' => 8.50,  'precio_venta' => 14.00, 'existencia' => 36],
            ['codigo_barras' => '7501055311018', 'descripcion' => 'Agua Natural 1.5L',       'precio_compra' => 6.00,  'precio_venta' => 10.00, 'existencia' => 60],
            ['codigo_barras' => '7501000641321', 'descripcion' => 'Sabritas Originales 45g', 'precio_compra' => 7.00,  'precio_venta' => 12.00, 'existencia' => 24],
            ['codigo_barras' => '7501000638666', 'descripcion' => 'Ruffles Queso 45g',       'precio_compra' => 7.00,  'precio_venta' => 12.00, 'existencia' => 24],
            ['codigo_barras' => '7501055360016', 'descripcion' => 'Gatorade Limón 600ml',    'precio_compra' => 12.00, 'precio_venta' => 20.00, 'existencia' => 30],
            ['codigo_barras' => '7501020564022', 'descripcion' => 'Boing Mango 250ml',       'precio_compra' => 5.00,  'precio_venta' => 9.00,  'existencia' => 48],
            ['codigo_barras' => '7501000664307', 'descripcion' => 'Pan Bimbo Blanco',        'precio_compra' => 30.00, 'precio_venta' => 42.00, 'existencia' => 15],
            ['codigo_barras' => '7501031310401', 'descripcion' => 'Leche Lala Entera 1L',    'precio_compra' => 18.00, 'precio_venta' => 25.00, 'existencia' => 20],
            ['codigo_barras' => '7501000633036', 'descripcion' => 'Doritos Nacho 65g',       'precio_compra' => 9.50,  'precio_venta' => 16.00, 'existencia' => 30],
        ];

        foreach ($products as $data) {
            Product::firstOrCreate(['codigo_barras' => $data['codigo_barras']], $data);
        }

        // Sample sales: only seed if no sales exist yet
        if (Sale::count() === 0) {
            $this->createSampleSale(
                customerId: Customer::where('nombre', 'Juan Pérez')->value('id'),
                items: [
                    ['product_id' => Product::where('codigo_barras', '7501055300906')->value('id'), 'quantity' => 2],
                    ['product_id' => Product::where('codigo_barras', '7501000641321')->value('id'), 'quantity' => 1],
                ]
            );

            $this->createSampleSale(
                customerId: Customer::where('nombre', 'María García')->value('id'),
                items: [
                    ['product_id' => Product::where('codigo_barras', '7501055311018')->value('id'), 'quantity' => 3],
                    ['product_id' => Product::where('codigo_barras', '7501000664307')->value('id'), 'quantity' => 1],
                    ['product_id' => Product::where('codigo_barras', '7501031310401')->value('id'), 'quantity' => 2],
                ]
            );

            $this->createSampleSale(
                customerId: null,
                items: [
                    ['product_id' => Product::where('codigo_barras', '7501000638666')->value('id'), 'quantity' => 1],
                    ['product_id' => Product::where('codigo_barras', '7501055360016')->value('id'), 'quantity' => 2],
                ]
            );
        }
    }

    /** @param array<int, array{product_id: int, quantity: float}> $items */
    private function createSampleSale(?int $customerId, array $items): void
    {
        $sale = Sale::create(['customer_id' => $customerId]);

        foreach ($items as $item) {
            $product = Product::find($item['product_id']);
            if ($product === null) {
                continue;
            }

            SaleItem::create([
                'sale_id'       => $sale->id,
                'descripcion'   => $product->descripcion,
                'codigo_barras' => $product->codigo_barras,
                'unit_price'    => $product->precio_venta,
                'quantity'      => $item['quantity'],
            ]);

            $product->decrement('existencia', $item['quantity']);
        }
    }
}
