<?php

declare(strict_types=1);

namespace App\Domain\Customers\Models;

use App\Domain\Sales\Models\Sale;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'customers';

    protected $fillable = ['nombre', 'telefono'];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'customer_id');
    }
}
