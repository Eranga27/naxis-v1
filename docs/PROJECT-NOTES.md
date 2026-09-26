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
- `v2` → V2, branched from `main` at `df4c3f0` (V1 as the client
  reviewed it: ~70% satisfied, with a first round of changes). V2 work
  goes here and only here; `main` stays V1 until the owner says
  otherwise. Its pushes get Vercel previews like any branch.
- `v2-hero-section` → a snapshot of `v2` at `e3299bd`: V2 with hero A, the
  flat CSS wheel, kept whole at the owner's request when hero B was made.
- `v2-hero-b` → V2 with hero B (the forged 3D wheel), at `9feb516`; `v2`
  itself is still there too.
- `v2-hero-c` → V2 with hero C (the woven wheel), branched from `v2`.
- `v2-hero-d` → V2 with hero D (the wheel close up), branched from
  `v2-hero-c` at `24ea974`. Only this branch has the header kept off the
  homepage hero (see Header below).
  The four heroes are alternatives for the client to choose between;
  each branch has its own preview. Once one is chosen, bring it to `v2`
  and drop the other heroes' components.
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
- `NAXIS GIANT WHEEL - v2.pdf` — the "Giant Wheel": six values round the
  rim (Quality, Reliability, Flawless, Flexible, Fast, Integrity),
  "Delivering excellence through experience", NAXIS Australia, and a
  disc of Australian icons about the N. One page of pure vector art,
  lettering outlined; `scripts/build-giant-wheel.py` (pymupdf) splits it
  into rings by distance from the centre. The N is a PDF shading, not a
  shape, so it's lifted from a plain render. The flag's faint seams are
  in the artwork itself.
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
  (the preloader's "Welcome to").

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
  `process`, `services`, `wheel` (each of the wheel's six values paired
  with a verbatim line of client copy that bears it out, and that line's
  page; the pairings are ours). `src/content/networkMap.ts` +
  `public/images/network-map.svg` are **generated** by
  `scripts/build-world-map.mjs` — edit the script, not them. Likewise
  `src/content/giantWheel.ts` (the wheel's rings as path data) and
  `public/images/wheel/centre.webp` (its icon disc, drawn with the
  artwork's white details in the site's cream) and `original-*.webp` (the
  whole wheel exactly as drawn, for heroes C and D; D's close-up needs the
  4096) are generated by `scripts/build-giant-wheel.py`.
- `src/lib/navLinks.ts` — the menu and footer; `src/lib/site.ts` — origin,
  name and `SITE_PAGES` (add every new page, it feeds the sitemap);
  `src/lib/enquiry.ts` — the brief's fields, validation and email text,
  shared by the form and the route handler.
- `GiantWheel.tsx` (server: draws the wheel's layers, so its path data
  ships as markup) + `GiantWheelScene.tsx` (client: layout and motion,
  given only the small geometry it needs).
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
- `src/lib/intro.ts` — preloader ↔ hero entrance handshake; the veil
  holds until the wheel's disc image is decoded (`waitForHeroWheel`).
- `components/wheel/WheelLayers.tsx` — the wheel's rims, lettered rings
  and disc as shared server components, in a "light" (as drawn) or
  "dark" (gilded, for the hero's stage) tone.
- `src/lib/wheelScene.ts` — hero B's three.js scene (loaded on demand,
  like the globe); draws whatever `WheelFrame` it's given.
- `src/lib/wovenScene.ts` — hero C's: the exact artwork on a disc plus
  points sampled from it; draws whatever `WovenFrame` it's given.
- `src/lib/dialScene.ts` — hero D's: the exact artwork on four stepped
  rings with its own shading, then depth of field, bloom and grain in
  its own passes; draws whatever `DialFrame` it's given.
- `src/lib/globeScene.ts` — the Global Network globe (three.js): night
  Earth shader, halo, routes, markers; it only draws what
  `GlobalNetwork.tsx` passes it each frame. Textures in
  `public/images/globe/` are NASA imagery (public domain), rebuilt by
  `scripts/build-globe-textures.py`.
- `media-library/` — tracked masters not served (hero 4K master, retired
  media). `new-media/` — **git-ignored**, 118MB of local stock, only on the
  owner's machine.

## Motion map (what plays where)

- **Preloader** (`Preloader.tsx`): "Welcome to" (Instrument Serif
  italic) rises out of a blur, then steps up over a big Bebas NAXIS and
  an AUSTRALIA line. (V1 opened with a greeting from each of the six
  countries on its flag, plus a Skip pill; the client asked for V2 to
  start at the welcome, so both went, with the Noto script fonts they
  needed.) Exit: NAXIS turns black, the
  veil switches to `mix-blend-mode: lighten` so the letters show the hero,
  then it scales about the centre of the X until the hero fills the
  screen. `VEIL_EXIT_MS` is reveal → veil gone; the hero times its
  entrance off it. Reduced motion: static lockup, then fade. The `intro-seen`
  class (which hides the veil on later visits) goes on only when the veil
  is released — added at the reveal, it cut the zoom off.
- **Hero D** (`DialWheelHero.tsx` → `DialWheelStage.tsx` +
  `src/lib/dialScene.ts`, on `v2-hero-d`): the Giant Wheel close up, as a
  made thing: a gold-edged medallion on a dark table, shot like a watch
  dial. On a wide screen the camera frames the upper-left quarter (the
  centre sits at the bottom right, the N just peeking in); on a phone,
  the upper half. The face is `original-4096.webp` (2048 on phones), the
  client's artwork exactly, cut into its four rings, which step down
  towards the centre (each step a 45° gold lip over a wall, in the white
  inside a rim, throwing a shadow worked out in the shader). The outer
  three turn at their own slow paces (240/300/200s a turn) about the
  icon disc, which holds still (the owner's call: the N stays upright).
  The shading comes from the same image: ink stands proud of the white
  (relief from a blurred mip) and throws a small shadow away from the
  light (a four-step march towards it through the same mip), the gold
  (lettering, rims, the N; not the icons' oranges) is foil that glints
  pale gold as it passes under the key light, and where the light is
  full the face is exactly the artwork. A fill from the camera's side
  lights only the metal, so the lips and walls facing the lens read as
  gold, not dark bronze. Each surface writes its
  circle of confusion into alpha, so depth of field is two passes (focus
  on the frame's centre: the far rim and near centre soften); bloom takes
  only what's brighter than the paper (a float target; without
  `EXT_color_buffer_float`/`_half_float` it's 8-bit and no bloom); then
  haze, vignette, grain and motes drawn as their own bokeh. Arrival:
  the X zoom lands on it dim, out of focus and pulled back, the rings
  wound round; the light comes up, the focus pulls in, and the rings
  coast into the client's arrangement just as the camera settles
  (lettering upright), then a light runs across the foil. Loop (32s):
  the focus racks out to the rim, in past the centre and back; a light
  runs across; the key light drifts (the pointer leads it on desktop)
  so the glint wanders over the lettering. Scrolling pulls the camera
  back to the whole medallion, laid back on the table, as the stage
  closes to a card. Reduced motion or no WebGL 2: `DialStill.tsx`, the
  same close-up face on in CSS (ring layers masked from the one image,
  the outer three turning unless motion is reduced), no pin. The Scroll cue sits on a
  dark capsule where it has to cross the white face.
- **Hero C** (`WovenWheelHero.tsx` → `WovenWheelStage.tsx` +
  `src/lib/wovenScene.ts`, on `v2-hero-c`): the Giant Wheel woven from
  thread, and at rest **exactly the client's artwork** — the owner's
  call: a first cut sampled it into points in the dark-stage colours and
  "didn't look quite it". The woven wheel is `original-*.webp`, a plain
  render of their PDF (white face and all), on one disc whose shader turns
  each ring in place (ring boundaries sit in the white inside each rim,
  so turning rings meet white on white). Loose, it's ~120k points (42k
  on phones) sampled from that same image, in its exact colours, on 190
  threads flowing across (warp) or down (weft) — each thread at its own
  depth so it stays a line. Weaving, each point swirls in at its own
  moment, centre first, and the artwork takes over as they land (the
  points fade); unravelling runs the other way, rim first. The rings are
  reset to the client's arrangement while fully unravelled, so every
  weave lands on their wheel exactly. Arrival: the X zoom lands on the
  loom and the threads weave the wheel. Loop (~26s): woven and turning,
  a faint sheen running round and a ripple; undone into threads the
  other way from last time; woven again. On desktop the pointer pulls
  threads out of the cloth (a hole in the art, the points lifted).
  Scrolling unpicks it as the stage closes to a card. Stand-in: hero A.
- **Hero B** (`ForgedWheelHero.tsx` → `ForgedWheelStage.tsx` +
  `src/lib/wheelScene.ts`, on `v2`): the Giant Wheel forged in WebGL.
  The client's lettering is extruded from its own outlines
  (`giantWheel.ts` through three's SVGLoader) into bevelled gold, cream
  and emerald relief on dark enamel bands, each band edged with a gold
  rim, the icon disc in a gold bezel; lit by a dark softbox "studio"
  environment built in the scene (a bright room washed the enamel pale
  and the gold white) with a soft front light for the lettering's faces,
  plus rays, a glow and 3D gold dust; bloom on desktop. Arrival: the
  zoom through the X lands on the wheel edge on, which turns to face the
  camera as it keeps pushing in, and its rings close up and lock with a
  flash. Loop (~22s, for a large screen left on it): the seal turns,
  rings at their own paces; the rings lift apart and tip on their own
  axes as a gyroscope while the camera swings round; they swing back and
  lock with a flash and a ring of light. The component tweens a state
  object with GSAP and passes it to `render()` every frame; `wheelScene`
  holds no timing. Phones: coarser curves, no bloom, fewer motes, 1.5x.
  The veil waits on the scene (`setHeroReady`). Without WebGL or under
  reduced motion, hero A stands in.
- **Hero A** (`WheelHero.tsx` + `WheelHeroStage.tsx`, V2): the client's
  Giant Wheel and nothing else, on a dark stage, always turning — the
  client wants to leave it running on a large screen. The intro's zoom
  through the X lands on the centre disc (the letters show it as they
  become windows); the camera pulls back while the ring outlines draw in
  and each lettered ring is lit clockwise behind a running spark (a
  conic `mask-image` on `--sweep`, cleared once lit). Then it loops for
  good: the rings turn at their own paces in alternating directions
  (CSS `wheel-spin`, `--spin`/`--spin-dir`), the stage drifts in a slow
  tilt (`wheel-drift`) that parts the layers, stepped in depth with
  GSAP `z`, and each scaled back by the lens so face-on they sit exactly
  as drawn; light sweeps the rings, rays turn behind, the glow breathes,
  gold dust rises (a canvas, 30fps on phones), and every few seconds a
  spark orbits the rim. On desktop the wheel leans to the pointer. All
  rest while it's off screen (`.wheel-paused`, dust stopped). Scrolling
  pins it: the wheel tips back (its layers stack visibly) and the stage
  closes to a card on cream; it fires `hero:pinned` and `hero:framed` as
  the old hero did. The only text is a Scroll cue; the h1 is sr-only.
  Reduced motion: the finished wheel, still, no pin. The V1 video hero
  (`Hero.tsx`) is on `main`; its video and poster files are still in
  `public/` (the poster is the menu's Home preview).
- **Ideas Wearable** (`IdeasWearable.tsx`): the client's phrase told as
  how a garment is made, on pattern paper (a dot grid on bark). Chalk
  guides and "WE MAKE" arrive as it scrolls in; pinned, "ideas" is
  sketched in pencil outline and inked in, then a running stitch goes
  round every letter of "WEARABLE." and green-and-gold fabric (with a
  twill weave and a lift) is laid in left to right, like patches sewn
  on. Two SVG lockups share the markup: one line over another on md+,
  stacked on phones. Reduced motion: the finished lockup, no pin.
- **The NAXIS wheel** (`GiantWheel*.tsx`, between Services and Global
  Network — its centre is Australia, where the globe starts): the
  client's wheel on cream, each ring its own layer. Pinned, the rings
  turn into register from their own offsets like a combination lock and
  the icon disc spins in; then a spotlight (a band behind the word, an
  emerald arc on the rim, a pointer) walks round the six values, dimming
  the others, while each is read out beside the wheel with its line and
  a link; finally the whole wheel lights. Side by side from lg; phones
  and portrait tablets stack. Reduced motion: the finished wheel and the
  six values as a list.
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
  scroll up, at the top, on keyboard focus or with the menu open. On
  `v2-hero-d` the homepage hero has no header at all (the owner's ask:
  nothing over the wheel): it stays tucked until Mission's top has come
  up under it, whichever way you scroll, and appears on scrolling back up
  from there. Keyboard focus still brings it back.
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
- Pins on phones run shorter than on desktop (Hero, Ideas Wearable, the
  NAXIS wheel, About's word roll, Sketch to Sample, the Logistics
  journey).
- The wheel's rings are separate `<svg>`/`<img>` layers turned with CSS
  transforms, so turning them is compositing, not repainting.
- Hero B on phones: 3 curve segments and one bevel step on the lettering
  (~120k triangles), no bloom, 1.5x pixel ratio, 160 dust motes.
- Hero C on phones: 42k points instead of 120k, each drawn larger so the
  weave still reads.
- Hero D on phones: the 2048 artwork, 1.5x pixel ratio (desktop is
  capped at ~4.2M pixels, so a big screen at 2x doesn't cost 8M a pass),
  2x MSAA instead of 4x, no paper tooth, 45 motes instead of 110.

## GSAP / scroll gotchas learned the hard way

- A GSAP `x`/`y` tween overwrites the CSS `translate` property — never
  animate x/y on an element positioned with Tailwind `translate-*`
  utilities; wrap it or animate opacity only.
- Tweens/triggers created in a later callback (e.g. `onComplete`) aren't
  recorded by `gsap.context` — wrap them in `ctx.add(...)`.
- `gsap.matchMedia()` instances: keep a reference and `mm.revert()` in
  cleanup. Nothing uses the deprecated `ScrollTrigger.matchMedia` any more.
  Use a conditions object (`{ isPhone, isWide, reduce }`) when branches
  differ by size and reduced motion. gsap only runs the callback when at
  least one condition matches, so keep a pair that always covers the
  screen (`isPhone`/`isWide`): with only `isPhone` and `reduce`, the
  wheel never set up on desktop.
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
- The V1 hero pinned only after its entrance finished, so Mission
  listens for `hero:pinned` to refresh — see `Mission.tsx`. The V2 wheel
  hero pins at mount and fires it on the next frame.
- An IntersectionObserver made before a ScrollTrigger pin moves its
  target into the pin-spacer kept reporting it off screen (hero B's
  render loop never started). Observe after the pin exists, or check
  the box in the loop, as hero B does.
- Metal facing the camera reflects what's behind the viewer: a dark
  studio environment needs a soft light there, or flat gold reads black.
- A layer in a `preserve-3d` stack at `z` looks `P/(P−z)` bigger through
  perspective `P`; scale it by `(P−z)/P` so face-on it keeps its drawn
  size and only the tilt shows the depth (the wheel hero's rings).
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
- Rendering to a half-float target isn't a given on phones: check for
  `EXT_color_buffer_float` or `EXT_color_buffer_half_float` first, or an
  incomplete framebuffer just draws black with no error (hero D).
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
  can't decode H.264, so videos never play (poster only); on `main` the
  intro waits out the V1 hero video's 6s timeout, so for timing checks
  stub `HTMLMediaElement.prototype.readyState` to 4 before load (V2's
  hero waits only on the wheel's disc image). Animations are
  best checked with a CDP screencast (`Page.startScreencast`) turned into
  contact sheets, not single screenshots. The screencast sends no frames
  during a view transition — take `Page.captureScreenshot` bursts there.
  Headless Chrome reports a coarse pointer, so to test cursor features
  patch `matchMedia` to answer `(pointer: fine)` before load. For the
  WebGL globe, launch headless Chrome with `--enable-unsafe-swiftshader
  --use-angle=swiftshader`. SwiftShader draws hero B at about a frame a
  second, so check its poses with `Page.captureScreenshot` at set times
  (the timelines run on real time), not a screencast. To film an intro
  that SwiftShader is too slow to catch, slow the page's clock in an init
  script: scale `performance.now` and `Date.now` by, say, 0.06, stretch
  `setTimeout` by the same, and pass the slowed time to rAF callbacks —
  GSAP and the scenes then run at that pace. Scroll into pinned sections in steps after
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
