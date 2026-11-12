import { getDb } from './db.js'

// Site-wide switches the owner flips from /admin, stored in the database so a
// change applies at once, with no redeploy.

const CACHE_MS = 5000
let maintenance: { on: boolean; at: number } | null = null

/**
 * Whether the site is closed to the public. Until it is set from /admin, it
 * follows the old VITE_MAINTENANCE / MAINTENANCE variable, so deploying this
 * doesn't open (or close) the site by surprise.
 */
export async function maintenanceOn(): Promise<boolean> {
  if (maintenance && Date.now() - maintenance.at < CACHE_MS) return maintenance.on
  const db = await getDb()
  const rows = await db.query<{ value: string }>("SELECT value FROM settings WHERE key = 'maintenance'")
  const fallback = process.env.MAINTENANCE === 'true' || process.env.VITE_MAINTENANCE === 'true'
  const on = rows[0] ? rows[0].value === 'on' : fallback
  maintenance = { on, at: Date.now() }
  return on
}

export async function setMaintenance(on: boolean): Promise<void> {
  const db = await getDb()
  const value = on ? 'on' : 'off'
  const existing = await db.query<{ value: string }>("SELECT value FROM settings WHERE key = 'maintenance'")
  if (existing[0]) await db.run("UPDATE settings SET value = ? WHERE key = 'maintenance'", [value])
  else await db.run("INSERT INTO settings (key, value) VALUES ('maintenance', ?)", [value])
  maintenance = { on, at: Date.now() }
}
