"use client";

import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { GOLD, EMERALD } from "@/lib/brand";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

// The stages, in the client's words: "the process from concept, pattern
// making and grading through sampling, fitting, construction and size
// development."
const STAGES = [
  { label: "Concept", note: "The idea, drawn as a flat." },
  { label: "Pattern making", note: "The flat, broken into the pieces that are cut." },
  { label: "Grading", note: "Each piece, stepped across the size range." },
  { label: "Sampling & fitting", note: "Measured, sampled and fitted before bulk." },
];

// A T-shirt flat, drawn in a 400-wide box and placed centre stage.
const TEE = "M160 60 Q200 92 240 60 L300 78 L355 130 L330 158 L292 128 L292 340 L108 340 L108 128 L70 158 L45 130 L100 78 Z";
const TEE_DETAILS = [
  "M152 64 Q200 104 248 64", // neckband
];
const TEE_STITCHES = [
  "M346 124 L321 151", // right sleeve hem
  "M54 124 L79 151", // left sleeve hem
  "M112 330 L288 330", // body hem
];

// Pattern pieces, each drawn around its own origin.
const FRONT = "M40 0 Q80 36 120 0 L160 14 Q150 56 172 72 L172 290 L-12 290 L-12 72 Q10 56 0 14 Z";
const BACK = "M40 0 Q80 12 120 0 L160 14 Q150 56 172 72 L172 290 L-12 290 L-12 72 Q10 56 0 14 Z";
const SLEEVE = "M0 70 Q60 -6 120 70 L108 130 L12 130 Z";

// Where the pieces spread to, in the 800 x 460 drawing.
// Each is centred on (cx, cy) in its own coordinates; the grainline runs
// down it with an arrowhead at the top.
const PIECES = [
  { name: "Front", d: FRONT, x: 90, y: 120, cx: 80, cy: 145, grain: [80, 90, 230], labelY: 272 },
  { name: "Back", d: BACK, x: 330, y: 120, cx: 80, cy: 145, grain: [80, 90, 230], labelY: 272 },
  { name: "Sleeve ×2", d: SLEEVE, x: 590, y: 190, cx: 60, cy: 62, grain: [60, 40, 110], labelY: 124 },
];
// The flat's centre in the drawing, where the pieces start stacked.
const TEE_CENTER = { x: 400, y: 200 };

const grainPath = ([x, top, bottom]: number[]) =>
  `M${x} ${top} L${x} ${bottom} M${x - 5} ${top + 9} L${x} ${top} L${x + 5} ${top + 9}`;

/**
 * Product Development's signature: "where ideas become garments", drawn.
 * The section pins while a garment flat draws itself line by line, breaks
 * into its pattern pieces, grades across sizes and takes its fitting
 * measurements — the client's own sequence, stage by stage beside it.
 * Under reduced motion it shows the finished drawing, all stages at once.
 */
export default function SketchToSample() {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRefs = useRef<Array<HTMLLIElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const svg = svgRef.current;
    if (!section || !svg) return;
    const q = gsap.utils.selector(svg);
    const stages = stageRefs.current.filter((el): el is HTMLLIElement => el !== null);

    const light = (active: number) =>
      stages.forEach((stage, i) => {
        stage.dataset.state = i < active ? "done" : i === active ? "current" : "todo";
      });

    if (prefersReducedMotion()) {
      gsap.set(q("[data-tee]"), { opacity: 0 });
      light(STAGES.length);
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(q("[data-draw], [data-grade], [data-measure]"), { drawSVG: "0%" });
      gsap.set(q("[data-stitch], [data-label], [data-grain], [data-measure-label]"), { opacity: 0 });
      gsap.set(q("[data-piece]"), { opacity: 0 });
      // Pieces start stacked where the flat is, then spread out. Offsets
      // are on an inner group, relative to each piece's placed position.
      PIECES.forEach((piece, i) => {
        gsap.set(q(`[data-piece="${i}"]`), {
          x: TEE_CENTER.x - (piece.x + piece.cx),
          y: TEE_CENTER.y - (piece.y + piece.cy),
          scale: 0.6,
          transformOrigin: "50% 50%",
        });
      });
      light(0);

      let shown = -1;
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // Shorter on phones, where a long pin under the thumb feels stuck.
          end: () => "+=" + window.innerHeight * (window.innerWidth < 768 ? 1.5 : 2.2),
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            const active = p < 0.32 ? 0 : p < 0.6 ? 1 : p < 0.78 ? 2 : 3;
            if (active !== shown) {
              shown = active;
              light(active);
            }
          },
        },
      });

      // Concept: the flat draws itself, then its stitch lines.
      tl.to(q("[data-tee] [data-draw]"), { drawSVG: "100%", duration: 0.28, stagger: 0.04, ease: "none" }, 0)
        .to(q("[data-stitch]"), { opacity: 1, duration: 0.06, stagger: 0.02 }, 0.27)
        // Pattern making: the flat gives way to its pieces.
        .to(q("[data-tee]"), { opacity: 0, scale: 0.92, transformOrigin: "50% 50%", duration: 0.1 }, 0.34)
        .to(q("[data-piece]"), { opacity: 1, duration: 0.06 }, 0.36)
        .to(q("[data-piece]"), { x: 0, y: 0, scale: 1, duration: 0.16, stagger: 0.02 }, 0.38)
        .to(q("[data-piece] [data-draw]"), { drawSVG: "100%", duration: 0.12, ease: "none" }, 0.38)
        .to(q("[data-grain], [data-label]"), { opacity: 1, duration: 0.06, stagger: 0.02 }, 0.52)
        // Grading: the front steps out to the sizes either side.
        .to(q("[data-grade]"), { drawSVG: "100%", duration: 0.14, stagger: 0.05, ease: "none" }, 0.62)
        // Sampling & fitting: measured.
        .to(q("[data-measure]"), { drawSVG: "100%", duration: 0.1, stagger: 0.05, ease: "none" }, 0.8)
        .to(q("[data-measure-label]"), { opacity: 1, duration: 0.05, stagger: 0.05 }, 0.86)
        .to({}, { duration: 0.08 });
    }, section);

    return () => ctx.revert();
  }, []);

  const stroke = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  return (
    <section
      ref={sectionRef}
      aria-label="From sketch to sample"
      className="relative flex min-h-svh w-full flex-col justify-center overflow-hidden bg-cream px-6 pb-10 pt-24 sm:px-10 md:px-16 lg:h-svh lg:px-20 lg:py-16"
    >
      {/* Faint pattern-paper grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(74,42,28,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(74,42,28,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative grid w-full gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] lg:items-center lg:gap-12">
        <div>
          <p className="mb-4 font-body text-xs font-bold uppercase tracking-[0.35em] text-brown md:text-sm">
            From sketch to sample
          </p>
          <h2 className="mb-8 max-w-md font-serif text-[clamp(1.75rem,3.4vw,2.9rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-brown">
            Product development is where ideas become garments.
          </h2>
          <ol className="flex flex-col gap-3 md:gap-4">
            {STAGES.map((stage, i) => (
              <li
                key={stage.label}
                ref={(el) => {
                  stageRefs.current[i] = el;
                }}
                data-state="todo"
                className="group flex items-start gap-4 transition-opacity duration-300 data-[state=todo]:opacity-35"
              >
                <span className="mt-1.5 block h-3 w-[3px] shrink-0 rounded-full bg-ink/20 transition-[background-color,scale] duration-300 group-data-[state=current]:scale-y-[1.8] group-data-[state=current]:bg-gold group-data-[state=done]:bg-emerald" />
                <span>
                  <span className="block font-headline text-2xl uppercase tracking-[-0.01em] text-ink md:text-3xl">
                    {String(i + 1).padStart(2, "0")} · {stage.label}
                  </span>
                  <span className="block font-body text-sm text-ink/60">{stage.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 800 460"
          role="img"
          aria-label="A T-shirt flat sketch, its pattern pieces, graded sizes and fitting measurements"
          className="order-first w-full lg:order-none"
        >
          {/* Concept: the flat */}
          <g transform="translate(200 0)">
          <g data-tee stroke="var(--color-brown)" strokeWidth={2.4} {...stroke}>
            <path data-draw d={TEE} />
            {TEE_DETAILS.map((d) => (
              <path key={d} data-draw d={d} />
            ))}
            {TEE_STITCHES.map((d) => (
              <path key={d} data-stitch d={d} strokeDasharray="5 5" strokeWidth={1.6} />
            ))}
          </g>
          </g>

          {/* Pattern pieces */}
          {PIECES.map((piece, i) => (
            <g key={piece.name} transform={`translate(${piece.x} ${piece.y})`}>
             <g data-piece={i}>
              <path data-draw d={piece.d} stroke="var(--color-brown)" strokeWidth={2.2} {...stroke} />
              {/* Grainline */}
              <path data-grain d={grainPath(piece.grain)} stroke={GOLD} strokeWidth={1.8} {...stroke} />
              <text
                data-label
                x={piece.cx}
                y={piece.labelY}
                textAnchor="middle"
                className="font-body"
                fontSize={13}
                fontWeight={700}
                letterSpacing={3}
                fill="var(--color-brown)"
              >
                {piece.name.toUpperCase()}
              </text>
             </g>
            </g>
          ))}

          {/* Grading: the front, a size down and a size up */}
          <g transform={`translate(${PIECES[0].x} ${PIECES[0].y})`}>
            <path data-grade d={FRONT} transform="translate(80 145) scale(0.93) translate(-80 -145)" stroke={EMERALD} strokeWidth={1.4} {...stroke} />
            <path data-grade d={FRONT} transform="translate(80 145) scale(1.07) translate(-80 -145)" stroke={GOLD} strokeWidth={1.4} {...stroke} />
          </g>

          {/* Fitting measurements on the front */}
          <g transform={`translate(${PIECES[0].x} ${PIECES[0].y})`} stroke="var(--color-ink)" strokeWidth={1.4} {...stroke}>
            <path data-measure d="M-12 118 L172 118 M-12 110 L-12 126 M172 110 L172 126" />
            <path data-measure d="M196 0 L196 290 M188 0 L204 0 M188 290 L204 290" />
          </g>
          <g transform={`translate(${PIECES[0].x} ${PIECES[0].y})`} className="font-body" fontSize={12} fontWeight={700} letterSpacing={2.5} fill="var(--color-ink)">
            <text data-measure-label x={80} y={108} textAnchor="middle">CHEST</text>
            <text data-measure-label x={212} y={150} transform="rotate(90 212 150)" textAnchor="middle">LENGTH</text>
          </g>
        </svg>
      </div>
    </section>
  );
}
