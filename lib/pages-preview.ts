import { defaults, samples, sampleVariants } from "./catalog";

// Only the separately built GitHub Pages document enables this local preview.
// The full-stack app retains its authenticated server API and relational database.
export const isPagesPreview = () =>
  typeof document !== "undefined" &&
  document.documentElement.dataset.preview === "github-pages";
export const previewBase = () =>
  document.querySelector<HTMLMetaElement>('meta[name="preview-base"]')
    ?.content || "/";
export const previewAsset = (src: string) =>
  isPagesPreview() && /^\/(images|fonts)\//.test(src)
    ? previewBase() + src.slice(1)
    : src;
export const previewSearch = () =>
  isPagesPreview()
    ? new URL(location.hash.slice(1) || "/", "https://preview.invalid").search
    : location.search;
export function previewNavigate(path: string) {
  if (isPagesPreview()) location.hash = path;
  else location.href = path;
}
const storageKey = "banashree-client-preview-v1";
type Line = { variantId: string; quantity: number; service: boolean };
type State = { cart: Line[]; wishlist: string[] };
const previewProducts = () =>
  samples.map((p, i) => ({
    ...p,
    sample: 1,
    active: 1,
    created_at: i,
    images: JSON.parse(p.images).map(previewAsset),
    collections: p.collections.split(","),
    variants: sampleVariants(p).map((v) => ({ ...v, image: previewAsset(v.image) })),
  }));
function read(): State {
  try {
    const s = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      cart: Array.isArray(s.cart)
        ? s.cart.filter(
            (x: any) =>
              x &&
              typeof x.variantId === "string" &&
              Number.isInteger(x.quantity) &&
              x.quantity > 0 &&
              x.quantity <= 10 &&
              typeof x.service === "boolean",
          )
        : [],
      wishlist: Array.isArray(s.wishlist)
        ? s.wishlist.filter((x: any) => typeof x === "string")
        : [],
    };
  } catch {
    return { cart: [], wishlist: [] };
  }
}
function write(s: State) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(s));
  } catch {
    throw new Error(
      "Enable browser storage to try the preview bag and wishlist.",
    );
  }
}
function bag(state: State) {
  const ps = previewProducts();
  return {
    items: state.cart.flatMap((line) => {
      const p = ps.find((p) => p.variants.some((v) => v.id === line.variantId));
      if (!p) return [];
      const variant = p.variants.find((v) => v.id === line.variantId)!;
      return [
        {
          ...p,
          id: line.variantId + ":" + Number(line.service),
          variant_id: line.variantId,
          product_id: p.id,
          color: variant.color,
          stock: variant.stock,
          images: [variant.image],
          quantity: line.quantity,
          service: Boolean(line.service && p.fall_pico),
        },
      ];
    }),
  };
}
export async function previewApi(path: string, body?: any): Promise<any> {
  const s = read();
  if (path === "store")
    return {
      products: previewProducts(),
      settings: {
        ...defaults,
        bannerImage: previewAsset(defaults.bannerImage),
      },
      user: null,
    };
  if (path === "cart") {
    if (!body) return bag(s);
    if (body.remove)
      s.cart = s.cart.filter(
        (x) => x.variantId + ":" + Number(x.service) !== body.remove,
      );
    else {
      const p = previewProducts().find(
        (x) => x.variants.some((v) => v.id === body.variantId),
      );
      if (!p) throw new Error("This sample saree is unavailable.");
      const variant = p.variants.find((v) => v.id === body.variantId)!;
      const service = Boolean(body.service && p.fall_pico);
      const line = s.cart.find(
        (x) => x.variantId === body.variantId && x.service === service,
      );
      const quantity = body.replace
        ? body.quantity
        : (line?.quantity || 0) + body.quantity;
      const otherQuantity = s.cart
        .filter((x) => x.variantId === body.variantId && x !== line)
        .reduce((n, x) => n + x.quantity, 0);
      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 10 ||
        quantity + otherQuantity > variant.stock
      )
        throw new Error("Choose a quantity within the sample stock shown.");
      if (line) line.quantity = quantity;
      else s.cart.push({ variantId: body.variantId, quantity, service });
    }
    write(s);
    return bag(s);
  }
  if (path === "account")
    return { wishlist: s.wishlist, addresses: [], orders: [] };
  if (path === "wishlist" && body) {
    if (!previewProducts().some((p) => p.id === body.productId))
      throw new Error("This sample saree is unavailable.");
    s.wishlist = body.remove
      ? s.wishlist.filter((x) => x !== body.productId)
      : [...new Set([...s.wishlist, body.productId])];
    write(s);
    return { wishlist: s.wishlist };
  }
  if (path === "checkout/quote") {
    const cart = bag(s);
    if (!cart.items.length) throw new Error("Your preview bag is empty.");
    const subtotal = cart.items.reduce(
      (n, x) =>
        n +
        (Number(x.price) + (x.service ? Number(x.fall_pico) : 0)) * x.quantity,
      0,
    );
    const coupon = (body?.coupon || "").trim().toUpperCase();
    if (coupon && (coupon !== "WELCOME10" || subtotal < 200000))
      throw new Error(
        "The sample WELCOME10 offer needs a bag of at least ₹2,000.",
      );
    const discount = coupon ? Math.floor(subtotal * 0.1) : 0;
    const shipping =
      subtotal - discount >= defaults.freeShipping ? 0 : defaults.shipping;
    return {
      cart,
      subtotal,
      discount,
      shipping,
      tax: 0,
      total: subtotal - discount + shipping,
      coupon: coupon || null,
      couponPercent: coupon ? 10 : 0,
      settings: defaults,
    };
  }
  throw new Error(
    "Client preview only. Accounts, orders, payments, enquiries and admin changes require the full backend deployment.",
  );
}
