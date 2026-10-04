"""Bake the Capabilities backdrop's dimming into its photos.

    pip install pillow numpy
    python3 scripts/build-backdrops.py

The section shows three greyscale textile photos
(public/images/backdrop/*-mono.jpg) at 55% opacity over its ink ground,
under a 75% ink veil: on screen, 13.75% photo and 86.25% ink. Drawn that
way, the photos (which drift with the scroll) were re-blended through two
translucent layers every frame, the slowest thing on a phone between the
About and Process sections. This writes them already blended
(*-dim.jpg), so they're drawn opaque, with no veil.
"""

import pathlib

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
FOLDER = ROOT / "public" / "images" / "backdrop"
INK = np.array([0x10, 0x0D, 0x09], np.float32)  # --color-ink
SHOWN = 0.55 * (1 - 0.75)  # the container's opacity, under the veil's

for source in sorted(FOLDER.glob("*-mono.jpg")):
    photo = np.asarray(Image.open(source).convert("RGB"), np.float32)
    dim = photo * SHOWN + INK * (1 - SHOWN)
    out = source.with_name(source.name.replace("-mono", "-dim"))
    Image.fromarray(np.clip(dim + 0.5, 0, 255).astype(np.uint8)).save(out, quality=88, optimize=True, progressive=True)
    print(f"{out.relative_to(ROOT)}: {out.stat().st_size / 1024:.0f}KB (from {source.stat().st_size / 1024:.0f}KB)")
