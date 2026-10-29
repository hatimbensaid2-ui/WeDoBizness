# WeDoBizness

Website and marketing assets for **WeDoBizness** — a productized e-commerce performance agency. We build the structure behind traffic (high-converting funnels, retention, loyalty, LTV) for established stores.

> **Positioning:** More profit from the traffic you already pay for.

## What's in here

```
.
├── index.html                 # The landing page (self-contained, deploy as-is)
├── thank-you.html             # Post-payment download page for the $29 guide
├── assets/
│   ├── mark.svg               # Logo mark
│   └── favicon.svg            # Favicon
├── email/
│   └── guide-delivery-email.html   # Delivery email template (Make/Zapier/webhook)
├── marketing/                 # Source files for collateral (PDFs/ads regenerated from these)
└── docs/
    ├── BRAND.md               # Brand system: colors, fonts, logo, voice
    └── HANDOVER.md            # Full project state & next steps
```

## The three offers

| Offer | Price | Stripe |
|---|---|---|
| Scaling Playbook (guide) | $29 one-time | Payment Link |
| Website Funnel Build | $750 one-time | Payment Link |
| Media Buying Management | $1,500/month | Payment Link (subscription) |

## Configuration

All site settings live in the `CONFIG` object near the bottom of `index.html`:

- **`stripe`** — the three live Payment Link URLs.
- **`calendly`** — booking link (also embedded inline in the Apply section).
- **`offer`** — the $29 → $49 price-rise countdown (`deadlineISO`, or set `rolling:true` for a per-visitor 48h timer).
- **`mediaBuying`** — scarcity counter (`capacity` / `taken`). Update `taken` as clients come and go.
- **`rates` / `symbols` / `methods`** — display currency + payment-method hints by currency.

### Stripe notes
- Leave each Payment Link's methods on **Automatic** so Stripe shows local methods per country.
- Enable **Adaptive Pricing** in Stripe to charge buyers in their own currency.

## Deploy

The site is a static, self-contained page.

- **Hostinger:** upload `index.html` (and `thank-you.html`) to `public_html`.
- **Any static host** (Netlify, Vercel, Cloudflare Pages, GitHub Pages): drop the files in.

External dependencies load from CDN at runtime: Google Fonts, Calendly widget, Stripe (via links). The Calendly calendar only renders on a live http(s) domain, not from a local file.

## Motion, 3D and speed

**Every page:** Lenis smooth scroll + GSAP scroll reveals (`assets/motion.js`), a CSS hero intro (in `assets/motion.css`, inlined into each page), count-up stats, scroll progress bar, magnetic CTA buttons.

**Homepage extras** (`assets/fx.css` + `assets/fx.js`):
- **Hero:** a soft CSS brand glow on every device. On desktops, an animated [ShaderGradient](https://github.com/ruucm/shadergradient) fades in over it.
- **3D logo marks** ([React Three Fiber](https://github.com/pmndrs/react-three-fiber)) in the orange "steroids" band, desktop only.
- **Floating CTA pill:** frosted CSS glass everywhere. On strong desktops it upgrades to real WebGL refraction ([liquid-glass-js](https://github.com/dashersw/liquid-glass-js)).

### Speed rules (verified with Lighthouse: home mobile 99, desktop 100, same as before the effects)
- Nothing above the fold waits for JavaScript. The hero intro is pure CSS and the headline is never hidden, so it paints on the first frame.
- All JS (Lenis, GSAP, motion.js, fx.js) loads **after** the page has loaded and its main content has painted (small inline loader at the bottom of each page).
- 3D only on desktop-class machines (mouse, 900px+ wide, 4+ cores, 4GB+ RAM), loaded on first interaction or after 3.5s of quiet, paused when off screen.
- WebGL glass only on 8+ core / 8GB+ desktops, and its one-off page snapshot runs only while the visitor is idle.
- Phones, reduced-motion and data-saver visitors get zero WebGL.
- CSS/JS URLs carry `?v=<hash>` and `.htaccess` caches them for a year (HTML always revalidates).

### Editing
- After changing any CSS/JS in `assets/`, run `python3 src/stamp_assets.py` (refreshes version hashes and the inlined motion CSS).
- 3D source is `src/3d/main.jsx`; rebuild with `cd src/3d && npm install && npm run build`, then run the stamp script.
- Deploy: upload the HTML files, `.htaccess` and the whole `assets/` folder. `src/` stays off the server.

## Guide delivery (digital product)

When someone buys the $29 guide:
1. Host the guide PDF (e.g. `public_html/downloads/…`).
2. Point `thank-you.html`'s download link at it, and set the Stripe Payment Link's **after-payment redirect** to `thank-you.html`.
3. Optional: auto-email the PDF via Make.com/Zapier (trigger on `checkout.session.completed`) or a server webhook, using `email/guide-delivery-email.html`.
