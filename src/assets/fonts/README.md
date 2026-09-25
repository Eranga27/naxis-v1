# Fonts for generated images

WOFF copies of two Google Fonts, read from disk by `src/lib/og.tsx` when
Next generates the Open Graph share images (the image renderer can't use
the site's `next/font` woff2 files).

- `BebasNeue-Regular.woff` — Bebas Neue by Dharma Type, SIL Open Font
  License 1.1
- `Inter-SemiBold.woff` — Inter by Rasmus Andersson, SIL Open Font License 1.1

Both fetched from fonts.gstatic.com (Google Fonts CSS API, WOFF variant).
