-- =============================================================================
-- Eleven Seller — Supabase (PostgreSQL) Schema
-- Multi-tenant SaaS seller management system
-- =============================================================================
-- Jalankan file ini dulu di Supabase SQL Editor sebelum 02_policies.sql dan
-- 03_seed.sql.
-- =============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- =============================================================================
-- ENUMS
-- =============================================================================

create type tenant_status        as enum ('active', 'inactive', 'suspended');
create type user_role            as enum ('owner', 'admin', 'staff');
create type user_status          as enum ('active', 'inactive');

create type product_status       as enum ('active', 'low_stock', 'out_of_stock', 'inactive');
create type movement_type        as enum (
  'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out', 'sale', 'restock'
);

create type order_status         as enum (
  'pending', 'processing', 'shipped', 'delivered', 'cancelled'
);
create type payment_status       as enum ('waiting', 'paid', 'failed', 'refunded');
create type return_type          as enum ('return_item', 'refund_only');
create type return_status        as enum ('requested', 'approved', 'rejected', 'completed');

create type customer_segment     as enum ('VIP', 'Regular', 'New');

create type reseller_tier        as enum ('Bronze', 'Silver', 'Gold', 'Platinum');
create type reseller_status      as enum ('active', 'pending', 'suspended');

create type voucher_type         as enum ('percentage', 'fixed');
create type voucher_status       as enum ('active', 'scheduled', 'expired', 'disabled');
create type flash_sale_status    as enum ('active', 'scheduled', 'ended');

create type tx_type              as enum ('Penjualan', 'Penarikan', 'Refund', 'Biaya Admin');
create type tx_status            as enum ('Sukses', 'Pending', 'Gagal');

create type notif_type           as enum ('order', 'payment', 'stock', 'system');
create type notif_status         as enum ('unread', 'read');
create type notif_priority       as enum ('low', 'medium', 'high');

create type chat_role            as enum ('user', 'agent');

-- =============================================================================
-- HELPER: updated_at trigger
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- PACKAGES (subscription plans)
-- =============================================================================

create table public.packages (
  id              text primary key,
  name            text not null,
  description     text,
  price           numeric(15,2) default 0,
  features        text[] not null default '{}',
  max_products    integer default 50,         -- -1 = unlimited
  max_orders      integer default 100,
  max_users       integer default 1,
  max_warehouses  integer default 1,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create trigger trg_packages_updated_at before update on public.packages
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TENANTS (clients / stores)
-- =============================================================================

create table public.tenants (
  id             bigserial primary key,
  subdomain      text unique not null,
  store_name     text not null,
  owner_name     text not null,
  email          citext unique not null,
  phone          text,
  logo_url       text,
  primary_color  text default '#6366f1',
  package_id     text not null default 'starter' references public.packages(id),
  status         tenant_status default 'active',
  trial_ends_at  timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index idx_tenants_subdomain on public.tenants(subdomain);
create index idx_tenants_status    on public.tenants(status);
create trigger trg_tenants_updated_at before update on public.tenants
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TENANT USERS (team members per tenant)
-- Linked to Supabase auth.users via user_id (nullable for seeding).
-- =============================================================================

create table public.tenant_users (
  id            bigserial primary key,
  tenant_id     bigint not null references public.tenants(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  name          text not null,
  email         citext not null,
  role          user_role default 'staff',
  status        user_status default 'active',
  avatar_url    text,
  permissions   text[],                       -- override role-derived permissions
  last_login    timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (tenant_id, email)
);
create index idx_tenant_users_tenant on public.tenant_users(tenant_id);
create index idx_tenant_users_user   on public.tenant_users(user_id);
create trigger trg_tenant_users_updated_at before update on public.tenant_users
  for each row execute function public.set_updated_at();

-- =============================================================================
-- STORE SETTINGS (1:1 dengan tenant)
-- =============================================================================

create table public.store_settings (
  tenant_id           bigint primary key references public.tenants(id) on delete cascade,
  description         text,
  address             text,
  city                text,
  province            text,
  postal_code         text,
  phone               text,
  email               citext,
  website             text,
  operational_hours   text,
  -- decoration
  theme_color         text default '#3b82f6',
  tagline             text,
  banner_url          text,
  show_reviews        boolean default true,
  show_best_sellers   boolean default true,
  -- shipping
  free_shipping_min   numeric(15,2) default 0,
  packaging_fee       numeric(15,2) default 0,
  processing_days     integer default 1,
  -- notifications
  notif_email_new_order   boolean default true,
  notif_sms_payment       boolean default true,
  notif_push              boolean default true,
  notif_email_low_stock   boolean default false,
  notif_email_promotion   boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create trigger trg_store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();

-- =============================================================================
-- COURIER SERVICES per tenant
-- =============================================================================

create table public.courier_services (
  id              bigserial primary key,
  tenant_id       bigint not null references public.tenants(id) on delete cascade,
  code            text not null,              -- 'jne', 'jt', 'sicepat', ...
  name            text not null,
  enabled         boolean default true,
  estimated_days  text,
  created_at      timestamptz default now(),
  unique (tenant_id, code)
);
create index idx_courier_tenant on public.courier_services(tenant_id);

-- =============================================================================
-- USER SESSIONS (login history per tenant_user)
-- =============================================================================

create table public.user_sessions (
  id            bigserial primary key,
  tenant_user_id bigint not null references public.tenant_users(id) on delete cascade,
  device        text,
  location      text,
  ip_address    text,
  is_current    boolean default false,
  last_active   timestamptz default now(),
  created_at    timestamptz default now()
);
create index idx_user_sessions_user on public.user_sessions(tenant_user_id);

-- =============================================================================
-- CATEGORIES (per tenant)
-- =============================================================================

create table public.categories (
  id          bigserial primary key,
  tenant_id   bigint not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  image_url   text,
  status      user_status default 'active',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (tenant_id, name)
);
create index idx_categories_tenant on public.categories(tenant_id);
create trigger trg_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- =============================================================================
-- PRODUCTS
-- =============================================================================

create table public.products (
  id           bigserial primary key,
  tenant_id    bigint not null references public.tenants(id) on delete cascade,
  category_id  bigint references public.categories(id) on delete set null,
  name         text not null,
  description  text,
  sku          text not null,
  price        numeric(15,2) not null,
  weight       numeric(8,2) default 0,         -- gram
  dimensions   text,
  image_url    text,
  status       product_status default 'active',
  featured     boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (tenant_id, sku)
);
create index idx_products_tenant   on public.products(tenant_id);
create index idx_products_category on public.products(category_id);
create index idx_products_status   on public.products(status);
create trigger trg_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id          bigserial primary key,
  product_id  bigint not null references public.products(id) on delete cascade,
  image_url   text not null,
  alt_text    text,
  is_primary  boolean default false,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);
create index idx_product_images_product on public.product_images(product_id);

-- =============================================================================
-- WAREHOUSES + STOCK DISTRIBUTION + MOVEMENTS
-- =============================================================================

create table public.warehouses (
  id          bigserial primary key,
  tenant_id   bigint not null references public.tenants(id) on delete cascade,
  code        text not null,
  name        text not null,
  address     text,
  city        text,
  pic         text,                            -- person in charge
  phone       text,
  is_primary  boolean default false,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (tenant_id, code)
);
create index idx_warehouses_tenant on public.warehouses(tenant_id);
create trigger trg_warehouses_updated_at before update on public.warehouses
  for each row execute function public.set_updated_at();

-- Stok per produk per gudang (lookup table)
create table public.stock_distribution (
  product_id    bigint not null references public.products(id) on delete cascade,
  warehouse_id  bigint not null references public.warehouses(id) on delete cascade,
  quantity      integer not null default 0,
  updated_at    timestamptz default now(),
  primary key (product_id, warehouse_id)
);
create index idx_stock_warehouse on public.stock_distribution(warehouse_id);
create trigger trg_stock_distribution_updated_at before update on public.stock_distribution
  for each row execute function public.set_updated_at();

create table public.stock_movements (
  id                  bigserial primary key,
  tenant_id           bigint not null references public.tenants(id) on delete cascade,
  product_id          bigint not null references public.products(id) on delete cascade,
  warehouse_id        bigint not null references public.warehouses(id) on delete cascade,
  ref_warehouse_id    bigint references public.warehouses(id) on delete set null,
  type                movement_type not null,
  qty                 integer not null,        -- selalu positif
  previous_stock      integer,
  new_stock           integer,
  reason              text,
  performed_by        text,                    -- nama display, bukan FK
  reference_type      text,                    -- 'order', 'restock', 'adjustment', 'return'
  reference_id        bigint,
  created_at          timestamptz default now()
);
create index idx_stock_mv_tenant    on public.stock_movements(tenant_id);
create index idx_stock_mv_product   on public.stock_movements(product_id);
create index idx_stock_mv_warehouse on public.stock_movements(warehouse_id);
create index idx_stock_mv_type      on public.stock_movements(type);

-- =============================================================================
-- CUSTOMERS
-- =============================================================================

create table public.customers (
  id            bigserial primary key,
  tenant_id     bigint not null references public.tenants(id) on delete cascade,
  name          text not null,
  email         citext,
  phone         text,
  address       text,
  date_of_birth date,
  gender        text check (gender in ('male','female','other')),
  segment       customer_segment default 'New',
  status        user_status default 'active',
  total_orders  integer default 0,
  total_spend   numeric(15,2) default 0,
  last_order_at timestamptz,
  join_date     date default current_date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (tenant_id, email)
);
create index idx_customers_tenant  on public.customers(tenant_id);
create index idx_customers_segment on public.customers(segment);
create trigger trg_customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create table public.customer_addresses (
  id              bigserial primary key,
  customer_id     bigint not null references public.customers(id) on delete cascade,
  type            text default 'home' check (type in ('home','office','other')),
  recipient_name  text,
  phone           text,
  address_line1   text not null,
  address_line2   text,
  city            text,
  state           text,
  postal_code     text,
  country         text default 'Indonesia',
  is_default      boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index idx_customer_addresses_customer on public.customer_addresses(customer_id);
create trigger trg_customer_addresses_updated_at before update on public.customer_addresses
  for each row execute function public.set_updated_at();

-- =============================================================================
-- ORDERS + ORDER ITEMS + RETURNS
-- =============================================================================

create table public.orders (
  id                   bigserial primary key,
  tenant_id            bigint not null references public.tenants(id) on delete cascade,
  order_number         text not null,
  customer_id          bigint references public.customers(id) on delete set null,
  customer_address_id  bigint references public.customer_addresses(id) on delete set null,
  -- snapshot data customer agar order tetap utuh meski customer berubah
  customer_name        text not null,
  customer_email       text,
  customer_phone       text,
  shipping_address     text,
  status               order_status default 'pending',
  payment_status       payment_status default 'waiting',
  payment_method       text,
  subtotal             numeric(15,2) not null default 0,
  tax_amount           numeric(15,2) default 0,
  shipping_cost        numeric(15,2) default 0,
  discount_amount      numeric(15,2) default 0,
  total_amount         numeric(15,2) not null,
  voucher_id           bigint,                     -- FK ditambahkan setelah vouchers dibuat
  reseller_id          bigint,                     -- FK ditambahkan setelah resellers dibuat
  notes                text,
  courier              text,
  tracking_number      text,
  order_date           timestamptz default now(),
  estimated_delivery   date,
  shipped_at           timestamptz,
  delivered_at         timestamptz,
  cancelled_at         timestamptz,
  cancel_reason        text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  unique (tenant_id, order_number)
);
create index idx_orders_tenant   on public.orders(tenant_id);
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_status   on public.orders(status);
create index idx_orders_payment  on public.orders(payment_status);
create index idx_orders_date     on public.orders(order_date);
create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id            bigserial primary key,
  order_id      bigint not null references public.orders(id) on delete cascade,
  product_id    bigint references public.products(id) on delete set null,
  product_name  text not null,                  -- snapshot
  product_sku   text,
  quantity      integer not null default 1,
  unit_price    numeric(15,2) not null,
  total_price   numeric(15,2) not null,
  created_at    timestamptz default now()
);
create index idx_order_items_order   on public.order_items(order_id);
create index idx_order_items_product on public.order_items(product_id);

create table public.order_returns (
  id            bigserial primary key,
  order_id      bigint not null references public.orders(id) on delete cascade,
  type          return_type not null,
  reason        text not null,
  notes         text,
  status        return_status default 'requested',
  request_date  timestamptz default now(),
  resolved_at   timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index idx_order_returns_order on public.order_returns(order_id);
create trigger trg_order_returns_updated_at before update on public.order_returns
  for each row execute function public.set_updated_at();

-- =============================================================================
-- PAYMENTS / TRANSACTIONS (financial ledger)
-- =============================================================================

create table public.payments (
  id                bigserial primary key,
  tenant_id         bigint not null references public.tenants(id) on delete cascade,
  order_id          bigint references public.orders(id) on delete cascade,
  payment_method    text not null,
  amount            numeric(15,2) not null,
  status            payment_status default 'waiting',
  transaction_id    text,
  gateway_response  jsonb,
  paid_at           timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create index idx_payments_tenant on public.payments(tenant_id);
create index idx_payments_order  on public.payments(order_id);
create index idx_payments_status on public.payments(status);
create trigger trg_payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- Buku besar finansial (Penjualan/Penarikan/Refund/Biaya Admin)
create table public.transactions (
  id          bigserial primary key,
  tenant_id   bigint not null references public.tenants(id) on delete cascade,
  tx_date     timestamptz default now(),
  description text not null,
  type        tx_type not null,
  amount      numeric(15,2) not null,
  status      tx_status default 'Sukses',
  order_id    bigint references public.orders(id) on delete set null,
  created_at  timestamptz default now()
);
create index idx_transactions_tenant on public.transactions(tenant_id);
create index idx_transactions_type   on public.transactions(type);
create index idx_transactions_date   on public.transactions(tx_date);

-- =============================================================================
-- MARKETING: Vouchers + Flash Sales
-- =============================================================================

create table public.vouchers (
  id            bigserial primary key,
  tenant_id     bigint not null references public.tenants(id) on delete cascade,
  code          text not null,
  name          text not null,
  description   text,
  type          voucher_type not null,
  value         numeric(15,2) not null,        -- % atau Rp
  min_purchase  numeric(15,2) default 0,
  max_discount  numeric(15,2),                  -- null = no cap
  quota         integer default 0,
  used          integer default 0,
  start_date    date not null,
  end_date      date not null,
  disabled      boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (tenant_id, code)
);
create index idx_vouchers_tenant on public.vouchers(tenant_id);
create trigger trg_vouchers_updated_at before update on public.vouchers
  for each row execute function public.set_updated_at();

alter table public.orders
  add constraint orders_voucher_fk
  foreign key (voucher_id) references public.vouchers(id) on delete set null;

create table public.flash_sales (
  id               bigserial primary key,
  tenant_id        bigint not null references public.tenants(id) on delete cascade,
  name             text not null,
  start_datetime   timestamptz not null,
  end_datetime     timestamptz not null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index idx_flash_sales_tenant on public.flash_sales(tenant_id);
create trigger trg_flash_sales_updated_at before update on public.flash_sales
  for each row execute function public.set_updated_at();

create table public.flash_sale_items (
  id              bigserial primary key,
  flash_sale_id   bigint not null references public.flash_sales(id) on delete cascade,
  product_id      bigint not null references public.products(id) on delete cascade,
  product_name    text not null,                -- snapshot
  original_price  numeric(15,2) not null,
  sale_price      numeric(15,2) not null,
  quota           integer not null default 0,
  sold            integer not null default 0,
  created_at      timestamptz default now()
);
create index idx_flash_sale_items_sale    on public.flash_sale_items(flash_sale_id);
create index idx_flash_sale_items_product on public.flash_sale_items(product_id);

-- =============================================================================
-- RESELLERS + TIER CONFIG + COMMISSIONS
-- =============================================================================

create table public.reseller_tier_settings (
  tenant_id    bigint not null references public.tenants(id) on delete cascade,
  tier         reseller_tier not null,
  commission   numeric(5,2) not null,            -- %
  min_sales    numeric(15,2) default 0,
  max_sales    numeric(15,2),                    -- null = unlimited
  updated_at   timestamptz default now(),
  primary key (tenant_id, tier)
);
create trigger trg_reseller_tier_settings_updated_at before update on public.reseller_tier_settings
  for each row execute function public.set_updated_at();

create table public.resellers (
  id                  bigserial primary key,
  tenant_id           bigint not null references public.tenants(id) on delete cascade,
  code                text not null,             -- 'RSL-001'
  name                text not null,
  email               citext,
  phone               text,
  city                text,
  address             text,
  tier                reseller_tier default 'Bronze',
  status              reseller_status default 'pending',
  join_date           date default current_date,
  total_sales         numeric(15,2) default 0,
  total_orders        integer default 0,
  pending_commission  numeric(15,2) default 0,
  paid_commission     numeric(15,2) default 0,
  referral_code       text not null,
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique (tenant_id, code),
  unique (tenant_id, referral_code)
);
create index idx_resellers_tenant on public.resellers(tenant_id);
create index idx_resellers_tier   on public.resellers(tier);
create index idx_resellers_status on public.resellers(status);
create trigger trg_resellers_updated_at before update on public.resellers
  for each row execute function public.set_updated_at();

alter table public.orders
  add constraint orders_reseller_fk
  foreign key (reseller_id) references public.resellers(id) on delete set null;

create table public.reseller_commissions (
  id           bigserial primary key,
  tenant_id    bigint not null references public.tenants(id) on delete cascade,
  reseller_id  bigint not null references public.resellers(id) on delete cascade,
  order_id     bigint references public.orders(id) on delete set null,
  amount       numeric(15,2) not null,
  status       text default 'pending' check (status in ('pending','paid','cancelled')),
  paid_at      timestamptz,
  payment_method text,                            -- bca/mandiri/gopay/...
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index idx_reseller_comm_tenant   on public.reseller_commissions(tenant_id);
create index idx_reseller_comm_reseller on public.reseller_commissions(reseller_id);
create trigger trg_reseller_comm_updated_at before update on public.reseller_commissions
  for each row execute function public.set_updated_at();

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

create table public.notifications (
  id          bigserial primary key,
  tenant_id   bigint not null references public.tenants(id) on delete cascade,
  user_id     bigint references public.tenant_users(id) on delete cascade,
  type        notif_type not null,
  title       text not null,
  message     text not null,
  status      notif_status default 'unread',
  priority    notif_priority default 'medium',
  action_url  text,
  read_at     timestamptz,
  created_at  timestamptz default now()
);
create index idx_notifications_tenant on public.notifications(tenant_id);
create index idx_notifications_user   on public.notifications(user_id);
create index idx_notifications_status on public.notifications(status);

-- =============================================================================
-- LIVE CHAT (in-app support)
-- =============================================================================

create table public.chat_threads (
  id          bigserial primary key,
  tenant_id   bigint not null references public.tenants(id) on delete cascade,
  user_id     bigint references public.tenant_users(id) on delete set null,
  subject     text,
  status      text default 'open' check (status in ('open','resolved','escalated')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index idx_chat_threads_tenant on public.chat_threads(tenant_id);
create trigger trg_chat_threads_updated_at before update on public.chat_threads
  for each row execute function public.set_updated_at();

create table public.chat_messages (
  id          bigserial primary key,
  thread_id   bigint not null references public.chat_threads(id) on delete cascade,
  role        chat_role not null,
  text        text not null,
  sent_at     timestamptz default now()
);
create index idx_chat_messages_thread on public.chat_messages(thread_id);

-- =============================================================================
-- ANALYTICS: Daily stats (rollup harian)
-- =============================================================================

create table public.daily_stats (
  id                bigserial primary key,
  tenant_id         bigint not null references public.tenants(id) on delete cascade,
  stat_date         date not null,
  total_sales       numeric(15,2) default 0,
  total_orders      integer default 0,
  total_visitors    integer default 0,
  conversion_rate   numeric(5,2) default 0,
  avg_order_value   numeric(15,2) default 0,
  created_at        timestamptz default now(),
  unique (tenant_id, stat_date)
);
create index idx_daily_stats_tenant on public.daily_stats(tenant_id);
create index idx_daily_stats_date   on public.daily_stats(stat_date);

-- AI sinyal forecast per produk (cached output dari pipeline)
create table public.product_signals (
  id                    bigserial primary key,
  tenant_id             bigint not null references public.tenants(id) on delete cascade,
  product_id            bigint not null references public.products(id) on delete cascade,
  avg_daily_sales       numeric(10,2) default 0,
  prev_avg_daily_sales  numeric(10,2) default 0,
  trend_pct             numeric(6,2) default 0,
  forecast_30d          integer default 0,
  forecast_revenue_30d  numeric(15,2) default 0,
  days_of_stock         numeric(8,2),
  confidence            integer default 0,        -- 0-100
  computed_at           timestamptz default now(),
  unique (tenant_id, product_id)
);
create index idx_product_signals_tenant on public.product_signals(tenant_id);

-- =============================================================================
-- VIEWS
-- =============================================================================

create or replace view public.product_summary as
select
  p.id,
  p.tenant_id,
  p.name,
  p.sku,
  p.price,
  p.status,
  c.name as category_name,
  coalesce(sum(sd.quantity), 0)::int as total_stock,
  (select image_url from public.product_images pi
     where pi.product_id = p.id order by pi.is_primary desc, pi.sort_order limit 1) as primary_image
from public.products p
left join public.categories c           on c.id = p.category_id
left join public.stock_distribution sd  on sd.product_id = p.id
group by p.id, c.name;

create or replace view public.order_summary as
select
  o.id,
  o.tenant_id,
  o.order_number,
  o.status,
  o.payment_status,
  o.total_amount,
  o.order_date,
  o.customer_name,
  count(oi.id) as item_count
from public.orders o
left join public.order_items oi on oi.order_id = o.id
group by o.id;
