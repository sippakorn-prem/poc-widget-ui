# Widget UI POC

Standalone static iframe widget for the deployed cross-origin POC.

This folder is intentionally separate from `ace-omnichat-web`. It has no Next.js, React, pnpm, or Vite dependency. Deploy it as static files to Cloudflare Pages.

## Files

- `shell.js` runs on the customer site and injects one iframe.
- `frame/index.html` is the iframe document.
- `frame/main.js` calls the POC Go API bootstrap endpoint and renders the demo chat UI.
- `frame/styles.css` styles the iframe UI.
- `_headers` is for Cloudflare Pages security headers, including `frame-ancestors`.

## Local Run

From this folder:

```bash
python3 -m http.server 5173
```

Then embed the widget from another local site, for example a page served at `http://localhost:5174`:

```html
<script
  async
  src="http://localhost:5173/shell.js"
  data-widget-key="wk_demo"
  data-api-url="http://localhost:8080"
></script>
```

The shell passes the host page origin to the iframe. The iframe calls:

```text
GET /widget/v1/bootstrap?key=wk_demo&host=<host-page-origin>
```

## Deploy To Cloudflare Pages

1. Create a new repo from this folder.
2. Create a Cloudflare Pages project.
3. Use no build command.
4. Set the output directory to `/` or leave it as the project root, depending on the Cloudflare Pages setup.
5. Deploy.
6. Replace `https://<C>` in `_headers` with the allowed demo client origin.
7. Redeploy after editing `_headers`.

## Demo Snippet

On the allowed client site:

```html
<script
  async
  src="https://<B>/shell.js"
  data-widget-key="wk_demo"
  data-api-url="https://<A>"
></script>
```

Where:

- `<A>` is the Railway Go API origin.
- `<B>` is this widget UI Cloudflare Pages origin.
- `<C>` is the allowed customer/demo client origin.

The API should be configured with:

```text
WIDGET_ORIGIN=https://<B>
ALLOWED_HOSTS=https://<C>
```

## CSP Allowlist

Cloudflare Pages reads `_headers` from the deploy root:

```text
/*
  Content-Security-Policy: frame-ancestors https://<C>
  X-Content-Type-Options: nosniff
```

Replace `https://<C>` with the allowed client site origin before the final demo deploy.
