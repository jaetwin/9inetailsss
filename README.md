# 9inetailss

The sanctuary site (3D rooms, `/`) plus a shop backend: a product admin at
`/admin`, a flat storefront at `/shop`, and Stripe Checkout. The garments shown
on the sanctuary cards, in the menu collection and in `/shop` all come from the
same database.

## Run it

```bash
npm install
cp .env.example .env        # then set ADMIN_PASSWORD and ADMIN_SECRET
npm run dev                 # shop API on :8787, site on http://localhost:3000
```

No `DATABASE_URL` means SQLite at `.data/9inetailss.db`, created and seeded with
the four garments from `src/data/products.ts` on the first request. Delete the
file to reseed.

- Site: <http://localhost:3000> — `ENTER SANCTUARY` for the 3D experience
- Storefront: <http://localhost:3000/shop>
- Admin: <http://localhost:3000/admin>

## Add a piece

`/admin` → **New piece**: name, price, category, image URL, sizes, description,
then **Publish piece**. It appears immediately on the sanctuary cards, in the
menu collection and in `/shop`. No deploy.

- **Draft** (unpublished) keeps a piece out of the storefront without deleting it.
- **Featured** marks it for the front of the collection.
- **Upload image** takes a photo from your phone or computer: it is resized to 1600px in the browser, stored in the database and served from `/api/images/…`. The URL field still accepts a Tapstitch link if you would rather host it there.

## How it fits together

| Path | Role |
| --- | --- |
| `src/` | The existing site (rooms, product modal, cart, checkout) |
| `src/shop/api.ts` | Maps the catalogue into the Shopify-shaped product the existing components expect |
| `src/shop/ShopPage.tsx` | `/shop` grid, reuses the existing product modal and cart |
| `src/shop/AdminPage.tsx` | `/admin`, styled in the site's own palette |
| `server/` | Hono API: catalogue, admin auth, product CRUD, Stripe sessions |
| `server/db.ts` | One data layer: SQLite locally, Neon Postgres on Vercel |
| `api/index.ts` | Vercel Function entry for every `/api/*` request |

`src/lib/shopify.ts` is no longer called; the site reads `/api/products`.

## Payments

Add `STRIPE_SECRET_KEY` (test key locally, live key in production). Test with
card `4242 4242 4242 4242`, any future expiry, any CVC.

Prices are read server-side from the database, so a cart cannot change what is
charged. Free shipping over `$100`, `$7` flat below (`src/data/products.ts`).
A failed checkout now keeps the cart and shows an error instead of pretending
the order was placed.

## Deploy on Vercel

1. Push this branch and let Vercel build it (`vercel.json` handles the SPA
   routes and funnels `/api/*` into one function).
2. Vercel → Storage → Neon (free tier) sets `DATABASE_URL`. Tables are created
   and seeded on the first request.
3. Environment variables: `ADMIN_PASSWORD`, `ADMIN_SECRET`
   (`openssl rand -hex 32`), `STRIPE_SECRET_KEY`. Redeploy.
4. Sign in at `https://9inetailss.com/admin`, paste images into the four seeded
   pieces, place one real test order, then refund it.

The apex domain already belongs to this project, so `/shop` and `/admin` serve
from the same deployment.

## Orders and Tapstitch

Tapstitch has no public API and no integration for custom sites, so each paid
order is one manual step. `/admin` shows every paid order with its pieces,
sizes, customer email, total and shipping address:

- **Copy for Tapstitch** puts the whole order on your clipboard as plain text.
- **Import from Stripe** pulls the last 50 paid checkouts, for buyers who closed
the tab before Stripe sent them back to the site.

An order row is written when checkout starts (so the exact sizes are kept) and
marked paid either when the buyer returns to `/order/confirmed` or on the next
import. Then create the order in Tapstitch — they print, ship and email
tracking.

Nothing is written if `STRIPE_SECRET_KEY` is unset, so a demo checkout cannot
create a fake order.

## Notes

- `ADMIN_PASSWORD` is a single shared password with a signed http-only cookie
  (7 days). Fine for one owner; use a real identity provider if you add staff.
- The root-level `App.tsx`, `pages/`, `components/`, `hooks/` and `lib/` are an
  earlier, unused app — nothing in `index.html` loads them, and `tsconfig.json`
  now scopes typechecking to `src/`, `server/` and `api/index.ts`. Safe to delete.
- `better-sqlite3` was removed: it is a native module, unused by the shop, and
  it fails to build on current Node versions.
