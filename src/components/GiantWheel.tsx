import Image from "next/image";
import GiantWheelScene from "@/components/GiantWheelScene";
import { GIANT_WHEEL as W } from "@/content/giantWheel";

// The artwork's own units, with room outside the rim for the pointer.
const WHEEL_VIEW = 480;
const VIEW_BOX = `${-WHEEL_VIEW} ${-WHEEL_VIEW} ${WHEEL_VIEW * 2} ${WHEEL_VIEW * 2}`;
// The centre disc's image covers the innermost ring and its outline.
const DISC = W.radii[3] + W.rimWidth / 2;
const DISC_SIZE = `${((DISC * 2) / (WHEEL_VIEW * 2)) * 100}%`;
const DISC_INSET = `${((WHEEL_VIEW - DISC) / (WHEEL_VIEW * 2)) * 100}%`;

/** One ring of the wheel: its own drawing, so it can turn on its own layer. */
function Ring({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox={VIEW_BOX}
      data-ring={name}
      className="absolute inset-0 h-full w-full will-change-transform"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/**
 * The client's Giant Wheel, drawn from their artwork in layers: the ring
 * outlines stay put while the three lettered rings and the centre disc
 * turn independently (see GiantWheelScene). Rendered on the server, so
 * the path data travels as markup rather than script.
 */
function WheelArt() {
  return (
    <>
      <svg viewBox={VIEW_BOX} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {W.radii.map((r, i) => (
          <circle key={r} r={r} fill="none" stroke={W.rimColours[i]} strokeWidth={W.rimWidth} />
        ))}
      </svg>
      {/* The spotlight on the value being read: a band behind its word,
          an arc over the rim and a pointer outside it. Shaped by the
          scene as it moves from word to word. */}
      <svg viewBox={VIEW_BOX} data-wheel-glow className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path data-glow="band" fill={W.valueColour} fillOpacity={0.1} />
        <path data-glow="arc" fill="none" stroke="var(--color-emerald)" strokeWidth={W.rimWidth} strokeLinecap="round" />
        <path data-glow="pointer" d={`M0 ${-W.radii[0] - 12} l-9 -15 h18 z`} fill="var(--color-emerald)" />
      </svg>
      <Ring name="values">
        {W.values.map((value, i) => (
          <path key={value.name} data-value={i} d={value.d} fill={W.valueColour} />
        ))}
        <path d={W.valueBars} fill={W.green} />
      </Ring>
      <Ring name="motto">
        <path d={W.motto.top + W.motto.bottom} fill={W.motto.colour} />
        <path d={W.mottoBars} fill={W.green} />
      </Ring>
      <Ring name="name">
        <path d={W.name.top} fill={W.name.topColour} />
        <path d={W.name.bottom} fill={W.name.bottomColour} />
        <path d={W.stars} fill={W.green} />
      </Ring>
      <div
        data-ring="centre"
        className="absolute will-change-transform"
        style={{ left: DISC_INSET, top: DISC_INSET, width: DISC_SIZE, height: DISC_SIZE }}
      >
        <Image
          src="/images/wheel/centre.webp"
          alt=""
          fill
          sizes="(min-width: 768px) 22vw, 36vw"
          className="select-none"
          draggable={false}
        />
      </div>
    </>
  );
}

export default function GiantWheel() {
  return (
    <GiantWheelScene
      art={<WheelArt />}
      geometry={{ rim: W.radii[0], band: W.radii[1], width: W.rimWidth, bars: W.valueBarAngles }}
    />
  );
}
