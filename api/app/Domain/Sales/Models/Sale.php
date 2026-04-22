<?php

declare(strict_types=1);

namespace App\Domain\Sales\Models;

use App\Domain\Customers\Models\Customer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    protected $table = 'sales';

    protected $fillable = ['customer_id'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class, 'sale_id');
    }

    public function getTotalAttribute(): string
    {
        $total = $this->items->sum(
            fn (SaleItem $item) => (float) $item->unit_price * (float) $item->quantity
        );
        return number_format($total, 2);
    }
}
