-- =============================================================================
-- Seed Data — Eleven Seller (Supabase)
-- =============================================================================
-- Jalankan setelah 01_schema.sql.
--
-- ID Mapping (bigserial — insert eksplisit, sequence direset di akhir file):
--   Tenants   : 1=Toko Demo, 2=Toko Budi Jaya, 3=ABC Store
--   Categories: 1-5=ABC Store, 6-7=Toko Budi, 8=Toko Demo
--   Warehouses: 1=Demo, 2-3=Budi, 4-6=ABC Store
--   Products  : 1-6=ABC Store, 7-8=Toko Budi, 9-10=Toko Demo
--   Customers : 1-6=ABC Store, 7=Toko Budi
--   Orders    : 1-5=ABC Store, 6=Toko Budi
--   Vouchers  : 1-4=ABC Store, 5=Toko Budi
--   FlashSales: 1-2=ABC Store
--   Resellers : 1-8=ABC Store
-- =============================================================================

-- =============================================================================
-- 1) PACKAGES (3 paket: starter, pro, business)
-- =============================================================================

insert into public.packages (id, name, description, price, features, max_products, max_orders, max_users, max_warehouses)
values
  ('starter', 'Starter', 'Paket dasar untuk toko baru', 99000,
    array['dashboard','products','warehouse','orders','payments','notifications','settings','help'],
    50, 100, 1, 1),
  ('pro', 'Pro', 'Fitur lengkap untuk toko berkembang', 299000,
    array['dashboard','products','warehouse','orders','analytics','customers','marketing','payments',
          'notifications','settings','help','team','export-data','bulk-import','stock-transfer',
          'bulk-actions','advanced-notifications','low-stock-alerts','two-factor-auth'],
    500, -1, 5, 5),
  ('business', 'Business', 'Semua fitur termasuk reseller', 599000,
    array['dashboard','products','warehouse','orders','analytics','customers','resellers','marketing',
          'payments','notifications','settings','help','team','export-data','export-pdf',
          'customer-history-detail','bulk-import','stock-transfer','bulk-actions',
          'advanced-notifications','low-stock-alerts','two-factor-auth','ai-insights'],
    -1, -1, -1, -1)
on conflict (id) do nothing;

-- =============================================================================
-- 2) TENANTS (3 toko demo)
-- =============================================================================

insert into public.tenants (id, subdomain, store_name, owner_name, email, phone, primary_color, package_id, status)
overriding system value
values
  (1, 'demo',     'Toko Demo',          'Admin Demo',   'demo@seller.id',          '+62 811-1111-0001', '#6366f1', 'starter',  'active'),
  (2, 'tokobudi', 'Toko Budi Jaya',     'Budi Santoso', 'budi@tokobudi.seller.id', '+62 811-1111-0002', '#0ea5e9', 'pro',      'active'),
  (3, 'abcstore', 'ABC Store Official', 'Ahmad Rizki',  'admin@abcstore.seller.id','+62 811-1111-0003', '#10b981', 'business', 'active')
on conflict (id) do nothing;

-- =============================================================================
-- 3) TENANT USERS
-- =============================================================================
-- user_id sengaja NULL — link ke auth.users dilakukan saat user pertama kali login.

insert into public.tenant_users (tenant_id, name, email, role, status, last_login)
values
  -- Toko Demo
  (1, 'Admin Demo',     'demo@seller.id',          'owner', 'active', now() - interval '2 hours'),

  -- Toko Budi Jaya
  (2, 'Budi Santoso',   'budi@tokobudi.seller.id', 'owner', 'active', now() - interval '1 hour'),
  (2, 'Siti Rahayu',    'siti@tokobudi.seller.id', 'admin', 'active', now() - interval '6 hours'),
  (2, 'Doni Prasetyo',  'doni@tokobudi.seller.id', 'staff', 'active', now() - interval '1 day'),

  -- ABC Store Official
  (3, 'Ahmad Rizki',    'ahmad@abcstore.seller.id','owner', 'active', now() - interval '30 minutes'),
  (3, 'Dewi Lestari',   'dewi@abcstore.seller.id', 'admin', 'active', now() - interval '3 hours'),
  (3, 'Eko Nugroho',    'eko@abcstore.seller.id',  'staff', 'active', now() - interval '5 hours')
on conflict (tenant_id, email) do nothing;

-- =============================================================================
-- 4) STORE SETTINGS (1 row per tenant)
-- =============================================================================

insert into public.store_settings (tenant_id, description, address, city, province, postal_code, phone, email,
                                   website, operational_hours, theme_color, tagline, free_shipping_min, packaging_fee, processing_days)
values
  (1, 'Toko Demo untuk preview fitur Eleven Seller.', 'Jl. Demo No. 1', 'Jakarta Pusat', 'DKI Jakarta', '10110',
    '+62 811-1111-0001', 'demo@seller.id', 'www.demo.seller.id', 'Senin–Sabtu, 09:00–18:00',
    '#6366f1', 'Demo toko Eleven Seller', 250000, 5000, 1),

  (2, 'Toko fashion dan aksesoris terlengkap di Surabaya.', 'Jl. Tunjungan No. 80', 'Surabaya', 'Jawa Timur', '60261',
    '+62 811-1111-0002', 'budi@tokobudi.seller.id', 'www.tokobudi.id', 'Setiap hari, 08:00–20:00',
    '#0ea5e9', 'Fashion update setiap minggu!', 300000, 5000, 1),

  (3, 'Toko elektronik terpercaya dengan produk berkualitas tinggi.', 'Jl. Sudirman No. 123', 'Jakarta Pusat', 'DKI Jakarta', '10220',
    '+62 811-1111-0003', 'admin@abcstore.seller.id', 'www.abcstore.id', 'Senin–Sabtu, 08:00–20:00',
    '#10b981', 'Elektronik Terbaik, Harga Terjangkau!', 500000, 5000, 1)
on conflict (tenant_id) do nothing;

-- =============================================================================
-- 5) COURIER SERVICES (per tenant)
-- =============================================================================

do $$
declare
  t bigint;
begin
  for t in select id from public.tenants loop
    insert into public.courier_services (tenant_id, code, name, enabled, estimated_days) values
      (t, 'jne',      'JNE',           true,  '1–3 hari'),
      (t, 'jt',       'J&T Express',   true,  '1–3 hari'),
      (t, 'sicepat',  'SiCepat',       true,  '1–2 hari'),
      (t, 'anteraja', 'Anteraja',      false, '1–3 hari'),
      (t, 'pos',      'Pos Indonesia', false, '2–5 hari'),
      (t, 'gosend',   'GoSend',        true,  'Same Day'),
      (t, 'grab',     'Grab Express',  false, 'Same Day'),
      (t, 'tiki',     'TIKI',          false, '2–4 hari')
    on conflict (tenant_id, code) do nothing;
  end loop;
end $$;

-- =============================================================================
-- 6) RESELLER TIER SETTINGS (per tenant)
-- =============================================================================

do $$
declare
  t bigint;
begin
  for t in select id from public.tenants loop
    insert into public.reseller_tier_settings (tenant_id, tier, commission, min_sales, max_sales) values
      (t, 'Bronze',   5,  0,         10000000),
      (t, 'Silver',   8,  10000000,  50000000),
      (t, 'Gold',     12, 50000000,  150000000),
      (t, 'Platinum', 15, 150000000, null)
    on conflict (tenant_id, tier) do nothing;
  end loop;
end $$;

-- =============================================================================
-- 7) CATEGORIES (per tenant)
-- =============================================================================

insert into public.categories (id, tenant_id, name, description)
overriding system value
values
  -- ABC Store (tenant 3)
  (1, 3, 'Electronics',     'Elektronik & gadget'),
  (2, 3, 'Fashion',         'Pakaian, sepatu, aksesoris'),
  (3, 3, 'Home & Garden',   'Peralatan rumah & taman'),
  (4, 3, 'Sports',          'Perlengkapan olahraga'),
  (5, 3, 'Health & Beauty', 'Kesehatan & kecantikan'),
  -- Toko Budi (tenant 2)
  (6, 2, 'Fashion',         'Pakaian & aksesoris'),
  (7, 2, 'Sepatu',          'Sepatu pria & wanita'),
  -- Toko Demo (tenant 1)
  (8, 1, 'Umum',            'Kategori umum')
on conflict (tenant_id, name) do nothing;

-- =============================================================================
-- 8) WAREHOUSES (per tenant)
-- =============================================================================

insert into public.warehouses (id, tenant_id, code, name, address, city, pic, phone, is_primary, active)
overriding system value
values
  -- Toko Demo (1 gudang — paket starter)
  (1, 1, 'DMO-01', 'Gudang Demo',
   'Jl. Demo No. 1', 'Jakarta Pusat', 'Demo PIC', '0811-0000-0001', true, true),

  -- Toko Budi (2 gudang)
  (2, 2, 'SBY-01', 'Gudang Surabaya',
   'Jl. Tunjungan No. 80', 'Surabaya', 'Lina Wijaya', '0813-3333-4444', true, true),
  (3, 2, 'SBY-02', 'Gudang Cabang Sidoarjo',
   'Jl. A. Yani No. 12', 'Sidoarjo', 'Heri Setiawan', '0813-3333-5555', false, true),

  -- ABC Store (3 gudang)
  (4, 3, 'JKT-01', 'Gudang Jakarta Pusat',
   'Jl. Sudirman No. 25, Kel. Karet, Setiabudi', 'Jakarta Pusat', 'Andi Saputra', '0812-1111-2222', true, true),
  (5, 3, 'BDG-01', 'Gudang Bandung',
   'Jl. Asia Afrika No. 50', 'Bandung', 'Rini Pertiwi', '0812-1111-3333', false, true),
  (6, 3, 'MDN-01', 'Gudang Medan',
   'Jl. Sutomo No. 10', 'Medan', 'Robert Tarigan', '0812-1111-4444', false, true)
on conflict (id) do nothing;

-- =============================================================================
-- 9) PRODUCTS (fokus ke ABC Store + sedikit di Toko Budi & Demo)
-- =============================================================================

insert into public.products (id, tenant_id, category_id, name, description, sku, price, weight, image_url, status, featured)
overriding system value
values
  -- ABC Store — Electronics (tenant 3, category 1)
  (1,  3, 1, 'iPhone 14 Pro Max',      'Apple iPhone 14 Pro Max 256GB Space Gray',        'IPH14PM-256-SG',  15999000, 240,  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', 'active',      true),
  (2,  3, 1, 'Samsung Galaxy S23 Ultra','Samsung Galaxy S23 Ultra 512GB Black',            'SGS23U-512-BK',   18999000, 234,  'https://images.unsplash.com/photo-1610792516307-ea5aabac2b31?w=400', 'active',      true),
  (3,  3, 1, 'MacBook Air M2',          'Apple MacBook Air M2 13-inch 256GB Space Gray',   'MBA-M2-256-SG',   18999000, 1240, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400', 'active',      false),
  (4,  3, 1, 'iPad Air 5th Gen',        'iPad Air 64GB Wi-Fi Space Gray',                  'IPAD-AIR5-64-SG', 8999000,  460,  'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400', 'active',      false),

  -- ABC Store — Fashion (tenant 3, category 2)
  (5,  3, 2, 'Nike Air Jordan 1',       'Nike Air Jordan 1 Retro High OG Size 42 Red',     'NAJ1-42-RED',     2499000,  800,  'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400', 'low_stock',   false),
  (6,  3, 2, 'Adidas Ultraboost 22',    'Adidas Ultraboost 22 Running Shoes Size 43 White','AUB22-43-WHT',    2899000,  350,  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'out_of_stock',false),

  -- Toko Budi — Fashion (tenant 2, category 6 & 7)
  (7,  2, 6, 'Kemeja Flanel Pria',      'Kemeja flanel motif kotak warna merah-hitam',     'KMJ-FLN-RED-L',   189000,   320,  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400', 'active',      true),
  (8,  2, 7, 'Sneakers Lokal Premium',  'Sneakers casual unisex warna putih',               'SNK-WHT-42',      459000,   700,  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'active',      false),

  -- Toko Demo (tenant 1, category 8)
  (9,  1, 8, 'Produk Demo A',           'Contoh produk untuk preview',                     'DEMO-A-001',      50000,    100,  null, 'active', false),
  (10, 1, 8, 'Produk Demo B',           'Contoh produk lain untuk preview',                'DEMO-B-002',      75000,    150,  null, 'active', false)
on conflict (id) do nothing;

-- Product images (primary)
insert into public.product_images (product_id, image_url, is_primary, sort_order) values
  (1, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800', true, 0),
  (2, 'https://images.unsplash.com/photo-1610792516307-ea5aabac2b31?w=800', true, 0),
  (3, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800', true, 0),
  (4, 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800', true, 0),
  (5, 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800', true, 0),
  (6, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', true, 0);

-- =============================================================================
-- 10) STOCK DISTRIBUTION (qty per produk per gudang)
-- =============================================================================

insert into public.stock_distribution (product_id, warehouse_id, quantity) values
  -- ABC Store (products 1-6, warehouses 4-6)
  (1, 4, 18), (1, 5,  5), (1, 6, 2),
  (2, 4, 10), (2, 5,  3), (2, 6, 2),
  (3, 4,  6), (3, 5,  2),
  (4, 4, 12), (4, 5,  4),
  (5, 4,  3),
  (6, 4,  0),

  -- Toko Budi (products 7-8, warehouses 2-3)
  (7, 2, 35), (7, 3, 12),
  (8, 2, 20), (8, 3,  8),

  -- Toko Demo (products 9-10, warehouse 1)
  (9,  1, 50),
  (10, 1, 30)
on conflict (product_id, warehouse_id) do nothing;

-- =============================================================================
-- 11) STOCK MOVEMENTS (sample)
-- =============================================================================

insert into public.stock_movements (tenant_id, product_id, warehouse_id, ref_warehouse_id, type, qty, reason, performed_by, reference_type)
values
  (3, 1, 4, null, 'restock',        20, 'Restock awal bulan',        'Andi Saputra', 'restock'),
  (3, 1, 4, 5,    'transfer_out',    5, 'Transfer JKT-01 → BDG-01', 'Andi Saputra', 'adjustment'),
  (3, 1, 5, 4,    'transfer_in',     5, 'Transfer JKT-01 → BDG-01', 'Rini Pertiwi', 'adjustment'),
  (3, 6, 4, null, 'sale',            3, 'Pesanan ORD-2025-0050',     'system',        'order'),
  (3, 5, 4, null, 'adjustment_out',  1, 'Produk rusak — defect QC', 'Andi Saputra', 'adjustment');

-- =============================================================================
-- 12) CUSTOMERS (ABC Store fokus, Toko Budi sedikit)
-- =============================================================================

insert into public.customers (id, tenant_id, name, email, phone, address, segment, total_orders, total_spend, last_order_at, join_date)
overriding system value
values
  (1, 3, 'Budi Santoso', 'budi.santoso@gmail.com',      '0812-3456-7890', 'Jl. Sudirman No. 12, Jakarta Pusat, DKI Jakarta 10220',    'VIP',     34,  18750000, '2025-05-01', '2022-03-15'),
  (2, 3, 'Siti Rahayu',  'siti.rahayu@yahoo.com',        '0856-9012-3456', 'Jl. Gatot Subroto No. 45, Bandung, Jawa Barat 40262',      'VIP',     28,  12400000, '2025-04-28', '2022-07-22'),
  (3, 3, 'Agus Wijaya',  'agus.wijaya@outlook.com',      '0878-5678-9012', 'Jl. Pemuda No. 78, Surabaya, Jawa Timur 60271',            'Regular', 11,  4250000,  '2025-04-20', '2023-01-10'),
  (4, 3, 'Dewi Lestari', 'dewi.lestari@gmail.com',       '0815-1357-2468', 'Jl. Diponegoro No. 321, Surabaya, Jawa Timur 60265',       'Regular', 7,   3120000,  '2025-04-15', '2023-06-05'),
  (5, 3, 'Eko Prasetyo', 'eko.prasetyo@email.com',       '0816-8642-9753', 'Jl. Malioboro No. 50, Yogyakarta, DIY 55271',              'New',     2,   980000,   '2025-05-08', '2025-04-10'),
  (6, 3, 'Ahmad Rizki',  'ahmad.rizki@email.com',        '0812-3456-7890', 'Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta 12190', 'New',     1,   15999000, '2025-05-10', '2025-05-01'),
  (7, 2, 'Rina Marlina', 'rina@example.com',             '0821-1111-2222', 'Jl. Jendral Sudirman 99, Surabaya',                        'Regular', 5,   1450000,  '2025-04-22', '2024-08-15')
on conflict (tenant_id, email) do nothing;

-- =============================================================================
-- 13) ORDERS + ORDER ITEMS
-- =============================================================================

insert into public.orders (id, tenant_id, order_number, customer_id, customer_name, customer_email, customer_phone,
                           shipping_address, status, payment_status, payment_method,
                           subtotal, shipping_cost, total_amount, courier, tracking_number,
                           order_date, estimated_delivery)
overriding system value
values
  (1, 3, 'ORD-2025-0001', 6, 'Ahmad Rizki',  'ahmad.rizki@email.com',  '+62 812-3456-7890',
   'Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta 12190',
   'pending',    'waiting',  null,      15999000, 0,     15999000, null,       null,
   now() - interval '1 day',    current_date + 5),

  (2, 3, 'ORD-2025-0002', 2, 'Siti Rahayu',  'siti.rahayu@yahoo.com',  '+62 813-2468-1357',
   'Jl. Gatot Subroto No. 456, Bandung, Jawa Barat 40123',
   'shipped',    'paid',     'bca',     22298000, 25000, 22323000, 'JNE',      'JNE123456789',
   now() - interval '3 days',   current_date + 3),

  (3, 3, 'ORD-2025-0003', 1, 'Budi Santoso', 'budi.santoso@email.com', '+62 814-9876-5432',
   'Jl. Malioboro No. 789, Yogyakarta, DIY 55271',
   'delivered',  'paid',     'gopay',   20298000, 30000, 20328000, 'SiCepat',  'SICEPAT987654321',
   now() - interval '7 days',   current_date - 2),

  (4, 3, 'ORD-2025-0004', 4, 'Dewi Lestari', 'dewi.lestari@email.com', '+62 815-1357-2468',
   'Jl. Diponegoro No. 321, Surabaya, Jawa Timur 60265',
   'processing', 'paid',     'mandiri', 4998000,  20000, 5018000,  null,       null,
   now() - interval '12 hours', current_date + 4),

  (5, 3, 'ORD-2025-0005', 5, 'Eko Prasetyo', 'eko.prasetyo@email.com', '+62 816-8642-9753',
   'Jl. Malioboro No. 50, Yogyakarta, DIY 55271',
   'cancelled',  'refunded', 'bca',     8999000,  0,     8999000,  null,       null,
   now() - interval '10 days',  current_date - 4),

  -- Toko Budi
  (6, 2, 'TBJ-2025-0001', 7, 'Rina Marlina', 'rina@example.com',       '0821-1111-2222',
   'Jl. Jendral Sudirman 99, Surabaya',
   'delivered',  'paid',     'ovo',     648000,   15000, 663000,   'J&T Express','JT202504220012',
   now() - interval '20 days',  current_date - 15)
on conflict (id) do nothing;

-- Update cancelled_at + cancel_reason
update public.orders set cancelled_at = now() - interval '9 days',  cancel_reason = 'Permintaan pelanggan' where id = 5;
update public.orders set delivered_at = now() - interval '2 days'  where id = 3;
update public.orders set shipped_at   = now() - interval '2 days'  where id = 2;

-- Order items
insert into public.order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price) values
  (1, 1,    'iPhone 14 Pro Max',        'IPH14PM-256-SG',  1, 15999000, 15999000),

  (2, 2,    'Samsung Galaxy S23 Ultra', 'SGS23U-512-BK',   1, 18999000, 18999000),
  (2, null, 'Samsung Galaxy Buds2 Pro', 'SGB2P-BLK',       1,  3299000,  3299000),

  (3, 3,    'MacBook Air M2',           'MBA-M2-256-SG',   1, 18999000, 18999000),
  (3, null, 'Magic Mouse',              'MAGIC-MOUSE',     1,  1299000,  1299000),

  (4, 5,    'Nike Air Jordan 1',        'NAJ1-42-RED',     2,  2499000,  4998000),

  (5, 4,    'iPad Air 5th Gen',         'IPAD-AIR5-64-SG', 1,  8999000,  8999000),

  (6, 7,    'Kemeja Flanel Pria',       'KMJ-FLN-RED-L',   2,   189000,   378000),
  (6, 8,    'Sneakers Lokal Premium',   'SNK-WHT-42',      1,   459000,   459000);

-- Sample return request
insert into public.order_returns (order_id, type, reason, notes, status) values
  (3, 'return_item', 'Produk tidak sesuai deskripsi', 'Warna berbeda dari foto produk', 'requested');

-- =============================================================================
-- 14) PAYMENTS
-- =============================================================================

insert into public.payments (tenant_id, order_id, payment_method, amount, status, transaction_id, paid_at) values
  (3, 2, 'bca',     22323000, 'paid',     'TRX-BCA-001', now() - interval '3 days'),
  (3, 3, 'gopay',   20328000, 'paid',     'TRX-GPY-001', now() - interval '7 days'),
  (3, 4, 'mandiri',  5018000, 'paid',     'TRX-MDR-001', now() - interval '12 hours'),
  (3, 5, 'bca',      8999000, 'refunded', 'TRX-BCA-002', now() - interval '9 days'),
  (2, 6, 'ovo',       663000, 'paid',     'TRX-OVO-001', now() - interval '20 days');

-- =============================================================================
-- 15) TRANSACTIONS (financial ledger)
-- =============================================================================

insert into public.transactions (tenant_id, tx_date, description, type, amount, status, order_id) values
  (3, now() - interval '3 days',   'Penjualan ORD-2025-0002',       'Penjualan',   22323000, 'Sukses', 2),
  (3, now() - interval '3 days',   'Biaya admin 2% ORD-2025-0002',  'Biaya Admin',   446460, 'Sukses', 2),
  (3, now() - interval '7 days',   'Penjualan ORD-2025-0003',       'Penjualan',   20328000, 'Sukses', 3),
  (3, now() - interval '7 days',   'Biaya admin 2% ORD-2025-0003',  'Biaya Admin',   406560, 'Sukses', 3),
  (3, now() - interval '12 hours', 'Penjualan ORD-2025-0004',       'Penjualan',    5018000, 'Sukses', 4),
  (3, now() - interval '9 days',   'Refund ORD-2025-0005',          'Refund',       8999000, 'Sukses', 5),
  (3, now() - interval '30 days',  'Penarikan saldo ke BCA',        'Penarikan',   15000000, 'Sukses', null),
  (2, now() - interval '20 days',  'Penjualan TBJ-2025-0001',       'Penjualan',     663000, 'Sukses', 6);

-- =============================================================================
-- 16) VOUCHERS
-- =============================================================================

insert into public.vouchers (id, tenant_id, code, name, description, type, value, min_purchase, max_discount, quota, used, start_date, end_date, disabled)
overriding system value
values
  (1, 3, 'WELCOME10', 'Selamat Datang 10%',     'Voucher sambutan untuk pelanggan baru.', 'percentage', 10,    100000, 50000,  100, 45, '2024-01-01', '2026-12-31', false),
  (2, 3, 'GAJIAN50K', 'Diskon Gajian Rp 50.000','Voucher periode gajian.',                'fixed',      50000, 250000, null,   200, 78, '2025-04-25', '2025-05-05', false),
  (3, 3, 'FLASH25',   'Flash Discount 25%',      'Voucher diskon kilat.',                  'percentage', 25,    500000, 200000, 50,  50, '2025-04-01', '2025-04-30', false),
  (4, 3, 'NEWMEMBER', 'Diskon Member Baru',       'Khusus member baru.',                    'fixed',      25000, 75000,  null,   500, 12, '2025-05-01', '2025-12-31', false),
  (5, 2, 'BUDI20',    'Diskon Toko Budi 20%',    'Promo akhir bulan Toko Budi.',           'percentage', 20,    150000, 100000, 100, 8,  '2025-05-01', '2025-05-31', false)
on conflict (tenant_id, code) do nothing;

-- =============================================================================
-- 17) FLASH SALES
-- =============================================================================

insert into public.flash_sales (id, tenant_id, name, start_datetime, end_datetime)
overriding system value
values
  (1, 3, 'Flash Sale Akhir Pekan',       now() - interval '2 hours', now() + interval '6 hours'),
  (2, 3, 'Flash Sale Pertengahan Bulan', now() + interval '3 days',  now() + interval '3 days 6 hours');

insert into public.flash_sale_items (flash_sale_id, product_id, product_name, original_price, sale_price, quota, sold) values
  (1, 4, 'iPad Air 5th Gen',         8999000,  7999000, 10, 4),
  (1, 5, 'Nike Air Jordan 1',        2499000,  1999000,  5, 2),
  (2, 1, 'iPhone 14 Pro Max',       15999000, 14999000,  5, 0),
  (2, 2, 'Samsung Galaxy S23 Ultra',18999000, 17499000,  3, 0);

-- =============================================================================
-- 18) RESELLERS (semua untuk ABC Store karena butuh paket business)
-- =============================================================================

insert into public.resellers (id, tenant_id, code, name, email, phone, city, address, tier, status,
                              join_date, total_sales, total_orders, pending_commission, paid_commission,
                              referral_code, notes)
overriding system value
values
  (1, 3, 'RSL-001', 'Ahmad Fauzi',  'ahmad.fauzi@gmail.com',      '+62 812-3456-7890', 'Jakarta',  'Jl. Sudirman No. 45, Jakarta Pusat',      'Platinum', 'active',    '2022-11-01', 158000000, 78, 5280000, 18420000, 'AHMAD22', 'Top performer, prioritas utama.'),
  (2, 3, 'RSL-002', 'Dewi Kusuma',  'dewi.kusuma@gmail.com',      '+62 813-2345-6789', 'Surabaya', 'Jl. Ahmad Yani No. 120, Surabaya',        'Gold',     'active',    '2023-02-10', 92000000,  51, 3840000,  7200000, 'DEWI23',  null),
  (3, 3, 'RSL-003', 'Budi Santoso', 'budi.santoso.rsl@gmail.com', '+62 814-3456-7890', 'Jakarta',  'Jl. Gatot Subroto No. 77, Jakarta Selatan','Gold',     'active',    '2023-03-15', 78000000,  42, 2400000,  6960000, 'BUDI23',  null),
  (4, 3, 'RSL-004', 'Siti Rahayu',  'siti.rahayu.rsl@gmail.com',  '+62 815-4567-8901', 'Bandung',  'Jl. Diponegoro No. 33, Bandung',           'Silver',   'active',    '2023-06-20', 38000000,  22, 1120000,  1920000, 'SITI23',  null),
  (5, 3, 'RSL-005', 'Eko Nugroho',  'eko.nugroho@gmail.com',      '+62 816-5678-9012', 'Medan',    'Jl. Imam Bonjol No. 88, Medan',            'Silver',   'active',    '2023-08-05', 25000000,  15,  800000,  1200000, 'EKO23',   null),
  (6, 3, 'RSL-006', 'Rina Marlina', 'rina.marlina.rsl@gmail.com', '+62 817-6789-0123', 'Makassar', 'Jl. Sam Ratulangi No. 55, Makassar',       'Bronze',   'active',    '2023-10-12', 8000000,   9,   240000,   160000, 'RINA23',  null),
  (7, 3, 'RSL-007', 'Maya Sari',    'maya.sari@gmail.com',        '+62 818-7890-1234', 'Bogor',    'Jl. Pajajaran No. 12, Bogor',              'Bronze',   'pending',   '2025-04-28', 0,         0,        0,        0, 'MAYA25',  'Pendaftaran baru, menunggu approval.'),
  (8, 3, 'RSL-008', 'Anto Wibowo',  'anto.wibowo@gmail.com',      '+62 819-8901-2345', 'Semarang', 'Jl. Pandanaran No. 9, Semarang',           'Bronze',   'suspended', '2023-12-01', 4500000,   6,        0,   135000, 'ANTO23',  'Suspend karena banyak retur.')
on conflict (tenant_id, code) do nothing;

-- Reseller commissions
insert into public.reseller_commissions (tenant_id, reseller_id, order_id, amount, status, payment_method, paid_at, notes) values
  (3, 1, 2, 3348450, 'paid',    'bca',  now() - interval '2 days', 'Komisi 15% dari penjualan'),
  (3, 2, 3, 2439360, 'paid',    'gopay',now() - interval '5 days', 'Komisi 12% dari penjualan'),
  (3, 1, null, 5280000, 'pending', null, null, 'Pending payout periode Mei'),
  (3, 3, null, 2400000, 'pending', null, null, 'Pending payout periode Mei');

-- =============================================================================
-- 19) NOTIFICATIONS
-- =============================================================================

insert into public.notifications (tenant_id, type, title, message, status, priority, action_url) values
  (3, 'order',   'Pesanan baru ORD-2025-0001',      'Ahmad Rizki memesan iPhone 14 Pro Max. Segera proses.', 'unread', 'high',   '/orders/ORD-2025-0001'),
  (3, 'stock',   'Stok rendah: Nike Air Jordan 1',  'Stok tersisa 3 unit, sebaiknya restock.',               'unread', 'medium', '/products/5'),
  (3, 'stock',   'Stok habis: Adidas Ultraboost 22','Produk sudah out of stock.',                            'unread', 'high',   '/products/6'),
  (3, 'payment', 'Refund berhasil ORD-2025-0005',   'Refund Rp 8.999.000 telah diproses.',                  'read',   'low',    '/payments'),
  (3, 'system',  'Update keamanan',                  'Versi baru aplikasi tersedia. Segera update.',          'read',   'low',    null),
  (2, 'order',   'Pesanan baru TBJ-2025-0001',       'Rina Marlina memesan 3 item.',                         'read',   'medium', '/orders/TBJ-2025-0001');

update public.notifications set read_at = now() - interval '1 day' where status = 'read';

-- =============================================================================
-- 20) CHAT (sample thread + messages)
-- =============================================================================

with new_thread as (
  insert into public.chat_threads (tenant_id, subject, status)
  values (3, 'Cara tambah produk', 'open')
  returning id
)
insert into public.chat_messages (thread_id, role, text, sent_at)
select id, 'agent'::chat_role, 'Halo! Saya **Reza** dari tim support Eleven Seller Center. Ada yang bisa saya bantu hari ini? 😊', now() - interval '10 minutes' from new_thread
union all
select id, 'user'::chat_role,  'Halo, gimana cara tambah produk secara massal?',                                                     now() - interval '8 minutes'  from new_thread
union all
select id, 'agent'::chat_role, 'Buka menu **Produk** → klik "Import Excel". Gunakan template yang disediakan.',                       now() - interval '7 minutes'  from new_thread;

-- =============================================================================
-- 21) DAILY STATS (rollup 14 hari terakhir untuk ABC Store)
-- =============================================================================

do $$
declare
  i int;
  d date;
  sales numeric;
  orders int;
begin
  for i in 0..13 loop
    d      := current_date - i;
    sales  := 5000000 + (i * 250000) + ((random() * 2000000)::int);
    orders := 5 + (i % 7) + (random() * 5)::int;
    insert into public.daily_stats (tenant_id, stat_date, total_sales, total_orders, total_visitors, conversion_rate, avg_order_value)
    values (3, d, sales, orders, orders * 25, 2.8 + random() * 1.5, sales / nullif(orders,0))
    on conflict (tenant_id, stat_date) do nothing;
  end loop;
end $$;

-- =============================================================================
-- 22) PRODUCT SIGNALS (cached AI insights untuk paket business)
-- =============================================================================

insert into public.product_signals (tenant_id, product_id, avg_daily_sales, prev_avg_daily_sales, trend_pct,
                                    forecast_30d, forecast_revenue_30d, days_of_stock, confidence) values
  (3, 1, 1.20, 0.95,  26.3, 36, 575964000, 20.8, 88),
  (3, 2, 0.85, 0.78,   9.0, 26, 493974000, 17.6, 82),
  (3, 3, 0.45, 0.62, -27.4, 14, 265986000, 17.8, 76),
  (3, 4, 1.10, 0.88,  25.0, 33, 296967000, 14.5, 84),
  (3, 5, 0.30, 0.18,  66.7,  9,  22491000, 10.0, 71),
  (3, 6, 0.00, 0.05, -100,   0,         0, null, 60)
on conflict (tenant_id, product_id) do nothing;

-- =============================================================================
-- RESET SEQUENCES (agar auto-increment lanjut dari ID tertinggi)
-- =============================================================================

select setval(pg_get_serial_sequence('public.tenants',    'id'), max(id)) from public.tenants;
select setval(pg_get_serial_sequence('public.categories', 'id'), max(id)) from public.categories;
select setval(pg_get_serial_sequence('public.warehouses', 'id'), max(id)) from public.warehouses;
select setval(pg_get_serial_sequence('public.products',   'id'), max(id)) from public.products;
select setval(pg_get_serial_sequence('public.customers',  'id'), max(id)) from public.customers;
select setval(pg_get_serial_sequence('public.orders',     'id'), max(id)) from public.orders;
select setval(pg_get_serial_sequence('public.vouchers',   'id'), max(id)) from public.vouchers;
select setval(pg_get_serial_sequence('public.flash_sales','id'), max(id)) from public.flash_sales;
select setval(pg_get_serial_sequence('public.resellers',  'id'), max(id)) from public.resellers;

-- =============================================================================
-- SELESAI. Verifikasi cepat:
-- =============================================================================
--   select count(*) from public.tenants;            -- 3
--   select count(*) from public.products;           -- 10
--   select count(*) from public.orders;             -- 6
--   select count(*) from public.resellers;          -- 8
--   select count(*) from public.daily_stats;        -- 14
-- =============================================================================
