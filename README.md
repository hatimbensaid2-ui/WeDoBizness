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

## Motion (smooth scroll + animations)

Every page loads a shared motion layer:

- `assets/vendor/`: self-hosted Lenis 1.3.27 and GSAP 3.15.0 (core, ScrollTrigger, SplitText). No CDN needed.
- `assets/motion.css`: Lenis base CSS, header shadow, scroll progress bar.
- `assets/motion.js`: Lenis smooth scroll (with header-offset anchor links), hero intro with line-by-line headline reveal, staggered scroll reveals, count-up stats, magnetic CTA buttons on desktop.

Homepage extras (`assets/fx.css` + `assets/fx.js`, loaded only on `index.html`):

- **Hero gradient:** an animated [ShaderGradient](https://github.com/ruucm/shadergradient) in brand orange, cream and peach behind the headline.
- **3D logo marks:** the growth-arrow mark extruded in 3D with [React Three Fiber](https://github.com/pmndrs/react-three-fiber), floating in the orange "steroids" band (desktop only).
- **Liquid glass CTA:** a floating "Apply / $29 playbook" pill using [liquid-glass-js](https://github.com/dashersw/liquid-glass-js) for real WebGL refraction on desktop, with a frosted CSS-glass fallback on phones.

The gradient and marks are compiled into `assets/vendor/wdb-3d.js` from `src/3d/main.jsx`. It loads lazily after the page is ready and pauses when off screen. To change colors or motion, edit `src/3d/main.jsx`, then run `cd src/3d && npm install && npm run build`. `src/` does not need to be uploaded to the server.

Visitors with "reduce motion" turned on get plain, instant scrolling and no reveals (and no 3D or WebGL glass). If the scripts ever fail to load, content still shows after 2.5s. Upload the `assets/` folder together with the HTML files when deploying.

## Guide delivery (digital product)

When someone buys the $29 guide:
1. Host the guide PDF (e.g. `public_html/downloads/…`).
2. Point `thank-you.html`'s download link at it, and set the Stripe Payment Link's **after-payment redirect** to `thank-you.html`.
3. Optional: auto-email the PDF via Make.com/Zapier (trigger on `checkout.session.completed`) or a server webhook, using `email/guide-delivery-email.html`.
