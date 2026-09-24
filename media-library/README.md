# Media Library

Raw/unedited footage that isn't wired into any page yet. Kept out of
`public/` so Next.js doesn't bundle or serve it and it doesn't bloat the
deploy — but still tracked in the repo so it isn't lost.

When a future section needs one of these, move it into `public/videos/`
(`git mv media-library/<file> public/videos/<file>`) and reference it from
the component, following the pattern in `Hero.tsx` / `CinematicDivider.tsx`.

| File | Size | Likely intended for |
| --- | --- | --- |
| `vertical1.mp4` | 49MB | Vertical/portrait-framed footage — mobile hero, story/reel-style section, or a full-bleed panel in a vertical layout block |
| `horizontal2.mp4` | 24MB | Widescreen footage — a second cinematic divider or gallery/showcase section |
| `horizontal1.mp4` | 13MB | Widescreen footage — same category as `horizontal2.mp4`, likely an alternate take or a different section's background |
| `story.mp4` | 2.3MB | Narrative/brand-story section (an "our story" or "about" block) |
| `editorial.mp4` | 1.8MB | Editorial/lookbook-style section, likely for showcasing product or campaign imagery in motion |
| `hero.mp4` | 1.5MB | An earlier or alternate hero cut — superseded by `public/videos/hero-compressed-video.mp4`, which is the one currently live in `Hero.tsx` |

None of these files are referenced by any component, config, or data file as
of this move — confirmed via a repo-wide grep before relocating them.

## Moved out of `public/` (V1 homepage wrap-up)

| File | Why |
| --- | --- |
| `hero-4k-master.mp4` | 4K master of the hero video. The site now serves `public/videos/hero-1080.mp4`, a ~1.7MB 1080p re-encode. Re-encode from this master if the hero ever needs a different size. |
| `ideas-wearable.mp4` | 36MB background for "We make ideas wearable", played at 25% opacity behind a dark scrim. Replaced by vector wattle/eucalyptus foliage matching the client's artboard. |
| `ideas-wearable-poster.jpg` | That video's poster (an unrelated stock photo). |

