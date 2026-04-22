# API Contract

Base URL: `http://localhost:8000/api`

All authenticated endpoints require:
```
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

All responses follow the JSON:API-inspired envelope:
```json
{ "data": { ... } }          // single resource
{ "data": [ ... ] }          // collection
{ "message": "...", "errors": { ... } }  // validation error (422)
{ "message": "..." }         // generic error
```

---

## Auth

### POST /auth/login
Authenticate and receive a token.

**Request:**
```json
{
  "email": "admin@pos.local",
  "password": "secret",
  "remember": false
}
```

**Response 200:**
```json
{
  "data": {
    "token": "1|abc123...",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@pos.local"
    }
  }
}
```

**Response 401:**
```json
{ "message": "Invalid credentials" }
```

**Rate limit:** 60 requests/minute per IP.

---

### POST /auth/logout
Revoke the current token.

**Response 200:**
```json
{ "message": "Logged out" }
```

---

### GET /auth/me
Return the authenticated user.

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "name": "Admin",
    "email": "admin@pos.local",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## Products

### GET /products
List all products (sorted by descripcion asc).

Query params:
- `search` (string) — filter by descripcion or codigo_barras (partial match)
- `low_stock` (bool) — only products with existencia <= 5

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "codigo_barras": "7501000625353",
      "descripcion": "Coca-Cola 600ml",
      "precio_compra": "8.00",
      "precio_venta": "14.00",
      "utilidad": "6.00",
      "existencia": "48.00"
    }
  ]
}
```

---

### GET /products/{id}
Get a single product.

**Response 200:** same shape as list item.

**Response 404:**
```json
{ "message": "Not found" }
```

---

### GET /products/barcode/{barcode}
Look up a product by exact barcode. Used by the POS scan flow.

**Response 200:** same shape as single product.

**Response 404:**
```json
{ "message": "Product not found" }
```

---

### POST /products
Create a product.

**Request:**
```json
{
  "codigo_barras": "7501000625353",
  "descripcion": "Coca-Cola 600ml",
  "precio_compra": 8.00,
  "precio_venta": 14.00,
  "existencia": 48
}
```

**Validation:**
- `codigo_barras` required, max 100, unique
- `descripcion` required, max 255
- `precio_compra` required, numeric, min 0
- `precio_venta` required, numeric, min 0.01
- `existencia` required, numeric, min 0

**Response 201:**
```json
{ "data": { /* product */ } }
```

**Response 422:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "codigo_barras": ["The codigo barras has already been taken."]
  }
}
```

---

### PUT /products/{id}
Update a product.

**Request:** same fields as POST, all optional except at least one required.

**Response 200:**
```json
{ "data": { /* updated product */ } }
```

---

### DELETE /products/{id}
Delete a product.

**Response 200:**
```json
{ "message": "Product deleted" }
```

---

## Customers

### GET /customers
List all customers.

Query params:
- `search` (string) — filter by nombre or telefono

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "telefono": "555-1234",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /customers/{id}
Get a single customer.

---

### POST /customers
Create a customer.

**Request:**
```json
{
  "nombre": "Juan Pérez",
  "telefono": "555-1234"
}
```

**Validation:**
- `nombre` required, max 255
- `telefono` required, max 50

**Response 201:**
```json
{ "data": { /* customer */ } }
```

---

### PUT /customers/{id}
Update a customer.

**Response 200:**
```json
{ "data": { /* customer */ } }
```

---

### DELETE /customers/{id}
Delete a customer. Associated sales have their `customer_id` set to NULL.

**Response 200:**
```json
{ "message": "Customer deleted" }
```

---

## Sales

### GET /sales
List all sales with computed total, sorted by created_at desc.

Query params:
- `from` (date YYYY-MM-DD)
- `to` (date YYYY-MM-DD)
- `customer_id` (int)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "customer_id": 1,
      "customer": {
        "id": 1,
        "nombre": "Juan Pérez",
        "telefono": "555-1234"
      },
      "total": "42.00",
      "items_count": 3,
      "created_at": "2024-01-15T14:23:00Z"
    }
  ]
}
```

---

### GET /sales/{id}
Get sale detail with all line items.

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "customer_id": 1,
    "customer": { "id": 1, "nombre": "Juan Pérez" },
    "total": "42.00",
    "items": [
      {
        "id": 1,
        "sale_id": 1,
        "descripcion": "Coca-Cola 600ml",
        "codigo_barras": "7501000625353",
        "unit_price": "14.00",
        "quantity": "2.00",
        "subtotal": "28.00"
      }
    ],
    "created_at": "2024-01-15T14:23:00Z"
  }
}
```

---

### POST /sales
Complete a sale. Atomic: all stock updates succeed or the whole request fails.

**Request:**
```json
{
  "customer_id": 1,
  "items": [
    { "product_id": 5, "quantity": 2 },
    { "product_id": 12, "quantity": 1 }
  ]
}
```

**Validation:**
- `customer_id` nullable, exists in customers
- `items` required, array, min 1
- `items.*.product_id` required, exists in products
- `items.*.quantity` required, numeric, min 0.01

**Business validation (returned as 422):**
- Any item where product.existencia < requested quantity:
```json
{
  "message": "Insufficient stock",
  "errors": {
    "items.0.quantity": ["Only 1.00 units of 'Coca-Cola 600ml' available"]
  }
}
```

**Response 201:**
```json
{
  "data": {
    "id": 42,
    "customer_id": 1,
    "customer": { ... },
    "total": "42.00",
    "items": [ ... ],
    "created_at": "2024-01-15T14:23:00Z"
  }
}
```

---

### DELETE /sales/{id}
Delete a sale. Stock is NOT restored (matches legacy behavior; cashier must manually correct stock).

**Response 200:**
```json
{ "message": "Sale deleted" }
```

---

## Users

### GET /users
List all users.

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Admin",
      "email": "admin@pos.local",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /users
Create a user.

**Request:**
```json
{
  "name": "Cashier 1",
  "email": "cashier1@pos.local",
  "password": "secret123",
  "password_confirmation": "secret123"
}
```

**Validation:**
- `name` required, max 255
- `email` required, unique, valid email
- `password` required, min 8, confirmed

**Response 201:**
```json
{ "data": { /* user without password */ } }
```

---

### PUT /users/{id}
Update a user. Password is only changed when `password` field is provided and non-empty.

**Request:**
```json
{
  "name": "Cashier 1 Updated",
  "email": "cashier1@pos.local",
  "password": "",
  "password_confirmation": ""
}
```

**Response 200:**
```json
{ "data": { /* user */ } }
```

---

### DELETE /users/{id}
Delete a user.

**Response 200:**
```json
{ "message": "User deleted" }
```

---

## Error Responses

| HTTP | Meaning |
|---|---|
| 401 | Unauthenticated — missing or invalid token |
| 403 | Forbidden |
| 404 | Resource not found |
| 422 | Validation failed — see `errors` object |
| 429 | Rate limited |
| 500 | Server error |
