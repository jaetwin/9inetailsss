import { handle } from 'hono/vercel'

import { app } from '../server/app'

// Vercel Function entry point. Every /api/* request lands here.
export const config = { runtime: 'nodejs' }

export default handle(app)
