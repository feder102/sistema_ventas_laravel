<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Customers\Models\Customer;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_list_customers(): void
    {
        Customer::factory()->count(4)->create();

        $this->actingAs($this->user, 'sanctum')
             ->getJson('/api/customers')
             ->assertOk()
             ->assertJsonCount(4, 'data');
    }

    public function test_can_create_customer(): void
    {
        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/customers', ['nombre' => 'Juan', 'telefono' => '555-1234'])
             ->assertStatus(201)
             ->assertJsonPath('data.nombre', 'Juan');

        $this->assertDatabaseHas('customers', ['nombre' => 'Juan']);
    }

    public function test_can_update_customer(): void
    {
        $customer = Customer::factory()->create(['nombre' => 'Old Name']);

        $this->actingAs($this->user, 'sanctum')
             ->putJson("/api/customers/{$customer->id}", ['nombre' => 'New Name'])
             ->assertOk()
             ->assertJsonPath('data.nombre', 'New Name');
    }

    public function test_can_delete_customer(): void
    {
        $customer = Customer::factory()->create();

        $this->actingAs($this->user, 'sanctum')
             ->deleteJson("/api/customers/{$customer->id}")
             ->assertOk();

        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }

    public function test_name_is_required(): void
    {
        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/customers', ['telefono' => '555-1234'])
             ->assertStatus(422)
             ->assertJsonStructure(['errors' => ['nombre']]);
    }
}
