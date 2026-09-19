# GitHub Pages client preview

The `docs/` directory contains a static, mobile-friendly client design preview of Banashree silk and sarees. The complete frontend, backend, database schema, migrations and admin dashboard source are also included in this repository.

## Preview scope

- The home page, collections, search, filters, sorting, pagination, product galleries, policies and responsive layouts can be reviewed.
- Preview bag and wishlist selections stay in the visitor's browser. They contain sample product IDs and quantities, not customer accounts or personal details.
- Checkout, contact, login and administrator forms are visibly marked and disabled. API calls that could create accounts, orders, payments, enquiries or admin changes are rejected in preview mode.
- No payment keys, administrator setup keys, session cookies or customer database records are included in this repository or the Pages build.
- All products and photography remain labelled as samples. The preview is not an operating online shop.

GitHub Pages is static hosting and is not intended for running an e-commerce business. Deploy the full backend using `DEPLOYMENT.md` before enabling real sales. See [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## Publish

1. Push this project to a repository named `banashree-silk-and-sarees`.
2. In **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/docs**, then Save.
3. GitHub will display the verified public Pages URL when deployment completes.

The source directory for the static entry point is `github-pages/`. The shared storefront is `app/store.tsx`; `lib/pages-preview.ts` provides the explicitly limited browser preview. Hash-based routes allow product pages and links to reload reliably on GitHub Pages.

## Rebuild the preview

```sh
npm ci
npm run test:pages
npm run build:pages
npm run preview:pages
```

Commit the generated `docs/` folder after a preview rebuild. The `/docs` directory is the Pages publishing source; `public/` contains its images and bundled font. The local preview URL is printed by Vite.

If the repository name changes, rebuild with the matching path:

```sh
PAGES_BASE_PATH=/your-repository-name/ npm run build:pages
```

For a user-site repository named `USERNAME.github.io`, use `PAGES_BASE_PATH=/`.

## Run the full store

Follow `README.md` and `DEPLOYMENT.md`. The full app uses its real authenticated backend whenever it is rendered by the normal Vinext entry point, which does not enable the GitHub Pages preview marker. GitHub Pages cannot run the Worker API or D1 database.

## Current browser-upload deployment

The public madhurag123 repository currently serves a flat bundle from main / (root), with the structured source in banashree-source.zip. To reproduce that bundle after `npm run build:pages`, run:

```sh
node scripts/export-pages-flat.mjs ../../work/github-upload/banashree-silk-and-sarees
```

Upload the rebuilt index, its referenced hashed JavaScript/CSS, new images, image provenance and refreshed source archive to the repository root. Preserve the existing root README. The standard /docs build remains available if the complete structured source is later checked into the repository.

The catalogue contains 24 designs and 30 colour choices. Three Mysore Silk designs each have three colours, with matching photos and independent stock. Finishing add-ons are removed from the shopping page and sample prices. All images, materials, prices and availability are illustrative.
