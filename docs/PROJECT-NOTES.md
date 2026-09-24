# NAXIS website — project notes

Working knowledge for anyone (human or AI session) picking this project up.
Loaded automatically into Claude Code sessions via `CLAUDE.md`. Keep it
current when something here changes.

## What this is

Marketing site for **NAXIS Australia** — an Australian-based private label
apparel development, manufacturing and supply chain company, with its own
facilities plus specialist partner factories across six countries (Sri
Lanka, India, Bangladesh, Vietnam, China, Italy). The site's job is B2B
lead generation: brands wanting their own clothing line.

Stack: Next.js 16.3.4 (App Router — read `AGENTS.md`; APIs differ from
older Next), React 19.2.8, Tailwind v4, GSAP + ScrollTrigger, Lenis smooth
scroll. No backend, no env vars.

## Branches and deploys

- `main` → Vercel **Production**: https://naxis-v1.vercel.app
- `v1-homepage-rebuild` → iteration branch; every push gets a Vercel
  Preview. V1 of the homepage shipped to `main` on 2026-09-24 (`46a559e`).
- Workflow: work on `v1-homepage-rebuild`, push, wait for its Vercel
  preview to succeed, then fast-forward `main` — **only when the owner asks**.
- Plan: keep refining V1, then a full top-to-bottom V2 later.
- Deployment status without `gh`: public GitHub API
  `/repos/Eranga27/naxis-v1/deployments` and `/deployments/{id}/statuses`.

## Conventions

- `[CONFIRM WITH CLIENT]` — use this literal string for any unconfirmed
  real-world fact (contact details, figures, names). Never invent plausible
  values, and never label content "from the client" unless it is.
- Placeholder images/videos are intentional stand-ins; don't flag them.
- Before calling work done: `npx eslint src scripts`, `npm run build`
  (clean), and check it in a browser at phone (≈375–390px), tablet (768)
  and desktop widths, plus `prefers-reduced-motion`.
- If Turbopack throws an odd internal error unrelated to a file:
  `rm -rf .next` and rebuild before assuming a code bug.
- One logical change per commit; messages explain *why*.
- Every animated component must short-circuit to a static final state
  under `prefers-reduced-motion` — this has been true everywhere so far.

## Client source material (`client-details/`)

- `NAXIS AUSTRALIA (1).pdf` — 6-page company profile. **Image-based**
  (no text layer); extract page images with `pypdf` to read it. Its copy is
  already transcribed verbatim into `src/content/services.ts`, the About
  and MOQ sections, the process steps and the certifications list.
- 4 artboard PNGs: About (ivory), MOQ (ivory), and two "We make ideas
  wearable" (wattle/eucalyptus on ivory / brown).
- The PDF's photos and certification logos appear AI-generated (e.g. the
  WRAP badge lettering is garbled) — do not put them on the site.
- Positioning confirmed by the client's own copy: own manufacturing
  facilities **and** a partner network; private label; Australian-based.

## Still placeholders (waiting on the client)

- Contact email / phone / WhatsApp → `src/lib/contact.ts`
- Product categories in `Capabilities.tsx` (not in any client material)
- All photography (stock) — incl. `public/images/services/*`
- Fonts: Source Serif 4 and Allura stand in for the artboards' serif and
  script (`layout.tsx`)
- Wattle foliage is procedural vector art (`WattleFoliage.tsx`) until the
  client sends the layered artwork
- Official certification logos + which facility holds which certificate
- Per-country roles, proof points (years, capacity, clients), AU address

## Design system

- Colours in `src/app/globals.css` (`:root` + `@theme inline`); JS mirrors
  for GSAP writes in `src/lib/brand.ts`. Gold + emerald are the paired
  accents (Australia's green and gold, as in the client artwork).
- Utilities: `text-gradient-brand` / `-deep`, `bg-gradient-brand` / `-deep`.
- Fonts: `font-headline` (Bebas Neue — section headlines), `font-display`
  (Poppins, sparing; Ideas Wearable uses Poppins Black to match the
  artboard), `font-body` (Inter), `font-serif`, `font-script`,
  `font-greeting` (preloader).
- `--color-phrase-*` are sampled from the client's "ideas wearable" art.

## Code map

- `src/app/page.tsx` — homepage section order.
- `src/app/services/[slug]/page.tsx` — SSG service pages
  (`dynamicParams = false`).
- `src/content/services.ts` — single source for the Services section and
  pages. `src/content/networkMap.ts` + `public/images/network-map.svg` are
  **generated** by `scripts/build-world-map.mjs` — edit the script, not them.
- `src/lib/pinnedGallery.ts` + `TickRail.tsx` — shared scroll-pinned
  horizontal gallery (Capabilities, ProcessTimeline).
- `src/lib/intro.ts` — preloader ↔ hero entrance handshake.
- `media-library/` — tracked masters not served (hero 4K master, retired
  media). `new-media/` — **git-ignored**, 118MB of local stock, only on the
  owner's machine.

## GSAP / scroll gotchas learned the hard way

- A GSAP `x`/`y` tween overwrites the CSS `translate` property — never
  animate x/y on an element positioned with Tailwind `translate-*`
  utilities; wrap it or animate opacity only.
- Tweens/triggers created in a later callback (e.g. `onComplete`) aren't
  recorded by `gsap.context` — wrap them in `ctx.add(...)`.
- `gsap.matchMedia()` instances: keep a reference and `mm.revert()` in
  cleanup. Some components still use the deprecated
  `ScrollTrigger.matchMedia` (works; migrate when touched).
- Pin lengths must be functions (`end: () => ...`) with
  `invalidateOnRefresh`, never numbers captured at load.
- Hero pins only after its entrance finishes; Mission listens for the
  `hero:pinned` event to refresh — see comments in `Mission.tsx`.
- Gradient-clipped text can't carry a parent's `text-shadow`; use a
  `drop-shadow` filter.
- SVG gradients inside a `display:none` SVG don't paint — shared defs live
  in an always-rendered zero-size SVG.
- After hot-reloading `page.tsx` while GSAP pins wrap sections, React can
  throw `insertBefore … not a child` — HMR residue; a fresh load is clean.

## Verifying visually

- The preloader plays once per browser session:
  `sessionStorage.setItem('naxis:intro-seen','done')` to skip it,
  `removeItem` to replay.
- The Claude desktop Browser pane stops painting when the window is
  occluded (rAF frozen, black/timed-out screenshots). Use
  `scripts/visual-check.mjs` (headless Chrome over CDP) instead — it
  screenshots sections at any viewport and reports horizontal overflow
  and console errors.

## Next up

- **Scroll-scrubbed "thread to doorstep" sequence** (owner is producing
  2–3 clips in Runable): extract frames with ffmpeg to WebP/AVIF (≈150
  desktop / ≈75 mobile), draw to `<canvas>` from ScrollTrigger progress,
  load on approach. Planned between Process and Services. Clip brief: 4–8s
  each, ≥1080p, 24–25fps, one continuous slow camera move, chained with
  first/last-frame, subject centred, no faces/hands/readable text.
- Client questions above; "Delivering excellence through experience" is a
  sign-off lockup, not a headline.
