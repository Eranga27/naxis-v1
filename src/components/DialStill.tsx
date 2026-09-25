import Image from "next/image";
import { GIANT_WHEEL as W } from "@/content/giantWheel";

// Where each ring ends, as a share of the wheel's radius (as in
// lib/dialScene): each boundary sits in the white just inside a rim.
const [R1, R2, R3, R4] = W.radii;
const EDGE = R1 + W.rimWidth / 2;
const BOUNDS = [1, (R2 - 8) / EDGE, (R3 - 7) / EDGE, (R4 + 6) / EDGE, 0];
const pct = (share: number) => `${(share * 100).toFixed(2)}%`;
// Each ring a layer of the artwork, masked to its band; each reaches a
// little past its edge, into the white under the ring outside, so no
// seam shows between them.
const RINGS = [0, 1, 2, 3].map((k) => {
  const outer = pct(Math.min(1, BOUNDS[k] + 0.006));
  const inner = BOUNDS[k + 1] > 0 ? `transparent ${pct(BOUNDS[k + 1])}, #000 ${pct(BOUNDS[k + 1])}, ` : "";
  return `radial-gradient(circle closest-side, ${inner}#000 ${outer}, transparent ${outer})`;
});
// Their turns, as in the moving hero: values, motto, name, disc.
const SPIN: Record<string, string>[] = [
  { "--spin": "240s" },
  { "--spin": "300s", "--spin-dir": "reverse" },
  { "--spin": "200s" },
  { "--spin": "360s", "--spin-dir": "reverse" },
];

/**
 * Hero D's stand-in, without WebGL or under reduced motion: the same
 * close-up of the client's wheel, a quarter of it filling the frame (half
 * on phones), face on and in its own colours, lit from the top left. Its
 * rings turn slowly unless motion is reduced, when it is simply still.
 * No pin, no scroll sequence.
 */
export default function DialStill() {
  return (
    <section
      id="top"
      data-dark-hero
      className="relative h-svh min-h-[560px] w-full overflow-hidden bg-[#0a0705] [--cx:64%] [--cy:79%] [--r:calc(max(100svh,560px)*0.54)] md:[--cx:76%] md:[--cy:94%] md:[--r:calc(max(100svh,560px)*1.02)]"
    >
      <h1 className="sr-only">NAXIS Australia — delivering excellence through experience</h1>
      <p className="sr-only">Quality. Reliability. Flawless. Flexible. Fast. Integrity.</p>

      <div
        aria-hidden="true"
        className="absolute"
        style={{
          left: "calc(var(--cx) - var(--r))",
          top: "calc(var(--cy) - var(--r))",
          width: "calc(var(--r) * 2)",
          height: "calc(var(--r) * 2)",
        }}
      >
        {RINGS.map((mask, k) => (
          <div key={k} className="wheel-spin absolute inset-0" style={{ ...SPIN[k], maskImage: mask, WebkitMaskImage: mask } as React.CSSProperties}>
            <Image
              src="/images/wheel/original-2048.webp"
              alt=""
              fill
              sizes="(max-width: 767px) 108vh, 204vh"
              priority
              data-wheel-disc={k === 0 ? true : undefined}
              className="select-none"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* The key light, up and to the left; the rest falls away into the dark. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 85% at 40% 38%, transparent 0%, transparent 35%, rgba(10,7,5,0.4) 70%, rgba(10,7,5,0.85) 100%)",
        }}
      />
    </section>
  );
}
