-- =============================================================================
-- Migration: Store Categories (Kategori Jenis Toko)
-- Jalankan di Supabase SQL Editor pada database yang sudah berjalan.
-- Aman dijalankan berulang kali (idempotent).
-- =============================================================================

-- 1) Tabel master kategori jenis toko
create table if not exists public.store_categories (
  id          text primary key,
  name        text not null,
  description text,
  icon        text,
  sort_order  integer default 0,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create or replace trigger trg_store_categories_updated_at
  before update on public.store_categories
  for each row execute function public.set_updated_at();

-- 2) Kolom store_category_id pada tenants
alter table public.tenants
  add column if not exists store_category_id text
    references public.store_categories(id) on delete set null;

-- 3) RLS
alter table public.store_categories enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'store_categories'
      and policyname = 'store_categories readable by all'
  ) then
    create policy "store_categories readable by all"
      on public.store_categories for select
      to anon, authenticated
      using (true);
  end if;
end$$;

-- 4) Seed master data kategori toko
insert into public.store_categories (id, name, description, icon, sort_order, is_active)
values
  ('elektronik', 'Elektronik & Gadget',    'Toko yang menjual produk elektronik, gadget, dan aksesoris teknologi', 'laptop',     1, true),
  ('makanan',    'Makanan & Minuman',       'Toko yang menjual makanan, minuman, snack, dan produk kuliner',         'utensils',   2, true),
  ('fashion',    'Fashion & Pakaian',       'Toko yang menjual pakaian, baju, kaos, kemeja, dan aksesoris mode',     'shirt',      3, true),
  ('sepatu',     'Sepatu & Tas',            'Toko yang menjual sepatu, sandal, tas, dompet, dan aksesoris',          'footprints', 4, true),
  ('kosmetik',   'Kosmetik & Kecantikan',   'Toko yang menjual produk kosmetik, skincare, perawatan, dan kecantikan','sparkles',   5, true),
  ('olahraga',   'Olahraga & Fitness',      'Toko yang menjual perlengkapan olahraga, gym, dan aktivitas outdoor',   'dumbbell',   6, true),
  ('rumah',      'Rumah & Dekorasi',        'Toko yang menjual furnitur, dekorasi rumah, perabot, dan kebutuhan dapur','home',      7, true),
  ('lainnya',    'Lainnya',                 'Kategori umum untuk toko yang tidak masuk kategori di atas',            'store',      8, true)
on conflict (id) do nothing;
