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
   transformation. (With credits to spare, 3–4 takes of each to pick from;
   the one-prompt route below makes one of each.)
   If Runable only takes a start frame: generate from it, describe the
   destination, and the last half-second is dissolved into the next
   hold's first frame in the edit (works, less magical).
5. **Check the joins** — play H1 → M12 → H2 back to back; nothing
   should jump. Small drifts get a 4–6 frame dissolve in the edit.
6. **Export** — the seven clips as they came out of Runable (MP4, full
   resolution, no audio needed), named in order: `1-hold-development`,
   `2-morph-paper-to-cloth`, `3-hold-manufacturing`,
   `4-morph-stitch-to-check`, `5-hold-quality`,
   `6-morph-carton-to-container`, `7-hold-logistics`. No edit is needed:
   the frame script reads the clips in order. (An edited master with cut
   times still works, if colour needs evening out in an editor first.)
7. **Deliver** — upload them to the repo on the `v2` branch under
   `media-library/services-film/` (GitHub's web upload takes files up
   to 25MB; a 5s 1080p clip is usually 5–20MB), or say where they are.
   A pilot first — hold 1, morph 1→2, hold 2 — proves the look and the
   join in the real section before the rest is made.

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

### The one-prompt route (fewest credits)

The owner asked for one prompt that has Runable do everything, one
version of each (4 stills + 7 clips = 11 generations), to keep credits
down. Paste this into a new Runable task in **Agent** mode, inside the
project. It stops twice — for the cost estimate and to approve the
stills — before any video is made; delete those two lines to run it
straight through.

```
You are producing a short brand film for NAXIS Australia, a private-label apparel manufacturer. It will be played frame by frame on a website as people scroll, so every clip must be ONE slow, continuous camera move (no cuts, no fades), and the clips must join seamlessly, each one starting exactly where the one before it ends.

CREDITS — IMPORTANT
- Generate exactly ONE version of everything: no variations, no alternatives, no extra upscaling passes, audio off.
- Before generating anything, tell me which image and video models you will use and the estimated total credit cost, and wait for my "go".
- After Step 1, show me the four stills and wait for my "go" before making any video.
- If something fails badly (visible text or logos, a cut or fade inside a clip, or a clip ending on a completely different scene), stop and ask me before regenerating.

SPECS FOR EVERY IMAGE AND CLIP
- 16:9, the highest resolution available (at least 1920x1080), 24 fps, every clip 5 seconds, audio off.
- Look (put this in every prompt): Cinematic 35mm film look, shallow depth of field, warm tungsten key light from the left, soft deep shadows, rich blacks, colour palette of ochre gold, deep brown and warm cream with a subtle emerald green accent, fine film grain, photorealistic, premium fashion brand film.
- Composition: main subject right of centre (about 60-65% across); the left third darker and calm (text will sit there); keep the subject inside the middle of the frame as well (a vertical phone crop is taken from it).
- Never: readable text, letters, logos, labels, watermarks, faces in focus, close-up hands, fast or shaky camera, cuts, fades.
- Video: use the best model you have that accepts BOTH a start image and an end image (first/last frame). Use the same video model for all seven clips.

DO THESE STEPS IN ORDER

STEP 1 - Four still images. Make A1 first, then A2, A3 and A4 with A1 as a style reference, so all four match in light, colour, lens and film look.
A1: Three-quarter overhead view of a garment designer's worktable in a dim, warm atelier: kraft-paper sewing patterns with white chalk lines, a yellow tailor's tape measure, pencils, fabric swatches in cream and ochre, a sample jacket on a dress form softly out of focus behind. Main subject right of centre; the left third falls into soft shadow. No people.
A2: An industrial sewing machine on a garment factory floor in warm light: its presser foot holding a panel of ochre fabric in the foreground, right of centre; rows of machines receding into soft focus; spools of cream and gold thread. Workers only as distant, soft silhouettes, faces not visible.
A3: A clean quality-control room: a finished ochre garment laid flat on a white inspection table under a bright lamp, a yellow tape measure along its seam, a magnifying glass, a clipboard turned so nothing is readable; subject right of centre, the left third in soft shadow. No faces.
A4: A container port at golden hour seen from above: stacked shipping containers in ochre, brown and deep green, gantry cranes silhouetted against a warm sky, a cargo ship alongside, the sea catching the light; the ship right of centre.

STEP 2 - Four "hold" clips, image-to-video, each starting on its still.
H1 (start image A1): Slow, steady dolly forward and gentle tilt down over the worktable, finishing looking straight down on a single kraft-paper pattern piece lying flat, right of centre, filling about half the frame. Dust drifting in the light. One continuous shot, no cuts.
H2 (start image A2): Slow push towards the needle as it stitches the ochre panel, the fabric feeding smoothly; finishing on a close-up of the needle and a neat line of fresh stitches, right of centre. One continuous shot.
H3 (start image A3): Slow glide along the inspection table, past the tape measure, finishing on a neatly folded ochre garment with a small gold swing tag, right of centre. One continuous shot.
H4 (start image A4): Slow aerial push towards the ship as a container is lowered aboard; calm water, warm haze. One continuous shot.

STEP 3 - Join frames. From the finished hold clips, extract full-resolution PNGs: the LAST frame of H1, H2 and H3, and the FIRST frame of H2, H3 and H4. (If you can't extract frames, stop here, give me everything so far and tell me.)

STEP 4 - Three "morph" clips, each with start image = the last frame of the hold before, and end image = the first frame of the hold after.
M12 (start H1 last frame, end H2 first frame): Seamless transformation: the kraft-paper pattern piece becomes a panel of woven ochre fabric of exactly the same shape; the paper texture turns into cloth and the chalk lines become stitching guides, as the camera slowly tilts up and pulls back to reveal the panel under the presser foot of an industrial sewing machine on a warm factory floor. One continuous shot, no cut, no fade.
M23 (start H2 last frame, end H3 first frame): Seamless transition: the camera follows the thread up from the needle, then slowly pulls back and rises; the same stitched seam is now lying on a white inspection table under a bright lamp, a yellow tape measure unrolling along it. One continuous shot, no cut, no fade.
M34 (start H3 last frame, end H4 first frame): Seamless transition: the camera rises straight up as the folded garment settles into an open cardboard carton; pulling back, the carton becomes one of hundreds in neat rows, which become stacked shipping containers at a port at golden hour. One continuous pull-out, no cut, no fade.
If the video model can't take an end image, use the start image only and add "ending on:" plus the description of the next still (A2, A3 or A4) to the prompt.

STEP 5 - Deliver. Name the seven clips exactly:
1-hold-development.mp4
2-morph-paper-to-cloth.mp4
3-hold-manufacturing.mp4
4-morph-stitch-to-check.mp4
5-hold-quality.mp4
6-morph-carton-to-container.mp4
7-hold-logistics.mp4
Also join them in that order into one preview, service-film-preview.mp4 (just joining, no new generation). Give me everything - the seven clips, the preview, the four stills and the join frames - as one zip, and tell me which video model you used and each clip's resolution and frame rate.
```

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

1. The seven clips in `media-library/services-film/`, named so they sort
   in order (see Export above).
2. `pip install imageio-ffmpeg` and run `python3
   scripts/build-service-film.py --clips media-library/services-film`
   (add `--focus 0.6,0.62,…` — 7 x positions, 0–1 — if a clip's subject
   isn't near 62% across, for the phone crop). It rewrites the frames and
   `src/content/serviceFilm.ts`; the stage needs no change. Tested on
   seven 1080p/24fps test clips of 4–5s. (An edited master instead:
   `--master <video> --cuts <json>`, the json `{"cuts": [8 times in
   seconds — where each of the seven segments begins, then where the
   last ends], "focus": [optional, 7 values]}`.)
3. Check the joins frame by frame, the weight (the budget above), and
   the phones. If the wide frames look soft on large retina screens,
   raise them to 1920×1080 in the script's `SETS` and re-check the
   weight; the canvas follows the frames' resolution by itself.

### What Runable actually made (2026-09-26), and the keyframe route

The first run used up the month's credits after making a shot list,
**eight keyframes** and the first two hold clips. The keyframes turn out
to be the film's skeleton — each segment runs from one to the next:

| Segment | From | To |
| --- | --- | --- |
| Hold 1 | K0 atelier (hold start) | K1 pattern piece |
| Morph 1→2 | K1 pattern piece | K2 factory line |
| Hold 2 | K2 factory line | K3 stitched seam |
| Morph 2→3 | K3 stitched seam | K4 QC table |
| Hold 3 | K4 QC table | K5 packing |
| Morph 3→4 | K5 packing | K6 port |
| Hold 4 | K6 port | K7 port, final frame |

So the film can be built now and upgraded a clip at a time:
`build-service-film.py --keyframes media-library/services-film` takes
K0–K7 (named `K0…`–`K7…`) and whichever clips exist, named `1-`…`7-`.
A segment with its clip plays it; one without is a crafted move between
its two keyframes (a push-in for a hold, a push-through dissolve for a
morph), and where a crafted segment meets a real clip it starts or ends
on the clip's own frame, so the joins stay exact. Each new clip dropped
in replaces its segment on the next run. Best order to spend credits:
the three morphs first (they carry the effect), then holds 3 and 4.

One clip per task, and outside Agent mode if Runable's Video tool takes
a start and an end image directly (the agent's planning costs credits
too):

```
Generate ONE 5-second video, 16:9, 1920x1080 or higher, 24fps, audio off.
Start frame: the attached image [K1]. End frame: the attached image [K2].
[The segment's prompt from the prompt pack above.]
Generate only this one video: no variations, no extra images, no shot list, no questions.
```

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
