<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Products\Models\Product;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_list_products(): void
    {
        Product::factory()->count(3)->create();

        $this->actingAs($this->user, 'sanctum')
             ->getJson('/api/products')
             ->assertOk()
             ->assertJsonCount(3, 'data');
    }

    public function test_can_search_products_by_description(): void
    {
        Product::factory()->create(['descripcion' => 'Coca-Cola 600ml']);
        Product::factory()->create(['descripcion' => 'Pepsi 600ml']);

        $this->actingAs($this->user, 'sanctum')
             ->getJson('/api/products?search=Coca')
             ->assertOk()
             ->assertJsonCount(1, 'data')
             ->assertJsonPath('data.0.descripcion', 'Coca-Cola 600ml');
    }

    public function test_can_find_product_by_barcode(): void
    {
        $product = Product::factory()->create(['codigo_barras' => '7501055300906']);

        $this->actingAs($this->user, 'sanctum')
             ->getJson('/api/products/barcode/7501055300906')
             ->assertOk()
             ->assertJsonPath('data.id', $product->id);
    }

    public function test_barcode_lookup_returns_404_when_not_found(): void
    {
        $this->actingAs($this->user, 'sanctum')
             ->getJson('/api/products/barcode/0000000000000')
             ->assertStatus(404);
    }

    public function test_can_create_product(): void
    {
        $payload = [
            'codigo_barras' => '1234567890123',
            'descripcion'   => 'Test Product',
            'precio_compra' => 5.00,
            'precio_venta'  => 10.00,
            'existencia'    => 50,
        ];

        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/products', $payload)
             ->assertStatus(201)
             ->assertJsonPath('data.descripcion', 'Test Product');

        $this->assertDatabaseHas('products', ['codigo_barras' => '1234567890123']);
    }

    public function test_cannot_create_product_with_duplicate_barcode(): void
    {
        Product::factory()->create(['codigo_barras' => 'DUPE']);

        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/products', [
                 'codigo_barras' => 'DUPE',
                 'descripcion'   => 'Another',
                 'precio_compra' => 1.00,
                 'precio_venta'  => 2.00,
                 'existencia'    => 10,
             ])
             ->assertStatus(422)
             ->assertJsonStructure(['errors' => ['codigo_barras']]);
    }

    public function test_can_update_product(): void
    {
        $product = Product::factory()->create(['precio_venta' => 10.00]);

        $this->actingAs($this->user, 'sanctum')
             ->putJson("/api/products/{$product->id}", ['precio_venta' => 15.00])
             ->assertOk()
             ->assertJsonPath('data.precio_venta', '15.00');
    }

    public function test_can_delete_product(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->user, 'sanctum')
             ->deleteJson("/api/products/{$product->id}")
             ->assertOk();

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }
}
