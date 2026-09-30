async function checkRoute(path) {
  try {
    const res = await fetch(`http://localhost:3000${path}`)
    console.log(`${res.status === 200 ? '✅' : '⚠️'} ${path} -> Status: ${res.status}`)
    return res.status
  } catch (err) {
    console.log(`❌ ${path} -> Error: ${err.message}`)
    return 500
  }
}

async function run() {
  console.log('Verifying Admin Center routes:')
  const routes = [
    '/admin',
    '/admin/tests',
    '/admin/tests/create',
    '/admin/question-bank',
    '/admin/passages',
    '/admin/audio',
    '/admin/media',
    '/admin/import',
    '/admin/import/pdf',
    '/admin/import/json',
    '/admin/users',
    '/admin/premium',
    '/admin/payments',
    '/admin/analytics',
    '/admin/settings',
    '/admin/logs',
  ]

  for (const r of routes) {
    await checkRoute(r)
  }
}

run()
