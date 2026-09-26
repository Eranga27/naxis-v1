"""Build the What We Do film's frames (see docs/SERVICES-FILM-PLAN.md).

    pip install pillow numpy imageio-ffmpeg

    # Stand-in, from the four service photos (slow push-ins, and a
    # push-through dissolve for each morph):
    python3 scripts/build-service-film.py --stand-in

    # The real film: the graded master and where each segment starts.
    python3 scripts/build-service-film.py --master media-library/services-film/master.mp4 \\
        --cuts media-library/services-film/cuts.json

The film runs hold 1, morph 1>2, hold 2, morph 2>3, hold 3, morph 3>4,
hold 4 — a hold per service (the camera slowly pushing in) and a morph
between each. The site scrubs it with the scroll, so it's cut into still
frames rather than played as video:

  - wide: 1440x810 WebP, 12 frames a hold and 32 a morph, for landscape
    screens;
  - tall: 540x960 WebP, a portrait crop round each segment's subject,
    8 a hold and 20 a morph, for phones and portrait tablets.

A hold's first and last frames are its ends; a morph's frames lie
strictly between the holds either side, so no frame repeats.

cuts.json: {"cuts": [8 times in seconds: where hold 1, morph 1>2, ...
hold 4 begin, then where hold 4 ends], "focus": [optional, 7 x
positions 0-1: where each segment's subject sits, for the tall crop;
default 0.62, as the clip brief asks]}.

Writes public/film/services/{wide,tall}/NNN.webp and
src/content/serviceFilm.ts (frame counts, which frames belong to which
segment, and a version for cache-busting).
"""

import argparse
import hashlib
import json
import math
import pathlib
import shutil
import subprocess

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_FRAMES = ROOT / "public" / "film" / "services"
OUT_TS = ROOT / "src" / "content" / "serviceFilm.ts"

SETS = {
    "wide": {"size": (1440, 810), "hold": 12, "morph": 32, "quality": 62},
    "tall": {"size": (540, 960), "hold": 8, "morph": 20, "quality": 60},
}
KINDS = ["hold", "morph", "hold", "morph", "hold", "morph", "hold"]

# The stand-in's sources: the current service photos, in order, and where
# each one's subject sits (x, y as a share of the photo).
PHOTOS = [
    ("product-development", (0.42, 0.62)),
    ("manufacturing", (0.66, 0.55)),
    ("quality", (0.42, 0.62)),
    ("logistics", (0.5, 0.42)),
]


def smooth(a: float, b: float, x: float) -> float:
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def view(image: Image.Image, size: tuple[int, int], scale: float, focus: tuple[float, float]) -> Image.Image:
    """The image filling `size` (cover), zoomed by `scale` about `focus`, kept inside the image."""
    w, h = image.size
    width, height = size
    k = max(width / w, height / h) * scale
    vw, vh = width / k, height / k
    left = min(max(focus[0] * w - vw / 2, 0), w - vw)
    top = min(max(focus[1] * h - vh / 2, 0), h - vh)
    return image.resize(size, Image.LANCZOS, box=(left, top, left + vw, top + vh))


def stand_in(set_name: str) -> list[Image.Image]:
    """The stand-in film: each photo pushed in slowly for its hold, and a
    push-through dissolve (the photo before still pushing, the next easing
    back from close, a dip in the light between) for each morph."""
    spec = SETS[set_name]
    photos = [(Image.open(ROOT / "public" / "images" / "services" / f"{name}.jpg").convert("RGB"), focus) for name, focus in PHOTOS]
    frames: list[Image.Image] = []
    for s, kind in enumerate(KINDS):
        if kind == "hold":
            image, focus = photos[s // 2]
            n = spec["hold"]
            for i in range(n):
                t = i / (n - 1)
                frames.append(view(image, spec["size"], 1.04 + 0.08 * t, focus))
        else:
            (a, fa), (b, fb) = photos[s // 2], photos[s // 2 + 1]
            m = spec["morph"]
            for i in range(m):
                t = (i + 1) / (m + 1)
                e = t * t * (3 - 2 * t)
                out = view(a, spec["size"], 1.12 + 0.35 * e, fa)
                into = view(b, spec["size"], 1.04 * (1 + 0.28 * (1 - e)), fb)
                mix = Image.blend(out, into, smooth(0.18, 0.82, t))
                dip = 1 - 0.28 * math.sin(math.pi * t)
                frames.append(Image.eval(mix, lambda v, d=dip: int(v * d)))
    return frames


def ffmpeg() -> str:
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def probe(master: pathlib.Path) -> tuple[int, int]:
    info = subprocess.run([ffmpeg(), "-i", str(master)], capture_output=True, text=True).stderr
    for line in info.splitlines():
        if "Video:" in line:
            for part in line.split(","):
                part = part.strip().split(" ")[0]
                if "x" in part and part.replace("x", "").isdigit():
                    w, h = part.split("x")
                    return int(w), int(h)
    raise SystemExit(f"no video stream in {master}")


def grab(master: pathlib.Path, at: float, size: tuple[int, int]) -> Image.Image:
    raw = subprocess.run(
        [ffmpeg(), "-v", "error", "-ss", f"{at:.4f}", "-i", str(master), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True,
        check=True,
    ).stdout
    w, h = size
    return Image.fromarray(np.frombuffer(raw[: w * h * 3], np.uint8).reshape(h, w, 3), "RGB")


def from_master(set_name: str, master: pathlib.Path, cuts: list[float], focus: list[float]) -> list[Image.Image]:
    """Frames sampled from the master: a hold from its first frame to its
    last, a morph strictly between the holds either side; each cropped to
    the set's shape round the segment's subject."""
    spec = SETS[set_name]
    size = probe(master)
    frames: list[Image.Image] = []
    for s, kind in enumerate(KINDS):
        start, end = cuts[s], cuts[s + 1]
        # The very last frame of the film sits a hair before its end.
        end_hold = end - 0.02 if s == len(KINDS) - 1 else end
        if kind == "hold":
            n = spec["hold"]
            times = [start + (end_hold - start) * i / (n - 1) for i in range(n)]
        else:
            m = spec["morph"]
            times = [start + (end - start) * (i + 1) / (m + 1) for i in range(m)]
        for at in times:
            frames.append(view(grab(master, at, size), spec["size"], 1.0, (focus[s], 0.5)))
        print(f"  {set_name} {kind} {s}: {len(times)} frames")
    return frames


def main() -> None:
    parser = argparse.ArgumentParser()
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--stand-in", action="store_true")
    source.add_argument("--master", type=pathlib.Path)
    parser.add_argument("--cuts", type=pathlib.Path)
    args = parser.parse_args()
    if args.master:
        if not args.cuts:
            raise SystemExit("--master needs --cuts")
        spec = json.loads(args.cuts.read_text())
        cuts = [float(c) for c in spec["cuts"]]
        if len(cuts) != len(KINDS) + 1:
            raise SystemExit(f"cuts: {len(KINDS) + 1} times, not {len(cuts)}")
        focus = [float(f) for f in spec.get("focus", [0.62] * len(KINDS))]

    digest = hashlib.sha1()
    counts = {}
    for set_name, spec in SETS.items():
        frames = stand_in(set_name) if args.stand_in else from_master(set_name, args.master, cuts, focus)
        out = OUT_FRAMES / set_name
        shutil.rmtree(out, ignore_errors=True)
        out.mkdir(parents=True)
        total = 0
        for i, frame in enumerate(frames):
            path = out / f"{i:03d}.webp"
            frame.save(path, "WEBP", quality=spec["quality"], method=6)
            digest.update(path.read_bytes())
            total += path.stat().st_size
        counts[set_name] = len(frames)
        print(f"{out.relative_to(ROOT)}: {len(frames)} frames, {total / 1e6:.1f}MB")

    # Which frames belong to which segment, per set.
    segments = []
    at = {name: 0 for name in SETS}
    for s, kind in enumerate(KINDS):
        entry = {"kind": kind, "service": s // 2} if kind == "hold" else {"kind": kind, "from": s // 2}
        for name, spec in SETS.items():
            n = spec[kind]
            entry[name] = [at[name], at[name] + n]
            at[name] += n
        segments.append(entry)

    manifest = {
        "source": "stand-in" if args.stand_in else args.master.name,
        "base": "/film/services",
        "version": digest.hexdigest()[:10],
        "sets": {name: {"width": spec["size"][0], "height": spec["size"][1], "count": counts[name]} for name, spec in SETS.items()},
        "segments": segments,
    }
    OUT_TS.write_text(
        "// GENERATED by scripts/build-service-film.py (see\n"
        "// docs/SERVICES-FILM-PLAN.md). Don't edit; re-run the script.\n\n"
        "// The What We Do film's frames: how many in each set, and which\n"
        "// belong to each hold and morph ([first, end) per set).\n"
        f"export const SERVICE_FILM = {json.dumps(manifest, indent=2)} as const;\n"
    )
    print(f"{OUT_TS.relative_to(ROOT)}: {manifest['source']}, version {manifest['version']}")


if __name__ == "__main__":
    main()
