import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    fabric: text("fabric").notNull(),
    occasion: text("occasion").notNull(),
    weave: text("weave").notNull(),
    collections: text("collections").notNull(),
    images: text("images").notNull(),
    price: integer("price").notNull(),
    length: text("length").notNull(),
    blouse: text("blouse").notNull(),
    care: text("care").notNull(),
    fallPico: integer("fall_pico").notNull().default(0),
    active: integer("active").notNull().default(1),
    sample: integer("sample").notNull().default(1),
    featured: integer("featured").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [check("product_price_positive", sql`${t.price}>0`)],
);
export const variants = sqliteTable(
  "variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    color: text("color").notNull(),
    sku: text("sku").notNull().unique(),
    stock: integer("stock").notNull(),
  },
  (t) => [
    index("idx_variants_product").on(t.productId),
    check("stock_nonnegative", sql`${t.stock}>=0`),
  ],
);
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  createdAt: integer("created_at").notNull(),
});
export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expires: integer("expires").notNull(),
});
export const resets = sqliteTable("password_resets", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expires: integer("expires").notNull(),
});
export const addresses = sqliteTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    data: text("data").notNull(),
  },
  (t) => [index("idx_addresses_user").on(t.userId)],
);
export const wishlist = sqliteTable(
  "wishlist",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
  },
  (t) => [uniqueIndex("idx_wishlist_unique").on(t.userId, t.productId)],
);
export const carts = sqliteTable("carts", {
  id: text("id").primaryKey(),
  revision: text("revision").notNull().default(""),
  userId: text("user_id"),
  createdAt: integer("created_at").notNull(),
});
export const cartItems = sqliteTable(
  "cart_items",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id),
    variantId: text("variant_id")
      .notNull()
      .references(() => variants.id),
    quantity: integer("quantity").notNull(),
    service: integer("service").notNull().default(0),
  },
  (t) => [
    uniqueIndex("idx_cart_item_unique").on(t.cartId, t.variantId, t.service),
    check("cart_quantity_valid", sql`${t.quantity}>0 AND ${t.quantity}<=10`),
  ],
);
export const coupons = sqliteTable(
  "coupons",
  {
    code: text("code").primaryKey(),
    percent: integer("percent").notNull(),
    minimum: integer("minimum").notNull().default(0),
    maxUses: integer("max_uses").notNull(),
    used: integer("used").notNull().default(0),
    expires: integer("expires").notNull(),
    active: integer("active").notNull().default(1),
  },
  (t) => [
    check("coupon_percent_valid", sql`${t.percent}>0 AND ${t.percent}<=100`),
    check("coupon_usage_valid", sql`${t.used}<=${t.maxUses}`),
  ],
);
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id").notNull(),
    userId: text("user_id"),
    email: text("email").notNull(),
    address: text("address").notNull(),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull(),
    shipping: integer("shipping").notNull(),
    tax: integer("tax").notNull(),
    total: integer("total").notNull(),
    coupon: text("coupon"),
    status: text("status").notNull(),
    paymentStatus: text("payment_status").notNull(),
    paymentMethod: text("payment_method").notNull(),
    test: integer("test").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    cartRevision: text("cart_revision").unique(),
    razorpayOrderId: text("razorpay_order_id").unique(),
    paymentId: text("payment_id").unique(),
    tracking: text("tracking"),
    carrier: text("carrier"),
    returnReason: text("return_reason"),
    emailStatus: text("email_status").notNull().default("unconfigured"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_orders_user_date").on(t.userId, t.createdAt)],
);
export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    variantId: text("variant_id")
      .notNull()
      .references(() => variants.id),
    name: text("name").notNull(),
    color: text("color").notNull(),
    price: integer("price").notNull(),
    quantity: integer("quantity").notNull(),
    service: integer("service").notNull(),
    image: text("image").notNull(),
  },
  (t) => [index("idx_order_items_order").on(t.orderId)],
);
export const events = sqliteTable("payment_events", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at").notNull(),
});
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expires: integer("expires").notNull(),
});
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at").notNull(),
});
export const audit = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  createdAt: integer("created_at").notNull(),
});
