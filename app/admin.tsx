"use client";
import { SiteLink } from "@/lib/pages-link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect as Select } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  Tag,
  Users,
  Mail,
  Plus,
  ArrowRight,
  LogOut,
} from "lucide-react";
import {
  useStore,
  api,
  AuthForm,
  Field,
  Choose,
  CheckField,
  Notice,
} from "./store";
import { money } from "@/lib/catalog";
const blank = {
  name: "",
  slug: "",
  description: "",
  fabric: "Silk",
  occasion: "Festive",
  weave: "Banarasi",
  collections: ["Silk"],
  images: ["/images/saree-emerald.jpg"],
  price: 100000,
  length: "5.5 metres",
  blouse: "0.8 metre unstitched blouse piece",
  care: "Dry clean recommended.",
  fall_pico: 0,
  active: 1,
  sample: 1,
  featured: 0,
};
export default function Admin() {
  const { user, loaded, act, setToast, reload } = useStore();
  const [d, setD] = useState<any>();
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [order, setOrder] = useState<any>();
  const [variant, setVariant] = useState<any>();
  const [coupon, setCoupon] = useState<any>();
  const [config, setConfig] = useState<any>();
  const [search, setSearch] = useState("");
  const load = async () => {
    try {
      const x = await api("admin");
      setD(x);
      setConfig(x.settings);
    } catch (e: any) {
      setError(e.message);
    }
  };
  useEffect(() => {
    if (user && user.role !== "customer") load();
  }, [user]);
  async function save(path: string, body: any) {
    setBusy(true);
    setError("");
    try {
      await api("admin/" + path, body);
      await load();
      await reload();
      setToast("Saved successfully");
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!loaded) return <div className="container">Opening administration…</div>;
  if (!user)
    return (
      <div className="container">
        <AuthForm admin />
      </div>
    );
  if (user.role === "customer")
    return (
      <div className="container">
        <Notice error>
          Administrator or staff access is required. Your account is a customer
          account.
        </Notice>
        <Button
          variant="outline"
          onClick={() => act("auth/logout", {}).catch(() => {})}
        >
          Sign out
        </Button>
      </div>
    );
  if (!d)
    return (
      <div className="container">
        {error ? <Notice error>{error}</Notice> : "Loading store data…"}
      </div>
    );
  const tabs: any[] = [
    ["overview", "Overview", LayoutDashboard],
    ["orders", "Orders", ShoppingBag],
    ...(user.role === "admin"
      ? [
          ["products", "Products", Package],
          ["coupons", "Coupons", Tag],
          ["settings", "Store settings", Settings],
          ["users", "Team & customers", Users],
        ]
      : []),
    ["messages", "Enquiries", Mail],
  ];
  return (
    <div className="admin-layout">
      <aside className="admin-nav">
        <div className="eyebrow">STORE STUDIO</div>
        <h2>Banashree silk and sarees</h2>
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            className={tab === id ? "selected" : ""}
            onClick={() => {
              setTab(id);
              setError("");
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
        <div className="admin-identity">
          <strong>{user.name}</strong>
          <span>{user.role}</span>
          <button onClick={() => act("auth/logout", {}).catch(() => {})}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-heading">
          <div>
            <div className="eyebrow">YOUR BOUTIQUE, AT A GLANCE</div>
            <h1>{tabs.find((t) => t[0] === tab)?.[1]}</h1>
          </div>
          <SiteLink className="text-link" href="/">
            View storefront <ArrowRight size={16} />
          </SiteLink>
        </div>
        {error && <Notice error>{error}</Notice>}
        {tab === "overview" && (
          <>
            <div className="stats">
              <div>
                <span>Live collected sales</span>
                <strong>{money(d.summary.sales || 0)}</strong>
                <small>Excludes test orders and refunds</small>
              </div>
              <div>
                <span>Total orders</span>
                <strong>{d.summary.orders}</strong>
                <small>{d.summary.test_orders || 0} test orders</small>
              </div>
              <div>
                <span>Low-stock variants</span>
                <strong>
                  {d.variants.filter((v: any) => v.stock <= 3).length}
                </strong>
                <small>3 or fewer available</small>
              </div>
              <div>
                <span>Active products</span>
                <strong>
                  {d.products.filter((p: any) => p.active).length}
                </strong>
                <small>
                  {d.products.filter((p: any) => p.sample).length} sample
                  listings
                </small>
              </div>
            </div>
            <div className="two-columns">
              <section className="admin-panel">
                <h2>Low-stock alerts</h2>
                {d.variants
                  .filter((v: any) => v.stock <= 3)
                  .map((v: any) => (
                    <div className="line-row" key={v.id}>
                      <div>
                        {
                          d.products.find((p: any) => p.id === v.product_id)
                            ?.name
                        }
                        <small>
                          {v.color} · {v.sku}
                        </small>
                      </div>
                      <strong>{v.stock} left</strong>
                    </div>
                  ))}
              </section>
              <section className="admin-panel">
                <h2>Store readiness</h2>
                <p>
                  <strong>Checkout:</strong> {d.settings.mode} mode
                </p>
                <p>
                  <strong>Payments:</strong>{" "}
                  {d.settings.mode === "demo"
                    ? "No live payments"
                    : "Razorpay " + d.settings.mode}
                </p>
                <p>
                  <strong>Policies:</strong> Drafts requiring business review
                </p>
                <p>
                  <strong>Contact:</strong> {d.settings.phone}
                </p>
                <p className="subtle">
                  Replace sample products and photography, complete contact
                  details, review policies, and configure live service
                  credentials before accepting real orders.
                </p>
              </section>
            </div>
            <section className="admin-panel">
              <h2>Recent activity</h2>
              {d.audit.length ? (
                d.audit.slice(0, 8).map((a: any) => (
                  <div className="line-row" key={a.id}>
                    <span>{a.action.replace("admin/", "")}</span>
                    <small>
                      {new Date(a.created_at).toLocaleString("en-IN")}
                    </small>
                  </div>
                ))
              ) : (
                <p className="subtle">
                  Administration changes will be recorded here.
                </p>
              )}
            </section>
          </>
        )}
        {tab === "products" && (
          <>
            <div className="admin-toolbar">
              <Field
                label="Search products"
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
              />
              <Button
                className="primary-button"
                onClick={() => setEdit({ ...blank })}
              >
                <Plus size={17} />
                Add saree
              </Button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Variants / stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {d.products
                    .filter((p: any) =>
                      p.name.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((p: any) => (
                      <tr key={p.id}>
                        <td>
                          <div className="table-product">
                            <img
                              src={p.images[0]}
                              width="45"
                              height="64"
                              alt=""
                            />
                            <div>
                              {p.name}
                              <small>
                                {p.sample ? "Sample · " : ""}
                                {p.fabric}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{money(p.price)}</td>
                        <td>
                          {d.variants
                            .filter((v: any) => v.product_id === p.id)
                            .map((v: any) => (
                              <button
                                className="variant-link"
                                key={v.id}
                                onClick={() => setVariant({ ...v })}
                              >
                                {v.color}: {v.stock}
                              </button>
                            ))}
                        </td>
                        <td>
                          <span className="pill">
                            {p.active ? "Active" : "Hidden"}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEdit({ ...p })}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setVariant({
                                product_id: p.id,
                                color: "",
                                sku: "",
                                stock: 0,
                              })
                            }
                          >
                            Add variant
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === "orders" && (
          <>
            <Field
              label="Search orders or email"
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
            />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Fulfillment</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {d.orders
                    .filter((o: any) =>
                      (o.id + " " + o.email)
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((o: any) => (
                      <tr key={o.id}>
                        <td>
                          {o.id}
                          <small>
                            {o.test ? "TEST ORDER" : ""}
                            <br />
                            {new Date(o.created_at).toLocaleDateString("en-IN")}
                          </small>
                        </td>
                        <td>{o.email}</td>
                        <td>{money(o.total)}</td>
                        <td>{o.payment_status.replaceAll("_", " ")}</td>
                        <td>{o.status.replaceAll("_", " ")}</td>
                        <td>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOrder({ ...o })}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!d.orders.length && (
                <p className="empty">
                  No orders yet. Place a demo order from the storefront to test
                  the flow.
                </p>
              )}
            </div>
          </>
        )}
        {tab === "coupons" && (
          <>
            <Button
              className="primary-button"
              onClick={() =>
                setCoupon({
                  code: "",
                  percent: 10,
                  minimum: 0,
                  max_uses: 100,
                  expires: Date.now() + 30 * 86400000,
                  active: 1,
                })
              }
            >
              <Plus size={17} />
              Add coupon
            </Button>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Minimum</th>
                    <th>Usage</th>
                    <th>Expires</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {d.coupons.map((c: any) => (
                    <tr key={c.code}>
                      <td>
                        {c.code} {!c.active && "(disabled)"}
                      </td>
                      <td>{c.percent}%</td>
                      <td>{money(c.minimum)}</td>
                      <td>
                        {c.used} / {c.max_uses}
                      </td>
                      <td>{new Date(c.expires).toLocaleDateString("en-IN")}</td>
                      <td>
                        <Button
                          variant="outline"
                          onClick={() => setCoupon({ ...c })}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === "settings" && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await save("settings", config);
            }}
          >
            <section className="admin-panel">
              <h2>Delivery & payment</h2>
              <div className="form-grid">
                <Choose
                  label="Checkout mode"
                  value={config.mode}
                  onChange={(e: any) =>
                    setConfig({ ...config, mode: e.target.value })
                  }
                >
                  <option value="demo">Demo — no payments</option>
                  <option value="test">Razorpay test mode</option>
                  <option value="live">Live payments</option>
                </Choose>
                {[
                  ["shipping", "Shipping charge (₹)", 100],
                  ["freeShipping", "Free shipping threshold (₹)", 100],
                  ["taxPercent", "Tax rate (%)", 1],
                  ["deliveryMin", "Minimum delivery days", 1],
                  ["deliveryMax", "Maximum delivery days", 1],
                ].map(([key, label, scale]: any) => (
                  <Field
                    key={key}
                    label={label}
                    type="number"
                    min="0"
                    step={key === "taxPercent" ? "0.01" : "1"}
                    required
                    value={config[key] / scale}
                    onChange={(e: any) =>
                      setConfig({
                        ...config,
                        [key]:
                          Math.round(Number(e.target.value) * scale * 100) /
                          100,
                      })
                    }
                  />
                ))}
              </div>
              <CheckField
                label="Offer cash on delivery"
                checked={config.cod}
                onChange={(v: boolean) => setConfig({ ...config, cod: v })}
              />
              <p className="subtle">
                Payment keys, webhook secret, and email credentials are
                environment secrets. Configure them through hosting; they are
                never shown here. Tax is an exclusive percentage of the
                discounted subtotal. Have your tax professional confirm the
                setting.
              </p>
            </section>
            <section className="admin-panel">
              <h2>Contact details</h2>
              <div className="form-grid">
                {[
                  ["phone", "Phone"],
                  ["email", "Email"],
                  [
                    "whatsapp",
                    "WhatsApp number with country code (digits only)",
                  ],
                  ["address", "Store address"],
                ].map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    value={config[key]}
                    onChange={(e: any) =>
                      setConfig({ ...config, [key]: e.target.value })
                    }
                  />
                ))}
              </div>
            </section>
            <section className="admin-panel">
              <h2>Homepage banner</h2>
              <Field
                label="Headline"
                required
                value={config.banner}
                onChange={(e: any) =>
                  setConfig({ ...config, banner: e.target.value })
                }
              />
              <Field
                label="Image path or HTTPS URL"
                required
                value={config.bannerImage}
                onChange={(e: any) =>
                  setConfig({ ...config, bannerImage: e.target.value })
                }
              />
              <img
                className="banner-preview"
                src={config.bannerImage}
                alt="Current homepage banner"
              />
            </section>
            <Button className="primary-button" disabled={busy}>
              Save store settings
            </Button>
          </form>
        )}
        {tab === "users" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {d.users.map((u: any) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <Select
                        aria-label={"Role for " + u.email}
                        disabled={u.id === user.id || busy}
                        value={u.role}
                        onChange={(e) =>
                          save("role", { id: u.id, role: e.target.value })
                        }
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">
                          Staff — orders & enquiries
                        </option>
                        <option value="admin">
                          Administrator — full access
                        </option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "messages" && (
          <div>
            {d.messages.length ? (
              d.messages.map((m: any) => (
                <article className="admin-panel" key={m.id}>
                  <h3>{m.name}</h3>
                  <p>
                    {m.email} · {new Date(m.created_at).toLocaleString("en-IN")}
                  </p>
                  <p>{m.message}</p>
                </article>
              ))
            ) : (
              <p>No enquiries yet.</p>
            )}
          </div>
        )}
      </div>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="admin-dialog">
          <DialogTitle>{edit?.id ? "Edit saree" : "Add saree"}</DialogTitle>
          <DialogDescription>
            Prices are entered in rupees. Use verified product information
            before removing the sample label.
          </DialogDescription>
          {edit && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await save("product", edit)) setEdit(null);
              }}
            >
              <div className="form-grid">
                {[
                  ["name", "Product name"],
                  ["slug", "URL slug"],
                  ["fabric", "Fabric"],
                  ["occasion", "Occasion"],
                  ["weave", "Weaving style"],
                  ["length", "Saree length"],
                  ["blouse", "Blouse details"],
                  ["care", "Care instructions"],
                ].map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    required
                    value={edit[key]}
                    onChange={(e: any) =>
                      setEdit({ ...edit, [key]: e.target.value })
                    }
                  />
                ))}
                <Field
                  label="Price (₹)"
                  type="number"
                  min="1"
                  required
                  value={edit.price / 100}
                  onChange={(e: any) =>
                    setEdit({
                      ...edit,
                      price: Math.round(Number(e.target.value) * 100),
                    })
                  }
                />
                <Field
                  label="Fall & pico charge (₹; 0 = not offered)"
                  type="number"
                  min="0"
                  value={edit.fall_pico / 100}
                  onChange={(e: any) =>
                    setEdit({
                      ...edit,
                      fall_pico: Math.round(Number(e.target.value) * 100),
                    })
                  }
                />
              </div>
              <Field
                label="Collections, separated by commas"
                required
                value={edit.collections.join(",")}
                onChange={(e: any) =>
                  setEdit({
                    ...edit,
                    collections: e.target.value
                      .split(",")
                      .map((s: string) => s.trim()),
                  })
                }
              />
              <label className="field">
                <span>Description</span>
                <textarea
                  required
                  minLength={10}
                  value={edit.description}
                  onChange={(e) =>
                    setEdit({ ...edit, description: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Image paths or HTTPS URLs (one per line)</span>
                <textarea
                  required
                  value={edit.images.join("\n")}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      images: e.target.value.split("\n").map((s) => s.trim()),
                    })
                  }
                />
              </label>
              {[
                ["active", "Visible in store"],
                ["sample", "Sample product — blocked from live checkout"],
                ["featured", "Featured in homepage edit"],
              ].map(([key, label]) => (
                <CheckField
                  key={key}
                  label={label}
                  checked={!!edit[key]}
                  onChange={(v: boolean) =>
                    setEdit({ ...edit, [key]: Number(v) })
                  }
                />
              ))}
              {error && <Notice error>{error}</Notice>}
              <Button className="primary-button" disabled={busy}>
                Save product
              </Button>
              <p className="subtle">
                Add colour variants and stock after creating the product.
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!variant} onOpenChange={(v) => !v && setVariant(null)}>
        <DialogContent>
          <DialogTitle>Colour & inventory</DialogTitle>
          <DialogDescription>
            Stock is available quantity after existing order reservations.
          </DialogDescription>
          {variant && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await save("variant", variant)) setVariant(null);
              }}
            >
              {[
                ["color", "Colour"],
                ["sku", "SKU"],
              ].map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={variant[key]}
                  required
                  onChange={(e: any) =>
                    setVariant({ ...variant, [key]: e.target.value })
                  }
                />
              ))}
              <Field
                label="Available stock"
                required
                type="number"
                min="0"
                step="1"
                value={variant.stock}
                onChange={(e: any) =>
                  setVariant({ ...variant, stock: Number(e.target.value) })
                }
              />
              {error && <Notice error>{error}</Notice>}
              <Button className="primary-button" disabled={busy}>
                Save variant
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!coupon} onOpenChange={(v) => !v && setCoupon(null)}>
        <DialogContent>
          <DialogTitle>Coupon details</DialogTitle>
          <DialogDescription>
            Coupon limits are enforced when the order is created.
          </DialogDescription>
          {coupon && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await save("coupon", coupon)) setCoupon(null);
              }}
            >
              <Field
                label="Code"
                required
                value={coupon.code}
                onChange={(e: any) =>
                  setCoupon({ ...coupon, code: e.target.value.toUpperCase() })
                }
              />
              {[
                ["percent", "Discount (%)", 1],
                ["minimum", "Minimum order (₹)", 100],
                ["max_uses", "Maximum uses", 1],
              ].map(([key, label, scale]: any) => (
                <Field
                  key={key}
                  label={label}
                  type="number"
                  required
                  value={coupon[key] / scale}
                  onChange={(e: any) =>
                    setCoupon({
                      ...coupon,
                      [key]: Number(e.target.value) * scale,
                    })
                  }
                />
              ))}
              <Field
                label="Expiry date"
                required
                type="date"
                value={new Date(coupon.expires).toISOString().slice(0, 10)}
                onChange={(e: any) =>
                  setCoupon({
                    ...coupon,
                    expires: new Date(
                      e.target.value + "T23:59:59+05:30",
                    ).getTime(),
                  })
                }
              />
              <CheckField
                label="Enabled"
                checked={!!coupon.active}
                onChange={(v: boolean) =>
                  setCoupon({ ...coupon, active: Number(v) })
                }
              />
              {error && <Notice error>{error}</Notice>}
              <Button className="primary-button" disabled={busy}>
                Save coupon
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!order} onOpenChange={(v) => !v && setOrder(null)}>
        <DialogContent className="admin-dialog">
          <DialogTitle>Manage {order?.id}</DialogTitle>
          <DialogDescription>
            Payment status is verified on the server. Fulfillment does not mark
            an online order as paid.
          </DialogDescription>
          {order && (
            <div>
              <p>
                {order.email} · {money(order.total)}
              </p>
              <p>
                {order.test ? "TEST ORDER · " : ""}
                {order.status.replaceAll("_", " ")} ·{" "}
                {order.payment_status.replaceAll("_", " ")}
              </p>
              <p>
                {Object.values(JSON.parse(order.address))
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {order.return_reason && (
                <Notice>Return reason: {order.return_reason}</Notice>
              )}
              <Field
                label="Carrier"
                value={order.carrier || ""}
                onChange={(e: any) =>
                  setOrder({ ...order, carrier: e.target.value })
                }
              />
              <Field
                label="Tracking number"
                value={order.tracking || ""}
                onChange={(e: any) =>
                  setOrder({ ...order, tracking: e.target.value })
                }
              />
              {order.payment_method === "razorpay" && (
                <Field
                  label="Razorpay order ID for reconciliation"
                  placeholder="order_…"
                  value={order.razorpay_order_id || ""}
                  onChange={(e: any) =>
                    setOrder({ ...order, razorpay_order_id: e.target.value })
                  }
                />
              )}
              <div className="admin-actions">
                {order.payment_method === "razorpay" && (
                  <Button
                    variant="outline"
                    disabled={busy || !order.razorpay_order_id}
                    onClick={async () => {
                      if (
                        await save("order", {
                          id: order.id,
                          action: "reconcile",
                          providerOrderId: order.razorpay_order_id,
                        })
                      )
                        setOrder(null);
                    }}
                  >
                    Verify provider payment
                  </Button>
                )}
                {(
                  {
                    confirmed: ["processing"],
                    processing: ["shipped"],
                    shipped: ["delivered"],
                    return_requested: ["return_approved", "return_rejected"],
                  } as any
                )[order.status]?.map((status: string) => (
                  <Button
                    key={status}
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await save("order", {
                          id: order.id,
                          status,
                          tracking: order.tracking,
                          carrier: order.carrier,
                        })
                      )
                        setOrder(null);
                    }}
                  >
                    Mark {status.replaceAll("_", " ")}
                  </Button>
                ))}
                {["confirmed", "processing"].includes(order.status) &&
                  order.payment_method !== "razorpay" && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          await save("order", {
                            id: order.id,
                            action: "cancel",
                          })
                        )
                          setOrder(null);
                      }}
                    >
                      Cancel & restore stock
                    </Button>
                  )}
                {order.payment_method === "cod" &&
                  order.status === "delivered" &&
                  order.payment_status === "cod_due" && (
                    <Button
                      disabled={busy}
                      onClick={async () => {
                        if (
                          await save("order", {
                            id: order.id,
                            action: "cod_paid",
                          })
                        )
                          setOrder(null);
                      }}
                    >
                      Record COD collected
                    </Button>
                  )}
                {order.payment_method === "razorpay" &&
                  ["return_requested", "return_approved"].includes(
                    order.status,
                  ) &&
                  user.role === "admin" && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          await save("order", {
                            id: order.id,
                            action: "refund",
                          })
                        )
                          setOrder(null);
                      }}
                    >
                      Issue full Razorpay refund
                    </Button>
                  )}
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => save("email", { id: order.id })}
                >
                  Resend order email
                </Button>
                <SiteLink className="text-link" href={"/order/" + order.id}>
                  Open full order <ArrowRight size={16} />
                </SiteLink>
              </div>
              {error && <Notice error>{error}</Notice>}
              <p className="subtle">
                Unpaid online reservations remain held until payment
                reconciliation. Review pending/refund-pending orders in the
                Razorpay dashboard; do not issue a duplicate refund. Return
                approval alone does not issue a refund or restock an item.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
