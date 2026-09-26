"""Build the What We Do film's frames (see docs/SERVICES-FILM-PLAN.md).

    pip install pillow numpy imageio-ffmpeg
    python3 scripts/build-service-film.py [media-library/services-film/edit.json]

The film runs hold 1, morph 1>2, hold 2, morph 2>3, hold 3, morph 3>4,
hold 4 — a hold per service and a morph between each. The site scrubs it
with the scroll, so it's cut into still frames rather than played as
video:

  - wide: 1440x810 WebP, 16 frames a hold and 44 a morph, for landscape
    screens;
  - tall: 540x960 WebP, a portrait crop round each shot's subject,
    12 a hold and 30 a morph, for phones and portrait tablets;

or a segment's own "frames": {"wide": 20, "tall": 13}, for a clip that
moves a lot for its scroll (the site scrolls every hold, and every morph,
the same distance, whatever its frames).

Those are squeezed to stream (the whole film is fetched), so every hold
frame (where the film can come to rest) is also written at the footage's
own resolution and high quality, to {wide,tall}-rest/NNN.webp: the site
fetches the one it stops on and fades it in over the canvas.

A hold's first and last frames are its ends; a morph's frames lie
strictly between the holds either side, so no frame repeats.

The edit (edit.json, next to the footage) says what plays in each of the
seven segments, as a list of pieces played in order:

  {"clip": "name.mp4", "from": 2.0, "to": 5.0, "focus": [0.6, 0.5]}
      a clip, from/to in seconds (default: all of it);
  {"still": "name.png", "zoom": [1.0, 1.1], "seconds": 2, "focus": ...}
      a still, pushed in slowly;
  "push" or {"push": 2.0}
      a crafted push-through dissolve (the picture before pushing on,
      the one after easing back from close, a dip in the light between)
      from the piece before it to the piece after it, across segment
      ends: a morph that's only "push" crafts the whole move.

Two pieces with no push between them are a cut, so the second must start
where the first ends (a clip made from the other's last frame); the
script prints how far apart each cut's two frames are. A segment's frames
are shared among its pieces by length: a clip's seconds, a still's
`seconds` (default 2), a push's (default 1.5). `focus` is where the
subject sits, x and y as shares of the frame, or a pair of them to pan
from and to over the piece: the tall crop centres on it, and stills push
in on it.

Writes public/film/services/{wide,tall}/NNN.webp, {wide,tall}-rest/ and
src/content/serviceFilm.ts (frame counts, which frames belong to which
segment, and a version for cache-busting).
"""

import argparse
import functools
import hashlib
import json
import math
import pathlib
import shutil
import subprocess

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
EDIT = ROOT / "media-library" / "services-film" / "edit.json"
OUT_FRAMES = ROOT / "public" / "film" / "services"
OUT_TS = ROOT / "src" / "content" / "serviceFilm.ts"

SETS = {
    "wide": {"size": (1440, 810), "hold": 16, "morph": 44, "quality": 62},
    "tall": {"size": (540, 960), "hold": 12, "morph": 30, "quality": 60},
}
# Each hold frame again at the footage's full resolution (the tall crop of
# a 1080p frame is 608 wide), for when the film is at rest on it.
REST = {
    "wide": {"size": (1920, 1080), "quality": 86},
    "tall": {"size": (608, 1080), "quality": 86},
}
KINDS = ["hold", "morph", "hold", "morph", "hold", "morph", "hold"]
LABELS = ["hold 1", "morph 1>2", "hold 2", "morph 2>3", "hold 3", "morph 3>4", "hold 4"]

# A clip's last sample sits a hair before its end.
TAIL = 0.05
PUSH_SECONDS = 1.5
STILL_SECONDS = 2.0


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


def ffmpeg() -> str:
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


@functools.cache
def probe(video: pathlib.Path) -> tuple[int, int, float]:
    """A video's width, height and duration (seconds)."""
    info = subprocess.run([ffmpeg(), "-i", str(video)], capture_output=True, text=True).stderr
    size = duration = None
    for line in info.splitlines():
        if "Duration:" in line and duration is None:
            h, m, sec = line.split("Duration:")[1].split(",")[0].strip().split(":")
            duration = int(h) * 3600 + int(m) * 60 + float(sec)
        if "Video:" in line and size is None:
            for part in line.split(","):
                part = part.strip().split(" ")[0]
                if "x" in part and part.replace("x", "").isdigit():
                    w, h2 = part.split("x")
                    size = (int(w), int(h2))
    if not size or duration is None:
        raise SystemExit(f"no video stream in {video}")
    return size[0], size[1], duration


@functools.lru_cache(maxsize=8)
def grab(video: pathlib.Path, at: float) -> Image.Image:
    w, h, _ = probe(video)
    raw = subprocess.run(
        [ffmpeg(), "-v", "error", "-ss", f"{at:.4f}", "-i", str(video), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return Image.fromarray(np.frombuffer(raw[: w * h * 3], np.uint8).reshape(h, w, 3), "RGB")


class Shot:
    """A clip or a still, and where its subject sits."""

    def __init__(self, spec: dict, folder: pathlib.Path):
        focus = spec.get("focus", [0.62, 0.5])
        self.focus = (focus, focus) if isinstance(focus[0], (int, float)) else (focus[0], focus[1])
        self.image = None
        if "clip" in spec:
            self.path = folder / spec["clip"]
            duration = probe(self.path)[2]
            self.start = float(spec.get("from", 0.0))
            self.end = float(spec.get("to", duration - TAIL))
            self.zoom = (1.0, 1.0)
            self.seconds = self.end - self.start
        else:
            self.path = folder / spec["still"]
            self.image = Image.open(self.path).convert("RGB")
            self.zoom = tuple(spec.get("zoom", [1.0, 1.1]))
            self.seconds = float(spec.get("seconds", STILL_SECONDS))
        self.name = self.path.name

    def at(self, u: float) -> tuple[Image.Image, float, tuple[float, float]]:
        """The picture, its zoom and its focus, u 0-1 through the piece."""
        (x0, y0), (x1, y1) = self.focus
        focus = (x0 + (x1 - x0) * u, y0 + (y1 - y0) * u)
        scale = self.zoom[0] + (self.zoom[1] - self.zoom[0]) * u
        image = self.image or grab(self.path, round(self.start + (self.end - self.start) * u, 4))
        return image, scale, focus

    def frame(self, u: float, size: tuple[int, int]) -> Image.Image:
        image, scale, focus = self.at(u)
        return view(image, size, scale, focus)


def push(a: Shot, b: Shot, t: float, size: tuple[int, int]) -> Image.Image:
    """From the end of `a` to the start of `b`, t 0-1: `a` pushes on,
    `b` eases back from close, with a dip in the light between. At t=0
    it's exactly a's last frame, at t=1 exactly b's first."""
    e = t * t * (3 - 2 * t)
    image, scale, focus = a.at(1.0)
    out = view(image, size, scale * (1 + 0.35 * e), focus)
    image, scale, focus = b.at(0.0)
    into = view(image, size, scale * (1 + 0.3 * (1 - e)), focus)
    mix = Image.blend(out, into, smooth(0.2, 0.8, t))
    dip = 1 - 0.22 * math.sin(math.pi * t)
    return Image.eval(mix, lambda v, d=dip: int(v * d))


def load(path: pathlib.Path) -> tuple[list[list], dict[str, list[int]]]:
    """The edit's segments, each a list of Shots and push lengths (floats),
    and how many frames each segment has in each set."""
    edit = json.loads(path.read_text())
    if len(edit["segments"]) != len(KINDS):
        raise SystemExit(f"{path.name}: {len(KINDS)} segments (hold 1, morph 1>2, ... hold 4), not {len(edit['segments'])}")
    segments = []
    counts: dict[str, list[int]] = {name: [] for name in SETS}
    for entry, kind in zip(edit["segments"], KINDS):
        for name, spec in SETS.items():
            counts[name].append(int(entry.get("frames", {}).get(name, spec[kind])))
        pieces = []
        for piece in entry["pieces"]:
            if piece == "push":
                pieces.append(PUSH_SECONDS)
            elif "push" in piece:
                pieces.append(float(piece["push"]))
            else:
                pieces.append(Shot(piece, path.parent))
        segments.append(pieces)
    for s, kind in enumerate(KINDS):
        if kind == "hold" and not (isinstance(segments[s][0], Shot) and isinstance(segments[s][-1], Shot)):
            raise SystemExit(f"{path.name}: {LABELS[s]} has to start and end on a clip or still")
    return segments, counts


def build(set_name: str, segments: list[list], counts: list[int]) -> tuple[list[Image.Image], dict[int, Image.Image]]:
    """The film's frames, a segment at a time, each segment's frames
    shared among its pieces by length; and each hold frame at rest size,
    by its index."""
    spec = SETS[set_name]
    size = spec["size"]
    flat = [piece for pieces in segments for piece in pieces]
    frames: list[Image.Image] = []
    rest: dict[int, Image.Image] = {}
    at = 0
    for s, (kind, pieces) in enumerate(zip(KINDS, segments)):
        n = counts[s]
        ts = [i / (n - 1) for i in range(n)] if kind == "hold" else [(i + 1) / (n + 1) for i in range(n)]
        lengths = [p.seconds if isinstance(p, Shot) else p for p in pieces]
        total = sum(lengths)
        for t in ts:
            # Which piece t falls in, and how far through it.
            edge = 0.0
            for k, length in enumerate(lengths):
                share = length / total
                if t <= edge + share + 1e-9 or k == len(lengths) - 1:
                    u = min(1.0, max(0.0, (t - edge) / share))
                    break
                edge += share
            piece = pieces[k]
            if isinstance(piece, Shot):
                render = functools.partial(piece.frame, u)
            else:
                where = at + k
                before = next(p for p in reversed(flat[:where]) if isinstance(p, Shot))
                after = next(p for p in flat[where + 1 :] if isinstance(p, Shot))
                render = functools.partial(push, before, after, u)
            if kind == "hold":
                rest[len(frames)] = render(REST[set_name]["size"])
            frames.append(render(size))
        at += len(pieces)
        names = " + ".join(p.name if isinstance(p, Shot) else "push" for p in pieces)
        print(f"  {set_name} {LABELS[s]}: {n} frames, {names}")
    return frames, rest


def check_cuts(segments: list[list]) -> None:
    """How far apart the two frames of each cut are (RMS on 0-255; a clip
    that really starts on the other's last frame is under ~12)."""
    flat = [piece for pieces in segments for piece in pieces]
    size = SETS["tall"]["size"]
    for a, b in zip(flat, flat[1:]):
        if isinstance(a, Shot) and isinstance(b, Shot):
            x = np.asarray(a.frame(1.0, size), np.float32)
            y = np.asarray(b.frame(0.0, size), np.float32)
            gap = float(np.sqrt(((x - y) ** 2).mean()))
            print(f"  cut {a.name} > {b.name}: {gap:.1f}{'  <- not a match; a push?' if gap > 20 else ''}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("edit", type=pathlib.Path, nargs="?", default=EDIT)
    args = parser.parse_args()
    segments, counts = load(args.edit)
    check_cuts(segments)

    digest = hashlib.sha1()
    for set_name, spec in SETS.items():
        frames, rest = build(set_name, segments, counts[set_name])
        for out, images, quality in (
            (OUT_FRAMES / set_name, dict(enumerate(frames)), spec["quality"]),
            (OUT_FRAMES / f"{set_name}-rest", rest, REST[set_name]["quality"]),
        ):
            shutil.rmtree(out, ignore_errors=True)
            out.mkdir(parents=True)
            total = 0
            for i, frame in images.items():
                path = out / f"{i:03d}.webp"
                frame.save(path, "WEBP", quality=quality, method=6)
                digest.update(path.read_bytes())
                total += path.stat().st_size
            print(f"{out.relative_to(ROOT)}: {len(images)} frames, {total / 1e6:.1f}MB")

    # Which frames belong to which segment, per set.
    manifest_segments = []
    at = {name: 0 for name in SETS}
    for s, kind in enumerate(KINDS):
        entry = {"kind": kind, "service": s // 2} if kind == "hold" else {"kind": kind, "from": s // 2}
        for name in SETS:
            n = counts[name][s]
            entry[name] = [at[name], at[name] + n]
            at[name] += n
        manifest_segments.append(entry)

    manifest = {
        "source": args.edit.resolve().relative_to(ROOT).as_posix(),
        "base": "/film/services",
        "version": digest.hexdigest()[:10],
        "sets": {name: {"width": spec["size"][0], "height": spec["size"][1], "count": sum(counts[name])} for name, spec in SETS.items()},
        "rest": {name: {"width": spec["size"][0], "height": spec["size"][1]} for name, spec in REST.items()},
        "segments": manifest_segments,
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
