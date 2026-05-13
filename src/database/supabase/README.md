# Supabase SQL Schema — Eleven Seller

Schema multi-tenant untuk aplikasi seller management. Dirancang untuk dijalankan
langsung di **Supabase SQL Editor**.

## Urutan Eksekusi

Jalankan file secara berurutan:

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `01_schema.sql`   | Buat extensions, enums, tables, indexes, triggers, views |
| 2 | `02_policies.sql` | Aktifkan Row Level Security (RLS) + policies per tabel |
| 3 | `03_seed.sql`     | Insert data dummy (3 tenant, produk, order, voucher, dst) |

### Cara menjalankan

1. Buka project Supabase Anda → menu **SQL Editor** → **New query**.
2. Copy isi `01_schema.sql`, paste, lalu klik **Run**.
3. Ulangi untuk `02_policies.sql` dan `03_seed.sql`.

> Saat menjalankan via SQL Editor, query dieksekusi sebagai role `postgres`
> yang otomatis **bypass RLS**, jadi seed bisa insert ke semua tenant tanpa
> autentikasi.

## Struktur Domain

```
packages ──┐
           ▼
        tenants ──────► tenant_users
           │                   │
           ├─► store_settings  │
           ├─► courier_services│
           ├─► categories      │
           ├─► warehouses ─────┼─► stock_distribution
           │                   │   stock_movements
           ├─► products ───────┼─► product_images
           │                   │   product_signals
           ├─► customers ──────┼─► customer_addresses
           │                   │
           ├─► orders ─────────┼─► order_items
           │     │             │   order_returns
           │     └─► payments  │   transactions
           │                   │
           ├─► vouchers        │
           ├─► flash_sales ────┼─► flash_sale_items
           │                   │
           ├─► reseller_tier_settings
           ├─► resellers ──────┼─► reseller_commissions
           │                   │
           ├─► notifications   │
           ├─► chat_threads ───┼─► chat_messages
           └─► daily_stats     │
                               ▼
                            user_sessions
```

## Tenant Demo

Tiga tenant tersedia setelah seed:

| Subdomain  | Tenant ID                              | Package  | Owner          |
|------------|----------------------------------------|----------|----------------|
| `demo`     | `11111111-1111-1111-1111-111111111111` | starter  | Admin Demo     |
| `tokobudi` | `22222222-2222-2222-2222-222222222222` | pro      | Budi Santoso   |
| `abcstore` | `33333333-3333-3333-3333-333333333333` | business | Ahmad Rizki    |

Data dummy paling banyak ada di **ABC Store** (business) — 6 produk,
6 order, 8 reseller, 5 voucher, flash sale aktif, dan stats 14 hari.

## Integrasi dengan App

Set di `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

Helper Supabase client (contoh):

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

Setelah user login via Supabase Auth, link `auth.users.id` ke baris
`tenant_users.user_id` agar `auth_tenant_id()` mengembalikan tenant yang benar.

## Reset / Drop

Untuk reset lengkap:

```sql
drop schema public cascade;
create schema public;
grant all on schema public to postgres, anon, authenticated, service_role;
```

Lalu jalankan ulang `01_schema.sql` → `02_policies.sql` → `03_seed.sql`.
