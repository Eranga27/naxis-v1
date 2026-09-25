"use client";

import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

// The client's phrase, set as a small story of how a garment is made:
// "ideas" is sketched in pencil, and "WEARABLE." is stitched, then
// filled with fabric in Australia's green and gold, as patches sewn on.
//
// Two drawings of the same lockup, each in its own units: on wider
// screens "WE MAKE" sits small beside the script "ideas", over
// "WEARABLE." in the headline face; on phones the three stack, so the
// lockup fills the tall screen instead of a strip across it. Both are
// in the markup and animated together; CSS shows one.
type Layout = {
  id: string;
  className: string;
  view: { w: number; h: number };
  make: { x: number; y: number; size: number; spacing: number; anchor: "start" | "middle" };
  ideas: { x: number; y: number; size: number; anchor: "start" | "middle" };
  wearable: { y: number; size: number };
};
const LAYOUTS: Layout[] = [
  {
    id: "wide",
    className: "hidden w-[min(92vw,1180px,150svh)] md:block",
    view: { w: 1000, h: 600 },
    make: { x: 18, y: 322, size: 40, spacing: 12, anchor: "start" },
    ideas: { x: 318, y: 330, size: 360, anchor: "start" },
    wearable: { y: 575, size: 272 },
  },
  {
    id: "phone",
    className: "w-[94vw] md:hidden",
    view: { w: 600, h: 620 },
    make: { x: 306, y: 104, size: 38, spacing: 12, anchor: "middle" },
    ideas: { x: 300, y: 398, size: 310, anchor: "middle" },
    wearable: { y: 596, size: 170 },
  },
];
// Longer than any one letter's outline: SVG dashes text glyph by glyph,
// so one dash this long draws every letter's outline at once.
const TRACE = 3000;

function Lockup({ id, className, view, make, ideas, wearable }: Layout) {
  const word = {
    x: view.w / 2,
    y: wearable.y,
    textAnchor: "middle" as const,
    className: "font-headline",
    fontSize: wearable.size,
    letterSpacing: wearable.size / 136,
    children: "WEARABLE.",
  };
  const guides = [ideas.y, wearable.y];
  return (
    <svg
      viewBox={`0 0 ${view.w} ${view.h}`}
      className={`relative z-10 overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Green and gold, as in the site's brand gradient. */}
        <linearGradient id={`iw-fabric-${id}`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0%" stopColor="var(--color-gold)" />
          <stop offset="45%" stopColor="#d9d36a" />
          <stop offset="100%" stopColor="var(--color-emerald-bright)" />
        </linearGradient>
        {/* A twill weave: fine diagonal ribs over the fabric. */}
        <pattern id={`iw-twill-${id}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
          <rect width="7" height="2.2" fill="#000" fillOpacity="0.1" />
        </pattern>
        <clipPath id={`iw-wipe-${id}`}>
          <rect data-wipe data-full={view.w} x="0" y="0" width={view.w} height={view.h} />
        </clipPath>
        {/* The stitches appear as this unseen pen traces the letters. */}
        <mask id={`iw-stitch-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={view.w} height={view.h}>
          <text
            {...word}
            data-stitch-pen
            fill="none"
            stroke="#fff"
            strokeWidth={16}
            strokeDasharray={`${TRACE} ${TRACE}`}
            strokeDashoffset={0}
          />
        </mask>
      </defs>

      {/* Chalk guides at the two baselines. */}
      {guides.map((y) => (
        <line
          key={y}
          data-guide
          x1={0}
          x2={view.w}
          y1={y + 6}
          y2={y + 6}
          stroke="var(--color-gold-light)"
          strokeOpacity={0.3}
          strokeWidth={1.2}
          strokeDasharray={`${TRACE} ${TRACE}`}
          strokeDashoffset={0}
        />
      ))}

      <text
        data-make
        x={make.x}
        y={make.y}
        textAnchor={make.anchor}
        className="font-body"
        fontSize={make.size}
        fontWeight={700}
        letterSpacing={make.spacing}
        fill="var(--color-cream)"
        fillOpacity={0.75}
      >
        WE MAKE
      </text>

      {/* The idea: a pencil outline, then filled in. */}
      <text
        data-sketch
        x={ideas.x}
        y={ideas.y}
        textAnchor={ideas.anchor}
        className="font-script"
        fontSize={ideas.size}
        fill="var(--color-cream)"
        stroke="var(--color-gold-light)"
        strokeWidth={1.6}
        strokeDasharray={`${TRACE} ${TRACE}`}
        strokeDashoffset={0}
      >
        ideas
      </text>

      {/* The garment: a lift underneath, the fabric and its weave, and
          the stitching over the edges. */}
      <g clipPath={`url(#iw-wipe-${id})`}>
        <text {...word} data-shadow x={word.x + 5} y={word.y + 8} fill="#120700" fillOpacity={0.7} />
        <text {...word} fill={`url(#iw-fabric-${id})`} />
        <text {...word} fill={`url(#iw-twill-${id})`} />
      </g>
      <text
        {...word}
        mask={`url(#iw-stitch-${id})`}
        fill="none"
        stroke="var(--color-cream)"
        strokeWidth={2.4}
        strokeDasharray="9 7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function IdeasWearable() {
  const sectionRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const all = (selector: string) => Array.from(section.querySelectorAll<SVGElement>(selector));
    const guides = all("[data-guide]");
    const make = all("[data-make]");
    const sketch = all("[data-sketch]");
    const stitchPen = all("[data-stitch-pen]");
    const shadow = all("[data-shadow]");
    const wipe = all("[data-wipe]");
    const progress = section.querySelector<HTMLElement>("[data-progress]");
    const fullWidth = (_: number, el: Element) => Number((el as HTMLElement).dataset.full);

    const mm = gsap.matchMedia();
    mm.add(
      {
        isPhone: "(max-width: 767px)",
        isWide: "(min-width: 768px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isPhone, reduce } = context.conditions as { isPhone: boolean; reduce: boolean };
        // The finished lockup is the markup's own state; reduced motion
        // just keeps it.
        if (reduce) return;

        gsap.set(guides, { strokeDashoffset: TRACE });
        gsap.set(make, { opacity: 0, y: 18 });
        gsap.set(sketch, { strokeDashoffset: TRACE, fillOpacity: 0 });
        gsap.set(stitchPen, { strokeDashoffset: TRACE });
        gsap.set(wipe, { attr: { width: 0 } });
        gsap.set(shadow, { opacity: 0 });

        // On the way in, the paper is ruled and the first words set, so
        // the section never arrives empty.
        gsap
          .timeline({
            scrollTrigger: { trigger: section, start: "top 70%", end: "top top", scrub: 0.6 },
          })
          .to(guides, { strokeDashoffset: 0, ease: "power1.inOut", stagger: 0.15 }, 0)
          .to(make, { opacity: 1, y: 0, ease: "power2.out" }, 0.3);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + window.innerHeight * (isPhone ? 1.3 : 1.6),
            pin: true,
            anticipatePin: 1,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (progress) gsap.set(progress, { scaleX: self.progress });
            },
          },
        });

        // The idea, sketched in outline, then inked in.
        tl.to(sketch, { strokeDashoffset: 0, duration: 0.3, ease: "power1.inOut" }, 0)
          .to(sketch, { fillOpacity: 1, duration: 0.1 }, 0.27)
          // A running stitch round every letter of WEARABLE...
          .to(stitchPen, { strokeDashoffset: 0, duration: 0.3, ease: "power1.inOut" }, 0.36)
          // ...and the fabric laid in, left to right.
          .to(wipe, { attr: { width: fullWidth }, duration: 0.2, ease: "power2.inOut" }, 0.64)
          .to(shadow, { opacity: 1, duration: 0.12 }, 0.7)
          .to(guides, { opacity: 0.35, duration: 0.1 }, 0.78)
          .to({}, { duration: 0.12 }, 0.88);
      }
    );
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ideas-wearable"
      // svh: a pinned full-screen section on a phone should match the
      // visible screen, not the taller bars-hidden viewport.
      className="relative flex h-svh min-h-[520px] w-full items-center justify-center overflow-hidden bg-bark"
    >
      {/* Pattern paper: a faint dot grid, darker towards the edges. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(var(--color-gold-light)_1px,transparent_1.2px)] [background-size:22px_22px] md:[background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-bark/40 to-bark"
      />

      <h2 className="sr-only">We make ideas wearable.</h2>

      {LAYOUTS.map((layout) => (
        <Lockup key={layout.id} {...layout} />
      ))}

      {/* Ambient micro-progress line for the pin */}
      <div className="absolute bottom-6 left-1/2 h-[2px] w-32 -translate-x-1/2 overflow-hidden rounded-full bg-cream/10 motion-reduce:hidden">
        <div data-progress className="h-full w-full origin-left bg-gold/60 will-change-transform" style={{ transform: "scaleX(0)" }} />
      </div>
    </section>
  );
}
