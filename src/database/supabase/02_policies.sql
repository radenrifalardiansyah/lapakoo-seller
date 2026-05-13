-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================
-- Pendekatan: setiap user (auth.users) terhubung ke baris tenant_users (lewat
-- kolom user_id). Helper auth_tenant_id() mengembalikan tenant_id user saat ini.
-- Semua tabel multi-tenant memfilter row by row dengan helper ini.
--
-- CATATAN: Saat menjalankan seed (03_seed.sql) lewat SQL Editor, RLS di-bypass
-- karena query dijalankan dengan role 'postgres' (bukan 'authenticated').
-- =============================================================================

-- Helper: tenant_id user saat ini berdasarkan auth.uid()
create or replace function public.auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.tenant_users where user_id = auth.uid() limit 1;
$$;

-- Helper: cek role
create or replace function public.auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.tenant_users where user_id = auth.uid() limit 1;
$$;

-- =============================================================================
-- Enable RLS pada semua tabel multi-tenant
-- =============================================================================

alter table public.packages              enable row level security;
alter table public.tenants               enable row level security;
alter table public.tenant_users          enable row level security;
alter table public.store_settings        enable row level security;
alter table public.courier_services      enable row level security;
alter table public.user_sessions         enable row level security;
alter table public.categories            enable row level security;
alter table public.products              enable row level security;
alter table public.product_images        enable row level security;
alter table public.warehouses            enable row level security;
alter table public.stock_distribution    enable row level security;
alter table public.stock_movements       enable row level security;
alter table public.customers             enable row level security;
alter table public.customer_addresses    enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_returns         enable row level security;
alter table public.payments              enable row level security;
alter table public.transactions          enable row level security;
alter table public.vouchers              enable row level security;
alter table public.flash_sales           enable row level security;
alter table public.flash_sale_items      enable row level security;
alter table public.reseller_tier_settings enable row level security;
alter table public.resellers             enable row level security;
alter table public.reseller_commissions  enable row level security;
alter table public.notifications         enable row level security;
alter table public.chat_threads          enable row level security;
alter table public.chat_messages         enable row level security;
alter table public.daily_stats           enable row level security;
alter table public.product_signals       enable row level security;

-- =============================================================================
-- Public read: packages (semua user perlu lihat daftar paket)
-- =============================================================================

create policy "packages readable by all"
  on public.packages for select
  to anon, authenticated
  using (true);

-- =============================================================================
-- Tenants: user hanya bisa lihat tenant-nya sendiri
-- =============================================================================

create policy "tenants visible to members"
  on public.tenants for select
  to authenticated
  using (id = public.auth_tenant_id());

create policy "tenants editable by owner"
  on public.tenants for update
  to authenticated
  using (id = public.auth_tenant_id() and public.auth_role() = 'owner');

-- Anon dapat baca tenant by subdomain (untuk tenant resolution di public site)
create policy "tenant lookup by subdomain"
  on public.tenants for select
  to anon
  using (status = 'active');

-- =============================================================================
-- Macro: policy generik per tabel berbasis tenant_id
-- =============================================================================
-- Pola "all action" untuk authenticated. Sesuaikan kalau perlu pemisahan
-- select/insert/update/delete yang lebih halus.
--
-- Catatan: PostgreSQL tidak punya macro, jadi kita expand manual per tabel.
-- =============================================================================

-- tenant_users
create policy "tenant_users by tenant"
  on public.tenant_users for select to authenticated
  using (tenant_id = public.auth_tenant_id());
create policy "tenant_users write by owner/admin"
  on public.tenant_users for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('owner','admin'))
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('owner','admin'));

-- store_settings
create policy "store_settings rw by tenant"
  on public.store_settings for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- courier_services
create policy "courier rw by tenant"
  on public.courier_services for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- user_sessions
create policy "sessions visible by tenant"
  on public.user_sessions for select to authenticated
  using (exists (
    select 1 from public.tenant_users tu
    where tu.id = tenant_user_id and tu.tenant_id = public.auth_tenant_id()
  ));

-- categories
create policy "categories rw by tenant"
  on public.categories for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- products
create policy "products rw by tenant"
  on public.products for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- product_images
create policy "product_images rw by tenant"
  on public.product_images for all to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.tenant_id = public.auth_tenant_id()
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_id and p.tenant_id = public.auth_tenant_id()
  ));

-- warehouses
create policy "warehouses rw by tenant"
  on public.warehouses for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- stock_distribution
create policy "stock_distribution rw by tenant"
  on public.stock_distribution for all to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.tenant_id = public.auth_tenant_id()
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_id and p.tenant_id = public.auth_tenant_id()
  ));

-- stock_movements
create policy "stock_movements rw by tenant"
  on public.stock_movements for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- customers
create policy "customers rw by tenant"
  on public.customers for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- customer_addresses
create policy "customer_addresses rw by tenant"
  on public.customer_addresses for all to authenticated
  using (exists (
    select 1 from public.customers c
    where c.id = customer_id and c.tenant_id = public.auth_tenant_id()
  ))
  with check (exists (
    select 1 from public.customers c
    where c.id = customer_id and c.tenant_id = public.auth_tenant_id()
  ));

-- orders
create policy "orders rw by tenant"
  on public.orders for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- order_items
create policy "order_items rw by tenant"
  on public.order_items for all to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.tenant_id = public.auth_tenant_id()
  ))
  with check (exists (
    select 1 from public.orders o
    where o.id = order_id and o.tenant_id = public.auth_tenant_id()
  ));

-- order_returns
create policy "order_returns rw by tenant"
  on public.order_returns for all to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.tenant_id = public.auth_tenant_id()
  ))
  with check (exists (
    select 1 from public.orders o
    where o.id = order_id and o.tenant_id = public.auth_tenant_id()
  ));

-- payments
create policy "payments rw by tenant"
  on public.payments for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- transactions
create policy "transactions rw by tenant"
  on public.transactions for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- vouchers
create policy "vouchers rw by tenant"
  on public.vouchers for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- flash_sales
create policy "flash_sales rw by tenant"
  on public.flash_sales for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- flash_sale_items
create policy "flash_sale_items rw by tenant"
  on public.flash_sale_items for all to authenticated
  using (exists (
    select 1 from public.flash_sales fs
    where fs.id = flash_sale_id and fs.tenant_id = public.auth_tenant_id()
  ))
  with check (exists (
    select 1 from public.flash_sales fs
    where fs.id = flash_sale_id and fs.tenant_id = public.auth_tenant_id()
  ));

-- reseller_tier_settings
create policy "tier_settings rw by tenant"
  on public.reseller_tier_settings for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- resellers
create policy "resellers rw by tenant"
  on public.resellers for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- reseller_commissions
create policy "commissions rw by tenant"
  on public.reseller_commissions for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- notifications
create policy "notifications rw by tenant"
  on public.notifications for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- chat_threads
create policy "chat_threads rw by tenant"
  on public.chat_threads for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- chat_messages
create policy "chat_messages rw by tenant"
  on public.chat_messages for all to authenticated
  using (exists (
    select 1 from public.chat_threads t
    where t.id = thread_id and t.tenant_id = public.auth_tenant_id()
  ))
  with check (exists (
    select 1 from public.chat_threads t
    where t.id = thread_id and t.tenant_id = public.auth_tenant_id()
  ));

-- daily_stats
create policy "daily_stats r by tenant"
  on public.daily_stats for select to authenticated
  using (tenant_id = public.auth_tenant_id());

-- product_signals
create policy "product_signals r by tenant"
  on public.product_signals for select to authenticated
  using (tenant_id = public.auth_tenant_id());
