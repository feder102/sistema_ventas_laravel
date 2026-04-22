# Migration Plan

## Overview

This migration moves from a Laravel 7 monolith with Blade templates to a Laravel 11 API + React SPA architecture. The goal is zero data loss and no business logic regression.

---

## Step 1 — Export Existing Data

Before any schema changes, dump the production database:

```bash
mysqldump -u root -p laravel_pos \
  users productos ventas productos_vendidos clientes \
  > backup_$(date +%Y%m%d_%H%M%S).sql
```

Keep this backup. All migration steps are reversible until the final cutover.

---

## Step 2 — Fix Duplicate Barcodes

The legacy system has no unique constraint on `productos.codigo_barras`. Before adding one, deduplicate:

```sql
-- Find duplicates
SELECT codigo_barras, COUNT(*) c FROM productos GROUP BY codigo_barras HAVING c > 1;

-- Rename duplicates (append -DUP-{id})
UPDATE productos p
JOIN (
  SELECT id, codigo_barras,
    ROW_NUMBER() OVER (PARTITION BY codigo_barras ORDER BY id) rn
  FROM productos
) ranked ON p.id = ranked.id
SET p.codigo_barras = CONCAT(p.codigo_barras, '-DUP-', p.id)
WHERE ranked.rn > 1;
```

---

## Step 3 — Migrate Customer FK on Ventas

The legacy `ventas.id_cliente` is NOT NULL with CASCADE DELETE. We need to change it to nullable with SET NULL:

```sql
-- 1. Drop foreign key (name may differ — check with SHOW CREATE TABLE ventas)
ALTER TABLE ventas DROP FOREIGN KEY ventas_id_cliente_foreign;

-- 2. Make column nullable
ALTER TABLE ventas MODIFY COLUMN id_cliente BIGINT UNSIGNED NULL DEFAULT NULL;

-- 3. Re-add FK with SET NULL
ALTER TABLE ventas
  ADD CONSTRAINT ventas_customer_id_foreign
  FOREIGN KEY (id_cliente) REFERENCES clientes(id)
  ON DELETE SET NULL ON UPDATE CASCADE;
```

---

## Step 4 — Column Renames (new schema uses English names)

The new API uses English column names in its codebase. We handle this via Eloquent's `$table` and column mapping rather than renaming DB columns, so existing data is untouched. The new migrations create fresh tables with English names; the old tables remain for the rollback window.

New table names:
| Old | New |
|---|---|
| productos | products |
| ventas | sales |
| productos_vendidos | sale_items |
| clientes | customers |
| users | users (unchanged) |

The new API runs against the **new tables**. Data is migrated via a one-time seeder that reads from old tables and inserts into new ones.

---

## Step 5 — Deploy New API

```bash
# In /api
cp .env.example .env
# Fill DB credentials, APP_KEY, etc.
php artisan key:generate
php artisan migrate
php artisan db:seed --class=ProductionMigrationSeeder
```

`ProductionMigrationSeeder` reads from old tables and inserts into new ones.

---

## Step 6 — Deploy Frontend

```bash
# In /frontend
cp .env.example .env.local
# Set VITE_API_URL=http://your-api-host:8000
npm install
npm run build
# Serve dist/ via nginx or Vite preview
```

---

## Step 7 — Parallel Run (Optional)

Run both old and new systems simultaneously for 1–2 days:
- Old system: port 80 (existing production)
- New system: port 8080 (shadow)
- Cashiers test new system; if any issue, fall back to old

---

## Step 8 — Cutover

1. Stop old Laravel monolith
2. Point domain to new frontend (nginx serves `frontend/dist`)
3. Point API subdomain to Laravel 11 (nginx → PHP-FPM)
4. Monitor error logs for 24h
5. Once stable, rename/archive old tables with `_legacy` suffix

---

## Rollback Plan

If the new system has critical bugs during the cutover window:
1. Re-point domain to old monolith
2. Old tables were never touched (except steps 2 and 3 above)
3. Step 3 (FK change) is safe — no data loss, just constraint change
4. Step 2 (duplicate barcode rename) is safe — barcodes still scannable

---

## Data Verification Checklist

After running `ProductionMigrationSeeder`, verify:

```sql
-- Row counts match
SELECT 'users' tbl, COUNT(*) old FROM users
UNION SELECT 'products', COUNT(*) FROM products
UNION SELECT 'customers', COUNT(*) FROM customers
UNION SELECT 'sales', COUNT(*) FROM sales
UNION SELECT 'sale_items', COUNT(*) FROM sale_items;

-- Compare with old tables
SELECT 'usuarios' tbl, COUNT(*) FROM users
UNION SELECT 'productos', COUNT(*) FROM productos
UNION SELECT 'clientes', COUNT(*) FROM clientes
UNION SELECT 'ventas', COUNT(*) FROM ventas
UNION SELECT 'productos_vendidos', COUNT(*) FROM productos_vendidos;
```

Totals must match. Also verify:
- [ ] Sale totals match between old and new systems for a sample of 10 sales
- [ ] Product stock values match
- [ ] Customer names and phones match
- [ ] User login works with existing credentials
