# WeDoBizness — Project State & Next Steps

## Live integrations
- **Stripe** (7ATIM LTD, `acct_1UWYCgRi3HRGubNs`, live mode). Old links from the previous account were removed. New products:
  - $29 The Scaling Playbook: `prod_VXdrAtqHiifgTf` / `price_1UWYZmRi3HRGubNsZA9MGDst` (tax inclusive)
  - $750 Website Funnel Build: `prod_VXdrTkSfbArgin` / `price_1UWYZoRi3HRGubNsqZL3TeYJ` (tax exclusive)
  - $1,500/mo Media Buying Management: `prod_VXdrZQ029kZj3o` / `price_1UWYZqRi3HRGubNsd4ppPAUw` (recurring, tax exclusive)
  - Payment Links pending: account activation must finish before cards are available. Then paste the URLs into `CONFIG.stripe` in `index.html` and the two buttons in `offers.html`. Until then the buttons scroll to the Apply/booking section.
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
