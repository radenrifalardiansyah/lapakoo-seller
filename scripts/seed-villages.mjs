/**
 * seed-villages.mjs  (v2 — optimized)
 * Load semua cities+districts dari DB sekaligus, lalu fetch villages per district.
 * Usage: node scripts/seed-villages.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_BASE     = 'https://ibnux.github.io/data-indonesia'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di environment.')
  console.error('Contoh: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=sb_secret_... node scripts/seed-villages.mjs')
  process.exit(1)
}

const BATCH = 300
const DELAY = 60   // ms antar API call

const PROVINCE_NAME_MAP = {
  'DKI Jakarta':   'Daerah Khusus Ibukota Jakarta',
  'DI Yogyakarta': 'Daerah Istimewa Yogyakarta',
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function apiGet(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`)
      if (res.status === 404) return []
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    } catch (e) {
      if (attempt === 2) { console.error(`  API failed: ${path}`); return [] }
      await sleep(300 * (attempt + 1))
    }
  }
  return []
}

async function sbGetAll(table, qs = '') {
  const PAGE = 1000
  let offset = 0, all = []
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${qs}&limit=${PAGE}&offset=${offset}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const rows = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) break
    all = all.concat(rows)
    if (rows.length < PAGE) break
    offset += PAGE
  }
  return all
}

async function sbInsert(table, rows) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates',
      },
      body: JSON.stringify(chunk),
    })
    if (!res.ok) {
      const txt = await res.text()
      if (!txt.includes('23505')) console.error(`  ✗ insert ${table}:`, txt.slice(0, 120))
    }
  }
}

console.log('🔄  Seed villages — loading DB data...\n')

// 1. Load semua data DB sekaligus
const [dbProvinces, dbCities, dbDistricts] = await Promise.all([
  sbGetAll('provinces', 'select=id,name'),
  sbGetAll('cities', 'select=id,name,province_id'),
  sbGetAll('districts', 'select=id,name,city_id'),
])
console.log(`DB: ${dbProvinces.length} provinces, ${dbCities.length} cities, ${dbDistricts.length} districts\n`)

// Build fast-lookup maps
const dbCityByProvId   = new Map()  // province_id → [city]
const dbDistrictByCityId = new Map() // city_id → [district]
for (const c of dbCities) {
  if (!dbCityByProvId.has(c.province_id)) dbCityByProvId.set(c.province_id, [])
  dbCityByProvId.get(c.province_id).push(c)
}
for (const d of dbDistricts) {
  if (!dbDistrictByCityId.has(d.city_id)) dbDistrictByCityId.set(d.city_id, [])
  dbDistrictByCityId.get(d.city_id).push(d)
}

// 2. Ambil provinsi dari API
const apiProvinces = await apiGet('/provinsi.json')

// 3. Match + seed
let totalVillages = 0
let processedDistricts = 0

for (const dp of dbProvinces) {
  const lookupName = PROVINCE_NAME_MAP[dp.name] ?? dp.name
  const ap = apiProvinces.find(p => p.nama.toLowerCase() === lookupName.toLowerCase())
  if (!ap) { console.warn(`  ⚠ No API match: "${dp.name}"`); continue }

  await sleep(DELAY)
  const apiCities = await apiGet(`/kabupaten/${ap.id}.json`)
  const dbCitiesForProv = dbCityByProvId.get(dp.id) ?? []

  for (const ac of apiCities) {
    const dbCity = dbCitiesForProv.find(x => x.name.toLowerCase() === ac.nama.toLowerCase())
    if (!dbCity) continue

    await sleep(DELAY)
    const apiDistricts = await apiGet(`/kecamatan/${ac.id}.json`)
    const dbDistrictsForCity = dbDistrictByCityId.get(dbCity.id) ?? []

    for (const ad of apiDistricts) {
      const dbDist = dbDistrictsForCity.find(x => x.name.toLowerCase() === ad.nama.toLowerCase())
      if (!dbDist) continue

      await sleep(DELAY)
      const apiVillages = await apiGet(`/kelurahan/${ad.id}.json`)
      if (!apiVillages.length) continue

      const rows = apiVillages.map(v => ({ district_id: dbDist.id, name: v.nama }))
      await sbInsert('villages', rows)

      totalVillages += rows.length
      processedDistricts++
    }
  }
  console.log(`  ✓ ${dp.name}: selesai  [total: ${totalVillages} desa dari ${processedDistricts} kecamatan]`)
}

console.log(`\n🎉  Selesai: ${totalVillages} kelurahan/desa`)
