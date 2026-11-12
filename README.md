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

## Import from Tapstitch

Tapstitch has no API for custom sites, so designs come in from its export:
Tapstitch → export designs → `.xlsx`, then `/admin` → **Import from Tapstitch**.

1. The preview lists every design in the file with its colour swatches, sizes
   and product code. New designs start ticked; untick any you don't want.
2. **Import** saves the ticked designs as **drafts**: in `/admin`, not in the
   shop. Each design is one piece with a colour and size choice. The export's
   64px cover pictures become the colour swatches.
3. A draft needs a **price** before it can go live (the export has none), and
   it should get a real photo (the export has none at full size). Use **Edit**.
4. Tick pieces and choose **Go live**, **Move to drafts** or **Remove**. The
   tabs filter All / Live / Drafts.

Importing a newer export refreshes the colours, sizes and product code of
designs already in the shop (matched by Tapstitch design ID). Their name,
price, photos, description and live/draft state are kept. Remove a piece and
import again to start it over.

Sizes are kept per colour: Tapstitch does not make every size in every colour,
and checkout refuses a combination it does not make. Each order line carries
the Tapstitch product code, colour ID and design link, and **Copy for
Tapstitch** includes them.

The reader lives in `server/xlsx.ts` (a small zip + XML reader for this one
export layout: Design Name, Cover, Design URL, Color Name, Color ID, Product
Code, Size).

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

Stripe Checkout (Stripe-hosted payment page) with Stripe Tax. All Stripe calls
live in `server/app.ts` and `server/stripe.ts`, pinned to API version
`2026-10-28.endive`.

1. **Keys.** Add `STRIPE_SECRET_KEY` (test key locally, live key in
   production). The publishable key is not needed: the browser never talks to
   Stripe directly. Test with card `4242 4242 4242 4242`, any future expiry,
   any CVC.
2. **Tax.** Stripe Dashboard → Settings → Tax: add your business address, then
   add a registration for every state (or country) where you collect sales tax.
   Until the address is in, checkout runs without tax and `/admin` says so;
   once Tax is active, checkout adds tax on top of the price from the shipping
   address. Garments use tax code `txcd_30011000` (Clothing & Footwear) and
   shipping uses `txcd_92010001`.
3. **Webhook.** Stripe Dashboard → Developers → Webhooks → Add endpoint:
   `https://9inetailss.com/api/stripe/webhook`, events
   `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
   Copy its signing secret into `STRIPE_WEBHOOK_SECRET`. Locally:
   `stripe listen --forward-to localhost:8787/api/stripe/webhook` prints a
   secret to use in `.env`.

Prices are read server-side from the database, so a cart cannot change what is
charged. Free shipping over `$100`, `$7` flat below (`src/data/products.ts`),
sent to Stripe as a shipping rate so it is taxed correctly per state.
A failed checkout keeps the cart and shows an error instead of pretending
the order was placed. Cancelling at Stripe returns the buyer to the page they
came from (`/` or `/shop`).

## Deploy on Vercel

1. Push this branch and let Vercel build it (`vercel.json` handles the SPA
   routes and funnels `/api/*` into one function).
2. Vercel → Storage → Neon (free tier) sets `DATABASE_URL`. Tables are created
   and seeded on the first request.
3. Environment variables: `ADMIN_PASSWORD`, `ADMIN_SECRET`
   (`openssl rand -hex 32`), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
   Redeploy.
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
marked paid by the Stripe webhook, when the buyer returns to
`/order/confirmed`, or on the next import, whichever comes first. Then create the order in Tapstitch — they print, ship and email
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
