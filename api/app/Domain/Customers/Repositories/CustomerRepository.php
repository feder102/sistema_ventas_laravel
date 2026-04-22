<?php

declare(strict_types=1);

namespace App\Domain\Customers\Repositories;

use App\Domain\Customers\Models\Customer;
use Illuminate\Database\Eloquent\Collection;

class CustomerRepository
{
    public function all(?string $search = null): Collection
    {
        return Customer::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search): void {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%");
            }))
            ->orderBy('nombre')
            ->get();
    }

    public function findById(int $id): Customer
    {
        return Customer::findOrFail($id);
    }

    public function create(array $data): Customer
    {
        return Customer::create($data);
    }

    public function update(Customer $customer, array $data): Customer
    {
        $customer->fill($data)->save();
        return $customer->fresh();
    }

    public function delete(Customer $customer): void
    {
        $customer->delete();
    }
}
