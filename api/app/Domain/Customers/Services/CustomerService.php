<?php

declare(strict_types=1);

namespace App\Domain\Customers\Services;

use App\Domain\Customers\Models\Customer;
use App\Domain\Customers\Repositories\CustomerRepository;
use Illuminate\Database\Eloquent\Collection;

class CustomerService
{
    public function __construct(private readonly CustomerRepository $repository) {}

    public function list(?string $search = null): Collection
    {
        return $this->repository->all($search);
    }

    public function findById(int $id): Customer
    {
        return $this->repository->findById($id);
    }

    public function create(array $data): Customer
    {
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): Customer
    {
        $customer = $this->repository->findById($id);
        return $this->repository->update($customer, $data);
    }

    public function delete(int $id): void
    {
        $customer = $this->repository->findById($id);
        $this->repository->delete($customer);
    }
}
