const { Client } = require('../backend/node_modules/pg')

const client = new Client({
  connectionString: 'postgresql://foxford_user:O0enoQfkTGi8uQatDUaKWeCD89SPW3kK@dpg-dat3jrnlk1mc73e4t340-a.oregon-postgres.render.com/foxford',
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()

  // Monthly:  $12.98/mo  → 1298 cents  → 166,144 UZS
  await client.query('UPDATE plans SET price=$1, name=$2, updated_at=NOW() WHERE slug=$3', [1298, 'Monthly Pro', 'monthly'])

  // Yearly:   $69.88/yr  → 6988 cents  → 894,464 UZS  (< Lifetime 998,400 ✅)
  //           = $5.82/month effectively
  await client.query('UPDATE plans SET price=$1, name=$2, updated_at=NOW() WHERE slug=$3', [6988, 'Yearly Pro', 'yearly'])

  // Lifetime: $78.00     → 7800 cents  → 998,400 UZS  (< 1,000,000 ✅)
  await client.query('UPDATE plans SET price=$1, name=$2, updated_at=NOW() WHERE slug=$3', [7800, 'Lifetime', 'lifetime'])

  const r = await client.query('SELECT name, slug, price, interval FROM plans ORDER BY price')
  console.log('Final plans:')
  r.rows.forEach(p => {
    const usd = (p.price / 100).toFixed(2)
    const uzs = Math.round((p.price / 100) * 12800).toLocaleString()
    console.log(`  ${p.slug.padEnd(10)} $${usd.padStart(7)} = ${uzs.padStart(12)} UZS`)
  })

  await client.end()
  console.log('\nDone!')
}

run().catch(e => { console.error('Error:', e.message); process.exit(1) })
