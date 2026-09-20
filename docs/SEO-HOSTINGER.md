# Ascent SEO and Hostinger launch

Production URL: **https://ascent.withcloud.io**.

## Deploy the server application

This is a TanStack Start server-rendered application with server functions, authentication and webhooks. Use Hostinger Node.js hosting or a VPS with a Node.js process; uploading just the client assets to `public_html` does not deploy the application.

- Install dependencies with `npm ci`.
- Build with `npm run build:hostinger` (selects Nitro's Node server target without changing Lovable's default target).
- Start with `npm start`, or use `.output/server/index.mjs` as the server entry. Deploy the complete `.output` directory, including `.output/public`.
- Use Node.js 22.12+ and the port provided by the hosting environment. On a VPS, proxy HTTPS traffic to the Node process.
- Set the required environment variables from `.env.example`. Set `APP_URL=https://ascent.withcloud.io`; provide the public `VITE_*` configuration at build time and server secrets at runtime.
- Point the `ascent` subdomain at the host using the DNS records Hostinger supplies. Enable SSL and redirect HTTP to HTTPS. Redirect any alternate production hostname to this hostname with a permanent redirect, retaining paths and query strings.
- Update Supabase's Site URL and allowed authentication redirects for this domain, and configure production payment/webhook URLs where applicable.

Hostinger's deployment workflow: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/

## Search configuration

Public landing, pricing, catalog, course, career-path and project-brief pages have self-referencing HTTPS canonical URLs, page-specific descriptions, Open Graph and Twitter metadata. The home page has Organization and WebSite structured data; detail pages have breadcrumbs, and courses have Course structured data. These describe the actual content and do not guarantee rich search results.

Account, profile, lesson, certificate, community and other application pages inherit `noindex, follow`. Public discovery routes explicitly opt in to indexing. If a new public route is added, use `seoHead` and include it in `sitemapPaths`. The sitemap derives course, path and project URLs from the content catalog so additions stay in sync. Robots allows crawling HTML pages so crawlers can read their noindex tags; noindex is not access control.

The canonical domain is defined in `src/lib/seo.ts` and `public/robots.txt`. Avoid indexing preview deployments by protecting them or setting a host-level `X-Robots-Tag: noindex` header there only.

## After deploying

1. Check `/`, `/learn`, `/paths`, `/pricing` and at least one course URL in page source. Confirm a single canonical on `ascent.withcloud.io`, the expected title, server-rendered content and `index, follow`.
2. Confirm `/auth` and `/dashboard` contain `noindex`, and an unknown course URL returns HTTP 404.
3. Open `https://ascent.withcloud.io/robots.txt` and `https://ascent.withcloud.io/sitemap.xml`. Both should return HTTP 200; the sitemap must be XML, not an HTML fallback.
4. Verify the domain in Google Search Console using the DNS TXT record it provides, then submit `https://ascent.withcloud.io/sitemap.xml`. Inspect the home page and a course URL and request indexing.
5. Validate structured data using Google's Rich Results Test and Schema.org's validator. Monitor Search Console indexing and Core Web Vitals after real traffic arrives.

Google references: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics and https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

DNS, SSL, hosting settings and Search Console verification require access to the corresponding accounts and are not performed by these code changes.
