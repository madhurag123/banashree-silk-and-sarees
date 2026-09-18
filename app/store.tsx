"use client";
import { SiteLink } from "@/lib/pages-link";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Search,
  User,
  Truck,
  Sparkles,
  MapPin,
  Menu,
  X,
  Plus,
  Minus,
  Check,
  ChevronRight,
  SlidersHorizontal,
  ShieldCheck,
  ArrowLeft,
  Package,
  LogOut,
  LayoutDashboard,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect as Select } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { money, collectionNames, defaults } from "@/lib/catalog";
import Admin from "./admin";
import {
  isPagesPreview,
  previewApi,
  previewAsset,
  previewSearch,
  previewNavigate,
} from "@/lib/pages-preview";
export async function api(path: string, body?: any): Promise<any> {
  if (isPagesPreview()) return previewApi(path, body);
  const res = await fetch("/api/" + path, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error("The store is unavailable. Please try again shortly.");
  }
  if (!res.ok) throw new Error(data.error || "Please try again.");
  return data;
}
const Context = createContext<any>(null);
export const useStore = () => useContext(Context);
export function Field({ label, ...props }: any) {
  return (
    <label className="field">
      <span>{label}</span>
      <Input {...props} />
    </label>
  );
}
export function Choose({ label, children, ...props }: any) {
  return (
    <label className="field">
      <span>{label}</span>
      <Select {...props}>{children}</Select>
    </label>
  );
}
export function CheckField({ label, checked, onChange }: any) {
  return (
    <label className="check-field">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
export function Empty({
  title,
  text,
  href = "/shop",
  link = "Explore sarees",
}: any) {
  return (
    <div className="empty">
      <ShoppingBag size={36} />
      <h2>{title}</h2>
      <p>{text}</p>
      <SiteLink className="button" href={href}>
        {link}
        <ArrowRight size={18} />
      </SiteLink>
    </div>
  );
}
export function Notice({ children, error = false }: any) {
  return (
    <div
      className={"notice " + (error ? "error" : "")}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
function Pic({ src, alt, className = "", eager = false }: any) {
  return (
    <img
      className={className}
      src={previewAsset(src)}
      alt={alt}
      width={800}
      height={1200}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
export default function Store({ route, id }: { route: string; id?: string }) {
  const [data, setData] = useState<any>({
    products: [],
    settings: defaults,
    user: null,
  });
  const [bag, setBag] = useState<any>({ items: [] });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const reload = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([api("store"), api("cart")]);
      setData(d);
      setBag(c);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const act = async (path: string, body: any, message?: string) => {
    try {
      const r = await api(path, body);
      await reload();
      if (message) setToast(message);
      return r;
    } catch (e: any) {
      setToast(e.message);
      throw e;
    }
  };
  const wish = async (p: any) => {
    if (!data.user && !isPagesPreview()) {
      location.href = "/account?next=/wishlist";
      return;
    }
    await act("wishlist", { productId: p.id }, "Saved to your wishlist").catch(
      () => {},
    );
  };
  useEffect(() => {
    const c = (document as any).modelContext;
    if (!c?.registerTool) return;
    const life = new AbortController();
    Promise.resolve(
      c.registerTool(
        {
          name: "search_sarees",
          description:
            "Navigate to the saree catalogue with a search term. Does not place an order.",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string", maxLength: 100 } },
            required: ["query"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: async (input: any) => {
            if (typeof input.query !== "string" || input.query.length > 100)
              throw new Error(
                "A search term of 100 characters or fewer is required.",
              );
            previewNavigate("/shop?q=" + encodeURIComponent(input.query));
            return { search: input.query };
          },
        },
        { signal: life.signal },
      ),
    ).catch(() => {});
    return () => life.abort();
  }, []);
  return (
    <Context.Provider
      value={{ ...data, bag, loaded, reload, act, wish, setToast }}
    >
      <SiteLink className="skip" href="#main">
        Skip to content
      </SiteLink>
      {isPagesPreview() && (
        <div className="client-preview-note">
          CLIENT DESIGN PREVIEW · Sample products · No orders or payments
        </div>
      )}
      <div className="announcement">
        From Bangalore, with love. Shipping across India.
      </div>
      <header className="masthead">
        <SiteLink
          className="brand"
          href="/"
          aria-label="Banashree silk and sarees"
        >
          Banashree
          <small>silk and sarees</small>
        </SiteLink>
        <nav aria-label="Main navigation">
          <SiteLink href="/shop">Shop all</SiteLink>
          <SiteLink href="/shop?collection=Silk">Silk sarees</SiteLink>
          <SiteLink href="/shop?collection=Bridal">The wedding edit</SiteLink>
          <SiteLink href="/about">Our story</SiteLink>
        </nav>
        <div className="tools">
          <SiteLink href="/shop" aria-label="Search sarees">
            <Search />
          </SiteLink>
          <SiteLink href="/account" aria-label="My account">
            <User />
          </SiteLink>
          <SiteLink href="/wishlist" aria-label="My wishlist">
            <Heart />
          </SiteLink>
          <SiteLink
            className="bag-link"
            href="/cart"
            aria-label={`Shopping bag, ${bag.items.reduce((n: number, x: any) => n + x.quantity, 0)} items`}
          >
            <ShoppingBag />
            {bag.items.length > 0 && (
              <span>
                {bag.items.reduce((n: number, x: any) => n + x.quantity, 0)}
              </span>
            )}
          </SiteLink>
          <button
            className="icon-button mobile-menu"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            aria-controls="mobile-navigation"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {menu && (
        <nav
          className="mobile-nav"
          id="mobile-navigation"
          aria-label="Mobile navigation"
        >
          {[
            ["/shop", "Shop all sarees"],
            ["/shop", "Search sarees"],
            ["/shop?collection=Bridal", "Wedding collection"],
            ["/about", "Our story"],
            ["/contact", "Visit & contact"],
            ["/account", "My account"],
            ["/wishlist", "My wishlist"],
          ].map(([url, label]) => (
            <SiteLink key={label} href={url} onClick={() => setMenu(false)}>
              {label}
              <ChevronRight size={16} />
            </SiteLink>
          ))}
        </nav>
      )}
      {route !== "home" && data.settings.mode !== "live" && (
        <div className="test-strip">
          {data.settings.mode === "demo"
            ? "DEMO STORE · Sample catalogue. No real payments."
            : "RAZORPAY TEST MODE · No live payments."}
        </div>
      )}
      <main id="main">
        {isPagesPreview() &&
          [
            "checkout",
            "account",
            "reset",
            "admin",
            "contact",
            "order",
          ].includes(route) && (
            <div className="preview-readonly-note">
              This page is a visual preview. Please do not enter personal
              details. Orders, sign-in, enquiries and administration are
              disabled on GitHub Pages; they run in the complete backend
              project.
            </div>
          )}
        <fieldset
          className={isPagesPreview() ? "preview-fieldset" : undefined}
          style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
          disabled={
            isPagesPreview() &&
            [
              "checkout",
              "account",
              "reset",
              "admin",
              "contact",
              "order",
            ].includes(route)
          }
        >
          {error && (
            <div className="container">
              <Notice error>
                {error} <button onClick={reload}>Retry</button>
              </Notice>
            </div>
          )}
          {route === "home" ? (
            <Home />
          ) : route === "shop" ? (
            <Shop />
          ) : route === "product" ? (
            <Product slug={id} />
          ) : route === "cart" ? (
            <Cart />
          ) : route === "checkout" ? (
            <Checkout />
          ) : route === "account" || route === "reset" ? (
            <Account reset={route === "reset"} />
          ) : route === "wishlist" ? (
            <Wishlist />
          ) : route === "order" ? (
            <Order id={id} />
          ) : route === "admin" ? (
            <Admin />
          ) : (
            <Info page={route} />
          )}
        </fieldset>
      </main>
      <Footer />
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
function Footer() {
  const { settings: s } = useStore();
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <SiteLink
            className="brand"
            href="/"
            aria-label="Banashree silk and sarees"
          >
            Banashree
            <small>silk and sarees</small>
          </SiteLink>
          <p>A little tradition for every chapter.</p>
          <p>Bangalore · Shipping across India</p>
        </div>
        <div>
          <h4>Explore</h4>
          <SiteLink href="/shop">All sarees</SiteLink>
          <SiteLink href="/shop?collection=Bridal">The wedding edit</SiteLink>
          <SiteLink href="/about">Our story</SiteLink>
          <SiteLink href="/wishlist">Your wishlist</SiteLink>
        </div>
        <div>
          <h4>Here to help</h4>
          <SiteLink href="/contact">Contact us</SiteLink>
          <SiteLink href="/faq">Frequently asked questions</SiteLink>
          <SiteLink href="/guide">Saree & draping guide</SiteLink>
          <SiteLink href="/account">My account & orders</SiteLink>
        </div>
        <div>
          <h4>The details</h4>
          <SiteLink href="/shipping">Shipping policy</SiteLink>
          <SiteLink href="/returns">Returns & exchanges</SiteLink>
          <SiteLink href="/privacy">Privacy policy</SiteLink>
          <SiteLink href="/terms">Terms of service</SiteLink>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Banashree silk and sarees</span>
        <span>
          {s.mode === "live"
            ? "INR · India"
            : "Sample catalogue · Illustrative photography · Test checkout"}
        </span>
        <SiteLink href="/admin">Store administration</SiteLink>
      </div>
    </footer>
  );
}
function Card({ p }: any) {
  const { wish } = useStore();
  return (
    <article className="product-card">
      <div className="product-image">
        <SiteLink href={"/product/" + p.slug}>
          <Pic
            src={p.images[0]}
            alt={p.name + " — illustrative sample photograph"}
          />
        </SiteLink>
        {p.sample === 1 && <span className="sample-tag">SAMPLE</span>}
        <button
          className="heart"
          aria-label={"Save " + p.name + " to wishlist"}
          onClick={() => wish(p)}
        >
          <Heart size={18} />
        </button>
        {!p.variants.some((v: any) => v.stock > 0) && (
          <span className="sold-out">Out of stock</span>
        )}
      </div>
      <div className="product-meta">
        {p.weave} · {p.fabric}
      </div>
      <SiteLink href={"/product/" + p.slug}>
        <h3>{p.name}</h3>
      </SiteLink>
      <span className="price">{money(p.price)}</span>
      <div className="swatches">
        {p.variants.map((v: any) => (
          <span
            key={v.id}
            style={{
              background:
                (
                  {
                    Rose: "#c48b93",
                    Emerald: "#19563f",
                    Ivory: "#ded1b6",
                    Blue: "#344c6f",
                    Gold: "#b19646",
                    Lavender: "#a399bd",
                    Teal: "#36777b",
                    Green: "#88a591",
                    Yellow: "#d5b951",
                    Multicolor: "#aa7145",
                  } as any
                )[v.color] || "#8a404d",
            }}
            title={v.color}
          />
        ))}
      </div>
    </article>
  );
}
function Home() {
  const { products: ps, settings: s, loaded } = useStore();
  const cols = [
    ["Silk", "saree-pink-silk"],
    ["Kanjivaram", "saree-emerald"],
    ["Banarasi", "saree-blue-orange"],
    ["Cotton", "saree-checkered"],
    ["Bridal", "saree-ivory"],
  ];
  return (
    <>
      <section
        className="hero"
        style={
          {
            backgroundImage: `url('${s.bannerImage}')`,
            "--hero-mobile": `url('${s.bannerImage}')`,
          } as any
        }
      >
        <div className="hero-copy">
          <div className="eyebrow">THE Banashree COLLECTION</div>
          <h1>
            {s.banner === defaults.banner ? (
              <>
                A little tradition.
                <br />A lifetime of <em>grace.</em>
              </>
            ) : (
              s.banner
            )}
          </h1>
          <p>
            Sarees for the moments you hold close.
            <br />
            Discover beautiful weaves, from everyday
            <br className="desktop" /> elegance to your most treasured
            celebrations.
          </p>
          <SiteLink className="button" href="/shop">
            Explore the collection <ArrowRight size={18} />
          </SiteLink>
          <div className="hero-note">BANGALORE · FOR YOUR EVERY CHAPTER</div>
        </div>
        <div
          className="hero-photo"
          style={{ backgroundImage: `url('${s.bannerImage}')` }}
        >
          <div className="hero-caption">The art of dressing in tradition</div>
        </div>
      </section>
      <div className="promise-bar">
        <span>
          <Truck /> Shipping across India
        </span>
        <span>
          <Sparkles /> A weave for every occasion
        </span>
        <span>
          <MapPin /> Your saree boutique in Bangalore
        </span>
      </div>
      <section className="section">
        <div className="eyebrow">FIND YOUR FAVOURITE</div>
        <div className="section-heading">
          <h2>A world of beautiful weaves</h2>
          <SiteLink href="/shop">
            View all collections <ArrowRight size={17} />
          </SiteLink>
        </div>
        <div className="collection-preview">
          {cols.map(([x, img]) => (
            <SiteLink href={"/shop?collection=" + x} key={x}>
              <Pic
                src={"/images/" + img + ".jpg"}
                alt={x + " saree collection — illustrative photography"}
              />
              <h3>{x}</h3>
              <small>Explore collection ↗</small>
            </SiteLink>
          ))}
        </div>
      </section>
      <section className="section arrivals">
        <div className="eyebrow">FRESH FROM OUR SAMPLE EDIT</div>
        <div className="section-heading">
          <h2>New arrivals, timeless charm</h2>
          <SiteLink href="/shop?sort=new">
            Discover new arrivals <ArrowRight size={17} />
          </SiteLink>
        </div>
        <div className="product-grid">
          {ps.slice(0, 4).map((p: any) => (
            <Card key={p.id} p={p} />
          ))}
        </div>
        {!loaded && <p role="status">Opening the collection…</p>}
      </section>
      <section className="wedding">
        <div>
          <Pic
            src="/images/saree-ivory.jpg"
            alt="Illustrative ivory and gold wedding saree"
          />
        </div>
        <div className="wedding-copy">
          <div className="eyebrow">THE WEDDING EDIT</div>
          <h2>
            For a day.
            <br />
            For a lifetime.
          </h2>
          <p>
            Rich silks, luminous borders, and colours to fall in love with. Find
            the saree that feels like your moment.
          </p>
          <SiteLink className="button" href="/shop?collection=Bridal">
            Discover bridal sarees <ArrowRight size={18} />
          </SiteLink>
        </div>
      </section>
      <section className="section">
        <div className="eyebrow">THE BOUTIQUE SELECTION</div>
        <div className="section-heading">
          <div>
            <h2>The bestseller edit</h2>
            <p className="subtle">
              Sample selection — bestseller rankings will appear when verified
              sales are available.
            </p>
          </div>
          <SiteLink href="/shop?sort=featured">
            Shop the edit <ArrowRight size={17} />
          </SiteLink>
        </div>
        <div className="product-grid">
          {ps
            .filter((p: any) => p.featured)
            .slice(0, 4)
            .map((p: any) => (
              <Card key={p.id} p={p} />
            ))}
        </div>
      </section>
      <section className="story">
        <div className="eyebrow">Banashree · BANGALORE</div>
        <h2>
          Every saree has a story.
          <br />
          Let’s find yours.
        </h2>
        <p>
          Welcome to Banashree silk and sarees, your Bangalore saree shop.
          <br />
          Explore a world of colour, texture and occasion, wherever you are in
          India.
        </p>
        <SiteLink href="/about" className="text-link">
          A little more about us <ArrowRight size={17} />
        </SiteLink>
      </section>
      <section className="section testimonials">
        <div className="eyebrow">YOUR STORIES, WOVEN TOGETHER</div>
        <h2>From our customers</h2>
        <p>
          Every real experience matters. Verified customer stories will appear
          here once collected.
        </p>
        <p className="subtle">No reviews have been published yet.</p>
      </section>
    </>
  );
}
function Shop() {
  const { products: ps, loaded } = useStore();
  const [filters, setFilters] = useState<any>({
    q: "",
    collection: "",
    fabric: "",
    color: "",
    occasion: "",
    weave: "",
    max: "",
    availability: "",
    sort: "featured",
  });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(previewSearch());
    setFilters((f: any) => ({ ...f, ...Object.fromEntries(q) }));
  }, []);
  function filter(k: string, v: string) {
    setFilters((f: any) => ({ ...f, [k]: v }));
    setPage(1);
  }
  let items = ps.filter(
    (p: any) =>
      (!filters.q ||
        (p.name + " " + p.fabric + " " + p.weave)
          .toLowerCase()
          .includes(filters.q.toLowerCase())) &&
      (!filters.collection || p.collections.includes(filters.collection)) &&
      (!filters.fabric || p.fabric === filters.fabric) &&
      (!filters.color ||
        p.variants.some((v: any) => v.color === filters.color)) &&
      (!filters.occasion || p.occasion === filters.occasion) &&
      (!filters.weave || p.weave === filters.weave) &&
      (!filters.max || p.price <= Number(filters.max) * 100) &&
      (!filters.availability || p.variants.some((v: any) => v.stock > 0)),
  );
  items = [...items].sort((a: any, b: any) =>
    filters.sort === "price-low"
      ? a.price - b.price
      : filters.sort === "price-high"
        ? b.price - a.price
        : filters.sort === "name"
          ? a.name.localeCompare(b.name)
          : filters.sort === "new"
            ? b.created_at - a.created_at
            : b.featured - a.featured,
  );
  const options: any = {
    collection: [
      ...new Set([
        ...collectionNames,
        ...ps.flatMap((p: any) => p.collections),
      ]),
    ],
    fabric: [...new Set(ps.map((p: any) => p.fabric))],
    color: [
      ...new Set(ps.flatMap((p: any) => p.variants.map((v: any) => v.color))),
    ],
    occasion: [...new Set(ps.map((p: any) => p.occasion))],
    weave: [...new Set(ps.map((p: any) => p.weave))],
  };
  return (
    <div className="container shop">
      <div className="breadcrumbs">
        <SiteLink href="/">Home</SiteLink>
        <ChevronRight size={12} />
        The collection
      </div>
      <div className="page-heading">
        <div className="eyebrow">FIND SOMETHING BEAUTIFUL</div>
        <h1>
          {filters.collection
            ? filters.collection + " sarees"
            : "The saree collection"}
        </h1>
        <p>From everyday rituals to extraordinary celebrations.</p>
      </div>
      <form className="search-bar" onSubmit={(e) => e.preventDefault()}>
        <Search size={19} />
        <Input
          aria-label="Search sarees"
          placeholder="Search for a weave, fabric or saree…"
          value={filters.q}
          onChange={(e) => filter("q", e.target.value)}
        />
        <Button
          className="filter-toggle"
          variant="outline"
          type="button"
          aria-expanded={open}
          aria-controls="catalogue-filters"
          onClick={() => setOpen(!open)}
        >
          <SlidersHorizontal size={16} />
          Filters
        </Button>
      </form>
      <div className="shop-layout">
        <aside
          id="catalogue-filters"
          aria-label="Filter sarees"
          className={"filters " + (open ? "is-open" : "")}
        >
          <div className="filter-heading">
            <h3>Refine your selection</h3>
            <button
              className="text-link"
              onClick={() => {
                setFilters({
                  q: "",
                  collection: "",
                  fabric: "",
                  color: "",
                  occasion: "",
                  weave: "",
                  max: "",
                  availability: "",
                  sort: "featured",
                });
                setPage(1);
              }}
            >
              Reset
            </button>
          </div>
          {Object.entries(options).map(([key, values]: any) => (
            <Choose
              key={key}
              label={
                key === "weave"
                  ? "Weaving style"
                  : key[0].toUpperCase() + key.slice(1)
              }
              value={filters[key]}
              onChange={(e: any) => filter(key, e.target.value)}
            >
              <option value="">
                All {key === "collection" ? "collections" : key + "s"}
              </option>
              {values.map((v: string) => (
                <option key={v}>{v}</option>
              ))}
            </Choose>
          ))}
          <Field
            label="Maximum price (₹)"
            type="number"
            min="0"
            placeholder="Any price"
            value={filters.max}
            onChange={(e: any) => filter("max", e.target.value)}
          />
          <CheckField
            label="In stock only"
            checked={!!filters.availability}
            onChange={(v: boolean) =>
              filter("availability", v ? "in-stock" : "")
            }
          />
          <Button
            className="primary-button filter-done"
            onClick={() => setOpen(false)}
          >
            Show {items.length} sarees
          </Button>
        </aside>
        <div className="shop-results">
          <div className="results-bar">
            <span>{loaded ? `${items.length} sarees` : "Loading sarees…"}</span>
            <Select
              aria-label="Sort sarees"
              value={filters.sort}
              onChange={(e) => filter("sort", e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="new">Newest first</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A–Z</option>
            </Select>
          </div>
          <div className="product-grid shop-grid">
            {items.slice((page - 1) * 9, page * 9).map((p: any) => (
              <Card key={p.id} p={p} />
            ))}
          </div>
          {loaded && !items.length && (
            <Empty
              title="A different weave awaits"
              text="Try fewer filters or a different search."
            />
          )}
          {items.length > 9 && (
            <nav className="pagination" aria-label="Catalogue pages">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} of {Math.ceil(items.length / 9)}
              </span>
              <Button
                variant="outline"
                disabled={page >= Math.ceil(items.length / 9)}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
function Product({ slug }: any) {
  const { products: ps, settings: s, loaded, act, wish } = useStore();
  const p = ps.find((p: any) => p.slug === slug);
  const [variant, setVariant] = useState("");
  const [service, setService] = useState(false);
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomLarge, setZoomLarge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  if (!p)
    return (
      <div className="container">
        {loaded ? (
          <Empty
            title="This saree is unavailable"
            text="Explore another beautiful weave in our collection."
          />
        ) : (
          <p>Opening the saree…</p>
        )}
      </div>
    );
  const v = p.variants.find((v: any) => v.id === variant) || p.variants[0];
  async function add() {
    setBusy(true);
    try {
      await act(
        "cart",
        { variantId: v.id, quantity: qty, service },
        "Added to your bag",
      );
      setAdded(true);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container">
      <div className="breadcrumbs">
        <SiteLink href="/">Home</SiteLink>
        <ChevronRight size={12} />
        <SiteLink href="/shop">Sarees</SiteLink>
        <ChevronRight size={12} />
        {p.name}
      </div>
      <div className="detail-grid">
        <div>
          <button
            className="main-product-photo"
            onClick={() => setZoom(true)}
            aria-label="Zoom saree photograph"
          >
            <Pic
              src={p.images[photo]}
              alt={p.name + " — illustrative sample"}
              eager
            />
            <span>
              <ZoomIn size={19} /> Click to explore
            </span>
          </button>
          <div className="thumbnails">
            {p.images.map((src: string, i: number) => (
              <button
                key={src + i}
                className={photo === i ? "selected" : ""}
                aria-label={"View photograph " + (i + 1)}
                onClick={() => setPhoto(i)}
              >
                <Pic src={src} alt={"View " + (i + 1)} />
              </button>
            ))}
          </div>
          <p className="subtle">
            {p.sample
              ? "Sample photography illustrates this listing; it is not a verified photograph of store inventory."
              : "Colours may vary slightly across screens."}
          </p>
        </div>
        <div className="detail-copy">
          <div className="eyebrow">
            {p.weave} · {p.fabric}
          </div>
          <h1>{p.name}</h1>
          <p className="detail-price">{money(p.price)}</p>
          {p.sample === 1 && (
            <span className="pill">Clearly labelled sample product</span>
          )}
          <p>{p.description}</p>
          <Choose
            label="Colour"
            value={v?.id || ""}
            onChange={(e: any) => setVariant(e.target.value)}
          >
            {p.variants.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.color} · {v.stock} in stock
              </option>
            ))}
          </Choose>
          {p.fall_pico > 0 && (
            <CheckField
              label={"Add fall & pico finishing · " + money(p.fall_pico)}
              checked={service}
              onChange={setService}
            />
          )}
          <div className="buy-row">
            <Field
              label="Quantity"
              type="number"
              min="1"
              max={Math.min(10, v?.stock || 1)}
              value={qty}
              onChange={(e: any) => setQty(Number(e.target.value))}
            />
            <Button
              className="primary-button"
              disabled={busy || !v?.stock}
              onClick={add}
            >
              <ShoppingBag size={17} />
              {busy ? "Adding…" : !v?.stock ? "Out of stock" : "Add to bag"}
            </Button>
            <Button
              className="wish-button"
              variant="outline"
              aria-label="Save to wishlist"
              onClick={() => wish(p)}
            >
              <Heart size={20} />
            </Button>
          </div>
          {added && (
            <SiteLink className="text-link" href="/cart">
              View your bag <ArrowRight size={16} />
            </SiteLink>
          )}
          <div className="delivery-note">
            <Truck size={22} />
            <div>
              Delivery across India
              <p>
                Estimated {s.deliveryMin}–{s.deliveryMax} business days after
                dispatch.
                <br />
                Shipping {money(s.shipping)}; free above {money(s.freeShipping)}
                . Draft estimates.
              </p>
            </div>
          </div>
          {[
            [
              "The details",
              <dl key="details">
                <dt>Fabric</dt>
                <dd>{p.fabric}</dd>
                <dt>Weaving style</dt>
                <dd>{p.weave}</dd>
                <dt>Saree length</dt>
                <dd>{p.length}</dd>
                <dt>Blouse piece</dt>
                <dd>{p.blouse}</dd>
                <dt>Stock</dt>
                <dd>{v?.stock || 0} available</dd>
              </dl>,
            ],
            ["Care for your saree", p.care],
            [
              "Shipping & returns",
              <p key="policy">
                Please review our{" "}
                <SiteLink href="/shipping">draft shipping policy</SiteLink> and{" "}
                <SiteLink href="/returns">draft returns policy</SiteLink>. Final
                business terms must be confirmed before live orders.
              </p>,
            ],
          ].map(([title, body]: any) => (
            <details key={title} open={title === "The details"}>
              <summary>{title}</summary>
              <div>{body}</div>
            </details>
          ))}
        </div>
      </div>
      <section className="related">
        <div className="section-heading">
          <h2>You may also love</h2>
          <SiteLink href="/shop">
            Explore more <ArrowRight size={16} />
          </SiteLink>
        </div>
        <div className="product-grid">
          {ps
            .filter(
              (x: any) =>
                x.id !== p.id &&
                (x.fabric === p.fabric || x.occasion === p.occasion),
            )
            .slice(0, 4)
            .map((x: any) => (
              <Card p={x} key={x.id} />
            ))}
        </div>
      </section>
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="zoom-dialog">
          <DialogTitle>{p.name}</DialogTitle>
          <DialogDescription>
            Zoom in to inspect the weave, then scroll to explore the photograph.
          </DialogDescription>
          <Button variant="outline" onClick={() => setZoomLarge(!zoomLarge)}>
            {zoomLarge ? "Fit image" : "Zoom in"}
          </Button>
          <div
            className={"zoom-media " + (zoomLarge ? "is-zoomed" : "")}
            tabIndex={0}
            aria-label="Scrollable enlarged photograph"
          >
            <img
              src={p.images[photo]}
              alt={p.name}
              width={1200}
              height={1800}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function Totals({ quote: q }: any) {
  if (!q) return <p>Calculating your total…</p>;
  return (
    <dl className="totals">
      <dt>Subtotal</dt>
      <dd>{money(q.subtotal)}</dd>
      <dt>Discount</dt>
      <dd>−{money(q.discount)}</dd>
      <dt>Shipping</dt>
      <dd>{q.shipping ? money(q.shipping) : "Complimentary"}</dd>
      <dt>Tax</dt>
      <dd>{money(q.tax)}</dd>
      <dt className="total">Total</dt>
      <dd className="total">{money(q.total)}</dd>
    </dl>
  );
}
function Cart() {
  const { bag, loaded, act } = useStore();
  const [coupon, setCoupon] = useState("");
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<any>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (bag.items.length)
      api("checkout/quote", { coupon: code })
        .then(setQuote)
        .catch((e) => {
          setError(e.message);
          setQuote(null);
        });
  }, [bag, code]);
  async function apply() {
    setBusy(true);
    try {
      const q = await api("checkout/quote", { coupon });
      setQuote(q);
      setCode(coupon);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!bag.items.length)
    return (
      <div className="container">
        <Empty
          title={loaded ? "Your bag is waiting" : "Opening your bag…"}
          text="A beautiful saree is always a good place to start."
        />
      </div>
    );
  return (
    <div className="container">
      <div className="page-heading">
        <div className="eyebrow">YOUR SELECTION</div>
        <h1>The shopping bag</h1>
      </div>
      <div className="checkout-grid">
        <div>
          {bag.items.map((x: any) => (
            <div key={x.id} className="cart-row">
              <SiteLink href={"/product/" + x.slug}>
                <Pic src={x.images[0]} alt={x.name} />
              </SiteLink>
              <div>
                <SiteLink href={"/product/" + x.slug}>
                  <h3>{x.name}</h3>
                </SiteLink>
                <p>
                  {x.color}
                  {x.service ? " · Fall & pico" : ""}
                </p>
                <p>{money(x.price + (x.service ? x.fall_pico : 0))}</p>
                <div className="quantity">
                  <Button
                    variant="outline"
                    aria-label={"Reduce quantity of " + x.name}
                    disabled={x.quantity <= 1 || busy}
                    onClick={() =>
                      act("cart", {
                        variantId: x.variant_id,
                        quantity: x.quantity - 1,
                        service: !!x.service,
                        replace: true,
                      }).catch(() => {})
                    }
                  >
                    <Minus size={14} />
                  </Button>
                  <span>{x.quantity}</span>
                  <Button
                    variant="outline"
                    aria-label={"Increase quantity of " + x.name}
                    disabled={x.quantity >= Math.min(x.stock, 10) || busy}
                    onClick={() =>
                      act("cart", {
                        variantId: x.variant_id,
                        quantity: x.quantity + 1,
                        service: !!x.service,
                        replace: true,
                      }).catch(() => {})
                    }
                  >
                    <Plus size={14} />
                  </Button>
                  <button
                    className="text-link"
                    onClick={() =>
                      act("cart", { remove: x.id }).catch(() => {})
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
              <strong>
                {money((x.price + (x.service ? x.fall_pico : 0)) * x.quantity)}
              </strong>
            </div>
          ))}
          <SiteLink className="text-link" href="/shop">
            <ArrowLeft size={15} /> Continue exploring
          </SiteLink>
        </div>
        <aside className="summary-card">
          <h2>Your order</h2>
          <Totals quote={quote} />
          <div className="coupon">
            <Field
              label="Coupon code"
              value={coupon}
              placeholder="WELCOME10"
              onChange={(e: any) => setCoupon(e.target.value.toUpperCase())}
            />
            <Button variant="outline" disabled={busy} onClick={apply}>
              Apply
            </Button>
          </div>
          <p className="subtle">
            Demo offer: WELCOME10 gives 10% off above ₹2,000.
          </p>
          {error && <Notice error>{error}</Notice>}
          {quote && (
            <SiteLink
              className="button full"
              href={
                "/checkout" +
                (code ? "?coupon=" + encodeURIComponent(code) : "")
              }
            >
              Continue to checkout <ArrowRight size={16} />
            </SiteLink>
          )}
          <p className="secure">
            <ShieldCheck size={16} />
            Prices and stock verified at checkout
          </p>
        </aside>
      </div>
    </div>
  );
}
export const addressFields = [
  ["name", "Full name"],
  ["phone", "Mobile number"],
  ["line1", "Address line 1"],
  ["line2", "Address line 2 (optional)"],
  ["city", "City"],
  ["state", "State"],
  ["pincode", "PIN code"],
];
export function AddressFields({ value, onChange }: any) {
  return (
    <div className="form-grid">
      {addressFields.map(([key, label]) => (
        <Field
          key={key}
          label={label}
          name={key}
          value={value[key] || ""}
          required={key !== "line2"}
          autoComplete={
            key === "name"
              ? "name"
              : key === "phone"
                ? "tel"
                : key === "line1"
                  ? "address-line1"
                  : key === "line2"
                    ? "address-line2"
                    : key === "city"
                      ? "address-level2"
                      : key === "state"
                        ? "address-level1"
                        : "postal-code"
          }
          inputMode={["phone", "pincode"].includes(key) ? "numeric" : undefined}
          pattern={
            key === "phone"
              ? "[6-9][0-9]{9}"
              : key === "pincode"
                ? "[1-9][0-9]{5}"
                : undefined
          }
          onChange={(e: any) => onChange({ ...value, [key]: e.target.value })}
        />
      ))}
    </div>
  );
}
function Checkout() {
  const { bag, user, settings: s, loaded, setToast } = useStore();
  const [address, setAddress] = useState<any>({});
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState<any[]>([]);
  const [save, setSave] = useState(false);
  const [quote, setQuote] = useState<any>();
  const [coupon, setCoupon] = useState("");
  const [payment, setPayment] = useState("demo");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  useEffect(() => {
    const pending =
      sessionStorage.getItem("bs_checkout_key") || crypto.randomUUID();
    sessionStorage.setItem("bs_checkout_key", pending);
    setKey(pending);
    const c = new URLSearchParams(previewSearch()).get("coupon") || "";
    setCoupon(c);
    api("checkout/quote", { coupon: c })
      .then(setQuote)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    setPayment(s.mode === "demo" ? "demo" : "razorpay");
  }, [s.mode]);
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      api("account")
        .then((a) => setSaved(a.addresses))
        .catch(() => {});
    }
  }, [user]);
  async function submit(e: any) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api("checkout", {
        email,
        address,
        coupon,
        payment,
        idempotencyKey: key,
      });
      if (save && user)
        await api("addresses", address).catch(() =>
          setToast("Order saved; the address could not be saved."),
        );
      sessionStorage.removeItem("bs_checkout_key");
      location.href = "/order/" + r.id;
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }
  if (loaded && !bag.items.length)
    return (
      <div className="container">
        <Empty
          title="Your bag is empty"
          text="Choose your saree before continuing to checkout."
        />
      </div>
    );
  return (
    <div className="container">
      <div className="page-heading">
        <div className="eyebrow">ONE STEP CLOSER</div>
        <h1>Checkout</h1>
        <p>
          {user
            ? "Welcome back, " + user.name + "."
            : "Checkout as a guest, or sign in to save your addresses and orders."}{" "}
          {!user && (
            <SiteLink className="text-link" href="/account?next=/checkout">
              Sign in
            </SiteLink>
          )}
        </p>
      </div>
      <form onSubmit={submit} className="checkout-grid">
        <div>
          <h2>Contact & delivery</h2>
          <Field
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />
          {saved.length > 0 && (
            <Choose
              label="Use a saved address"
              defaultValue=""
              onChange={(e: any) => {
                const a = saved.find((x) => x.id === e.target.value);
                if (a) setAddress(a.data);
              }}
            >
              <option value="">Enter a new address</option>
              {saved.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.data.name} · {a.data.line1}
                </option>
              ))}
            </Choose>
          )}
          <AddressFields value={address} onChange={setAddress} />
          {user && (
            <CheckField
              label="Save this address to my account"
              checked={save}
              onChange={setSave}
            />
          )}
          <h2 className="spaced">Payment</h2>
          {s.mode === "demo" && (
            <Notice>
              Demo checkout creates a test order. No money is collected and no
              actual shipment is arranged.
            </Notice>
          )}
          <Choose
            label="Payment method"
            value={payment}
            onChange={(e: any) => setPayment(e.target.value)}
          >
            {s.mode === "demo" ? (
              <option value="demo">Demo order — no payment</option>
            ) : (
              <option value="razorpay">
                {s.mode === "test" ? "Razorpay test payment" : "Pay securely"} ·
                UPI / cards
              </option>
            )}
            {s.cod && (
              <option value="cod">
                Cash on delivery{s.mode !== "live" ? " (test order)" : ""}
              </option>
            )}
          </Choose>
          <p className="subtle">
            By continuing, you acknowledge the{" "}
            <SiteLink href="/terms">terms</SiteLink>,{" "}
            <SiteLink href="/shipping">shipping policy</SiteLink>, and{" "}
            <SiteLink href="/returns">returns policy</SiteLink>. Draft terms
            must be finalised before live sales.
          </p>
          {error && <Notice error>{error}</Notice>}
        </div>
        <aside className="summary-card">
          <h2>Your selection</h2>
          {bag.items.map((x: any) => (
            <div className="mini-item" key={x.id}>
              <Pic src={x.images[0]} alt={x.name} />
              <div>
                {x.name}
                <small>
                  {x.color} · Qty {x.quantity}
                  {x.service ? " · Fall & pico" : ""}
                </small>
              </div>
            </div>
          ))}
          <Totals quote={quote} />
          <Button
            type="submit"
            className="primary-button full"
            disabled={busy || !quote || !key}
          >
            {busy
              ? "Saving your order…"
              : payment === "demo"
                ? "Place demo order"
                : payment === "cod"
                  ? "Place COD order"
                  : "Continue to Razorpay"}
            <ArrowRight size={17} />
          </Button>
          <p className="secure">
            <ShieldCheck size={16} />
            Secure checkout · INR
          </p>
        </aside>
      </form>
    </div>
  );
}
export function AuthForm({ admin = false, reset = false }: any) {
  const [mode, setMode] = useState(reset ? "reset" : "login");
  const [form, setForm] = useState<any>({
    email: "",
    password: "",
    name: "",
    token: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: any) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        token:
          mode === "reset"
            ? new URLSearchParams(previewSearch()).get("token")
            : form.token,
      };
      const r = await api("auth/" + mode, payload);
      if (["login", "register", "setup"].includes(mode)) {
        const next = new URLSearchParams(previewSearch()).get("next");
        location.href = admin
          ? "/admin"
          : next?.startsWith("/") && !next.startsWith("//")
            ? next
            : "/account";
      } else setMessage(r.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card">
      <div className="eyebrow">
        {admin ? "BOUTIQUE ADMINISTRATION" : "YOUR Banashree"}
      </div>
      <h1>
        {mode === "login"
          ? "Welcome back"
          : mode === "register"
            ? "Make yourself at home"
            : mode === "setup"
              ? "Set up your store"
              : mode === "forgot"
                ? "Forgot your password?"
                : "A fresh start"}
      </h1>
      <p>
        {mode === "login"
          ? "Sign in to " +
            (admin
              ? "manage the store."
              : "save your favourites and follow your orders.")
          : mode === "setup"
            ? "Use the private setup key supplied with your project. It can create the first administrator only."
            : mode === "forgot"
              ? "Enter your email to request a secure reset link."
              : "Create a password of at least 12 characters."}
      </p>
      <form onSubmit={submit}>
        {["register", "setup"].includes(mode) && (
          <Field
            label="Your name"
            required
            value={form.name}
            onChange={(e: any) => setForm({ ...form, name: e.target.value })}
          />
        )}{" "}
        {mode !== "reset" && (
          <Field
            label="Email address"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e: any) => setForm({ ...form, email: e.target.value })}
          />
        )}{" "}
        {mode !== "forgot" && (
          <Field
            label="Password"
            type="password"
            required
            minLength={12}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            value={form.password}
            onChange={(e: any) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        )}{" "}
        {mode === "setup" && (
          <Field
            label="Private setup key"
            type="password"
            required
            value={form.token}
            onChange={(e: any) => setForm({ ...form, token: e.target.value })}
          />
        )}{" "}
        {error && <Notice error>{error}</Notice>}
        {message && <Notice>{message}</Notice>}
        <Button className="primary-button full" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : mode === "register"
                ? "Create account"
                : mode === "setup"
                  ? "Create administrator"
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Update password"}
        </Button>
      </form>
      <div className="auth-links">
        {mode === "login" ? (
          <>
            <button
              className="text-link"
              onClick={() => setMode(admin ? "setup" : "register")}
            >
              {admin ? "First-time store setup" : "Create an account"}
            </button>
            <button className="text-link" onClick={() => setMode("forgot")}>
              Forgot password?
            </button>
          </>
        ) : (
          <button
            className="text-link"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
function Account({ reset = false }: any) {
  const { user, loaded, act, setToast } = useStore();
  const [data, setData] = useState<any>();
  const [tab, setTab] = useState("orders");
  const [address, setAddress] = useState<any>({});
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () =>
    api("account")
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (user) {
      setName(user.name);
      load();
    }
  }, [user]);
  async function save(e: any) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(
        tab === "addresses" ? "addresses" : "profile",
        tab === "addresses" ? address : { name },
      );
      setToast("Saved successfully");
      if (tab === "addresses") setAddress({});
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (reset)
    return (
      <div className="container">
        <AuthForm reset />
      </div>
    );
  if (!loaded) return <div className="container">Opening your account…</div>;
  if (!user)
    return (
      <div className="container">
        <AuthForm />
      </div>
    );
  return (
    <div className="container">
      <div className="page-heading">
        <div className="eyebrow">YOUR Banashree</div>
        <h1>Hello, {user.name}</h1>
      </div>
      <div className="account-nav">
        {["orders", "addresses", "profile"].map((x) => (
          <Button
            key={x}
            variant={tab === x ? "default" : "outline"}
            onClick={() => setTab(x)}
          >
            {x[0].toUpperCase() + x.slice(1)}
          </Button>
        ))}
        <SiteLink className="text-link" href="/wishlist">
          Wishlist <Heart size={15} />
        </SiteLink>
        {user.role !== "customer" && (
          <SiteLink className="text-link" href="/admin">
            Administration
          </SiteLink>
        )}
        <Button
          variant="ghost"
          onClick={() => act("auth/logout", {}).catch(() => {})}
        >
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
      {error && <Notice error>{error}</Notice>}
      {tab === "orders" &&
        (data?.orders.length ? (
          <div className="order-list">
            {data.orders.map((o: any) => (
              <SiteLink
                className="order-card"
                href={"/order/" + o.id}
                key={o.id}
              >
                <div>
                  <span className="eyebrow">
                    {o.test ? "TEST ORDER" : "ORDER"}
                  </span>
                  <h3>{o.id}</h3>
                  <span>
                    {new Date(o.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="pill">{o.status.replaceAll("_", " ")}</span>
                  <p>
                    {money(o.total)} · {o.payment_status.replaceAll("_", " ")}
                  </p>
                </div>
                <ChevronRight size={20} />
              </SiteLink>
            ))}
          </div>
        ) : (
          <Empty
            title="Your story starts here"
            text="Your orders will appear here after checkout."
          />
        ))}
      {tab === "addresses" && (
        <div className="two-columns">
          <div>
            {data?.addresses.map((a: any) => (
              <div className="address-card" key={a.id}>
                <h3>{a.data.name}</h3>
                <p>
                  {a.data.line1}
                  <br />
                  {a.data.line2}
                  <br />
                  {a.data.city}, {a.data.state} {a.data.pincode}
                  <br />
                  {a.data.phone}
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await api("addresses", { delete: a.id });
                      load();
                    } catch (e: any) {
                      setError(e.message);
                    }
                  }}
                >
                  Remove address
                </Button>
              </div>
            ))}
          </div>
          <form onSubmit={save}>
            <h2>Add an address</h2>
            <AddressFields value={address} onChange={setAddress} />
            <Button className="primary-button" disabled={busy}>
              Save address
            </Button>
          </form>
        </div>
      )}
      {tab === "profile" && (
        <form className="narrow" onSubmit={save}>
          <Field
            label="Name"
            required
            value={name}
            onChange={(e: any) => setName(e.target.value)}
          />
          <Field label="Account email" value={user.email} disabled />
          <Button className="primary-button" disabled={busy}>
            Save profile
          </Button>
        </form>
      )}
    </div>
  );
}
function Wishlist() {
  const { products: ps, user, loaded, setToast } = useStore();
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (user || isPagesPreview())
      api("account")
        .then((x) => setIds(x.wishlist))
        .catch((e) => setError(e.message));
  }, [user]);
  if (!loaded) return <div className="container">Opening your wishlist…</div>;
  if (!user && !isPagesPreview())
    return (
      <div className="container">
        <Empty
          title="A place for your favourites"
          text="Sign in to keep your favourite sarees close."
          href="/account?next=/wishlist"
          link="Sign in"
        />
      </div>
    );
  return (
    <div className="container">
      <div className="page-heading">
        <div className="eyebrow">KEEP THEM CLOSE</div>
        <h1>Your wishlist</h1>
      </div>
      {error && <Notice error>{error}</Notice>}
      <div className="product-grid">
        {ps
          .filter((p: any) => ids.includes(p.id))
          .map((p: any) => (
            <div key={p.id}>
              <Card p={p} />
              <button
                className="text-link"
                onClick={async () => {
                  try {
                    await api("wishlist", { productId: p.id, remove: true });
                    setIds(ids.filter((x) => x !== p.id));
                    setToast("Removed from wishlist");
                  } catch (e: any) {
                    setError(e.message);
                  }
                }}
              >
                Remove from wishlist
              </button>
            </div>
          ))}
      </div>
      {!ids.length && (
        <Empty
          title="Love it? Save it."
          text="Tap the heart on a saree to add it to your wishlist."
        />
      )}
    </div>
  );
}
function Order({ id }: any) {
  const [o, setO] = useState<any>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const load = () =>
    api("orders/" + id)
      .then(setO)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [id]);
  async function action(action: string) {
    setBusy(true);
    try {
      await api("orders/action", { id, action, reason });
      await load();
      setMessage("Your request has been saved.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function pay() {
    setBusy(true);
    setError("");
    try {
      const r = await api("payment/start", { id });
      if (!(window as any).Razorpay)
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () =>
            reject(
              new Error(
                "The payment window could not be loaded. Please retry.",
              ),
            );
          document.body.appendChild(script);
        });
      const checkout = new (window as any).Razorpay({
        ...r,
        name: "Banashree silk and sarees",
        description: (r.test ? "TEST PAYMENT — " : "") + id,
        prefill: {
          email: o.email,
          name: o.address.name,
          contact: o.address.phone,
        },
        theme: { color: "#731e2c" },
        handler: async (data: any) => {
          try {
            await api("payment/verify", { id, ...data });
            await load();
            setMessage(
              r.test
                ? "Test payment verified. No live payment was made."
                : "Your payment has been verified.",
            );
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setMessage(
              "Payment window closed. Your order remains unpaid until verified.",
            );
          },
        },
      });
      checkout.on("payment.failed", () => {
        setError(
          "Payment failed. No successful payment has been confirmed. You can retry.",
        );
        setBusy(false);
      });
      checkout.open();
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }
  if (!o)
    return (
      <div className="container">
        {error ? <Notice error>{error}</Notice> : <p>Loading your order…</p>}
      </div>
    );
  return (
    <div className="container order-detail">
      <div className="page-heading">
        <div className="eyebrow">
          {o.test ? "TEST ORDER · NO LIVE PAYMENT CONFIRMATION" : "YOUR ORDER"}
        </div>
        <h1>
          {o.payment_status === "paid"
            ? "Thank you for your order."
            : o.test
              ? "Your test order is saved."
              : "Your order is saved."}
        </h1>
        <p>
          {id} · {new Date(o.created_at).toLocaleString("en-IN")}
        </p>
      </div>
      {o.test && (
        <Notice>
          This is a test order.{" "}
          {o.payment_status === "test_paid"
            ? "A Razorpay test payment was verified."
            : "No real payment has been collected."}{" "}
          No actual shipment is arranged.
        </Notice>
      )}
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="checkout-grid">
        <div>
          <div className="status-panel">
            <Package size={26} />
            <div>
              <h3>{o.status.replaceAll("_", " ")}</h3>
              <p>Payment: {o.payment_status.replaceAll("_", " ")}</p>
              {o.tracking && (
                <p>
                  {o.carrier} · Tracking number: <strong>{o.tracking}</strong>
                </p>
              )}
            </div>
          </div>
          <div className="tracking-steps">
            {["confirmed", "processing", "shipped", "delivered"].map((s, i) => (
              <div
                key={s}
                className={
                  ["confirmed", "processing", "shipped", "delivered"].indexOf(
                    o.status,
                  ) >= i
                    ? "done"
                    : ""
                }
              >
                <span>{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
          {o.items.map((x: any) => (
            <div className="mini-item" key={x.id}>
              <Pic src={x.image} alt={x.name} />
              <div>
                <h3>{x.name}</h3>
                <p>
                  {x.color} · Qty {x.quantity}
                  {x.service ? " · Fall & pico" : ""}
                </p>
                {money((x.price + x.service) * x.quantity)}
              </div>
            </div>
          ))}
          <h2 className="spaced">Delivery address</h2>
          <p>
            {o.address.name}
            <br />
            {o.address.line1}
            <br />
            {o.address.line2}
            <br />
            {o.address.city}, {o.address.state} {o.address.pincode}
            <br />
            {o.address.phone}
          </p>
          {o.status === "delivered" && (
            <div className="narrow">
              <Field
                label="Reason for return (at least 8 characters)"
                value={reason}
                minLength={8}
                onChange={(e: any) => setReason(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={busy || reason.length < 8}
                onClick={() => action("return")}
              >
                Request a return
              </Button>
            </div>
          )}
          {["confirmed", "payment_failed"].includes(o.status) &&
            o.payment_method !== "razorpay" &&
            !["paid", "test_paid"].includes(o.payment_status) && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => action("cancel")}
              >
                Cancel order
              </Button>
            )}
          {o.return_reason && <p>Return request: {o.return_reason}</p>}
        </div>
        <aside className="summary-card">
          <h2>Order summary</h2>
          <Totals quote={o} />
          {o.payment_method === "razorpay" &&
            ["awaiting_payment", "payment_failed"].includes(o.status) && (
              <Button
                className="primary-button full"
                disabled={busy}
                onClick={pay}
              >
                {busy
                  ? "Opening payment…"
                  : o.test
                    ? "Pay with Razorpay test mode"
                    : "Pay with Razorpay"}
              </Button>
            )}
          <p className="subtle">
            {o.email_status === "sent"
              ? "An order email has been sent."
              : o.email_status === "unconfigured"
                ? "Email service is not configured. Keep this order number for reference."
                : "The order email could not be delivered; the store can resend it."}
          </p>
          <Button variant="outline" className="full" onClick={load}>
            Refresh order status
          </Button>
          <SiteLink href="/account" className="text-link">
            Your account & orders <ArrowRight size={16} />
          </SiteLink>
        </aside>
      </div>
    </div>
  );
}
const policyText: any = {
  shipping: {
    title: "Shipping across India",
    intro:
      "Draft shipping policy — merchant approval required before live sales.",
    sections: [
      [
        "Where we deliver",
        "Banashree serves Bangalore and ships across India. Final serviceable PIN codes and courier partners are to be confirmed.",
      ],
      [
        "Charges & estimated delivery",
        "The checkout shows the current configured delivery charge and free-shipping threshold. Sample estimates are 4–8 business days after dispatch; dispatch timelines and holiday exceptions must be confirmed by the store.",
      ],
      [
        "Order tracking",
        "When the team marks your order as shipped, your carrier and tracking number appear in the order details. Contact the store if a parcel has not arrived.",
      ],
      [
        "Details to complete",
        "Confirm dispatch times, remote-area fees, lost-parcel procedures, carrier partners, and responsibility for address changes.",
      ],
    ],
  },
  returns: {
    title: "Returns & exchanges",
    intro:
      "Draft returns policy — final eligibility and time limits are not yet supplied.",
    sections: [
      [
        "Request a return",
        "After an order is marked delivered, use “Request a return” in the order details and explain the issue. The team reviews each request; submitting a request does not automatically approve a return or refund.",
      ],
      [
        "Before you send an item",
        "Contact the store for return approval and the correct return address. Keep the saree, tags, packaging and order information available.",
      ],
      [
        "Custom finishing",
        "The store must confirm how fall & pico finishing affects cancellation, returns and exchanges before live sales.",
      ],
      [
        "Details to complete",
        "Return window, eligible conditions, damaged-item evidence, reverse shipping fees, exchange availability, refund timing, and COD refund method must be finalised.",
      ],
    ],
  },
  privacy: {
    title: "Your privacy",
    intro:
      "Draft privacy policy — review and complete before collecting real customer data.",
    sections: [
      [
        "Information this website collects",
        "Accounts store your name, email and a password hash. Orders store contact information, shipping addresses, purchased items, payment references and order status. Wishlists and saved addresses are associated with your account.",
      ],
      [
        "Payments",
        "Razorpay handles online payment details. This store does not store full card numbers, UPI credentials, or payment PINs.",
      ],
      [
        "Cookies & service providers",
        "Essential HTTP-only cookies keep you signed in and identify your shopping bag. Hosting, payment and configured email providers process information necessary to operate these services.",
      ],
      [
        "Details to complete",
        "Add the business legal name, privacy contact, data retention periods, deletion/request process, provider details and applicable disclosures before launch.",
      ],
    ],
  },
  terms: {
    title: "Terms of service",
    intro:
      "Draft terms — business identity and final commercial terms require merchant review.",
    sections: [
      [
        "About this store",
        "Banashree silk and sarees is a Bangalore saree shop shipping across India. Legal business name, registered address and tax details have not yet been supplied.",
      ],
      [
        "Sample catalogue",
        "Items marked “Sample” and illustrative photographs demonstrate the store experience. They are not confirmed inventory, quality certifications, or offers for live sale. Sample items are blocked from live checkout.",
      ],
      [
        "Prices & payments",
        "Prices use INR. Discounts, shipping and configurable tax are calculated on the server. An order is paid only after server verification of a captured payment, or an authorised COD collection record.",
      ],
      [
        "Details to complete",
        "Confirm acceptance of orders, product descriptions, pricing corrections, cancellation terms, dispute handling, jurisdiction and contact information before live sales.",
      ],
    ],
  },
};
function Info({ page }: any) {
  const { settings: s } = useStore();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const policy = policyText[page];
  if (policy)
    return (
      <article className="container prose">
        <div className="eyebrow">THE DETAILS</div>
        <h1>{policy.title}</h1>
        <Notice>{policy.intro}</Notice>
        {policy.sections.map(([h, p]: string[]) => (
          <section key={h}>
            <h2>{h}</h2>
            <p>{p}</p>
          </section>
        ))}
        <SiteLink href="/contact" className="text-link">
          Contact the store <ArrowRight size={16} />
        </SiteLink>
      </article>
    );
  if (page === "about")
    return (
      <div className="container">
        <div className="about-grid">
          <Pic
            src="/images/saree-emerald.jpg"
            alt="Illustrative emerald silk saree"
            eager
          />
          <div>
            <div className="eyebrow">Banashree · BANGALORE</div>
            <h1>
              A saree for
              <br />
              every chapter.
            </h1>
            <p>
              Welcome to Banashree silk and sarees. We serve saree lovers in
              Bangalore and ship across India.
            </p>
            <p>
              Browse silks for celebrations, cottons for everyday moments, and
              occasion edits to help you find your next saree.
            </p>
            <p className="subtle">
              Our detailed brand story will be added by the store. We make no
              unverified claims about sourcing, weaving, certifications or years
              in business.
            </p>
            <SiteLink className="button" href="/shop">
              Explore the collection <ArrowRight size={16} />
            </SiteLink>
          </div>
        </div>
      </div>
    );
  if (page === "contact") {
    async function send(e: any) {
      e.preventDefault();
      setBusy(true);
      setError("");
      try {
        const d = Object.fromEntries(new FormData(e.currentTarget));
        const r = await api("contact", d);
        setMessage(r.message);
        e.target.reset();
      } catch (e: any) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }
    return (
      <div className="container">
        <div className="page-heading">
          <div className="eyebrow">WE’D LOVE TO HEAR FROM YOU</div>
          <h1>Let’s find your saree.</h1>
        </div>
        <div className="two-columns">
          <div>
            <h2>Visit Banashree</h2>
            <p>
              Bangalore, India
              <br />
              {s.address}
            </p>
            <p>
              Phone: {s.phone}
              <br />
              Email: {s.email}
              <br />
              WhatsApp: {s.whatsapp}
            </p>
            <p className="subtle">
              Bracketed contact details are awaiting the store’s information.
              Opening hours will be added once confirmed.
            </p>
            {/^\d{10,15}$/.test(s.whatsapp) && (
              <SiteLink
                className="button"
                href={"https://wa.me/" + s.whatsapp}
                target="_blank"
                rel="noreferrer"
              >
                Chat on WhatsApp
              </SiteLink>
            )}
          </div>
          <form onSubmit={send}>
            <h2>Send an enquiry</h2>
            <Field label="Your name" name="name" required minLength={2} />
            <Field label="Email address" name="email" type="email" required />
            <label className="field">
              <span>Your message</span>
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={2000}
                rows={5}
              />
            </label>
            {error && <Notice error>{error}</Notice>}
            {message && <Notice>{message}</Notice>}
            <Button className="primary-button" disabled={busy}>
              {busy ? "Saving…" : "Send enquiry"}
              <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </div>
    );
  }
  if (page === "faq")
    return (
      <div className="container prose">
        <div className="eyebrow">A LITTLE GUIDANCE</div>
        <h1>Your questions, answered.</h1>
        {[
          [
            "Do you ship outside Bangalore?",
            "Yes, Banashree ships across India. Courier coverage and final delivery timelines must be confirmed by the store.",
          ],
          [
            "Is this a live shopping catalogue?",
            "Items marked Sample are demonstration products with illustrative photographs. Demo orders do not collect real payment or arrange shipment.",
          ],
          [
            "Is a blouse piece included?",
            "Check the blouse-piece information on each saree page. Sample specifications must be verified against actual inventory before launch.",
          ],
          [
            "Can I add fall and pico?",
            "Where offered, the product page lets you add fall & pico finishing. The service charge is shown before you add the saree to your bag.",
          ],
          [
            "How can I track my order?",
            "Sign in and open your order history. Guest shoppers can return to their order page in the same browser. Tracking appears after the team adds the carrier and tracking number.",
          ],
          [
            "How do returns work?",
            "Read the draft returns policy. After delivery, the order page provides a return request form. The store must approve the request and confirm final return terms.",
          ],
        ].map(([h, p]) => (
          <details key={h}>
            <summary>{h}</summary>
            <p>{p}</p>
          </details>
        ))}
      </div>
    );
  if (page === "guide")
    return (
      <div className="container prose">
        <div className="eyebrow">THE ART OF THE DRAPE</div>
        <h1>A little saree guidance.</h1>
        <p>
          A saree’s fit comes from its drape. Check the length and blouse
          details on each product before you choose.
        </p>
        <section>
          <h2>Before you begin</h2>
          <p>
            Wear your blouse and a securely tied petticoat or saree shapewear.
            Put on the footwear you plan to wear so the hem sits comfortably
            above the floor.
          </p>
        </section>
        {[
          [
            "1. Start with a secure tuck",
            "Begin with the plain end at your waist. Tuck as you wrap once around, keeping the lower edge even.",
          ],
          [
            "2. Make your pleats",
            "Fold a neat set of pleats with the remaining front fabric. Align their lower edges and tuck them securely at the waist.",
          ],
          [
            "3. Arrange the pallu",
            "Bring the decorated end around and over your shoulder. Let it fall naturally or fold it into pleats, then secure it gently if needed.",
          ],
          [
            "4. Check comfort and movement",
            "Walk a few steps, adjust your pleats and check the hem. Avoid pulling pins through delicate zari or fine fabric.",
          ],
        ].map(([h, p]) => (
          <section key={h}>
            <h2>{h}</h2>
            <p>{p}</p>
          </section>
        ))}
        <Notice>
          Lengths vary by product. Blouse pieces are unstitched unless the
          listing explicitly says otherwise.
        </Notice>
      </div>
    );
  return (
    <div className="container">
      <Empty
        title="This page hasn’t been woven yet"
        text="Return to the collection to find your next saree."
      />
    </div>
  );
}
