import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
const base = process.env.TEST_BASE_URL || "http://localhost:5173";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base))
  throw Error("Journey tests are restricted to a local development database.");
const env = Object.fromEntries(
  fs
    .readFileSync(".dev.vars", "utf8")
    .split("\n")
    .filter((x) => x.includes("="))
    .map((x) => [x.slice(0, x.indexOf("=")), x.slice(x.indexOf("=") + 1)]),
);
function client() {
  let jar = {};
  return async (path, body, expected = 200) => {
    const r = await fetch(base + "/api/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: Object.entries(jar)
          .map(([k, v]) => k + "=" + v)
          .join("; "),
        Origin: base,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const c of r.headers.getSetCookie()) {
      const [k, v] = c.split(";")[0].split("=");
      jar[k] = v;
    }
    const data = await r.json();
    assert.equal(r.status, expected, `${path}: ${JSON.stringify(data)}`);
    return data;
  };
}
const admin = client(),
  customer = client(),
  guest = client(),
  outsider = client();
let count = 0;
const pass = (s) => {
  count++;
  console.log("PASS " + s);
};
const store = await guest("store");
assert.equal(store.products.length, 12);
assert.ok(store.products.every((x) => x.sample === 1));
pass("Twelve clearly labelled persistent sample products");
await guest("admin", undefined, 401);
await guest("account", undefined, 401);
pass("Anonymous account and admin access rejected");
const qaFile = new URL(
  "../.sites-runtime/qa-credentials.json",
  import.meta.url,
);
let qa;
fs.mkdirSync(new URL("../.sites-runtime/", import.meta.url), {
  recursive: true,
});
if (fs.existsSync(qaFile)) qa = JSON.parse(fs.readFileSync(qaFile));
else {
  qa = {
    email: "admin@banashree.test",
    name: "Local QA Admin",
    password: crypto.randomBytes(22).toString("base64url"),
  };
  fs.writeFileSync(qaFile, JSON.stringify(qa));
}
let setup;
try {
  setup = await admin("auth/setup", { ...qa, token: env.ADMIN_SETUP_TOKEN });
} catch (e) {
  await admin("auth/login", qa);
}
assert.equal((await admin("admin")).user.role, "admin");
pass("Secure first administrator setup / login");
const email = "qa-" + Date.now() + "@example.test";
await customer("auth/register", {
  name: "Test Shopper",
  email,
  password: "SamplePassword-OnlyForLocalQA!",
});
await customer("admin", undefined, 403);
await customer(
  "admin/variant",
  { id: "vp1", product_id: "p1", stock: 900, color: "Rose", sku: "DEMO-p1" },
  403,
);
pass("Customer registration and role-based admin rejection");
await customer("profile", { name: "Updated Test Shopper" });
await customer("wishlist", { productId: "p1" });
const address = {
  name: "Test Shopper",
  phone: "9000000000",
  line1: "123 Demo Street",
  line2: "Test address only",
  city: "Bangalore",
  state: "Karnataka",
  pincode: "560001",
};
await customer("addresses", address);
let account = await customer("account");
assert.equal(account.user.name, "Updated Test Shopper");
assert.ok(account.wishlist.includes("p1"));
assert.equal(account.addresses.length, 1);
pass("Profile, wishlist and address persistence");
await customer("cart", { variantId: "vp1", quantity: 1, service: true });
await customer("cart", {
  variantId: "vp1",
  quantity: 2,
  service: true,
  replace: true,
});
let bag = await customer("cart");
assert.equal(bag.items[0].quantity, 2);
await customer("checkout/quote", { coupon: "NOT-VALID" }, 400);
const quote = await customer("checkout/quote", { coupon: "WELCOME10" });
assert.equal(quote.subtotal, 1400000);
assert.equal(quote.discount, 140000);
assert.equal(quote.total, 1260000);
pass("Cart editing, finishing service, invalid coupon and server totals");
const key = crypto.randomUUID();
const payload = {
  email,
  address,
  payment: "demo",
  coupon: "WELCOME10",
  idempotencyKey: key,
  total: 1,
};
const [a, b] = await Promise.all([
  customer("checkout", payload),
  customer("checkout", { ...payload, idempotencyKey: crypto.randomUUID() }),
]);
assert.equal(a.id, b.id);
assert.equal((await customer("checkout", payload)).id, a.id);
let order = await customer("orders/" + a.id);
assert.equal(order.total, 1260000);
assert.equal(order.payment_status, "demo_unpaid");
assert.equal(order.test, 1);
assert.equal((await customer("cart")).items.length, 0);
await outsider("orders/" + a.id, undefined, 404);
pass(
  "Atomic checkout, price-tampering ignored, duplicate submissions and order privacy",
);
assert.ok((await customer("account")).orders.some((x) => x.id === a.id));
await admin("admin/order", { id: a.id, status: "delivered" }, 400);
await admin("admin/order", { id: a.id, status: "processing" });
await admin("admin/order", {
  id: a.id,
  status: "shipped",
  carrier: "Demo Courier",
  tracking: "TEST123",
});
await admin("admin/order", { id: a.id, status: "delivered" });
await customer("orders/action", {
  id: a.id,
  action: "return",
  reason: "Sample return journey verification",
});
assert.equal((await customer("orders/" + a.id)).status, "return_requested");
await admin("admin/order", { id: a.id, status: "return_approved" });
pass("Order history, valid fulfillment transitions, tracking and returns");
const out = store.products.find((p) => !p.variants[0].stock);
await guest("cart", { variantId: out.variants[0].id, quantity: 1 }, 409);
await guest("cart", { variantId: "vp2", quantity: -1 }, 400);
pass("Out-of-stock and invalid quantity rejected");
const original = store.products.find((p) => p.id === "p2").variants[0].stock;
await guest("cart", { variantId: "vp2", quantity: 1 });
await admin("admin/variant", {
  id: "vp2",
  product_id: "p2",
  color: "Emerald",
  sku: "DEMO-p2",
  stock: 0,
});
await guest(
  "checkout",
  {
    email: "guest@example.test",
    address,
    payment: "demo",
    idempotencyKey: crypto.randomUUID(),
  },
  409,
);
await admin("admin/variant", {
  id: "vp2",
  product_id: "p2",
  color: "Emerald",
  sku: "DEMO-p2",
  stock: original,
});
const g = await guest("checkout", {
  email: "guest@example.test",
  address,
  payment: "demo",
  idempotencyKey: crypto.randomUUID(),
});
await guest("orders/action", { id: g.id, action: "cancel" });
await guest("orders/action", { id: g.id, action: "cancel" }, 400);
assert.equal(
  (await guest("store")).products.find((p) => p.id === "p2").variants[0].stock,
  original,
);
pass(
  "Stock conflict, guest checkout, cancellation and exactly-once stock restoration",
);
const cfg = (await admin("admin")).settings;
await admin("admin/settings", {
  ...cfg,
  taxPercent: 5,
  shipping: 19900,
  freeShipping: 100000000,
  cod: true,
});
await guest("cart", { variantId: "vp3", quantity: 1 });
const tax = await guest("checkout/quote", {});
assert.equal(tax.shipping, 19900);
assert.equal(tax.tax, 19750);
const cod = await guest("checkout", {
  email: "guest@example.test",
  address,
  payment: "cod",
  idempotencyKey: crypto.randomUUID(),
});
assert.equal((await guest("orders/" + cod.id)).payment_status, "cod_due");
await admin("admin/settings", cfg);
pass("Shipping, configurable taxes and COD");
await admin("admin/coupon", {
  code: "QA20",
  percent: 20,
  minimum: 0,
  max_uses: 5,
  expires: Date.now() + 86400000,
  active: 1,
});
await admin(
  "admin/coupon",
  {
    code: "BAD",
    percent: 101,
    minimum: 0,
    max_uses: 5,
    expires: Date.now() + 86400000,
    active: 1,
  },
  400,
);
const ps = (await admin("admin")).products[0];
await admin("admin/product", { ...ps, name: ps.name + " QA" });
await admin("admin/product", ps);
const newVariant = {
  product_id: ps.id,
  color: "QA Ivory",
  sku: "QA-" + Date.now(),
  stock: 1,
};
await admin("admin/variant", newVariant);
pass("Admin product, variant, inventory and coupon actions");
await customer("contact", {
  name: "Test Shopper",
  email,
  message: "This is a local test enquiry only.",
});
assert.ok((await admin("admin")).messages.some((x) => x.email === email));
await customer("auth/forgot", { email }, 503);
await guest("payment/webhook", { event: "payment.captured" }, 400);
await guest("payment/start", { id: g.id }, 400);
pass(
  "Enquiry persistence, honest email-disabled state, forged payment rejection",
);
const response = await fetch(base + "/api/contact", {
  method: "POST",
  headers: {
    Origin: "https://evil.example",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Attack",
    email: "test@example.test",
    message: "forged request",
  }),
});
assert.equal(response.status, 403);
pass("Cross-origin mutation rejected");
await customer("auth/logout", {});
await customer("account", undefined, 401);
await customer("auth/login", {
  email,
  password: "SamplePassword-OnlyForLocalQA!",
});
assert.equal((await customer("account")).user.email, email);
pass("Logout invalidates session and login restores account");
console.log(
  `\n${count} journey groups passed. External Razorpay/email credentials were not used.`,
);
