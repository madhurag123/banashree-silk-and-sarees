import { z } from "zod";
import {
  db,
  q,
  all,
  one,
  seed,
  settings,
  products,
  config,
  now,
  uid,
  hash,
  passwordHash,
  equal,
  hmac,
  cookie,
  setCookie,
  user,
  requireUser,
  fail,
  limit,
  cart,
  quote,
  email,
  orderEmail,
  razor,
  ownedOrder,
} from "@/lib/server";
const addr = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  line1: z.string().trim().min(5).max(250),
  line2: z.string().max(250).optional().default(""),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code."),
});
const credentials = z.object({
  email: z
    .string()
    .email()
    .max(200)
    .transform((x) => x.toLowerCase().trim()),
  password: z.string().min(12).max(128),
});
const result = (data: any, status = 200, headers: any = {}) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
async function login(req: Request, u: any) {
  const token = uid() + uid();
  await q(
    "INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)",
    await hash(token),
    u.id,
    now() + 7 * 86400000,
  ).run();
  return result(
    { user: { id: u.id, email: u.email, name: u.name, role: u.role } },
    200,
    { "Set-Cookie": setCookie(req, "bs_session", token) },
  );
}
async function settled(o: any, p: any) {
  if (
    p.order_id !== o.razorpay_order_id ||
    p.amount !== o.total ||
    p.currency !== "INR" ||
    p.status !== "captured"
  )
    fail("Payment is not captured or does not match this order.", 409);
  if (
    ["paid", "test_paid", "refunded"].includes(o.payment_status) &&
    o.payment_id === p.id
  )
    return;
  if (!["awaiting_payment", "payment_failed", "confirmed"].includes(o.status))
    fail("Order requires manual payment reconciliation.", 409);
  await q(
    "UPDATE orders SET payment_status=?,payment_id=?,status='confirmed' WHERE id=? AND payment_status NOT IN ('paid','test_paid','refunded')",
    o.test ? "test_paid" : "paid",
    p.id,
    o.id,
  ).run();
  await orderEmail(o.id);
}
async function handler(req: Request) {
  try {
    await seed();
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\//, "");
    const method = req.method;
    if (method !== "GET" && path !== "payment/webhook") {
      const origin = req.headers.get("origin");
      if (origin && origin !== url.origin)
        fail("Request origin is not allowed.", 403);
      if (req.headers.get("sec-fetch-site") === "cross-site")
        fail("Request origin is not allowed.", 403);
    }
    if (Number(req.headers.get("content-length") || 0) > 1000000)
      fail("Request is too large.", 413);
    const raw = method === "GET" ? "" : await req.text();
    if (raw.length > 1000000) fail("Request is too large.", 413);
    let b: any = {};
    if (raw && path !== "payment/webhook") {
      try {
        b = JSON.parse(raw);
      } catch {
        fail("Invalid request body.");
      }
    }
    if (method === "GET") {
      if (path === "store") {
        const s = await settings();
        return result({
          products: await products(),
          settings: s,
          user: await user(req),
          paymentConfigured: !!(
            config().RAZORPAY_KEY_ID && config().RAZORPAY_KEY_SECRET
          ),
          emailConfigured: !!(config().RESEND_API_KEY && config().EMAIL_FROM),
        });
      }
      if (path === "cart") {
        return result(await cart(req));
      }
      if (path === "account") {
        const u = await requireUser(req);
        return result({
          user: u,
          addresses: (
            await all("SELECT * FROM addresses WHERE user_id=?", u.id)
          ).map((x) => ({ ...x, data: JSON.parse(x.data) })),
          wishlist: (
            await all("SELECT product_id FROM wishlist WHERE user_id=?", u.id)
          ).map((x) => x.product_id),
          orders: await all(
            "SELECT id,total,status,payment_status,created_at,test,tracking,carrier,return_reason FROM orders WHERE user_id=? ORDER BY created_at DESC",
            u.id,
          ),
        });
      }
      if (path.startsWith("orders/")) {
        const o = await ownedOrder(req, path.split("/")[1]);
        return result({
          ...o,
          address: JSON.parse(o.address),
          items: await all("SELECT * FROM order_items WHERE order_id=?", o.id),
        });
      }
      if (path === "admin") {
        const u = await requireUser(req, "staff");
        const ps = await all("SELECT * FROM products ORDER BY created_at DESC");
        return result({
          user: u,
          products: ps.map((x) => ({
            ...x,
            description: x.description.replaceAll("BANAshree", "Banashree"),
            images: JSON.parse(x.images),
            collections: x.collections.split(","),
          })),
          variants: await all("SELECT * FROM variants"),
          orders: await all(
            "SELECT * FROM orders ORDER BY created_at DESC LIMIT 250",
          ),
          coupons: await all("SELECT * FROM coupons"),
          settings: await settings(),
          users:
            u.role === "admin"
              ? await all("SELECT id,name,email,role FROM users")
              : [],
          messages: await all(
            "SELECT * FROM messages ORDER BY created_at DESC LIMIT 100",
          ),
          summary: await one(
            "SELECT COUNT(*) AS orders,COALESCE(SUM(CASE WHEN test=0 AND payment_status='paid' THEN total ELSE 0 END),0) AS sales,SUM(CASE WHEN test=1 THEN 1 ELSE 0 END) AS test_orders FROM orders",
          ),
          audit:
            u.role === "admin"
              ? await all(
                  "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 30",
                )
              : [],
        });
      }
      fail("Page not found.", 404);
    }
    if (path === "auth/register") {
      await limit(req, "auth");
      const c = credentials
        .extend({ name: z.string().min(2).max(100) })
        .parse(b);
      if (await one("SELECT id FROM users WHERE email=?", c.email))
        fail(
          "An account could not be created with these details. Try signing in.",
        );
      const u = { id: uid(), email: c.email, name: c.name, role: "customer" };
      await q(
        "INSERT INTO users(id,email,name,password,role,created_at) VALUES(?,?,?,?,?,?)",
        u.id,
        u.email,
        u.name,
        await passwordHash(c.password),
        u.role,
        now(),
      ).run();
      return login(req, u);
    }
    if (path === "auth/setup") {
      await limit(req, "setup", 5);
      const c = credentials
        .extend({ name: z.string().min(2).max(100), token: z.string().min(20) })
        .parse(b);
      if (
        !config().ADMIN_SETUP_TOKEN ||
        !equal(c.token, config().ADMIN_SETUP_TOKEN)
      )
        fail("The setup key is invalid or setup is disabled.", 403);
      const u = { id: uid(), email: c.email, name: c.name, role: "admin" };
      await db().batch([
        q("INSERT INTO settings(key,value) VALUES('admin_initialized','1')"),
        q(
          "INSERT INTO users(id,email,name,password,role,created_at) VALUES(?,?,?,?,?,?)",
          u.id,
          u.email,
          u.name,
          await passwordHash(c.password),
          u.role,
          now(),
        ),
      ]);
      return login(req, u);
    }
    if (path === "auth/login") {
      await limit(req, "auth", 20);
      const c = credentials.parse(b);
      const u = await one("SELECT * FROM users WHERE email=?", c.email);
      const actual = await passwordHash(
        c.password,
        u?.password?.split(":")[0] || "dummy-salt",
      );
      if (!u || !equal(actual, u.password))
        fail("Email or password is incorrect.", 401);
      return login(req, u);
    }
    if (path === "auth/logout") {
      await q(
        "DELETE FROM sessions WHERE token=?",
        await hash(cookie(req, "bs_session")),
      ).run();
      return result({ ok: true }, 200, {
        "Set-Cookie": setCookie(req, "bs_session", "", 0),
      });
    }
    if (path === "auth/forgot") {
      await limit(req, "reset", 5);
      const em = z.string().email().parse(b.email).toLowerCase();
      if (!config().RESEND_API_KEY || !config().EMAIL_FROM)
        fail(
          "Password reset email is not configured. Please contact the store.",
          503,
        );
      const u = await one("SELECT id FROM users WHERE email=?", em);
      if (u) {
        const token = uid() + uid();
        await q(
          "INSERT INTO password_resets(token,user_id,expires) VALUES(?,?,?)",
          await hash(token),
          u.id,
          now() + 1800000,
        ).run();
        const origin = config().APP_URL;
        if (!origin) fail("The store email link is not configured.", 503);
        await email(
          em,
          "Reset your Banashree password",
          `Open ${origin}/reset?token=${token} within 30 minutes. Ignore this email if you did not request it.`,
          "reset-" + (await hash(token)),
        );
      }
      return result({
        message: "If this account exists, a reset link has been sent.",
      });
    }
    if (path === "auth/reset") {
      await limit(req, "reset", 5);
      const c = z
        .object({
          token: z.string().min(30),
          password: z.string().min(12).max(128),
        })
        .parse(b);
      const r = await one(
        "SELECT * FROM password_resets WHERE token=? AND expires>?",
        await hash(c.token),
        now(),
      );
      if (!r) fail("This reset link has expired or was already used.");
      const newHash = await passwordHash(c.password);
      await db().batch([
        q(
          "UPDATE users SET password=? WHERE id=? AND EXISTS(SELECT 1 FROM password_resets WHERE token=? AND expires>?)",
          newHash,
          r.user_id,
          r.token,
          now(),
        ),
        q("DELETE FROM password_resets WHERE user_id=?", r.user_id),
        q("DELETE FROM sessions WHERE user_id=?", r.user_id),
      ]);
      return result({ message: "Password updated. Please sign in." });
    }
    if (path === "profile") {
      const u = await requireUser(req);
      const name = z.string().trim().min(2).max(100).parse(b.name);
      await q("UPDATE users SET name=? WHERE id=?", name, u.id).run();
      return result({ ok: true });
    }
    if (path === "addresses") {
      const u = await requireUser(req);
      if (b.delete) {
        await q(
          "DELETE FROM addresses WHERE id=? AND user_id=?",
          String(b.delete),
          u.id,
        ).run();
      } else {
        const a = addr.parse(b);
        await q(
          "INSERT INTO addresses(id,user_id,data) VALUES(?,?,?)",
          uid(),
          u.id,
          JSON.stringify(a),
        ).run();
      }
      return result({ ok: true });
    }
    if (path === "wishlist") {
      const u = await requireUser(req);
      const id = z.string().parse(b.productId);
      if (!(await one("SELECT id FROM products WHERE id=? AND active=1", id)))
        fail("Saree not found.", 404);
      if (b.remove)
        await q(
          "DELETE FROM wishlist WHERE user_id=? AND product_id=?",
          u.id,
          id,
        ).run();
      else
        await q(
          "INSERT OR IGNORE INTO wishlist(id,user_id,product_id) VALUES(?,?,?)",
          uid(),
          u.id,
          id,
        ).run();
      return result({ ok: true });
    }
    if (path === "cart") {
      const c = await cart(req, true);
      if (b.remove) {
        await db().batch([
          q(
            "DELETE FROM cart_items WHERE id=? AND cart_id=?",
            String(b.remove),
            c.id,
          ),
          q("UPDATE carts SET revision=? WHERE id=?", uid(), c.id),
        ]);
      } else {
        const v = z
          .object({
            variantId: z.string(),
            quantity: z.number().int().min(1).max(10),
            service: z.boolean().default(false),
            replace: z.boolean().optional(),
          })
          .parse(b);
        const item = await one(
          "SELECT v.*,p.active,p.fall_pico FROM variants v JOIN products p ON p.id=v.product_id WHERE v.id=?",
          v.variantId,
        );
        if (!item || !item.active) fail("This saree is unavailable.");
        if (v.service && !item.fall_pico)
          fail("Finishing is not available for this saree.");
        const existing = c.items.find(
          (x) =>
            x.variant_id === v.variantId && x.service === Number(v.service),
        );
        const quantity = v.replace
          ? v.quantity
          : v.quantity + (existing?.quantity || 0);
        if (quantity > item.stock || quantity > 10)
          fail("The requested quantity is not available.", 409);
        await db().batch([
          q(
            "INSERT INTO cart_items(id,cart_id,variant_id,quantity,service) VALUES(?,?,?,?,?) ON CONFLICT(cart_id,variant_id,service) DO UPDATE SET quantity=excluded.quantity",
            uid(),
            c.id,
            v.variantId,
            quantity,
            Number(v.service),
          ),
          q("UPDATE carts SET revision=? WHERE id=?", uid(), c.id),
        ]);
      }
      return result(
        { ok: true },
        200,
        c.fresh
          ? { "Set-Cookie": setCookie(req, "bs_cart", c.id!, 2592000) }
          : {},
      );
    }
    if (path === "checkout/quote") {
      const a = await quote(req, String(b.coupon || ""));
      return result({
        subtotal: a.subtotal,
        discount: a.discount,
        shipping: a.shipping,
        tax: a.tax,
        total: a.total,
        coupon: a.coupon,
      });
    }
    if (path === "checkout") {
      await limit(req, "checkout", 40);
      const v = z
        .object({
          email: z.string().email(),
          address: addr,
          coupon: z.string().max(40).optional(),
          payment: z.enum(["demo", "razorpay", "cod"]),
          idempotencyKey: z.string().uuid(),
        })
        .parse(b);
      const cid = cookie(req, "bs_cart");
      const key = await hash(cid + ":" + v.idempotencyKey);
      const old = await one(
        "SELECT id FROM orders WHERE idempotency_key=?",
        key,
      );
      if (old) return result({ id: old.id });
      const version = await one("SELECT revision FROM carts WHERE id=?", cid);
      const previous =
        version &&
        (await one(
          "SELECT id FROM orders WHERE cart_revision=?",
          version.revision,
        ));
      if (previous) return result({ id: previous.id });
      const a = await quote(req, v.coupon || "");
      const u = await user(req);
      const s = a.settings;
      const test = s.mode !== "live";
      if (v.payment === "demo" && s.mode !== "demo")
        fail("Demo checkout is not enabled.");
      if (v.payment === "cod" && !s.cod)
        fail("Cash on delivery is not available.");
      if (
        v.payment === "razorpay" &&
        (s.mode === "demo" ||
          !config().RAZORPAY_KEY_ID ||
          !config().RAZORPAY_KEY_SECRET)
      )
        fail(
          "Online payment is not configured. Use the clearly labeled demo option.",
        );
      if (
        v.payment === "razorpay" &&
        !test &&
        !config().RAZORPAY_KEY_ID.startsWith("rzp_live_")
      )
        fail("Live payment keys are required.");
      if (
        v.payment === "razorpay" &&
        test &&
        !config().RAZORPAY_KEY_ID.startsWith("rzp_test_")
      )
        fail("Test mode requires Razorpay test keys.");
      if (!test) {
        for (const item of a.cart.items) {
          const p = await one(
            "SELECT sample FROM products WHERE id=?",
            item.product_id,
          );
          if (p.sample)
            fail("Sample products cannot be purchased in live mode.");
        }
      }
      const id = "BS-" + uid().slice(0, 8).toUpperCase();
      const statements = [
        q(
          "INSERT INTO orders(id,cart_id,user_id,email,address,subtotal,discount,shipping,tax,total,coupon,status,payment_status,payment_method,test,idempotency_key,cart_revision,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM carts WHERE id=? AND revision=?)",
          id,
          a.cart.id,
          u?.id || null,
          v.email,
          JSON.stringify(v.address),
          a.subtotal,
          a.discount,
          a.shipping,
          a.tax,
          a.total,
          a.coupon,
          v.payment === "razorpay" ? "awaiting_payment" : "confirmed",
          v.payment === "demo"
            ? "demo_unpaid"
            : v.payment === "cod"
              ? "cod_due"
              : "unpaid",
          v.payment,
          Number(test),
          key,
          a.cart.revision,
          now(),
          a.cart.id,
          a.cart.revision,
        ),
      ];
      for (const item of a.cart.items) {
        statements.push(
          q(
            "UPDATE variants SET stock=CASE WHEN EXISTS(SELECT 1 FROM products WHERE id=? AND price=? AND fall_pico=? AND active=1) THEN stock-? ELSE -1 END WHERE id=?",
            item.product_id,
            item.price,
            item.fall_pico,
            item.quantity,
            item.variant_id,
          ),
          q(
            "INSERT INTO order_items(id,order_id,variant_id,name,color,price,quantity,service,image) VALUES(?,?,?,?,?,?,?,?,?)",
            uid(),
            id,
            item.variant_id,
            item.name,
            item.color,
            item.price,
            item.quantity,
            item.service ? item.fall_pico : 0,
            item.images[0],
          ),
        );
      }
      if (a.coupon)
        statements.push(
          q(
            "UPDATE coupons SET used=CASE WHEN active=1 AND expires>? AND percent=? THEN used+1 ELSE max_uses+1 END WHERE code=?",
            now(),
            a.couponPercent,
            a.coupon,
          ),
        );
      statements.push(q("DELETE FROM cart_items WHERE cart_id=?", a.cart.id));
      try {
        await db().batch(statements);
      } catch (e) {
        const existing = await one(
          "SELECT id FROM orders WHERE idempotency_key=? OR cart_revision=?",
          key,
          a.cart.revision,
        );
        if (existing) return result({ id: existing.id });
        fail(
          "Stock or coupon availability changed. Refresh your bag and try again.",
          409,
        );
      }
      await orderEmail(id);
      return result({ id });
    }
    if (path === "payment/start") {
      const o = await ownedOrder(req, z.string().parse(b.id));
      if (
        o.payment_method !== "razorpay" ||
        !["awaiting_payment", "payment_failed"].includes(o.status)
      )
        fail("This order cannot start a payment.");
      let r = o.razorpay_order_id
        ? await razor("orders/" + o.razorpay_order_id)
        : null;
      if (!r) {
        const lock = await q(
          "UPDATE orders SET status='payment_initializing' WHERE id=? AND status IN ('awaiting_payment','payment_failed') AND razorpay_order_id IS NULL",
          o.id,
        ).run();
        if (!lock.meta.changes)
          fail(
            "Payment setup is already in progress. Please refresh shortly.",
            409,
          );
        try {
          r = await razor("orders", {
            amount: o.total,
            currency: "INR",
            receipt: o.id,
            notes: { order_id: o.id },
          });
          await q(
            "UPDATE orders SET razorpay_order_id=?,status='awaiting_payment' WHERE id=?",
            r.id,
            o.id,
          ).run();
        } catch (e) {
          await q(
            "UPDATE orders SET status='payment_setup_uncertain' WHERE id=?",
            o.id,
          ).run();
          fail(
            "Payment setup could not be confirmed. Contact the store with your order number before retrying.",
            502,
          );
        }
      }
      return result({
        key: config().RAZORPAY_KEY_ID,
        order_id: r.id,
        amount: o.total,
        currency: "INR",
        test: !!o.test,
      });
    }
    if (path === "payment/verify") {
      const v = z
        .object({
          id: z.string(),
          razorpay_payment_id: z.string(),
          razorpay_signature: z.string(),
        })
        .parse(b);
      const o = await ownedOrder(req, v.id);
      if (
        !o.razorpay_order_id ||
        !equal(
          await hmac(
            config().RAZORPAY_KEY_SECRET || "",
            o.razorpay_order_id + "|" + v.razorpay_payment_id,
          ),
          v.razorpay_signature,
        )
      )
        fail("Payment verification failed.", 400);
      const p = await razor(
        "payments/" + encodeURIComponent(v.razorpay_payment_id),
      );
      await settled(o, p);
      return result({ ok: true, test: !!o.test });
    }
    if (path === "payment/webhook") {
      const secret = config().RAZORPAY_WEBHOOK_SECRET;
      if (
        !secret ||
        !equal(
          await hmac(secret, raw),
          req.headers.get("x-razorpay-signature") || "",
        )
      )
        fail("Invalid webhook signature.", 400);
      const event = JSON.parse(raw);
      const eventId =
        req.headers.get("x-razorpay-event-id") || (await hash(raw));
      if (await one("SELECT id FROM payment_events WHERE id=?", eventId))
        return result({ ok: true });
      const refund = event.payload?.refund?.entity;
      if (event.event === "refund.processed" && refund?.payment_id) {
        await q(
          "UPDATE orders SET status='refunded',payment_status='refunded' WHERE payment_id=? AND total=? AND status='refund_pending'",
          refund.payment_id,
          refund.amount,
        ).run();
      }
      const p = event.payload?.payment?.entity;
      const o =
        p?.order_id &&
        (await one(
          "SELECT * FROM orders WHERE razorpay_order_id=?",
          p.order_id,
        ));
      if (o && event.event === "payment.captured") await settled(o, p);
      if (o && event.event === "payment.failed")
        await q(
          "UPDATE orders SET status='payment_failed',payment_status='failed' WHERE id=? AND payment_status NOT IN ('paid','test_paid','refunded')",
          o.id,
        ).run();
      await q(
        "INSERT OR IGNORE INTO payment_events(id,created_at) VALUES(?,?)",
        eventId,
        now(),
      ).run();
      return result({ ok: true });
    }
    if (path === "orders/action") {
      const o = await ownedOrder(req, z.string().parse(b.id));
      if (b.action === "return") {
        const reason = z.string().trim().min(8).max(1000).parse(b.reason);
        if (o.status !== "delivered")
          fail("Returns can be requested after delivery.");
        await q(
          "UPDATE orders SET status='return_requested',return_reason=? WHERE id=? AND status='delivered'",
          reason,
          o.id,
        ).run();
      } else if (b.action === "cancel") {
        if (
          !["confirmed", "payment_failed", "awaiting_payment"].includes(
            o.status,
          ) ||
          ["paid", "test_paid"].includes(o.payment_status) ||
          o.payment_method === "razorpay"
        )
          fail(
            "Please contact the store to reconcile or refund this payment before cancellation.",
          );
        await cancelOrder(o);
      } else fail("Invalid action.");
      return result({ ok: true });
    }
    if (path === "contact") {
      await limit(req, "contact", 5);
      const c = z
        .object({
          name: z.string().min(2).max(100),
          email: z.string().email(),
          message: z.string().min(10).max(2000),
        })
        .parse(b);
      await q(
        "INSERT INTO messages(id,name,email,message,created_at) VALUES(?,?,?,?,?)",
        uid(),
        c.name,
        c.email,
        c.message,
        now(),
      ).run();
      return result({
        message: "Your message has been saved for the store team.",
      });
    }
    if (path.startsWith("admin/")) {
      const u = await requireUser(
        req,
        ["admin/order", "admin/email"].includes(path) ? "staff" : "admin",
      );
      if (path === "admin/product") {
        const p = z
          .object({
            id: z.string().optional(),
            slug: z
              .string()
              .regex(/^[a-z0-9-]+$/)
              .max(120),
            name: z.string().min(3).max(150),
            description: z.string().min(10).max(3000),
            fabric: z.string().min(2),
            occasion: z.string().min(2),
            weave: z.string().min(2),
            collections: z.array(z.string().min(1)).min(1),
            images: z
              .array(
                z
                  .string()
                  .refine(
                    (x) =>
                      /^\/images\/[a-zA-Z0-9_.-]+$/.test(x) ||
                      /^https:\/\//.test(x),
                    "Use a local image path or HTTPS image URL.",
                  ),
              )
              .min(1)
              .max(8),
            price: z.number().int().positive().max(100000000),
            length: z.string().min(2),
            blouse: z.string().min(2),
            care: z.string().min(2),
            fall_pico: z.number().int().min(0).max(1000000),
            active: z.number().int().min(0).max(1),
            sample: z.number().int().min(0).max(1),
            featured: z.number().int().min(0).max(1),
          })
          .parse(b);
        await q(
          "INSERT INTO products(id,slug,name,description,fabric,occasion,weave,collections,images,price,length,blouse,care,fall_pico,active,sample,featured,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,name=excluded.name,description=excluded.description,fabric=excluded.fabric,occasion=excluded.occasion,weave=excluded.weave,collections=excluded.collections,images=excluded.images,price=excluded.price,length=excluded.length,blouse=excluded.blouse,care=excluded.care,fall_pico=excluded.fall_pico,active=excluded.active,sample=excluded.sample,featured=excluded.featured",
          p.id || uid(),
          p.slug,
          p.name,
          p.description,
          p.fabric,
          p.occasion,
          p.weave,
          p.collections.join(","),
          JSON.stringify(p.images),
          p.price,
          p.length,
          p.blouse,
          p.care,
          p.fall_pico,
          p.active,
          p.sample,
          p.featured,
          now(),
        ).run();
      } else if (path === "admin/variant") {
        const v = z
          .object({
            id: z.string().optional(),
            product_id: z.string(),
            color: z.string().min(2).max(50),
            sku: z.string().min(2).max(60),
            image: z.string().refine((x) => x === "" || /^\/images\/[a-zA-Z0-9_.-]+$/.test(x) || /^https:\/\//.test(x), "Use a local image path or HTTPS image URL.").default(""),
            stock: z.number().int().min(0).max(100000),
          })
          .parse(b);
        await q(
          "INSERT INTO variants(id,product_id,color,sku,stock,image) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET color=excluded.color,sku=excluded.sku,stock=excluded.stock,image=excluded.image",
          v.id || uid(),
          v.product_id,
          v.color,
          v.sku,
          v.stock,
          v.image,
        ).run();
      } else if (path === "admin/coupon") {
        const c = z
          .object({
            code: z.string().regex(/^[A-Z0-9_-]{3,30}$/),
            percent: z.number().int().min(1).max(100),
            minimum: z.number().int().min(0),
            max_uses: z.number().int().positive(),
            expires: z.number().int().positive(),
            active: z.number().int().min(0).max(1),
          })
          .parse(b);
        await q(
          "INSERT INTO coupons(code,percent,minimum,max_uses,used,expires,active) VALUES(?,?,?,?,0,?,?) ON CONFLICT(code) DO UPDATE SET percent=excluded.percent,minimum=excluded.minimum,max_uses=excluded.max_uses,expires=excluded.expires,active=excluded.active",
          c.code,
          c.percent,
          c.minimum,
          c.max_uses,
          c.expires,
          c.active,
        ).run();
      } else if (path === "admin/settings") {
        const s = z
          .object({
            shipping: z.number().int().min(0).max(100000),
            freeShipping: z.number().int().min(0),
            taxPercent: z.number().min(0).max(40),
            cod: z.boolean(),
            mode: z.enum(["demo", "test", "live"]),
            deliveryMin: z.number().int().min(1).max(60),
            deliveryMax: z.number().int().min(1).max(90),
            phone: z.string().max(50),
            email: z.string().max(200),
            whatsapp: z.string().max(50),
            address: z.string().max(500),
            banner: z.string().min(4).max(200),
            bannerImage: z
              .string()
              .refine(
                (x) => x.startsWith("/images/") || x.startsWith("https://"),
              ),
          })
          .parse(b);
        if (s.deliveryMax < s.deliveryMin)
          fail("Maximum delivery days must be at least the minimum.");
        if (
          s.mode !== "demo" &&
          (!config().RAZORPAY_KEY_ID ||
            !config().RAZORPAY_KEY_SECRET ||
            !config().RAZORPAY_WEBHOOK_SECRET)
        )
          fail(
            "Configure the Razorpay keys and webhook secret before enabling payments.",
          );
        if (
          s.mode === "live" &&
          !config().RAZORPAY_KEY_ID.startsWith("rzp_live_")
        )
          fail("Live Razorpay keys are required.");
        if (
          s.mode === "test" &&
          !config().RAZORPAY_KEY_ID.startsWith("rzp_test_")
        )
          fail("Razorpay test keys are required.");
        await q(
          "UPDATE settings SET value=? WHERE key='store'",
          JSON.stringify(s),
        ).run();
      } else if (path === "admin/role") {
        const r = z
          .object({
            id: z.string(),
            role: z.enum(["admin", "staff", "customer"]),
          })
          .parse(b);
        if (r.id === u.id) fail("You cannot change your own role.");
        await q("UPDATE users SET role=? WHERE id=?", r.role, r.id).run();
      } else if (path === "admin/email") {
        await orderEmail(z.string().parse(b.id));
      } else if (path === "admin/order") {
        const o = await one(
          "SELECT * FROM orders WHERE id=?",
          z.string().parse(b.id),
        );
        if (!o) fail("Order not found.", 404);
        if (b.action === "reconcile") {
          const providerId = z
            .string()
            .regex(/^order_[a-zA-Z0-9]+$/)
            .parse(b.providerOrderId);
          if (
            o.payment_method !== "razorpay" ||
            (o.razorpay_order_id && o.razorpay_order_id !== providerId)
          )
            fail("Payment reference cannot be replaced.");
          const external = await razor("orders/" + providerId);
          if (
            external.receipt !== o.id ||
            external.amount !== o.total ||
            external.currency !== "INR"
          )
            fail("The provider order does not match this store order.");
          await q(
            "UPDATE orders SET razorpay_order_id=?,status='awaiting_payment' WHERE id=? AND payment_status NOT IN ('paid','test_paid','refunded')",
            providerId,
            o.id,
          ).run();
          const payments = await razor("orders/" + providerId + "/payments");
          const captured = payments.items?.find(
            (p: any) => p.status === "captured",
          );
          if (captured)
            await settled({ ...o, razorpay_order_id: providerId }, captured);
        } else if (b.action === "cod_paid") {
          if (o.payment_method !== "cod" || o.status !== "delivered")
            fail("Only delivered COD orders can be recorded as collected.");
          await q(
            "UPDATE orders SET payment_status=? WHERE id=?",
            o.test ? "test_paid" : "paid",
            o.id,
          ).run();
        } else if (b.action === "cancel") {
          if (
            ["paid", "test_paid"].includes(o.payment_status) ||
            o.payment_method === "razorpay"
          )
            fail("Online payments require reconciliation and refund first.");
          if (!["confirmed", "processing"].includes(o.status))
            fail("Order cannot be cancelled in this state.");
          await cancelOrder(o);
        } else if (b.action === "refund") {
          if (!["admin"].includes(u.role))
            fail("Administrator access is required.", 403);
          if (
            o.payment_method !== "razorpay" ||
            !o.payment_id ||
            !["paid", "test_paid"].includes(o.payment_status) ||
            !["return_requested", "return_approved"].includes(o.status)
          )
            fail("Only paid online return requests can be refunded.");
          const claimed = await q(
            "UPDATE orders SET status='refund_pending' WHERE id=? AND status IN ('return_requested','return_approved')",
            o.id,
          ).run();
          if (!claimed.meta.changes)
            fail("Refund is already being processed.", 409);
          const r = await razor("payments/" + o.payment_id + "/refund", {
            amount: o.total,
            receipt: o.id,
          });
          if (r.status === "processed")
            await q(
              "UPDATE orders SET payment_status='refunded',status='refunded' WHERE id=?",
              o.id,
            ).run();
        } else {
          const s = z
            .enum([
              "processing",
              "shipped",
              "delivered",
              "return_approved",
              "return_rejected",
            ])
            .parse(b.status);
          const allowed: any = {
            confirmed: ["processing"],
            processing: ["shipped"],
            shipped: ["delivered"],
            return_requested: ["return_approved", "return_rejected"],
          };
          if (!allowed[o.status]?.includes(s))
            fail("This status transition is not allowed.");
          if (
            ["processing", "shipped"].includes(s) &&
            o.payment_method === "razorpay" &&
            !["paid", "test_paid"].includes(o.payment_status)
          )
            fail("Payment must be captured before fulfillment.");
          if (s === "shipped" && (!b.tracking || !b.carrier))
            fail("Enter both a carrier and tracking number.");
          await q(
            "UPDATE orders SET status=?,tracking=?,carrier=? WHERE id=? AND status=?",
            s,
            String(b.tracking || o.tracking || "").slice(0, 120),
            String(b.carrier || o.carrier || "").slice(0, 100),
            o.id,
            o.status,
          ).run();
        }
        await orderEmail(o.id);
      } else fail("Unknown administration action.", 404);
      await q(
        "INSERT INTO audit_log(id,user_id,action,created_at) VALUES(?,?,?,?)",
        uid(),
        u.id,
        path + (b.id ? ":" + b.id : ""),
        now(),
      ).run();
      return result({ ok: true });
    }
    fail("Action not found.", 404);
  } catch (e: any) {
    if (e instanceof z.ZodError)
      return result(
        {
          error: e.issues
            .map((x) => `${x.path.join(".")}: ${x.message}`)
            .join("; "),
        },
        400,
      );
    if (e.status) return result({ error: e.message }, e.status);
    console.error("Store request failed:", e.message);
    return result(
      {
        error:
          "We could not complete this request. Please refresh and try again. If you already placed an order, check your orders before trying again.",
      },
      503,
    );
  }
}
async function cancelOrder(o: any) {
  const items = await all("SELECT * FROM order_items WHERE order_id=?", o.id);
  const stmts = items.map((x) =>
    q(
      "UPDATE variants SET stock=stock+? WHERE id=? AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status IN ('confirmed','processing','payment_failed','awaiting_payment'))",
      x.quantity,
      x.variant_id,
      o.id,
    ),
  );
  if (o.coupon)
    stmts.push(
      q(
        "UPDATE coupons SET used=MAX(0,used-1) WHERE code=? AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status IN ('confirmed','processing','payment_failed','awaiting_payment'))",
        o.coupon,
        o.id,
      ),
    );
  stmts.push(
    q(
      "UPDATE orders SET status='cancelled' WHERE id=? AND status IN ('confirmed','processing','payment_failed','awaiting_payment')",
      o.id,
    ),
  );
  await db().batch(stmts);
}
export const GET = handler;
export const POST = handler;
