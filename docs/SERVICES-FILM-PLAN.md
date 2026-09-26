# What We Do — the service film (plan)

The owner's brief (2026-09-26): in the homepage's "What We Do" section
(`ServicesStack.tsx`), cinematic videos, made in Runable, that morph
from one process into the next. This replaces the earlier "thread to
doorstep" sequence idea in PROJECT-NOTES.

## The effect

One continuous film behind the four services. The section holds on
screen (pins) and scrolling moves the film: each service has a short
**hold** shot (the camera slowly pushing in), and between services the
shot **morphs** into the next — a match cut where something in one
scene becomes something in the next. Scroll back and it runs backwards.
It always comes to rest on a service, never mid-morph. Each service's
number, title, summary, highlights and "Learn more" change with it.

| Film | Service | What we see | How it ends / morphs |
| --- | --- | --- | --- |
| Hold 1 | 01 Product Development & Sampling | Designer's table: kraft-paper patterns, chalk, tape measure, a sample on a dress form | Pushes in and tilts down to a single paper pattern piece, seen from above |
| Morph 1→2 | | **Paper becomes cloth**: the pattern piece turns into a fabric panel of the same shape under a sewing machine foot | |
| Hold 2 | 02 Manufacturing | The sewing line in warm light, rows of machines | Pushes in to the needle and a neat line of stitches |
| Morph 2→3 | | **The stitch becomes the check**: follow the thread; the camera pulls back and the same seam is on an inspection table under a lamp, a tape along it | |
| Hold 3 | 03 Quality Control & Assurance | Inspection table: garment, tape, magnifier, spec sheet (unreadable) | Ends on the approved garment, folded, with a small gold swing tag |
| Morph 3→4 | | **The carton becomes the container**: the garment goes into a carton, the lid closes, the camera rises and pulls out to a pallet, then a container lifted aboard a ship | |
| Hold 4 | 04 Logistics & Freight | A container port at golden hour, cranes, the ship | Slow aerial push towards the ship |

## Producing it in Runable

### Every clip

- 16:9, at least 1920×1080 (4K if offered); all clips the same frame
  rate (24fps); no audio needed.
- Holds 4s, morphs 5s. Master ≈ 31s.
- One continuous, slow camera move per clip: no cuts, whip pans or
  speed ramps. AI video holds together best when it's slow.
- Composition: the subject around 60–65% across the frame; the left
  third darker and calm (desktop text sits there); the subject also
  inside the central 9:16 band, since phones get a portrait crop
  around it.
- No readable text, logos, labels or watermarks. Faces turned away or
  out of focus; hands at a distance or in soft focus (AI hands);
  nobody close to the lens.
- The same look on every prompt — paste this style suffix:

  > Cinematic 35mm film look, shallow depth of field, warm tungsten key
  > light from the left, deep soft shadows, rich blacks, a palette of
  > ochre gold, deep brown and warm cream with a touch of emerald green,
  > subtle film grain, slow controlled camera movement, photorealistic,
  > premium apparel brand film. No text, no logos, no labels.

### Order of work (this is what makes the joins seamless)

1. **Anchor stills** — generate the first frame of each hold (A1–A4)
   as images. Review the four side by side (same light, palette,
   lens) and get the client's sign-off here, where changes are cheap.
2. **Holds** — image-to-video from each anchor (H1–H4), each ending
   where the table above says, since that end is where the next morph
   starts.
3. **Join frames** — take the exact last frame of H1, H2, H3 and the
   exact first frame of H2, H3, H4 (from the generated clips, not the
   anchors — models drift a little). `ffmpeg -sseof -0.05 -i H1.mp4
   -frames:v 1 H1-last.png` / `ffmpeg -i H2.mp4 -frames:v 1
   H2-first.png`, or send the clips and Claude extracts them.
4. **Morphs** — M12, M23, M34 in first-and-last-frame (keyframe)
   mode: start = the last frame of the hold before, end = the first
   frame of the hold after, and the prompt describing the
   transformation. Make 3–4 takes of each and keep the smoothest.
   If Runable only takes a start frame: generate from it, describe the
   destination, and the last half-second is dissolved into the next
   hold's first frame in the edit (works, less magical).
5. **Check the joins** — play H1 → M12 → H2 back to back; nothing
   should jump. Small drifts get a 4–6 frame dissolve in the edit.
6. **Grade and export** — all seven clips in one timeline (CapCut or
   DaVinci Resolve), exposure and colour evened out; export the whole
   master (high-bitrate H.264/H.265) **and** the seven clips, with the
   timecode where each starts.
7. **Deliver** — commit them to the repo under
   `media-library/services-film/` (tracked masters, not served; each
   file under GitHub's 100MB), or say where they are.

### Prompts (starting points; each + the style suffix)

- **A1** — A garment designer's worktable in a dim atelier: kraft-paper
  sewing patterns with chalk lines, a tailor's tape measure, pencils
  and fabric swatches, a sample jacket on a dress form in soft focus
  behind. A slight high angle, subject to the right of frame, the left
  third falling into shadow.
- **H1** (from A1) — A slow, steady dolly forward and tilt down over
  the table until the camera looks straight down on a single paper
  pattern piece, right of centre. Minimal movement in the scene, dust in
  the light. One continuous shot.
- **A2** — A garment factory sewing line in warm light: rows of
  industrial sewing machines receding, fabric panels, spools of thread;
  in the foreground a sewing machine foot guiding a fabric panel.
  Workers in soft focus behind, faces not visible.
- **H2** (from A2) — A slow push towards the needle as it stitches the
  panel, ending on a close-up of the needle and a neat line of stitches.
- **A3** — An inspection table under a bright lamp in a clean QA room:
  a finished garment laid flat, a tailor's tape along its seam, a
  magnifier, a clipboard with an unreadable spec sheet; the inspector's
  hands in soft focus.
- **H3** (from A3) — A slow move along the seam as it's checked, ending
  on the garment neatly folded with a small gold swing tag, right of
  centre.
- **A4** — A container port at golden hour: a cargo ship being loaded,
  stacked containers, cranes silhouetted against a warm sky, the sea
  catching the light.
- **H4** (from A4) — A slow aerial push towards the ship as a container
  is lowered aboard; calm water, warm haze.
- **M12** (H1 last → H2 first) — The paper pattern piece becomes a
  fabric panel of the same shape: the paper's texture turns to woven
  cloth and the chalk lines to stitching guides, as the camera tilts up
  and the table becomes a sewing machine bed on a factory floor. One
  continuous transformation, no cut.
- **M23** (H2 last → H3 first) — Follow the thread from the needle as
  the camera pulls back and rises: the seam is now on an inspection
  table under a bright lamp, a measuring tape unrolling along it. One
  continuous move.
- **M34** (H3 last → H4 first) — The folded garment is laid into a
  cardboard carton and the lid closes; the camera rises and pulls back —
  the carton is one of many on a pallet, then a container being lifted
  onto a ship at a port at golden hour. One continuous pull-out, no cut.

## How the site plays it

- **Stage**: the section becomes one pinned, full-screen stage (in
  place of the stacked cards). The film fills it; the service's text
  sits on the left over a dark gradient (at the bottom on phones), with
  a 01–04 chapter rail and progress (the shared tick painter).
- **Scrubbed frames, not `<video>`**: scrubbing a video seeks between
  keyframes, stutters, and on iPhones barely works. The film is cut into
  still frames drawn to a `<canvas>` from the scroll position: exact,
  reversible, smooth.
- **Weight**: desktop ≈ 210 frames at 1600×900 WebP (≈20 per hold, ≈45
  per morph), ≈ 8–10MB; phones a 720×1280 portrait crop round the
  subject, about half the frames, ≈ 3–4MB. Streamed, not up front: the
  four anchor stills first (they're also the fallback), then frames in
  viewing order, starting ~2 screens before the section. If the scroll
  outruns loading, the nearest loaded frame shows. Tuned against real
  phones once the footage exists.
- **Smoothness**: neighbouring frames are crossfaded by the fractional
  position (so ~45 frames reads as fluid motion); scroll smoothing on
  the scrub; **snap to the nearest service** when scrolling stops, so it
  never rests on a half-morphed frame; draws only when the frame
  changes; frames decode off the main thread (`createImageBitmap`); on
  phones only frames near the playhead stay decoded.
- **Resting**: on a service, a very slow drift on the frame keeps it
  alive (optionally, short ambient loops per service later).
- **Text**: each service's text leaves as its morph begins and arrives
  as it lands. The text stays real HTML (headings, links) for SEO and
  screen readers; the canvas is decorative.
- **Pin length**: about a screen per hold and one per morph (≈ 6
  screens on desktop, ≈ 4.5 on phones).
- **"Learn more"**: the current frame carries into the service page's
  hero, as the photos do now (a view transition captures the canvas).
- **Reduced motion / no JavaScript**: the four services as static
  cards with the anchor stills; no pin.
- **Pipeline**: `scripts/build-service-film.mjs` (ffmpeg) turns the
  master and its timecodes into the desktop and phone frame sets plus a
  manifest (segment frame ranges, anchors); the masters stay in
  `media-library/`.

## Where it stands

Phase 0 is built (`ServicesFilm.tsx`, `scripts/build-service-film.py`):
the stage plays stand-in frames made from the four service photos —
wide 144 frames at 1440×810 (≈ 5.8MB), tall 92 at 540×960 (≈ 2.0MB).
To swap in the real film:

1. Put the master and a cuts file in `media-library/services-film/`:
   `cuts.json` = `{"cuts": [8 times in seconds — where hold 1, morph
   1→2, hold 2, morph 2→3, hold 3, morph 3→4 and hold 4 begin, then
   where hold 4 ends], "focus": [optional: 7 x positions, 0–1, of each
   segment's subject for the phone crop; default 0.62]}`.
2. `pip install imageio-ffmpeg` and run `python3
   scripts/build-service-film.py --master media-library/services-film/master.mp4
   --cuts media-library/services-film/cuts.json`. It rewrites the frames
   and `src/content/serviceFilm.ts`; the stage needs no change.
3. Check the joins frame by frame, the weight (the budget above), and
   the phones. If the wide frames look soft on large retina screens,
   raise them to 1920×1080 in the script's `SETS` and re-check the
   weight; the canvas follows the frames' resolution by itself.

## Phases

0. **Before any footage (Claude)**: build the stage with stand-in
   frames made from the current four service photos (slow push-ins,
   dissolves for the morphs). It proves pinning, snapping, text sync,
   loading and phones, gives the client the structure to react to, and
   the real frames drop straight in later.
1. **Owner**: the four anchor stills → client sign-off.
2. **Owner**: holds, morphs, the edit, delivery.
3. **Claude**: frame extraction, integration, tuning weight and
   smoothness on phones, notes.
