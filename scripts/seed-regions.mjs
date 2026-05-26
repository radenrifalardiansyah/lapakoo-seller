/**
 * seed-regions.mjs
 * Populate cities, districts, villages dari ibnux.github.io/data-indonesia
 * Usage:
 *   node scripts/seed-regions.mjs                  → cities + districts saja
 *   node scripts/seed-regions.mjs --with-villages  → + villages (~83k rows, ~1 jam)
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_BASE     = 'https://ibnux.github.io/data-indonesia'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di environment.')
  console.error('Contoh: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=sb_secret_... node scripts/seed-regions.mjs')
  process.exit(1)
}

const BATCH = 200
const DELAY = 80   // ms antar request

// Nama beda antara DB kita dan API
const PROVINCE_NAME_MAP = {
  'DKI Jakarta':    'Daerah Khusus Ibukota Jakarta',
  'DI Yogyakarta':  'Daerah Istimewa Yogyakarta',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${API_BASE}${path}`)
  return res.json()
}

async function sbGet(table, qs = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  return res.json()
}

async function sbInsert(table, rows) {
  if (!rows.length) return
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
    if (!res.ok) console.error(`  ✗ insert ${table}[${i}]:`, await res.text())
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

console.log('🔄  Seed wilayah Indonesia\n')

// Ambil provinsi dari DB kita
const dbProvinces = await sbGet('provinces', 'select=id,name&order=name')
console.log(`DB provinces: ${dbProvinces.length}`)

// Ambil provinsi dari API
const apiProvinces = await apiGet('/provinsi.json')
console.log(`API provinces: ${apiProvinces.length}\n`)

// Build map: dbId → apiId
const provinceMap = []   // [{dbId, apiId, name}]
for (const dp of dbProvinces) {
  const lookupName = PROVINCE_NAME_MAP[dp.name] ?? dp.name
  const ap = apiProvinces.find(
    p => p.nama.toLowerCase() === lookupName.toLowerCase()
  )
  if (ap) provinceMap.push({ dbId: dp.id, apiId: ap.id, name: dp.name })
  else console.warn(`  ⚠ No API match for "${dp.name}" (tried "${lookupName}")`)
}
console.log(`Matched: ${provinceMap.length}/${dbProvinces.length} provinces\n`)

// ─── CITIES ──────────────────────────────────────────────────────────────────
console.log('── Cities ──────────────────────────────────────────────')
let totalCities = 0
// apiCityId → dbCityId  (diperlukan untuk district cascade)
const cityMap = new Map()

for (const prov of provinceMap) {
  await sleep(DELAY)
  const apiCities = await apiGet(`/kabupaten/${prov.apiId}.json`)

  const rows = apiCities.map(c => ({
    province_id: prov.dbId,
    name: c.nama,
    type: c.nama.toLowerCase().startsWith('kota') ? 'Kota' : 'Kabupaten',
  }))
  await sbInsert('cities', rows)

  // Re-fetch untuk dapat ID yang sebenarnya
  const dbCities = await sbGet('cities', `select=id,name&province_id=eq.${prov.dbId}`)
  for (const ac of apiCities) {
    const dc = dbCities.find(x => x.name.toLowerCase() === ac.nama.toLowerCase())
    if (dc) cityMap.set(ac.id, dc.id)
  }

  totalCities += rows.length
  process.stdout.write(`  ✓ ${prov.name}: ${rows.length} kota/kab  [total: ${totalCities}]\n`)
}
console.log(`\n✅ Cities selesai: ${totalCities}\n`)

// ─── DISTRICTS ───────────────────────────────────────────────────────────────
console.log('── Districts (Kecamatan) ────────────────────────────────')
let totalDistricts = 0
const districtMap = new Map()   // apiDistrictId → dbDistrictId

for (const prov of provinceMap) {
  await sleep(DELAY)
  const apiCities = await apiGet(`/kabupaten/${prov.apiId}.json`)

  for (const ac of apiCities) {
    const dbCityId = cityMap.get(ac.id)
    if (!dbCityId) continue

    await sleep(DELAY)
    const apiDistricts = await apiGet(`/kecamatan/${ac.id}.json`)

    const rows = apiDistricts.map(d => ({ city_id: dbCityId, name: d.nama }))
    await sbInsert('districts', rows)

    const dbDistricts = await sbGet('districts', `select=id,name&city_id=eq.${dbCityId}`)
    for (const ad of apiDistricts) {
      const dd = dbDistricts.find(x => x.name.toLowerCase() === ad.nama.toLowerCase())
      if (dd) districtMap.set(ad.id, dd.id)
    }

    totalDistricts += rows.length
  }
  process.stdout.write(`  ✓ ${prov.name}: selesai  [total kecamatan: ${totalDistricts}]\n`)
}
console.log(`\n✅ Districts selesai: ${totalDistricts}\n`)

// ─── VILLAGES (opsional) ─────────────────────────────────────────────────────
if (process.argv.includes('--with-villages')) {
  console.log('── Villages (Kelurahan/Desa) ────────────────────────────')
  console.log('  ⚠ Proses ini akan memakan waktu ~30–60 menit...')
  let totalVillages = 0

  for (const [apiDistId, dbDistId] of districtMap) {
    await sleep(DELAY)
    let apiVillages
    try { apiVillages = await apiGet(`/kelurahan/${apiDistId}.json`) }
    catch { continue }

    const rows = apiVillages.map(v => ({ district_id: dbDistId, name: v.nama }))
    await sbInsert('villages', rows)
    totalVillages += rows.length

    if (totalVillages % 5000 === 0)
      process.stdout.write(`  ... ${totalVillages} desa\n`)
  }
  console.log(`\n✅ Villages selesai: ${totalVillages}\n`)
} else {
  console.log('ℹ  Villages dilewati. Tambah --with-villages untuk seed kelurahan.\n')
}

console.log('🎉  Seed selesai!')
