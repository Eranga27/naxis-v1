"""Build the homepage globe's textures into public/images/globe/.

    pip install pillow numpy
    python3 scripts/build-globe-textures.py

Sources are NASA imagery (public domain), as mirrored in the three-globe
project's examples:
  - earth-blue-marble.jpg: NASA Blue Marble, the daylit surface
  - earth-night.jpg: NASA Earth at Night, from which only the city lights
    are kept. Its unlit land and sea are a dark blue with almost no red,
    while the lights are near-white, so the red channel separates them.

Writes a 4096 and a 2048 wide WebP of each; GlobalNetwork loads the
smaller pair below 1024px wide.
"""

import io
import pathlib
import urllib.request

import numpy as np
from PIL import Image

SOURCE = "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/"
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "images" / "globe"


def fetch(name: str) -> Image.Image:
    with urllib.request.urlopen(SOURCE + name) as response:
        return Image.open(io.BytesIO(response.read())).convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    day = fetch("earth-blue-marble.jpg")
    red = np.asarray(fetch("earth-night.jpg")).astype(np.float32)[..., 0]
    lights = Image.fromarray((np.clip((red - 20) / 110, 0, 1) ** 0.8 * 255).astype(np.uint8), "L").convert("RGB")

    for width in (4096, 2048):
        size = (width, width // 2)
        day.resize(size, Image.LANCZOS).save(OUT / f"earth-day-{width}.webp", "WEBP", quality=78, method=6)
        lights.resize(size, Image.LANCZOS).save(OUT / f"earth-lights-{width}.webp", "WEBP", quality=80, method=6)

    for path in sorted(OUT.glob("*.webp")):
        print(f"{path.name}: {path.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
