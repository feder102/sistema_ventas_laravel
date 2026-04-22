<?php

declare(strict_types=1);

namespace App\Domain\Users\Services;

use App\Domain\Users\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function list(): Collection
    {
        return User::orderBy('name')->get();
    }

    public function findById(int $id): User
    {
        return User::findOrFail($id);
    }

    public function create(array $data): User
    {
        return User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
    }

    public function update(int $id, array $data): User
    {
        $user = $this->findById($id);
        $user->name  = $data['name'] ?? $user->name;
        $user->email = $data['email'] ?? $user->email;

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();
        return $user->fresh();
    }

    public function delete(int $id): void
    {
        User::findOrFail($id)->delete();
    }
}
