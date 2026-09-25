import GiantWheelScene from "@/components/GiantWheelScene";
import { GIANT_WHEEL as W } from "@/content/giantWheel";
import { DISC_BOX, WHEEL_VIEW_BOX, WheelDisc, WheelRims, WheelRing } from "@/components/wheel/WheelLayers";

const RING_CLASS = "absolute inset-0 h-full w-full will-change-transform";

/**
 * The values section's wheel, as the client drew it: the ring outlines
 * stay put while the three lettered rings and the centre disc turn
 * independently (see GiantWheelScene).
 */
function WheelArt() {
  return (
    <>
      <WheelRims tone="light" className="absolute inset-0 h-full w-full" />
      {/* The spotlight on the value being read: a band behind its word,
          an arc over the rim and a pointer outside it. Shaped by the
          scene as it moves from word to word. */}
      <svg viewBox={WHEEL_VIEW_BOX} data-wheel-glow className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path data-glow="band" fill={W.valueColour} fillOpacity={0.1} />
        <path data-glow="arc" fill="none" stroke="var(--color-emerald)" strokeWidth={W.rimWidth} strokeLinecap="round" />
        <path data-glow="pointer" d={`M0 ${-W.radii[0] - 12} l-9 -15 h18 z`} fill="var(--color-emerald)" />
      </svg>
      <WheelRing ring="values" tone="light" data-ring="values" className={RING_CLASS} />
      <WheelRing ring="motto" tone="light" data-ring="motto" className={RING_CLASS} />
      <WheelRing ring="name" tone="light" data-ring="name" className={RING_CLASS} />
      <div data-ring="centre" className="absolute will-change-transform" style={DISC_BOX}>
        <WheelDisc tone="light" sizes="(min-width: 768px) 22vw, 36vw" />
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
