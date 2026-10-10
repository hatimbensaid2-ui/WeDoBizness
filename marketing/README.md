# Marketing sources

This folder holds the **source files** for WeDoBizness marketing collateral, so the PDFs and ad images can be regenerated rather than stored as stale binaries.

Add here as they're rebuilt:
- `offers.html` — source for the 3 offer one-pagers (renders to a Letter PDF).
- `guide.html` — source for the $29 Scaling Playbook (needs the client dashboard screenshots to embed).
- `ads/` — the 8 ad creatives (EN + Simplified Chinese, 1080×1080) and their HTML source.
- `build/` — the render scripts (base64-embedded fonts + Playwright HTML→PDF/PNG).

Fonts used: Space Grotesk, Inter (body/headlines), Anton (ad headlines), Noto Sans CJK SC (Chinese). See `../docs/BRAND.md`.
