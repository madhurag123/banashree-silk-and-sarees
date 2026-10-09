import { env } from "cloudflare:workers";
import { samples, defaults, sampleVariants } from "./catalog";
export const config = () => env as any;
export const db = () => {
  if (!config().DB)
    throw new Error("The store database is unavailable. Please try again.");
  return config().DB as D1Database;
};
export const now = () => Date.now();
export const uid = () => crypto.randomUUID();
export const q = (sql: string, ...args: any[]) =>
  db()
    .prepare(sql)
    .bind(...args);
export const all = async (sql: string, ...args: any[]) =>
  (await q(sql, ...args).all()).results as any[];
export const one = async (sql: string, ...args: any[]) =>
  (await q(sql, ...args).first()) as any;
let seeded: Promise<void> | undefined;
export function seed() {
  return (seeded ??= (async () => {
    const marker = await one("SELECT value FROM settings WHERE key='seeded'");
    if (marker) return;
    const statements: any[] = [];
    for (const p of samples) {
      statements.push(
        q(
          `INSERT OR IGNORE INTO products(id,slug,name,description,fabric,occasion,weave,collections,images,price,length,blouse,care,fall_pico,featured,active,sample,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,1,?)`,
          p.id,
          p.slug,
          p.name,
          p.description,
          p.fabric,
          p.occasion,
          p.weave,
          p.collections,
          p.images,
          p.price,
          p.length,
          p.blouse,
          p.care,
          p.fall_pico,
          p.featured,
          now(),
        ),
      );
      for (const v of sampleVariants(p)) {
        statements.push(q(
          "INSERT OR IGNORE INTO variants(id,product_id,color,sku,stock,image) VALUES(?,?,?,?,?,?)",
          v.id, p.id, v.color, v.sku, v.stock, v.image,
        ));
      }
    }
    statements.push(
      q(
        "INSERT OR IGNORE INTO settings(key,value) VALUES('store',?)",
        JSON.stringify(defaults),
      ),
      q(
        "INSERT OR IGNORE INTO coupons(code,percent,minimum,max_uses,used,expires,active) VALUES('WELCOME10',10,200000,1000,0,?,1)",
        now() + 365 * 86400000,
      ),
      q("INSERT OR IGNORE INTO settings(key,value) VALUES('seeded','1')"),
    );
    await db().batch(statements);
  })().catch((e) => {
    seeded = undefined;
    throw e;
  }));
}
export async function settings() {
  const row = await one("SELECT value FROM settings WHERE key='store'");
  return { ...defaults, ...JSON.parse(row?.value || "{}") };
}
export async function products() {
  const ps = await all(
    "SELECT * FROM products WHERE active=1 ORDER BY created_at DESC,id",
  );
  const vs = await all("SELECT * FROM variants");
  return ps.map((p) => ({
    ...p,
    // Keep previously seeded catalogue copy aligned with the current brand.
    description: p.description.replaceAll("BANAshree", "Banashree"),
    images: JSON.parse(p.images),
    collections: p.collections.split(","),
    variants: vs.filter((v) => v.product_id === p.id),
  }));
}
export async function hash(value: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function passwordHash(password: string, salt = uid()) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const data = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return (
    salt +
    ":" +
    [...new Uint8Array(data)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}
export const equal = (a: string, b: string) => {
  let v = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    v |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return v === 0;
};
export async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return [
    ...new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export function cookie(req: Request, name: string) {
  return (
    req.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(name + "="))
      ?.slice(name.length + 1) || ""
  );
}
export function setCookie(
  req: Request,
  name: string,
  value: string,
  age = 604800,
) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`;
}
export async function user(req: Request) {
  const token = cookie(req, "bs_session");
  return token
    ? one(
        "SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?",
        await hash(token),
        now(),
      )
    : null;
}
export function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
export async function requireUser(req: Request, role?: string) {
  const u = await user(req);
  if (!u) fail("Please sign in to continue.", 401);
  if (
    role &&
    !(role === "staff" ? ["admin", "staff"].includes(u.role) : u.role === role)
  )
    fail("You do not have permission for this action.", 403);
  return u;
}
export async function limit(req: Request, scope: string, max = 12) {
  const key =
    scope + ":" + (await hash(req.headers.get("cf-connecting-ip") || "local"));
  await q(
    "INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<? THEN excluded.expires ELSE expires END",
    key,
    now() + 900000,
    now(),
    now(),
  ).run();
  const r = await one("SELECT count FROM rate_limits WHERE key=?", key);
  if (r.count > max)
    fail("Too many attempts. Please try again in 15 minutes.", 429);
}
export async function cart(req: Request, create = false) {
  let id = cookie(req, "bs_cart");
  let row = id && (await one("SELECT * FROM carts WHERE id=?", id));
  let fresh = false;
  if (!row && create) {
    id = uid() + uid();
    const u = await user(req);
    await q(
      "INSERT INTO carts(id,revision,user_id,created_at) VALUES(?,?,?,?)",
      id,
      uid(),
      u?.id || null,
      now(),
    ).run();
    row = { id };
    fresh = true;
  }
  const items = row
    ? await all(
        "SELECT ci.*,v.color,v.stock,v.image AS variant_image,v.product_id,p.name,p.slug,p.price,p.fall_pico,p.images,p.active FROM cart_items ci JOIN variants v ON v.id=ci.variant_id JOIN products p ON p.id=v.product_id WHERE ci.cart_id=?",
        id,
      )
    : [];
  return {
    id: row ? id : null,
    revision: row?.revision,
    items: items.map((p) => ({ ...p, images: p.variant_image ? [p.variant_image] : JSON.parse(p.images) })),
    fresh,
  };
}
export async function quote(req: Request, code = "") {
  const c = await cart(req);
  if (!c.items.length) fail("Your bag is empty.");
  let subtotal = 0;
  for (const x of c.items) {
    if (!x.active || x.stock < x.quantity)
      fail(
        `${x.name} no longer has enough stock. Please update your bag.`,
        409,
      );
    if (x.service && !x.fall_pico)
      fail("This finishing service is no longer offered.", 409);
    subtotal += (x.price + (x.service ? x.fall_pico : 0)) * x.quantity;
  }
  const s = await settings();
  let discount = 0;
  let coupon = null;
  if (code) {
    coupon = await one(
      "SELECT * FROM coupons WHERE code=? AND active=1 AND expires>? AND used<max_uses",
      code.trim().toUpperCase(),
      now(),
    );
    if (!coupon || subtotal < coupon.minimum)
      fail("This coupon is unavailable or the minimum spend has not been met.");
    discount = Math.floor((subtotal * coupon.percent) / 100);
  }
  const shipping = subtotal - discount >= s.freeShipping ? 0 : s.shipping;
  const tax = Math.round(((subtotal - discount) * s.taxPercent) / 100);
  return {
    cart: c,
    subtotal,
    discount,
    shipping,
    tax,
    total: subtotal - discount + shipping + tax,
    coupon: coupon?.code || null,
    couponPercent: coupon?.percent || 0,
    settings: s,
  };
}
export async function email(
  to: string,
  subject: string,
  text: string,
  key: string,
) {
  const e = config();
  if (!e.RESEND_API_KEY || !e.EMAIL_FROM) return "unconfigured";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${e.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      },
      body: JSON.stringify({ from: e.EMAIL_FROM, to: [to], subject, text }),
    });
    return r.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
export async function orderEmail(id: string) {
  const o = await one("SELECT * FROM orders WHERE id=?", id);
  const status = await email(
    o.email,
    `${o.test ? "TEST — " : ""}Banashree order ${id}`,
    `${o.test ? "TEST ORDER: no live payment has been confirmed.\n" : ""}Order ${id}\nStatus: ${o.status}\nPayment: ${o.payment_status}\nTotal: INR ${(o.total / 100).toFixed(2)}\nSign in to your account or return to the same browser to track this order.`,
    id +
      "-" +
      o.payment_status +
      "-" +
      o.status +
      "-" +
      (await hash(o.tracking || "")),
  );
  await q("UPDATE orders SET email_status=? WHERE id=?", status, id).run();
}
export async function razor(path: string, body?: any) {
  const e = config();
  if (!e.RAZORPAY_KEY_ID || !e.RAZORPAY_KEY_SECRET)
    fail("Razorpay is not configured. Contact the store.", 503);
  const res = await fetch("https://api.razorpay.com/v1/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization:
        "Basic " + btoa(e.RAZORPAY_KEY_ID + ":" + e.RAZORPAY_KEY_SECRET),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok)
    fail(
      "The payment provider is unavailable. Your payment is not confirmed.",
      502,
    );
  return res.json() as Promise<any>;
}
export async function ownedOrder(req: Request, id: string) {
  const o = await one("SELECT * FROM orders WHERE id=?", id);
  const u = await user(req);
  if (
    !o ||
    !(
      (u && o.user_id === u.id) ||
      cookie(req, "bs_cart") === o.cart_id ||
      (u && ["admin", "staff"].includes(u.role))
    )
  )
    fail("Order not found.", 404);
  return o;
}
