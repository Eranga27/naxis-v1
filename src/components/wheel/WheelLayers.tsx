import Image from "next/image";
import { GIANT_WHEEL as W } from "@/content/giantWheel";

// The client's Giant Wheel as separate layers — the ring outlines, the
// three lettered rings and the centre disc — so each can turn on its own.
// Shared by the homepage hero and the values section. Server-rendered:
// the path data travels as markup rather than script.

// The artwork's own units, with room outside the rim for a pointer.
export const WHEEL_VIEW = 480;
export const WHEEL_VIEW_BOX = `${-WHEEL_VIEW} ${-WHEEL_VIEW} ${WHEEL_VIEW * 2} ${WHEEL_VIEW * 2}`;
/** Radii of the four ring outlines, outermost first, and their stroke. */
export const WHEEL_RADII = W.radii;
export const WHEEL_RIM_WIDTH = W.rimWidth;

// The centre disc covers the innermost ring and its outline; as a share
// of the drawing, for placing it over the SVG layers.
const DISC = W.radii[3] + W.rimWidth / 2;
export const DISC_BOX = {
  left: `${((WHEEL_VIEW - DISC) / (WHEEL_VIEW * 2)) * 100}%`,
  top: `${((WHEEL_VIEW - DISC) / (WHEEL_VIEW * 2)) * 100}%`,
  width: `${((DISC * 2) / (WHEEL_VIEW * 2)) * 100}%`,
  height: `${((DISC * 2) / (WHEEL_VIEW * 2)) * 100}%`,
};

/**
 * "light" is the client's artwork as drawn, for a cream page. "dark" is
 * the same artwork lit for a dark stage: the gold is gilded (a banded
 * metallic gradient, which catches the light as the ring turns), the
 * brown that would vanish on dark becomes cream, and the green brightens.
 */
export type WheelTone = "light" | "dark";

const CREAM = "#f4efe4";
const EMERALD = "#2fd08a";

/** A banded, metallic gold across the whole drawing. */
function Gild({ id }: { id: string }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="-160" y1={-WHEEL_VIEW} x2="160" y2={WHEEL_VIEW}>
      <stop offset="0" stopColor="#fff3d1" />
      <stop offset="0.2" stopColor="#f0c565" />
      <stop offset="0.42" stopColor="#b97a26" />
      <stop offset="0.6" stopColor="#f7dc97" />
      <stop offset="0.8" stopColor="#c48a35" />
      <stop offset="1" stopColor="#fbe3a8" />
    </linearGradient>
  );
}

type SvgProps = Omit<React.SVGProps<SVGSVGElement>, "children">;

/** The four ring outlines. */
export function WheelRims({ tone, ...props }: { tone: WheelTone } & SvgProps) {
  const dark = tone === "dark";
  const strokes = dark
    ? ["url(#wheel-gild-rims)", "rgba(244,239,228,0.4)", "url(#wheel-gild-rims)", "rgba(230,205,147,0.75)"]
    : W.rimColours;
  return (
    <svg viewBox={WHEEL_VIEW_BOX} aria-hidden="true" {...props}>
      {dark && (
        <defs>
          <Gild id="wheel-gild-rims" />
        </defs>
      )}
      {W.radii.map((r, i) => (
        <circle key={r} data-rim={i} r={r} fill="none" stroke={strokes[i]} strokeWidth={W.rimWidth} />
      ))}
    </svg>
  );
}

/** One lettered ring: the six values, the motto, or the name and stars. */
export function WheelRing({ ring, tone, ...props }: { ring: "values" | "motto" | "name"; tone: WheelTone } & SvgProps) {
  const dark = tone === "dark";
  const green = dark ? EMERALD : W.green;
  const gild = `wheel-gild-${ring}`;
  return (
    <svg viewBox={WHEEL_VIEW_BOX} aria-hidden="true" {...props}>
      {dark && ring !== "motto" && (
        <defs>
          <Gild id={gild} />
        </defs>
      )}
      {ring === "values" && (
        <>
          {W.values.map((value, i) => (
            <path key={value.name} data-value={i} d={value.d} fill={dark ? `url(#${gild})` : W.valueColour} />
          ))}
          <path data-bars d={W.valueBars} fill={green} />
        </>
      )}
      {ring === "motto" && (
        <>
          <path d={W.motto.top + W.motto.bottom} fill={dark ? CREAM : W.motto.colour} />
          <path data-bars d={W.mottoBars} fill={green} />
        </>
      )}
      {ring === "name" && (
        <>
          <path d={W.name.top} fill={dark ? `url(#${gild})` : W.name.topColour} />
          <path d={W.name.bottom} fill={dark ? CREAM : W.name.bottomColour} />
          <path data-stars d={W.stars} fill={green} />
        </>
      )}
    </svg>
  );
}

/**
 * The centre disc of Australian icons about the N. On a dark stage it
 * sits on a cream enamel plate (the icons were drawn for a pale ground).
 */
export function WheelDisc({
  tone,
  sizes,
  priority = false,
}: {
  tone: WheelTone;
  sizes: string;
  priority?: boolean;
}) {
  const image = (
    <Image
      src="/images/wheel/centre.webp"
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      data-wheel-disc
      className="select-none"
      draggable={false}
    />
  );
  if (tone === "light") return image;
  return (
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background: "radial-gradient(circle at 50% 42%, #fffaf0 0%, #f4efe4 55%, #e3d6bb 100%)",
        boxShadow: "inset 0 0 0 2px rgba(247,220,151,0.9), inset 0 -18px 40px rgba(120,80,30,0.25), 0 0 60px rgba(255,201,74,0.18)",
      }}
    >
      {image}
    </div>
  );
}
