# Verification report

Verified 18 September 2026 on the local Cloudflare-compatible development runtime and persistent D1 database.

## Automated customer and admin journeys

`tests/journeys.mjs` completed 15 scenario groups successfully:

1. Twelve labelled sample products loaded from persistent storage.
2. Anonymous account/admin requests were rejected.
3. Secret-protected administrator setup and login worked.
4. Customer registration worked; customer requests to admin data/mutations were rejected.
5. Profile edits, wishlist items and saved addresses persisted.
6. Cart quantities, finishing charges and coupon calculations matched server totals; invalid coupon was rejected.
7. Concurrent checkout with different request IDs created only one order; retry returned the existing order; a forged browser total was ignored; anonymous third parties could not read the order.
8. Account order history, valid fulfillment transitions, tracking, delivery and return request/approval worked. An invalid status jump was rejected.
9. Out-of-stock and negative-quantity requests were rejected.
10. A stock change between adding to bag and checkout produced a conflict; guest checkout and cancellation restored inventory exactly once.
11. Configurable shipping, tax and COD produced the expected totals/status.
12. Product edits, variants, inventory and coupons persisted; a discount over 100% was rejected.
13. Enquiries persisted, missing email credentials were reported honestly, and forged payment/webhook requests were rejected.
14. Cross-origin mutation was rejected.
15. Logout invalidated the session; login restored the account.

A separate final-unit race check also passed: two different carts competed for one remaining unit, exactly one order succeeded, and the other received a stock conflict.

The test data lives only in the local QA database. Deployment uses a separately provisioned database and starts with the sample seed.

## Browser checks

- Desktop home at 1440 pixels and mobile home/checkout at 390 pixels were inspected.
- Product detail, bag, coupon, guest checkout and explicitly unpaid demo-order confirmation were exercised through the rendered UI.
- The authenticated admin dashboard and product/inventory controls were inspected; the admin sign-in form was checked; the browser test caught and corrected validation of a blank optional name on login.
- Catalogue search worked through the registered WebMCP `search_sarees` tool. Invalid non-string input was rejected without changing state.
- Product image paths loaded; product pages include matching titles and JSON-LD. Sample listings omit live offers and invented review ratings.

## Synthetic payment verification

`tests/payment-webhook.mjs` also passed using a local-only secret and synthetic payment fixtures: invalid signatures and wrong amounts were rejected; a valid signed capture became `test_paid`; replayed captures and a late failure preserved the paid order and its fulfillment status. No payment provider or real money was involved.

## External-service boundary

No Razorpay or email credentials were provided, so no real/test-provider charge, real refund, webhook delivery from Razorpay, password-reset email delivery or order email delivery was claimed as tested. Signature verification, capture/amount/currency checks, payment-state guards, provider-order reconciliation, refund-state handling and email integrations are implemented. Run the documented provider tests after configuring secrets and making the webhook origin externally reachable. Courier dispatch/tracking entry is manual; no courier API is configured.

## Mobile layout update — 18 September 2026

Verified against the local preview after the mobile layout changes:

- Home: no document overflow at 320, 390, 430, 768 and 1440px. The bold brand name is preserved. The 390px hero shows the main shopping link in the initial viewport.
- Navigation at 320px: the expanded menu exposes shop/search, bridal, story, contact, account and wishlist links; navigation closes the menu.
- Shop at 320px: filters expand, Cotton returns two sample products, and the result button closes the filters. Product cards remain in two columns without document overflow.
- Product at 320px: add-to-bag and wishlist controls are 48px tall and remain within the viewport; adding a sample saree updates the shopping bag.
- Cart at 320px: quantity buttons are 44px square, quantity change updates the bag, and the checkout link works without horizontal overflow.
- Checkout: no document overflow at 320, 390, 430, 768 or 1440px. Phone address fields use one column, 16px input text and 48px field height. No payment or order was submitted in this visual check.
- Admin overview at 320px: navigation wraps, sign-out stays accessible, and the dashboard fits without document overflow.

The API and payment logic were unchanged by this update. Existing integration results above remain the backend verification record.
