"""Build the header's logo: the client's wordmark with AXIS in white.

    pip install pillow numpy
    python3 scripts/build-header-logo.py

The client asked for the header's logo with the N as it is and the AXIS
lettering white. public/logos/naxis-wordmark.png is a raster (a gold
gradient N, AXIS in dark brown across its foot), so the lettering is
repainted here rather than redrawn: every brown pixel turns white. Where
AXIS crosses the N, an edge pixel is part brown, part gold; it's unmixed
against the gold around it, so the white meets the gold cleanly instead
of through a muddy brown fringe.

Writes public/logos/naxis-wordmark-light.png, the same size.
"""

import pathlib

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "logos" / "naxis-wordmark.png"
OUT = ROOT / "public" / "logos" / "naxis-wordmark-light.png"

# The lettering's brown, as drawn, and the white it becomes.
BROWN = np.array([81.0, 41.0, 27.0])
WHITE = np.array([255.0, 255.0, 255.0])
# Brightness (0-255) at or below which a pixel is lettering, and at or
# above which it's the N's gold (the darkest gold sits around 128).
INK, GOLD = 70.0, 118.0


def blur(channel: np.ndarray, radius: float) -> np.ndarray:
    """A Gaussian blur, one axis at a time."""
    reach = int(radius * 3)
    kernel = np.exp(-0.5 * (np.arange(-reach, reach + 1) / radius) ** 2)
    kernel /= kernel.sum()
    along = lambda a, axis: np.apply_along_axis(lambda row: np.convolve(row, kernel, mode="same"), axis, a)
    return along(along(channel, 0), 1)


def main() -> None:
    image = np.asarray(Image.open(SOURCE).convert("RGBA")).astype(float)
    rgb, alpha = image[..., :3], image[..., 3]
    lum = rgb @ np.array([0.299, 0.587, 0.114])

    # The gold nearby, for every pixel: the N's colour averaged over a few
    # pixels round it (ignoring the lettering and the transparent ground).
    gold_mask = ((lum >= GOLD) & (alpha > 250)).astype(float)
    weight = blur(gold_mask, 4)
    local = np.stack([blur(rgb[..., c] * gold_mask, 4) for c in range(3)], -1) / np.maximum(weight, 1e-6)[..., None]
    near_gold = weight > 0.02

    # How much of each pixel is lettering: all of it where it's dark, none
    # where it's gold, and in between (the edges over the N), the share
    # that mixes its colour from the brown and the gold beside it.
    span = BROWN - local
    share = np.einsum("ijk,ijk->ij", rgb - local, span) / np.maximum(np.einsum("ijk,ijk->ij", span, span), 1e-6)
    share = np.where(near_gold, np.clip(share, 0, 1), 1.0)
    share = np.where(lum <= INK, 1.0, share)
    share = np.where(lum >= GOLD, 0.0, share)

    # Repaint: the lettering's share white, the rest the gold it was
    # mixed with (or the pixel as it was, away from the N).
    rest = np.where(near_gold[..., None], local, rgb)
    out = rgb.copy()
    edge = (share > 0) & (lum < GOLD)
    out[edge] = (share[edge, None] * WHITE) + (1 - share[edge, None]) * rest[edge]

    result = np.dstack([np.clip(out, 0, 255), alpha]).astype(np.uint8)
    Image.fromarray(result, "RGBA").save(OUT, optimize=True)
    print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
