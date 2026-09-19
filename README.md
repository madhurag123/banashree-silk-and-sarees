# Banashree silk and sarees

**Client preview:** https://madhurag123.github.io/banashree-silk-and-sarees/

A mobile-friendly client design preview of an Indian saree boutique, with ivory backgrounds, maroon accents and bold brand lettering.


## Catalogue update

The preview now includes **24 sample saree designs and 30 colour choices**, with a dedicated **Mysore Silk** collection. Three Mysore designs each offer three colours; selecting a colour updates its matching photograph and stock, and the shopping bag keeps colours separate. Finishing add-ons and their sample charges have been removed.

The source archive includes the new colour-image database migration and admin image field. Type checks, both builds, preview checks and 16 local customer/admin journey groups passed. Photography and inventory remain illustrative.

## Complete project source

Download [banashree-source.zip](banashree-source.zip) and extract the `banashree-github` folder. It contains the full frontend, backend, relational database schema, administrator dashboard, tests, environment-variable template and setup/deployment instructions.

The files displayed at the root of this repository are the directly uploaded static preview. The complete structured development project is supplied in the source archive. No privileged source-import workflow is installed.

## Preview features

- Home, collections, search, filters, sorting, pagination, product galleries and supporting pages.
- Sample shopping bag and wishlist saved only in the visitor's browser.
- Responsive phone, tablet and desktop layouts.
- Clearly labelled illustrative sample products and photography.

**This is a client design preview, not an operating shop.** Order submission, payments, account creation, contact submissions and administration are disabled. No customer data or private setup keys are included.

GitHub Pages serves static files only. Deploy the full backend using the archive's `DEPLOYMENT.md` to operate the actual store. For further details see [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## Publishing

GitHub Pages is configured for branch `main`, folder `/ (root)`. Keep the preview entry point and its image, CSS, JavaScript and font files together. The source archive also contains a standard `/docs` build and `GITHUB-PAGES.md` instructions for maintaining the full development project.

Photography provenance is in [IMAGE-SOURCES.json](IMAGE-SOURCES.json). The bundled font license is [OFL.txt](OFL.txt).


## Review and run the static preview

The public demo is the quickest review path. To run the same preview locally, install Git and Python 3, then run these commands from a directory that will contain the clone:

```sh
git clone https://github.com/madhurag123/banashree-silk-and-sarees.git
python3 -m http.server 8768 --bind 127.0.0.1
```

Keep the server in the **parent directory** of the clone and open **http://127.0.0.1:8768/banashree-silk-and-sarees/**. The published assets use that repository path; serving only the repository root at `/` will produce missing JavaScript and CSS files. Stop the server with Ctrl+C. No credentials, database, or package installation are needed for this static preview.

For the complete development application, extract `banashree-source.zip` and follow its `README.md`, `.env.example`, `GITHUB-PAGES.md`, and `DEPLOYMENT.md`. The archive uses React/TypeScript, a server API, and Cloudflare D1; the Pages site serves only the compiled preview. Keep generated setup keys and local configuration private.

## Verification and next steps

On 18 September 2026, the public preview and the matching local static files loaded successfully at the repository path. This confirms static serving, not production checkout or external payment/email integrations.

When changing the preview, check Home → Shop → product details, search/filter behavior, wishlist and bag persistence, and the disabled account/checkout notices on desktop and a narrow screen. Keep sample labels visible.

Next steps: import the structured development source into normal versioned files for easier code review; add a repeatable preview check; and record the exact personal contribution and tools/assistance used in the project. Full-store launch requires the separate deployment and external-service checks in the source archive.
