<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Customers\Models\Customer;
use App\Domain\Products\Models\Product;
use App\Domain\Sales\Models\Sale;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_complete_a_sale(): void
    {
        $customer = Customer::factory()->create();
        $product  = Product::factory()->create(['existencia' => 10, 'precio_venta' => 15.00]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/sales', [
                             'customer_id' => $customer->id,
                             'items'       => [
                                 ['product_id' => $product->id, 'quantity' => 3],
                             ],
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.total', '45.00')
                 ->assertJsonCount(1, 'data.items');

        // Stock must be decremented
        $this->assertDatabaseHas('products', ['id' => $product->id, 'existencia' => 7.00]);
    }

    public function test_sale_without_customer_is_allowed(): void
    {
        $product = Product::factory()->create(['existencia' => 5]);

        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/sales', [
                 'customer_id' => null,
                 'items'       => [['product_id' => $product->id, 'quantity' => 1]],
             ])
             ->assertStatus(201)
             ->assertJsonPath('data.customer_id', null);
    }

    public function test_sale_rejected_when_insufficient_stock(): void
    {
        $product = Product::factory()->create(['existencia' => 2]);

        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/sales', [
                 'items' => [['product_id' => $product->id, 'quantity' => 5]],
             ])
             ->assertStatus(422)
             ->assertJsonStructure(['errors' => ['items.0.quantity']]);

        // Stock must not change
        $this->assertDatabaseHas('products', ['id' => $product->id, 'existencia' => 2.00]);
    }

    public function test_sale_with_empty_items_is_rejected(): void
    {
        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/sales', ['items' => []])
             ->assertStatus(422);
    }

    public function test_can_view_sale_detail(): void
    {
        $customer = Customer::factory()->create();
        $product  = Product::factory()->create(['existencia' => 10]);

        $sale = $this->actingAs($this->user, 'sanctum')
                     ->postJson('/api/sales', [
                         'customer_id' => $customer->id,
                         'items'       => [['product_id' => $product->id, 'quantity' => 2]],
                     ])
                     ->json('data');

        $this->actingAs($this->user, 'sanctum')
             ->getJson("/api/sales/{$sale['id']}")
             ->assertOk()
             ->assertJsonStructure(['data' => ['id', 'customer', 'items', 'total']]);
    }

    public function test_can_delete_sale_without_restoring_stock(): void
    {
        $product  = Product::factory()->create(['existencia' => 10]);
        $customer = Customer::factory()->create();

        $saleData = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/sales', [
                             'customer_id' => $customer->id,
                             'items'       => [['product_id' => $product->id, 'quantity' => 3]],
                         ])
                         ->json('data');

        $this->actingAs($this->user, 'sanctum')
             ->deleteJson("/api/sales/{$saleData['id']}")
             ->assertOk();

        // Stock stays at 7, not restored to 10
        $this->assertDatabaseHas('products', ['id' => $product->id, 'existencia' => 7.00]);
        $this->assertDatabaseMissing('sales', ['id' => $saleData['id']]);
    }

    public function test_sale_items_preserved_when_product_is_deleted(): void
    {
        $product  = Product::factory()->create(['existencia' => 10]);
        $customer = Customer::factory()->create();

        $saleData = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/sales', [
                             'customer_id' => $customer->id,
                             'items'       => [['product_id' => $product->id, 'quantity' => 1]],
                         ])
                         ->json('data');

        // Delete the product
        $this->actingAs($this->user, 'sanctum')
             ->deleteJson("/api/products/{$product->id}")
             ->assertOk();

        // Sale item still exists (it's a snapshot)
        $this->assertDatabaseHas('sale_items', ['sale_id' => $saleData['id']]);
    }

    public function test_customer_deletion_nullifies_sale_customer_id(): void
    {
        $customer = Customer::factory()->create();
        $product  = Product::factory()->create(['existencia' => 10]);

        $saleData = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/sales', [
                             'customer_id' => $customer->id,
                             'items'       => [['product_id' => $product->id, 'quantity' => 1]],
                         ])
                         ->json('data');

        // Delete the customer
        $this->actingAs($this->user, 'sanctum')
             ->deleteJson("/api/customers/{$customer->id}")
             ->assertOk();

        // Sale still exists, customer_id is null
        $this->assertDatabaseHas('sales', ['id' => $saleData['id'], 'customer_id' => null]);
    }
}
