"""Build the homepage's Giant Wheel from the client's artwork.

    pip install pymupdf pillow
    python3 scripts/build-giant-wheel.py

The source is client-details/NAXIS GIANT WHEEL - v2.pdf: one page of pure
vector art, its lettering already outlined. Every shape is sorted into
the wheel's rings by its distance from the centre, so each ring can turn
on its own:

  - values: the outer ring's six words (Quality, Reliability, Flawless,
    Flexible, Fast, Integrity), grouped word by word, and the green bars
    between them
  - motto: "Delivering excellence / through experience", and its bars
  - name: "NAXIS" / "AUSTRALIA", and the green stars
  - rims: the four ring outlines
  - centre: the disc of Australian icons around the N mark, which is
    ~6,500 shapes, so it's drawn once to a WebP rather than shipped as
    SVG. Its white backing is left out so the disc sits on the page,
    and white elsewhere (drawn for a white page) takes the site's cream,
    except in the flag. The N itself is a gradient (a PDF shading, which isn't among the
    shapes), so it's lifted from a plain render of the page.

Writes src/content/giantWheel.ts (path data, centred on the wheel's
centre, in the artwork's units) and public/images/wheel/centre.webp.
"""

import io
import json
import math
import pathlib

import numpy as np
import pymupdf
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "client-details" / "NAXIS GIANT WHEEL - v2.pdf"
OUT_TS = ROOT / "src" / "content" / "giantWheel.ts"
OUT_IMG = ROOT / "public" / "images" / "wheel"

# Where the gradient N sits, in the artwork's units from the centre.
N_BOX = (-47, -38, 46, 40)
# The page the wheel sits on (--color-cream): the artwork's white details
# outside the flag were drawn to match a white page, so they take this.
PAGE = "#f4efe4"

# The values in the order they sit round the wheel, clockwise from the top.
VALUES = ["Quality", "Reliability", "Flawless", "Flexible", "Fast", "Integrity"]


def hex_colour(rgb):
    return "#" + "".join(f"{round(c * 255):02x}" for c in rgb)


def path_data(drawing, cx, cy, places=1):
    """A drawing's items as SVG path data, moved so the wheel's centre is 0,0."""
    out = []
    current = None

    def pt(p):
        return f"{p.x - cx:.{places}f} {p.y - cy:.{places}f}"

    for item in drawing["items"]:
        kind = item[0]
        if kind == "l":
            a, b = item[1], item[2]
            if current is None or abs(current.x - a.x) > 1e-3 or abs(current.y - a.y) > 1e-3:
                out.append("M" + pt(a))
            out.append("L" + pt(b))
            current = b
        elif kind == "c":
            a, c1, c2, b = item[1:5]
            if current is None or abs(current.x - a.x) > 1e-3 or abs(current.y - a.y) > 1e-3:
                out.append("M" + pt(a))
            out.append("C" + " ".join(pt(p) for p in (c1, c2, b)))
            current = b
        elif kind == "re":
            r = item[1]
            out.append(f"M{r.x0 - cx:.{places}f} {r.y0 - cy:.{places}f}H{r.x1 - cx:.{places}f}V{r.y1 - cy:.{places}f}H{r.x0 - cx:.{places}f}Z")
            current = None
        elif kind == "qu":
            q = item[1]
            out.append("M" + pt(q.ul) + "L" + pt(q.ur) + "L" + pt(q.lr) + "L" + pt(q.ll) + "Z")
            current = None
    if drawing.get("closePath"):
        out.append("Z")
    return "".join(out)


def main() -> None:
    page = pymupdf.open(SOURCE)[0]
    drawings = page.get_drawings()

    # The outermost ring is the widest shape; its centre is the wheel's.
    rims = sorted((d for d in drawings if d["type"] == "s"), key=lambda d: -d["rect"].width)
    outer = rims[0]["rect"]
    cx, cy = (outer.x0 + outer.x1) / 2, (outer.y0 + outer.y1) / 2
    radii = [round((d["rect"].width) / 2, 1) for d in rims]

    rings = {"values": [], "valueBars": [], "motto": [], "mottoBars": [], "name": [], "stars": []}
    colours = {}
    centre = []
    for d in drawings:
        if d["type"] == "s":
            continue
        r = d["rect"]
        mx, my = (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2
        radius = math.hypot(mx - cx, my - cy)
        fill = d.get("fill")
        is_green = fill is not None and fill[0] < 0.05 and fill[1] > 0.3
        if max(r.width, r.height) > 380:
            continue  # the centre disc's white backing
        if radius < radii[3]:
            centre.append(d)
            continue
        ring = "values" if radius > radii[1] else "motto" if radius > radii[2] else "name"
        if is_green:
            ring = {"values": "valueBars", "motto": "mottoBars", "name": "stars"}[ring]
        # Angle clockwise from the top, for grouping the values into words.
        angle = math.degrees(math.atan2(mx - cx, -(my - cy))) % 360
        rings[ring].append({"d": path_data(d, cx, cy), "angle": angle, "radius": radius, "fill": hex_colour(fill)})
        colours.setdefault(ring, hex_colour(fill))

    # Each value's letters lie between two green bars.
    bars = sorted(b["angle"] for b in rings["valueBars"])
    def word_index(angle):
        # Bars sit either side of each word; Quality straddles 0 degrees.
        for i in range(len(bars)):
            lo, hi = bars[i - 1], bars[i]
            if (lo < hi and lo < angle < hi) or (lo > hi and (angle > lo or angle < hi)):
                return i
        raise ValueError(angle)
    words = {}
    for glyph in rings["values"]:
        words.setdefault(word_index(glyph["angle"]), []).append(glyph)
    # Order the words clockwise from the top, starting with the one that
    # straddles 0 degrees (turning everything 30 degrees on puts its first
    # letter nearest zero).
    order = sorted(words, key=lambda i: min((g["angle"] + 30) % 360 for g in words[i]))
    values = []
    for name, i in zip(VALUES, order):
        glyphs = sorted(words[i], key=lambda g: (g["angle"] + 30) % 360)
        angles = [((g["angle"] + 180) % 360) - 180 if name == "Quality" else g["angle"] for g in glyphs]
        values.append({
            "name": name,
            "letters": len(glyphs),
            "angle": round(sum(angles) / len(angles) % 360, 1),
            "d": "".join(g["d"] for g in glyphs),
        })

    # The motto and name rings: top arc and bottom arc as one path each.
    def arc(ring, top):
        return "".join(g["d"] for g in rings[ring] if (g["angle"] > 270 or g["angle"] < 90) == top)

    data = {
        "radii": radii,
        "rimColours": [hex_colour(d["color"]) for d in rims],
        "rimWidth": rims[0]["width"],
        "values": values,
        "valueColour": colours["values"],
        "green": colours["valueBars"],
        "valueBars": "".join(b["d"] for b in rings["valueBars"]),
        # Clockwise from the top, in degrees: the bars that part the words.
        "valueBarAngles": [round(a, 1) for a in bars],
        "motto": {"top": arc("motto", True), "bottom": arc("motto", False), "colour": colours["motto"]},
        "mottoBars": "".join(b["d"] for b in rings["mottoBars"]),
        "name": {
            "top": arc("name", True),
            "bottom": arc("name", False),
            "topColour": next(g["fill"] for g in rings["name"] if g["angle"] > 270 or g["angle"] < 90),
            "bottomColour": next(g["fill"] for g in rings["name"] if 90 < g["angle"] < 270),
        },
        "stars": "".join(s["d"] for s in rings["stars"]),
    }

    header = (
        "// GENERATED by scripts/build-giant-wheel.py from the client's\n"
        "// artwork (client-details/NAXIS GIANT WHEEL - v2.pdf). Don't edit;\n"
        "// change the script and re-run it.\n\n"
        "// Path data is in the artwork's units, centred on the wheel.\n"
    )
    OUT_TS.write_text(header + "export const GIANT_WHEEL = " + json.dumps(data, indent=2) + " as const;\n")

    # The centre disc, drawn through MuPDF's SVG renderer with a
    # transparent ground.
    r = radii[3] + rims[3]["width"] / 2
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-r} {-r} {2 * r} {2 * r}" width="{2 * r}" height="{2 * r}">']
    # The flag is its largest shape; a little slack for its own edges.
    flag = max(centre, key=lambda d: d["rect"].width)["rect"] + (-1, -1, 1, 1)
    for d in centre:
        fill = hex_colour(d["fill"])
        if fill == "#ffffff" and not flag.contains(d["rect"]):
            fill = PAGE
        rule = ' fill-rule="evenodd"' if d.get("even_odd") else ""
        opacity = d.get("fill_opacity")
        alpha = f' fill-opacity="{opacity:.3f}"' if opacity is not None and opacity < 1 else ""
        # Full precision: the flag is thousands of abutting pieces, and
        # rounding opens hairline seams between them.
        svg.append(f'<path d="{path_data(d, cx, cy, 3)}" fill="{fill}"{rule}{alpha}/>')
    svg.append("</svg>")
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(stream="".join(svg).encode(), filetype="svg")
    for size in (1024,):
        zoom = size / (2 * r)
        pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=True)
        shapes = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")
        # The N from a plain render (on white): its opacity read back from
        # how far each pixel is from white, its colour un-blended from it.
        plain = page.get_pixmap(
            matrix=pymupdf.Matrix(zoom, zoom),
            clip=pymupdf.Rect(cx - r, cy - r, cx + r, cy + r),
            alpha=False,
        )
        rgb = np.asarray(Image.frombytes("RGB", (plain.width, plain.height), plain.samples)).astype(float)
        rgb = np.asarray(Image.fromarray(rgb.astype(np.uint8)).resize(shapes.size)).astype(float)
        alpha = np.clip((255 - rgb.min(axis=2)) / 150, 0, 1)
        colour = np.clip((rgb - 255 * (1 - alpha[..., None])) / np.maximum(alpha[..., None], 1e-3), 0, 255)
        box = np.zeros(alpha.shape, bool)
        x0, y0, x1, y1 = (round((v + r) * zoom) for v in N_BOX)
        box[y0:y1, x0:x1] = True
        n = np.dstack([colour, alpha * box * 255]).astype(np.uint8)
        disc = Image.fromarray(n, "RGBA")
        disc.alpha_composite(shapes)
        disc.save(OUT_IMG / "centre.webp", "WEBP", quality=86, method=6)

    print(f"centre ({cx:.1f}, {cy:.1f}), radii {radii}")
    for v in values:
        print(f"  {v['name']}: {v['letters']} letters at {v['angle']} deg")
    print(f"{OUT_TS.relative_to(ROOT)}: {OUT_TS.stat().st_size // 1024}KB")
    for path in sorted(OUT_IMG.glob("*.webp")):
        print(f"{path.relative_to(ROOT)}: {path.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
