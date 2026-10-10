# WeDoBizness — Project State & Next Steps

## Live integrations
- **Stripe** (account "7atim ltd", live mode) — three Payment Links, wired into `index.html` CONFIG:
  - $29 guide → `https://buy.stripe.com/dRm7sE0oH5iI9WicsrgrS01`
  - $750 funnel → `https://buy.stripe.com/00w9AMb3l6mMd8ueAzgrS02`
  - $1,500/mo media buying (subscription) → `https://buy.stripe.com/bJedR21sL9yYfgC2RRgrS03`
- **Calendly** — `https://calendly.com/agenciaoff/30min`, embedded inline in the Apply section. Renders only on a live http(s) domain.
- **Hosting** — Hostinger (`public_html`).

## In this repo
- `index.html` — full landing page (Stripe checkout, inline Calendly, geo-currency, price-rise countdown, 6-of-10 scarcity, mobile menu). Currency selector is in the footer. Application form was intentionally removed — booking is Calendly-only.
- `thank-you.html`, `email/guide-delivery-email.html` — digital delivery for the $29 guide.
- `assets/`, `docs/BRAND.md`, `README.md`.

## Done elsewhere (delivered to the user, not yet in repo)
Brand kit page, 3 offer one-pagers (PDF), the 10/11-page $29 Scaling Guide (PDF), 8 ad creatives (EN + Simplified Chinese, 1080×1080, with anonymized Shopify dashboard proof), ad copy (EN + CN). These are **binary/source regenerated** from a build pipeline (base64-embedded fonts + Playwright HTML→PDF/PNG). The `marketing/` folder is the place to add their sources; the client dashboard screenshots are needed to rebuild the guide/ads and must be re-supplied.

## Open / next steps
- Add the marketing sources (offers.html, guide.html, ad HTML, build scripts) and regenerate the PDFs/PNGs into `marketing/`.
- **Stripe dashboard TODO (user):** enable **Adaptive Pricing**; turn on more payment methods (iDEAL, Bancontact, SEPA, Alipay, WeChat, Klarna, etc.); fix the "Scallig Guide" typo on the $29 line item.
- **Guide auto-delivery:** set the $29 Payment Link's after-payment redirect to `thank-you.html` (host the PDF first). Optional: Make.com/Zapier or a webhook to email the PDF.
- **Countdown:** `offer.deadlineISO` is set to 2026-12-31; change it or switch `rolling:true` for an evergreen per-visitor timer.
- **Judgment flag:** the $1,500 Media Buying card currently takes direct payment. It's an eligibility-gated offer, so consider switching that button back to "Apply for a spot" (Calendly-first).

## Conventions
- Commits authored as **hatim**. No references to any AI assistant in branches, commits, or PRs.
- Brand copy avoids em-dashes. See `docs/BRAND.md`.
