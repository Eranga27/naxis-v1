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
older Next), React 19.2.8, Tailwind v4, GSAP (ScrollTrigger, SplitText,
DrawSVG, Draggable — all free now), Lenis smooth scroll, and three.js
for the homepage globe only (loaded on demand).

The only server code is `src/app/api/enquiry/route.ts`, which sends the
Start a Project brief through Resend. It needs `RESEND_API_KEY`,
`ENQUIRY_FROM` (a verified sending address) and `ENQUIRY_TO` in Vercel;
none are set yet, so it answers 503 and the form falls back to a
prefilled email / copy-to-clipboard. Optional `NEXT_PUBLIC_SITE_URL`
overrides the canonical origin (`src/lib/site.ts`) once the client's
domain is live.

## Branches and deploys

- `main` → Vercel **Production**: https://naxis-v1.vercel.app
- `v1-homepage-rebuild` → iteration branch; every push gets a Vercel
  Preview. V1 of the homepage shipped to `main` on 2026-09-24 (`46a559e`).
- Workflow: work on `v1-homepage-rebuild`, push, wait for its Vercel
  preview to succeed, then fast-forward `main` — **only when the owner asks**.
- The V1 inner pages (`docs/V1-PLAN.md`) were built on
  `v1-homepage-rebuild` on 2026-09-25 and went to `main` the same day at
  the owner's request; later rounds follow the same ask-first workflow.
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
  (no text layer); extract page images with `pypdf` (needs `cffi`) to read
  it. Its copy is transcribed verbatim into `src/content/` (services,
  about, MOQ, process, compliance).
- 4 artboard PNGs: About (ivory), MOQ (ivory), and two "We make ideas
  wearable" (wattle/eucalyptus on ivory / brown). The homepage sets that
  phrase in the site's own faces and green and gold, not the artboards'
  rainbow letters: the owner found those broke from the rest of the site.
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
- Official certification logos + which facility holds which certificate.
  The tags' "what it covers" lines describe each standard, not NAXIS's
  certificates (`src/content/compliance.ts`).
- "Responsible sourcing. Stronger tomorrow." (Compliance page) is printed
  on the swing tag in the profile's page 6 photo — confirm they want it
- Per-country roles, proof points (years, capacity, clients), AU address
- Enquiry delivery: Resend account + verified domain, then the three env
  vars above; a privacy notice once the form sends real details

## Design system

- Colours in `src/app/globals.css` (`:root` + `@theme inline`); JS mirrors
  for GSAP writes in `src/lib/brand.ts`. Gold + emerald are the paired
  accents (Australia's green and gold, as in the client artwork).
- Utilities: `text-gradient-brand` / `-deep`, `bg-gradient-brand` / `-deep`.
- Fonts: `font-headline` (Bebas Neue — section headlines), `font-body`
  (Inter), `font-serif`, `font-script` (Allura), `font-greeting`
  (preloader), `font-native` (the greetings' own scripts).

## Code map

- `src/app/page.tsx` — homepage section order. Inner pages: `about`,
  `services` (hub), `services/[slug]` (SSG, `dynamicParams = false`),
  `how-we-work`, `compliance`, `contact` (Start a Project), and
  `not-found.tsx` ("Lost in transit"). Each has an `opengraph-image.tsx`
  drawn by `src/lib/og.tsx` with the vendored fonts in `src/assets/fonts`.
- Page kit: `PageShell` (the view-transition wrapper + footer — every page
  renders inside one), `PageHero` (photo hero with the homepage's
  frame-to-card exit), `NextChapter` (the end-of-page link whose photo
  becomes the next hero; the pages run About → Services → the four
  services in order → How We Work → Compliance → Start a Project, with
  no loop back to service 01), `SignOff` (the client's lockup), and
  `components/motion/` (`SplitReveal`, `ScrubWords`, `CurtainImage`,
  `ThreadLine`). Hooks and constants in `src/lib/motion.ts`.
- `src/content/` — single sources shared by the homepage and the pages,
  client copy verbatim: `about`, `compliance`, `countries`, `moq`,
  `process`, `services`. `src/content/networkMap.ts` +
  `public/images/network-map.svg` are **generated** by
  `scripts/build-world-map.mjs` — edit the script, not them.
- `src/lib/navLinks.ts` — the menu and footer; `src/lib/site.ts` — origin,
  name and `SITE_PAGES` (add every new page, it feeds the sitemap);
  `src/lib/enquiry.ts` — the brief's fields, validation and email text,
  shared by the form and the route handler.
- Service signatures (`components/services/`), one per service page:
  `SketchToSample`, `TheLine`, `TheLoupe`, `DoorstepJourney`; the map in
  `services/[slug]/page.tsx` says which replace the stage list.
- `src/lib/pinnedGallery.ts` + `TickRail.tsx` — shared scroll-pinned
  horizontal gallery (Capabilities, ProcessTimeline) at md and up, plus
  the shared tick painter.
- `src/lib/swipeDeck.ts` — the phone counterpart: native swipe strip with
  depth (centred card flat, neighbours turned/shrunk/dimmed), centring
  padding, the same tick rail, and a one-off nudge. Wayfinding only under
  reduced motion.
- `src/lib/intro.ts` — preloader ↔ hero entrance handshake.
- `src/lib/globeScene.ts` — the Global Network globe (three.js): night
  Earth shader, halo, routes, markers; it only draws what
  `GlobalNetwork.tsx` passes it each frame. Textures in
  `public/images/globe/` are NASA imagery (public domain), rebuilt by
  `scripts/build-globe-textures.py`.
- `media-library/` — tracked masters not served (hero 4K master, retired
  media). `new-media/` — **git-ignored**, 118MB of local stock, only on the
  owner's machine.

## Motion map (what plays where)

- **Preloader** (`Preloader.tsx`): six greetings on flag backdrops, each
  with its own ink/cream text tone (cream alone vanished on India's and
  Italy's white centres). Each is the greeting as said ("Ayubowan") in
  Instrument Serif italic, letters rising out of a blur, its own script
  small above (Noto faces, `font-native`) and "from Sri Lanka" beneath,
  the country's name lighting up and keeping a glow. (It was a
  typewriter in the native scripts; the owner found it choppy.) Finale:
  "Welcome to" rises the same way, then steps up over a big Bebas NAXIS
  and an AUSTRALIA line. Exit: NAXIS turns black, the
  veil switches to `mix-blend-mode: lighten` so the letters show the hero,
  then it scales about the centre of the X until the hero fills the
  screen. `VEIL_EXIT_MS` is reveal → veil gone; Hero times its headline
  off it. A "Skip intro" pill (and Escape) appears after a moment and
  cuts the greetings short: the one on screen steps out and the welcome
  plays as usual, lockup and zoom included, so skipping never lands
  flat on the hero. The pill goes once the welcome starts. Reduced
  motion: static lockup, then fade. The `intro-seen`
  class (which hides the veil on later visits) goes on only when the veil
  is released — added at the reveal, it cut the zoom off.
- **Hero** (`Hero.tsx`): after the entrance, a pinned, scrubbed two-phase
  exit on every size. The statement moves to centre and grows, then the
  full-bleed frame clip-paths to a rounded card on cream, handing over to
  Mission seamlessly. It fires `hero:pinned` (Mission refreshes) and
  `hero:framed` (Nav goes solid over the cream). Below lg an "Operating
  across" roller turns through the six countries. Once the headline's
  line masks release, it takes a layered shadow (`.hero-headline.is-lit`
  in globals), over a soft shade pooled behind it.
- **Ideas Wearable** (`IdeasWearable.tsx`): the client's phrase told as
  how a garment is made, on pattern paper (a dot grid on bark). Chalk
  guides and "WE MAKE" arrive as it scrolls in; pinned, "ideas" is
  sketched in pencil outline and inked in, then a running stitch goes
  round every letter of "WEARABLE." and green-and-gold fabric (with a
  twill weave and a lift) is laid in left to right, like patches sewn
  on. Two SVG lockups share the markup: one line over another on md+,
  stacked on phones. Reduced motion: the finished lockup, no pin.
- **Global Network** (`GlobalNetwork.tsx`): a night globe rising from the
  foot of a dark section (after moto-card.com, which the owner cited).
  The section pins: the globe rises, NAXIS Australia lights, and a route
  leaves it for each country, nearest first (exports, not imports: the
  owner's call), while the globe turns west; countries light as routes
  land, the logistics steps pop up as status pills, and shipments keep
  running out along the routes. Copy lines the risen globe would reach
  fade out. three.js and textures load as it approaches; it renders only
  while on screen. Reduced motion: the finished network, still. No WebGL:
  a list of the countries, no pin.
- **Phones**: Hero and Ideas Wearable pin (shorter pins); Capabilities and
  Process use the swipe deck; Services cards are dealt in (no sticky:
  tall cards would hide their links). Full-screen pinned sections use
  `h-svh`.
- **Between pages** (`PageShell` + `globals.css`): React `<ViewTransition>`.
  The old page sinks back and dims, a gold→emerald band wipes up and the
  new page follows it; the header is anchored (`site-header`). Shared
  photos morph into the next hero by name: `hero-about`, `hero-services`,
  `hero-service-{slug}`, `hero-how-we-work`, `hero-compliance` (on
  NextChapter cards, service cards, the homepage About photo and each
  PageHero). Instant under reduced motion or without browser support.
- **Header** (`Nav.tsx`): clear over dark heroes, a near-opaque ink bar
  elsewhere; it tucks up out of view while scrolling down and returns on
  scroll up, at the top, on keyboard focus or with the menu open.
- **Menu** (`Nav.tsx`): full screen, opened as a circle clip from the
  button; items rise in masks with a photo preview on hover.
- **Inner pages**: PageHero repeats the homepage hero's exit and fires
  `hero:framed`. About pins a word roll through the tagline's four words
  (`ChapterScroller`). The Services hub previews each photo under the
  cursor (touch: rows light at mid-screen). Service signatures: a pinned
  DrawSVG sketch → pattern → grade → measure; a garment running a
  production line (pinned on md+, scrubbed on phones); a loupe that
  follows the cursor or is dragged; a pinned route map where the shipment
  leaves NAXIS Australia and fans out to the six countries, a door pin
  landing at each (exports, matching the globe). How We Work draws one thread down the page
  that lights each stage (`StageThread`). Compliance hangs the
  certifications as spring-driven swing tags on a `gsap.ticker` (only
  while on screen) that flip on tap. The 404 loops a parcel round the map.

## Phones: what keeps them smooth

Measured on a throttled phone profile (see Verifying visually). Keep to
these when adding motion:

- Anything a scroll sequence scales or moves every frame gets its own
  layer (`will-change-transform`): the heroes' media, the Logistics
  route SVG. Without it, what's painted with it (grades over the video,
  the ~2,900-dot map under the routes) is repainted every frame.
- Don't animate anything inside an SVG that also holds a big static
  drawing; split the static part out (the 404 map) or move the animated
  bit to HTML (the Logistics pulse ring).
- No blur, blend or backdrop-filter on layers that move or sit over
  something that redraws: the hero's grain and screen-blended light are
  md+ only; the globe's labels and
  pills are solid; Capabilities' backdrop photos are pre-rendered
  greyscale (`public/images/backdrop/`) instead of a CSS filter.
- The globe on phones: 1.5x pixel ratio, no MSAA, pulses at 30fps only
  while pinned, no redraws while it scrolls in or out.
- Pins on phones run shorter than on desktop (Hero, Ideas Wearable,
  About's word roll, Sketch to Sample, the Logistics journey).

## GSAP / scroll gotchas learned the hard way

- A GSAP `x`/`y` tween overwrites the CSS `translate` property — never
  animate x/y on an element positioned with Tailwind `translate-*`
  utilities; wrap it or animate opacity only.
- Tweens/triggers created in a later callback (e.g. `onComplete`) aren't
  recorded by `gsap.context` — wrap them in `ctx.add(...)`.
- `gsap.matchMedia()` instances: keep a reference and `mm.revert()` in
  cleanup. Nothing uses the deprecated `ScrollTrigger.matchMedia` any more.
  Use a conditions object (`{ isPhone, isWide, reduce }`) when branches
  differ by size and reduced motion.
- Reveal masks around text that sits offset sideways: an overflow-hidden
  wrapper clips it (the hero read "IX" / "STANDARI" until the masks were
  released). Mask vertically only, e.g. `clip-path: inset(-0.3em -100vw
  -0.25em -100vw)`, and start the text low enough to clear the reach.
- Don't give an element GSAP will animate an inline percentage transform
  (`translateY(110%)`); GSAP can read it back as px and add to it. Set the
  hidden start state with `gsap.set` instead.
- A CSS animation on a property (e.g. the caret's opacity blink) beats
  GSAP's inline writes to it; set `animation: none` before tweening.
- A repeating timeline that tweens the same element out and back in
  misrenders at the loop point; use a self-rescheduling `delayedCall`.
- Measurements inside scrubbed pins: use layout offsets (`offsetTop`/
  `offsetLeft`), which transforms don't affect, inside function values
  with `invalidateOnRefresh`, so they're right whatever the progress is at
  refresh.
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
- `ctx.add(fn)` runs `fn` straight away. For something that starts later
  (a `once` trigger's `onEnter`), call `ctx.add(() => …)` inside that
  callback, or register a named method: `const go = ctx.add("go", fn)`.
- GSAP `x`/`y` on an SVG `<g>` replaces its `transform` attribute: put the
  placement on an outer static `<g>` and animate an inner one.
- `clip-path` (like `overflow: hidden`) flattens a `preserve-3d` element:
  on a flip card, clip the faces, not the card.
- SVG `<text>` takes `stroke-dasharray`, and dashes each glyph on its
  own: one dash longer than any letter's outline, offset back to 0,
  draws every letter at once (Ideas Wearable's sketch and stitches). To
  reveal a dashed stroke progressively, draw a solid one in a mask.
- GSAP reads an array target as a list of targets, so
  `gsap.to(numbers, { 0: 1 })` does nothing: tween objects (`{ p: 0 }`).
- A ScrollTrigger on a pinned section ends at the section's own bottom
  edge, partway through the pin. To know whether a pinned section is on
  screen, use an IntersectionObserver (it stays in view while pinned).
- three.js orthographic cameras clip to their near/far range: a globe
  scaled to hundreds of px needs a depth range to match, or only a thin
  slice of it draws.
- Additive WebGL layers over a transparent canvas: put the intensity in
  alpha, or where they fade to black they hide the page behind.
- Anything transformed on every frame of a scroll sequence is repainted
  every frame: keep its text-shadow blur modest (a 72px one on the hero
  headline made the exit's frames ~50% slower), don't leave a finished
  `filter: blur(0px)` on it (`clearProps: "filter"`), and avoid
  `backdrop-filter` on fixed bars over pinned sections. Measure by timing
  rAF frames while stepping `scrollTo` through the pin in headless Chrome.
- A page reused across dynamic params (service → service) keeps its
  instance, so no transition plays and effects go stale: key `PageShell`
  by the slug. Preload the next hero on intent (`preloadHero`) so a
  morph doesn't land on an unloaded image.

## Verifying visually

- The preloader plays once per browser session:
  `sessionStorage.setItem('naxis:intro-seen','done')` to skip it,
  `removeItem` to replay.
- The Claude desktop Browser pane stops painting when the window is
  occluded (rAF frozen, black/timed-out screenshots). Use
  `scripts/visual-check.mjs` (headless Chrome over CDP) instead — it
  screenshots sections at any viewport and reports horizontal overflow
  and console errors.
- Cloud sessions: Chromium is at `/opt/pw-browsers/chromium`, but the
  container runs as root, where Chrome needs `--no-sandbox`. Point
  `CHROME_PATH` at a two-line wrapper script that adds it. That Chromium
  can't decode H.264, so the hero video never plays (poster only) and the
  intro waits out its 6s media timeout; for timing checks, stub
  `HTMLMediaElement.prototype.readyState` to 4 before load. Animations are
  best checked with a CDP screencast (`Page.startScreencast`) turned into
  contact sheets, not single screenshots. The screencast sends no frames
  during a view transition — take `Page.captureScreenshot` bursts there.
  Headless Chrome reports a coarse pointer, so to test cursor features
  patch `matchMedia` to answer `(pointer: fine)` before load. For the
  WebGL globe, launch headless Chrome with `--enable-unsafe-swiftshader
  --use-angle=swiftshader`. Scroll into pinned sections in steps after
  the page settles; a single jump lands before late re-measures move
  them.
- Phone performance: emulate 390×844 at 3x density with CPU throttling
  (`Emulation.setCPUThrottlingRate` 4), step `scrollTo` a few percent of
  the viewport per double-rAF and time the frames, grouped by the
  section at the viewport centre. Software GL inflates absolute numbers;
  compare variants (A/B by mutating the DOM before measuring). Neutralise
  WebGL draws to rule the globe in or out.

## Next up

- **V1 is built and live** (`docs/V1-PLAN.md`): every page the client
  material supports; the owner asked for it on `main` on 2026-09-25.
  Preview deployments are behind Vercel Authentication, so the owner
  can't open them on a phone without logging in to Vercel; to share
  previews, turn it off (or use a shareable link) under the Vercel
  project's Settings → Deployment Protection. Still to come: Global Network and What We Make pages (blocked
  on client detail), the privacy notice, and turning on enquiry email.
- **Scroll-scrubbed "thread to doorstep" sequence** (owner is producing
  2–3 clips in Runable): extract frames with ffmpeg to WebP/AVIF (≈150
  desktop / ≈75 mobile), draw to `<canvas>` from ScrollTrigger progress,
  load on approach. Planned between Process and Services, and as the
  film version of How We Work's thread. Clip brief: 4–8s
  each, ≥1080p, 24–25fps, one continuous slow camera move, chained with
  first/last-frame, subject centred, no faces/hands/readable text.
- Client questions above; "Delivering excellence through experience" is a
  sign-off lockup, not a headline.
- The owner cited yarnity.com (a Webflow site) as the feel for the hero's
  scroll exit. It's blocked from cloud sessions, so the centre-stage +
  card sequence was built from the brief; revisit once the owner says
  what to match.
