// Update plan prices in the database
const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford',
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()

  // Check current plans
  const current = await client.query('SELECT id, name, slug, price, interval FROM plans ORDER BY price')
  console.log('Current plans:')
  current.rows.forEach(p => console.log(`  ${p.slug}: $${p.price/100}/month price_cents=${p.price}`))

  // New prices (stored in cents USD):
  // Monthly:  $12.98  → 1298 cents
  // Yearly:   $143.88 → 14388 cents  ($11.99 x 12)
  // Lifetime: $78.00  → 7800 cents   (78 * 12800 = 998,400 UZS < 1,000,000 ✅)
  const updates = [
    { slug: 'monthly',  price: 1298,  name: 'Monthly Pro' },
    { slug: 'yearly',   price: 14388, name: 'Yearly Pro'  },
    { slug: 'lifetime', price: 7800,  name: 'Lifetime'    },
  ]

  for (const u of updates) {
    const res = await client.query(
      'UPDATE plans SET price = $1, name = $2, updated_at = NOW() WHERE slug = $3 RETURNING id, slug, price',
      [u.price, u.name, u.slug]
    )
    if (res.rows.length > 0) {
      const uzsPrice = Math.round((u.price / 100) * 12800).toLocaleString()
      console.log(`✅ ${u.slug}: $${u.price/100} (~${uzsPrice} UZS)`)
    } else {
      console.log(`⚠️  ${u.slug} not found — inserting...`)
    }
  }

  // Verify
  const after = await client.query('SELECT name, slug, price, interval FROM plans WHERE slug != \'free\' ORDER BY price')
  console.log('\nUpdated plans:')
  after.rows.forEach(p => {
    const uzs = Math.round((p.price / 100) * 12800).toLocaleString()
    console.log(`  ${p.slug}: $${p.price/100} ≈ ${uzs} UZS`)
  })

  await client.end()
}

run().catch(console.error)
