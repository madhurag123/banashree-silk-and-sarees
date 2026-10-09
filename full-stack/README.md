# Banashree silk and sarees

This repository includes the **complete full-stack store** and a separate **GitHub Pages client design preview**. See [GITHUB-PAGES.md](GITHUB-PAGES.md) for preview scope, publishing and rebuild instructions. The Pages preview does not accept real orders, account details or payments.

A complete responsive sample storefront for a Bangalore saree shop shipping across India. Includes a React/Vinext frontend, server API, persistent Cloudflare D1 relational database, customer accounts and an administrator dashboard. Currency is INR; all stored monetary amounts are integer paise.

**Default mode is DEMO.** Demo orders are permanently labelled test orders and `demo_unpaid`. No real payment or shipment is represented as successful. The hosted site starts private. Real business contacts and policies remain clearly marked placeholders/drafts.

## Run locally

Requirements: Node.js 22.13+ (Node 24 recommended), npm, and a supported macOS/Linux/Windows environment.

```sh
npm ci
cp .env.example .dev.vars
# Generate a private setup key and enter it in ADMIN_SETUP_TOKEN in .dev.vars:
node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"
npm run build
npm run db:local
npm run dev
```

Open the Local URL printed by the server (normally `http://localhost:5173`). If a different port is used, set APP_URL to that origin. Local secrets are read from `.dev.vars`; never commit that file. The database is durable in `.wrangler/state/`. The 24 sample designs and 30 colour options, variants, store defaults and WELCOME10 coupon are inserted once on the first API request. Seeds use insert-if-absent operations and do not overwrite admin edits. Database schema changes are migrations, not runtime DDL.

Local migration history is recorded in `.sites-runtime/local-migrations.json`. Keep it together with `.wrangler/state`; if intentionally creating a completely new local database, remove both directories before rebuilding and migrating. Do not rerun applied migrations manually against an existing database.

## First administrator

1. Configure a cryptographically random ADMIN_SETUP_TOKEN as a server secret.
2. Open `/admin` and choose **First-time store setup**.
3. Enter your name, email, password (12+ characters), and the private setup key.
4. After successful setup, remove ADMIN_SETUP_TOKEN from the environment and restart/redeploy.

Setup is protected by the secret, rate limited, and allowed exactly once by a unique database marker in the same transaction as the administrator insert. There is no default production password or unrestricted admin account. Keep the administrator setup key private and configure it on your chosen backend host.

Additional people register ordinary customer accounts. An administrator changes their role under **Team & customers**. Staff manage orders and enquiries. Administrators also manage products, variants, coupons, settings and roles. An administrator cannot change their own role. Every admin mutation checks authorization on the server and is recorded in the audit log.

## Customer experience

- Home: editorial hero, collection photography, new arrivals, clearly identified sample bestseller edit, wedding edit, brand introduction, and an honest empty state for testimonials.
- Shop: text search; fabric, colour, price, occasion, weaving style, collection and in-stock filters; sorting and pagination.
- Product: image gallery and zoom, variants and available stock, price, measurements, blouse details, care, delivery estimates, wishlist, related products.
- Bag: database-backed guest cookie, editable quantities, validated coupons, server-calculated subtotal, shipping and taxes.
- Checkout: guest or registered customer, saved addresses, demo/Razorpay/COD modes, durable idempotency, and atomic stock reservations.
- Account: registration/login/logout, password reset when email is configured, profile, wishlist, addresses, order history and tracking.
- Supporting pages: About, Contact with database-backed enquiries, FAQ, draping guide, draft shipping/returns/privacy/terms.

Each colour variant can have its own photograph, SKU and stock in the colour/inventory editor. The three Mysore Silk sample designs each include three matching colour photographs. Existing seeded backend databases are not automatically overwritten; use the admin editor to add the new designs.

Image URLs and gallery ordering are managed in the product editor (one HTTPS URL or local `/images/…` path per line). Self-host product assets in `public/images` or use your approved image host. Direct file upload is not included. Collections are managed as comma-separated product assignments; new collection names automatically appear in the catalogue filter.

## Checkout, inventory and payment integrity

- The browser never supplies authoritative prices, discounts, taxes or stock. All totals are calculated server-side.
- D1 transactions create orders/lines, decrement stock, consume coupons, and clear the cart together. Stock CHECK constraints cause rollback on conflicts.
- A unique cart revision prevents two checkout requests from ordering the same bag twice, even with different request keys. A separate idempotency key handles retries. Cart changes create a fresh revision.
- Product prices, finishing prices and availability are checked again inside the transaction. Coupon percentage, expiry, enabled state and usage limits are checked before consumption.
- Guest order access requires the high-entropy, HTTP-only bag cookie; registered order access requires the owner’s session. An order ID alone does not expose customer data.
- Session tokens and reset tokens are SHA-256 hashed in storage; passwords use salted PBKDF2-SHA-256. Reset links expire after 30 minutes and are consumed once; reset invalidates prior sessions.
- Mutations reject cross-origin requests; prepared SQL statements, Zod validation, role checks, authentication rate limits, HTTP-only/SameSite cookies, and secure cookies on HTTPS protect state.
- Cancellation of unpaid demo/COD orders restores stock exactly once. Paid and online orders require payment reconciliation; they cannot be casually marked unpaid or cancelled.
- Unpaid online reservations deliberately remain held until reconciled. There is no automated expiry job. This avoids selling stock while a late payment may still arrive.

## Configure Razorpay

Use the [official Razorpay web integration documentation](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/) and [webhook documentation](https://razorpay.com/docs/webhooks/). Configure:

```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
APP_URL=https://your-store-origin
```

1. Use a public HTTPS endpoint for Razorpay webhooks. The private review deployment is not suitable for external provider callbacks until its access policy is intentionally changed for launch.
2. Add `APP_URL/api/payment/webhook` in the Razorpay dashboard. Subscribe to `payment.captured`, `payment.failed`, and `refund.processed`. Use the same webhook secret on both sides. Configure automatic capture in Razorpay.
3. In Store settings select **Razorpay test mode**. The server requires test-prefixed keys; test payments remain `test_paid`, never live paid.
4. Create a test order and use **Pay with Razorpay test mode**. UPI/cards are provided through Razorpay’s checkout, subject to methods enabled on your merchant account.
5. The server creates the provider order from its trusted order total. The return signature is HMAC-verified against the stored provider order ID; the server fetches payment status and requires a captured payment with the correct order, amount and INR currency.
6. Webhooks are verified against the exact raw request body and deduplicated by provider event ID/hash. Failed payment events cannot downgrade paid orders. A webhook can complete a payment even when the shopper closes the browser.
7. If provider order creation has an uncertain outcome, the app stops retries and marks `payment_setup_uncertain`. Find the receipt matching the Banashree order ID in Razorpay, then use **Verify provider payment** in the admin order dialog. The server validates receipt, amount and currency before associating the reference and reconciling captured payments.
8. Online return requests allow an administrator to issue a full Razorpay refund. `refund_pending` prevents duplicate refund submissions; only a processed response or verified refund webhook marks it refunded. Reconcile uncertain refunds in Razorpay before any manual action. Partial refunds and automated reverse shipping are outside this implementation.

Before live mode: replace all sample products with actual inventory and verified product photography; remove the Sample flag only after verification; complete business contacts and policies; confirm tax/shipping/COD settings; complete Razorpay merchant activation; run a full test payment and refund; use live-prefixed keys and select Live. **Sample products are blocked from live checkout.** Live mode cannot be enabled without the required payment secrets.

## Email

Transactional order/status emails and password resets use the Resend HTTP API when RESEND_API_KEY and EMAIL_FROM are supplied. Verify the sender domain with Resend. APP_URL supplies password-reset links. Order email failures do not lose the order; the admin can resend. Provider idempotency keys prevent duplicate sends for the same payment status. Without credentials the order page explicitly says email is unconfigured, and password reset returns a helpful unavailable response. Contact enquiries are saved in the database and visible to staff; they are not silently represented as emailed.

## Shipping and taxes

Shipping is a configurable flat India-wide charge with a free-shipping threshold, estimated day range and optional COD. Tax is an exclusive configurable percentage of the discounted merchandise/services subtotal, rounded to paise; shipping is not taxed by this simple model. The default tax is 0% pending business input. Confirm the appropriate actual calculation before launch. Carrier names and tracking numbers are entered manually by staff. There is no courier API, live postcode serviceability check, shipping-label purchase or automatic dispatch promise.

## Database and source map

- `db/schema.ts`: typed schema (17 tables), constraints, indexes and relationships.
- `drizzle/*.sql` and `drizzle/meta/`: schema migrations and journals. Treat deployed migrations as immutable.
- `lib/catalog.ts`: 12 labelled sample products and store defaults.
- `lib/server.ts`: database access, auth/crypto, totals, cart, email and Razorpay helpers.
- `app/api/[...path]/route.ts`: validated server endpoints and transaction boundaries.
- `app/store.tsx`: storefront, accounts, policies, customer order views and shared controls.
- `app/admin.tsx`: role-protected administration surface.
- `app/globals.css`: boutique visual system and responsive layouts.
- `IMAGE-SOURCES.json`: photography sources and AI-image disclosures.
- `.env.example`: complete runtime variable template.

## Test

```sh
npm run typecheck
npm run build
# With a migrated local preview and ADMIN_SETUP_TOKEN configured:
npm run test:journeys
```

`tests/journeys.mjs` intentionally creates local-only QA accounts, orders, a coupon and a variant. It refuses non-loopback URLs. Run on a fresh local database for repeatable stock assertions. QA login credentials are saved to the ignored `.sites-runtime/qa-credentials.json` in this project. Hosted storage is separate and contains none of the local test customers/orders.

For the optional local signed-webhook fixture test, set `RAZORPAY_WEBHOOK_SECRET=local-synthetic-webhook-fixture-only` in `.dev.vars`, restart the local server, run the journey test to initialise a QA admin, then run `node tests/payment-webhook.mjs`. It creates a clearly labelled synthetic test payment directly in the local database and never contacts Razorpay. Never use this fixture secret for a hosted deployment.

See `TEST-REPORT.md` for the performed checks and external-service limitations.

## Deployment

See `DEPLOYMENT.md` for the private Sites deployment and independent Cloudflare deployment instructions. This project uses HTTP-based service APIs and Worker-compatible ESM; it requires a persistent D1 binding named `DB`. A static-only deployment would not provide the requested backend or persistence.
