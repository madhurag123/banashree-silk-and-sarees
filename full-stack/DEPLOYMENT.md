# Deployment

## Current private review site

The project is registered with Sites. `.openai/hosting.json` retains its exact project ID and logical `DB` binding. Sites provisions the persistent D1 database, applies the included SQL migrations, and serves the Worker and static assets. Source, saved version, and deployment must refer to the same committed source state.

The current site is owner-private and uses demo checkout. Configure production runtime secrets through Sites; never insert credentials in `.openai/hosting.json` or source. Deploy a new version after changing runtime environment values. Use the Sites building/hosting workflow for subsequent changes. Keep deployed migration files immutable and generate additive migrations for schema changes.

Before inviting real customers, deliberately change the audience/access policy, connect your domain if desired, complete the launch setup listed in README, and verify externally reachable payment webhooks. Do not assume the private preview can receive callbacks from Razorpay.

## Independent Cloudflare Workers + D1 deployment

If deploying outside Sites:

1. Create your own Cloudflare account/project and a D1 database.
2. Install dependencies and build: `npm ci && npm run build`.
3. Copy `dist/server/wrangler.json` to a private deployment configuration in that same directory. Preserve its generated entry point, assets configuration, compatibility flags/date and build settings. Replace the placeholder D1 database ID/name with the real database ID/name, keeping binding `DB`. Select your Worker name and domain.
4. Apply each SQL file in `drizzle/` exactly once and in filename order to the new remote database, for example:

   ```sh
   npx wrangler d1 execute DB --remote --config dist/server/wrangler.production.json --file drizzle/0000_cute_nebula.sql
   npx wrangler d1 execute DB --remote --config dist/server/wrangler.production.json --file drizzle/0001_good_tombstone.sql
   ```

5. Add ADMIN_SETUP_TOKEN, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RESEND_API_KEY and EMAIL_FROM with `wrangler secret put ... --config dist/server/wrangler.production.json` as needed. Set APP_URL to your trusted HTTPS origin in deployment vars. Do not include the `.dev.vars` file in deployment artifacts.
6. Deploy the generated Worker using `npx wrangler deploy --config dist/server/wrangler.production.json`.
7. Open the store. Initial idempotent seeding inserts the sample catalogue. Set up the first admin, then remove the setup secret.
8. Perform customer registration, saved-address checkout, product/stock editing, coupon checks, fulfillment, signed payment webhook and email-delivery tests on that deployment before launch.

Keep your production deployment configuration outside generated build output in your deployment pipeline; copy it into place after each build so a rebuild cannot silently restore placeholder IDs. Do not deploy the dev server. Preserve your D1 database across deployments; deleting the database deletes orders/accounts. Configure backups, monitoring, alerts and retention appropriate for your business.

## Environment variables

| Variable                | Purpose                                                 | Secret                       |
| ----------------------- | ------------------------------------------------------- | ---------------------------- |
| APP_URL                 | Canonical HTTPS origin for password reset emails        | No                           |
| ADMIN_SETUP_TOKEN       | One-time first-admin setup secret; remove after setup   | Yes                          |
| RAZORPAY_KEY_ID         | Test or live public checkout key                        | Yes in hosting configuration |
| RAZORPAY_KEY_SECRET     | Server-to-server API and payment-signature secret       | Yes                          |
| RAZORPAY_WEBHOOK_SECRET | Raw webhook HMAC secret                                 | Yes                          |
| RESEND_API_KEY          | Transactional email service key                         | Yes                          |
| EMAIL_FROM              | Verified sender address, e.g. Shop <orders@your-domain> | No                           |

Never use an `NEXT_PUBLIC_` or `VITE_` prefix for secrets. Only the Razorpay public key is intentionally returned when starting a valid payment. The database binding `DB` is provisioned by the hosting platform, not a plaintext connection string.

## Operational boundaries

Demo/test/live are distinct stored payment states. Real provider capture, refunds, delivery serviceability and email delivery still require the owner’s credentials and business validation. The project does not invent review ratings, certification, store hours, legal terms, or verified inventory. Manual payment reconciliation and courier tracking are deliberate administration tasks. Do not present a test order as a real successful payment.
