// Synthetic, local-only webhook fixtures. Never sends or collects a payment.
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
const base = "http://localhost:5173";
const secret = fs
  .readFileSync(".dev.vars", "utf8")
  .split("\n")
  .find((x) => x.startsWith("RAZORPAY_WEBHOOK_SECRET="))
  ?.split("=")
  .slice(1)
  .join("=");
assert.equal(
  secret,
  "local-synthetic-webhook-fixture-only",
  "Use the documented local synthetic secret and restart local dev before running this test.",
);
function client() {
  let jar = "";
  return async (path, body) => {
    const r = await fetch(base + "/api/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        Cookie: jar,
        Origin: base,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.headers.get("set-cookie"))
      jar = r.headers.get("set-cookie").split(";")[0];
    const data = await r.json();
    assert.equal(r.status, 200, JSON.stringify(data));
    return data;
  };
}
const guest = client(),
  admin = client();
await admin(
  "auth/login",
  JSON.parse(fs.readFileSync(".sites-runtime/qa-credentials.json")),
);
await guest("cart", { variantId: "vp7", quantity: 1 });
const o = await guest("checkout", {
  email: "synthetic-payment@example.test",
  address: {
    name: "Synthetic Test",
    phone: "9000000000",
    line1: "123 Fixture Street",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
  },
  payment: "demo",
  idempotencyKey: crypto.randomUUID(),
});
const before = await guest("orders/" + o.id);
const provider = "order_fixture" + crypto.randomBytes(8).toString("hex");
const payment = "pay_fixture" + crypto.randomBytes(8).toString("hex");
assert.match(o.id, /^BS-[A-F0-9]{8}$/);
assert.match(provider, /^order_[a-zA-Z0-9]+$/);
const sql = `UPDATE orders SET payment_method='razorpay',razorpay_order_id='${provider}',status='awaiting_payment',payment_status='unpaid' WHERE id='${o.id}' AND test=1`;
const r = spawnSync(
  process.execPath,
  [
    "--import",
    "./scripts/sites-env.mjs",
    "./node_modules/wrangler/bin/wrangler.js",
    "d1",
    "execute",
    "DB",
    "--local",
    "--config",
    "dist/server/wrangler.json",
    "--persist-to",
    ".wrangler/state",
    "--command",
    sql,
  ],
  { encoding: "utf8" },
);
assert.equal(r.status, 0, r.stderr);
async function send(event, entity, id, expected = 200, badSignature = false) {
  const raw = JSON.stringify({ event, payload: { payment: { entity } } });
  const signature = crypto
    .createHmac("sha256", secret)
    .update(raw)
    .digest("hex");
  const response = await fetch(base + "/api/payment/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": badSignature ? "00" : signature,
      "x-razorpay-event-id": id,
    },
    body: raw,
  });
  const data = await response.json();
  assert.equal(response.status, expected, JSON.stringify(data));
}
const p = {
  id: payment,
  order_id: provider,
  amount: before.total,
  currency: "INR",
  status: "captured",
};
await send("payment.captured", p, "invalid-" + provider, 400, true);
await send("payment.captured", { ...p, amount: 1 }, "amount-" + provider, 409);
await send("payment.captured", p, "capture-" + provider);
assert.equal((await guest("orders/" + o.id)).payment_status, "test_paid");
await admin("admin/order", { id: o.id, status: "processing" });
await send("payment.captured", p, "capture-" + provider);
await send("payment.captured", p, "redelivery-" + provider);
await send("payment.failed", { ...p, status: "failed" }, "failed-" + provider);
const after = await guest("orders/" + o.id);
assert.equal(after.payment_status, "test_paid");
assert.equal(after.status, "processing");
console.log(
  "PASS synthetic webhooks: bad signature and wrong amount rejected; valid capture marked TEST paid; duplicate capture and late failure preserved paid fulfillment state. No real provider or money involved.",
);
