import { createApp } from './app.js'
import { env } from './config/env.js'
import { pool } from './config/db.js'

async function main() {
  // Fail fast if DB is unreachable
  await pool.query('select 1')

  const app = createApp()
  app.listen(env.PORT, () => {
    console.log(`CampusGigs API listening on http://localhost:${env.PORT}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
