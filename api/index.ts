import { app } from '../server/app.js'

// Vercel Function entry point. Every /api/* request lands here (vercel.json
// rewrites them all to /api).
//
// Two things keep this loadable on Vercel's Node.js runtime:
// - Relative imports end in `.js`. The package is an ES module
//   ("type": "module"), and Node will not resolve an import without its
//   extension, so `'../server/app'` crashed every request with
//   ERR_MODULE_NOT_FOUND.
// - Handlers are exported per HTTP method. Vercel calls these with a Web
//   Request and expects a Response, which is exactly what Hono's app.fetch
//   takes and returns. A plain default-exported function is called Node-style,
//   with (req, res), instead.
// 60s: a Tapstitch import looks up each design's details on tapstitch.com.
export const config = { runtime: 'nodejs', maxDuration: 60 }

const handler = (request: Request) => app.fetch(request)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
