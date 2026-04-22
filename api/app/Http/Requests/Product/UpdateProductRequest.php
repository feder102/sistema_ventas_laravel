<?php

declare(strict_types=1);

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo_barras' => ['sometimes', 'required', 'string', 'max:100',
                Rule::unique('products', 'codigo_barras')->ignore($this->route('product'))],
            'descripcion'   => ['sometimes', 'required', 'string', 'max:255'],
            'precio_compra' => ['sometimes', 'required', 'numeric', 'min:0'],
            'precio_venta'  => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'existencia'    => ['sometimes', 'required', 'numeric', 'min:0'],
        ];
    }
}
