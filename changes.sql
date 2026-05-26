-- ============================================================
-- changes.sql  (v2 — English field names + master data tables)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- ── Step 1: Hapus kolom lama (bahasa Indonesia) jika ada ──────────────────────
ALTER TABLE public.warehouses
  DROP COLUMN IF EXISTS negara,
  DROP COLUMN IF EXISTS provinsi,
  DROP COLUMN IF EXISTS kecamatan,
  DROP COLUMN IF EXISTS kelurahan;

-- ── Step 2: Tambah kolom lokasi bertingkat (English) ke warehouses ─────────────
ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS country     text    DEFAULT 'Indonesia',
  ADD COLUMN IF NOT EXISTS province    text,
  ADD COLUMN IF NOT EXISTS province_id bigint,
  ADD COLUMN IF NOT EXISTS city_id     bigint,
  ADD COLUMN IF NOT EXISTS district    text,
  ADD COLUMN IF NOT EXISTS district_id bigint,
  ADD COLUMN IF NOT EXISTS village     text;

UPDATE public.warehouses SET country = 'Indonesia' WHERE country IS NULL;

-- ── Step 3: Master data — countries ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.countries (
  id     bigserial  PRIMARY KEY,
  name   text       NOT NULL UNIQUE,
  code   char(2)    NOT NULL UNIQUE,   -- ISO 3166-1 alpha-2
  active boolean    DEFAULT true
);

-- ── Step 4: Master data — provinces ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.provinces (
  id         bigserial PRIMARY KEY,
  country_id bigint    NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  name       text      NOT NULL,
  UNIQUE (country_id, name)
);

-- ── Step 5: Master data — cities ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cities (
  id          bigserial PRIMARY KEY,
  province_id bigint    NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  name        text      NOT NULL,
  type        text,                    -- 'Kota' | 'Kabupaten'
  UNIQUE (province_id, name)
);

-- ── Step 6: Master data — districts (kecamatan) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.districts (
  id      bigserial PRIMARY KEY,
  city_id bigint    NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name    text      NOT NULL,
  UNIQUE (city_id, name)
);

-- ── Step 7: Master data — villages (kelurahan/desa) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.villages (
  id          bigserial PRIMARY KEY,
  district_id bigint    NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name        text      NOT NULL,
  UNIQUE (district_id, name)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_provinces_country  ON public.provinces(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_province    ON public.cities(province_id);
CREATE INDEX IF NOT EXISTS idx_districts_city     ON public.districts(city_id);
CREATE INDEX IF NOT EXISTS idx_villages_district  ON public.villages(district_id);

-- FK indexes on warehouses
CREATE INDEX IF NOT EXISTS idx_warehouses_province_id ON public.warehouses(province_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_city_id     ON public.warehouses(city_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_district_id ON public.warehouses(district_id);

-- ── Step 8: Seed countries ────────────────────────────────────────────────────
INSERT INTO public.countries (name, code) VALUES
  -- Southeast Asia
  ('Indonesia',              'ID'),
  ('Malaysia',               'MY'),
  ('Singapore',              'SG'),
  ('Thailand',               'TH'),
  ('Vietnam',                'VN'),
  ('Philippines',            'PH'),
  ('Myanmar',                'MM'),
  ('Cambodia',               'KH'),
  ('Laos',                   'LA'),
  ('Brunei',                 'BN'),
  ('Timor-Leste',            'TL'),
  -- East Asia
  ('China',                  'CN'),
  ('Japan',                  'JP'),
  ('South Korea',            'KR'),
  ('Taiwan',                 'TW'),
  ('Hong Kong',              'HK'),
  -- South Asia
  ('India',                  'IN'),
  ('Bangladesh',             'BD'),
  ('Pakistan',               'PK'),
  ('Sri Lanka',              'LK'),
  -- Oceania
  ('Australia',              'AU'),
  ('New Zealand',            'NZ'),
  -- Middle East
  ('Saudi Arabia',           'SA'),
  ('United Arab Emirates',   'AE'),
  ('Qatar',                  'QA'),
  ('Kuwait',                 'KW'),
  ('Bahrain',                'BH'),
  ('Oman',                   'OM'),
  -- Europe
  ('United Kingdom',         'GB'),
  ('Germany',                'DE'),
  ('France',                 'FR'),
  ('Netherlands',            'NL'),
  ('Italy',                  'IT'),
  ('Spain',                  'ES'),
  ('Sweden',                 'SE'),
  ('Switzerland',            'CH'),
  ('Belgium',                'BE'),
  ('Portugal',               'PT'),
  ('Poland',                 'PL'),
  ('Denmark',                'DK'),
  ('Norway',                 'NO'),
  ('Finland',                'FI'),
  -- Americas
  ('United States',          'US'),
  ('Canada',                 'CA'),
  ('Brazil',                 'BR'),
  ('Mexico',                 'MX'),
  ('Argentina',              'AR'),
  ('Chile',                  'CL'),
  ('Colombia',               'CO'),
  -- Africa
  ('South Africa',           'ZA'),
  ('Nigeria',                'NG'),
  ('Egypt',                  'EG'),
  ('Kenya',                  'KE'),
  ('Ethiopia',               'ET')
ON CONFLICT (code) DO NOTHING;

-- ── Step 9: Seed Indonesian provinces ─────────────────────────────────────────
INSERT INTO public.provinces (country_id, name)
SELECT c.id, p.name
FROM public.countries c
CROSS JOIN (VALUES
  ('Aceh'),
  ('Sumatera Utara'),
  ('Sumatera Barat'),
  ('Riau'),
  ('Jambi'),
  ('Sumatera Selatan'),
  ('Bengkulu'),
  ('Lampung'),
  ('Kepulauan Bangka Belitung'),
  ('Kepulauan Riau'),
  ('DKI Jakarta'),
  ('Jawa Barat'),
  ('Jawa Tengah'),
  ('DI Yogyakarta'),
  ('Jawa Timur'),
  ('Banten'),
  ('Bali'),
  ('Nusa Tenggara Barat'),
  ('Nusa Tenggara Timur'),
  ('Kalimantan Barat'),
  ('Kalimantan Tengah'),
  ('Kalimantan Selatan'),
  ('Kalimantan Timur'),
  ('Kalimantan Utara'),
  ('Sulawesi Utara'),
  ('Sulawesi Tengah'),
  ('Sulawesi Selatan'),
  ('Sulawesi Tenggara'),
  ('Gorontalo'),
  ('Sulawesi Barat'),
  ('Maluku'),
  ('Maluku Utara'),
  ('Papua Barat'),
  ('Papua'),
  ('Papua Selatan'),
  ('Papua Tengah'),
  ('Papua Pegunungan'),
  ('Papua Barat Daya')
) AS p(name)
WHERE c.code = 'ID'
ON CONFLICT (country_id, name) DO NOTHING;

-- ── Note ──────────────────────────────────────────────────────────────────────
-- Tabel cities, districts, dan villages bisa diisi via import data atau
-- melalui halaman admin master data.
-- Data wilayah Indonesia tersedia di: https://github.com/emsifa/wig
-- ─────────────────────────────────────────────────────────────────────────────
