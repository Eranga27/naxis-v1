"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { WHEEL_VALUES } from "@/content/wheel";
import { useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Geometry = {
  /** Radius of the outer rim, and of the ring inside the values. */
  rim: number;
  band: number;
  /** The rims' stroke width. */
  width: number;
  /** Clockwise from the top: the bars between the six words. */
  bars: readonly number[];
};

// A point on the wheel, `deg` clockwise from the top.
const at = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(r * Math.sin(a)).toFixed(1)} ${(-r * Math.cos(a)).toFixed(1)}`;
};
const arcTo = (r: number, a0: number, a1: number, sweep: 0 | 1) =>
  `A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${sweep} ${at(r, a1)}`;
// Keeps the spotlight clear of the green bars either side of a word.
const BAR_CLEARANCE = 2.5;

/**
 * The Giant Wheel's section. Pinned, the scroll first turns the wheel's
 * rings into register, each from its own offset, like a combination
 * lock. A spotlight then walks round the rim, word by word, and each of
 * the six values is read out beside the wheel with the line of the
 * client's copy that bears it out. Finally the whole wheel lights.
 *
 * Under reduced motion the wheel sits finished and the six values are a
 * plain list.
 */
export default function GiantWheelScene({ art, geometry }: { art: React.ReactNode; geometry: Geometry }) {
  const sectionRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const { rim, band, width, bars } = geometry;
    const one = <T extends Element>(selector: string) => section.querySelector<T>(selector)!;
    const words = Array.from(section.querySelectorAll<SVGPathElement>("[data-value]"));
    const items = Array.from(section.querySelectorAll<HTMLElement>("[data-value-item]"));
    const rings = {
      values: one<SVGSVGElement>('[data-ring="values"]'),
      motto: one<SVGSVGElement>('[data-ring="motto"]'),
      name: one<SVGSVGElement>('[data-ring="name"]'),
      centre: one<HTMLElement>('[data-ring="centre"]'),
    };
    const glow = one<SVGSVGElement>("[data-wheel-glow]");
    const glowBand = one<SVGPathElement>('[data-glow="band"]');
    const glowArc = one<SVGPathElement>('[data-glow="arc"]');
    const pointer = one<SVGPathElement>('[data-glow="pointer"]');

    // Each word's stretch of the rim, between its two bars; the first,
    // Quality, straddles the top.
    const sectors = words.map((_, k) => [
      (k === 0 ? bars[bars.length - 1] - 360 : bars[k - 1]) + BAR_CLEARANCE,
      bars[k] - BAR_CLEARANCE,
    ]);
    const inner = band + width / 2 + 3;
    const outer = rim - width / 2 - 3;
    const spot = { a0: sectors[0][0], a1: sectors[0][1] };
    const drawSpot = () => {
      const { a0, a1 } = spot;
      glowBand.setAttribute(
        "d",
        `M${at(outer, a0)}${arcTo(outer, a0, a1, 1)}L${at(inner, a1)}${arcTo(inner, a1, a0, 0)}Z`
      );
      glowArc.setAttribute("d", `M${at(rim, a0)}${arcTo(rim, a0, a1, 1)}`);
      pointer.setAttribute("transform", `rotate(${(a0 + a1) / 2})`);
    };
    drawSpot();

    const mm = gsap.matchMedia();
    mm.add(
      // isWide is there so that some condition always matches: gsap only
      // runs this when one does.
      {
        isPhone: "(max-width: 767px)",
        isWide: "(min-width: 768px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isPhone, reduce } = context.conditions as { isPhone: boolean; reduce: boolean };
        if (reduce) {
          gsap.set(glow, { autoAlpha: 0 });
          return;
        }

        // Out of register: each ring turned its own way, the disc small.
        gsap.set(items, { autoAlpha: 0, y: 14 });
        gsap.set(glow, { autoAlpha: 0 });
        gsap.set(rings.values, { rotation: -150 });
        gsap.set(rings.motto, { rotation: 190 });
        gsap.set(rings.name, { rotation: -250 });
        gsap.set(rings.centre, { rotation: 110, scale: 0.6, autoAlpha: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + window.innerHeight * (isPhone ? 2.2 : 2.8),
            pin: true,
            anticipatePin: 1,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        // The rings turn into register, the outer ones furthest, each
        // settling past its mark and back as a dial clicks home.
        tl.to(rings.values, { rotation: 0, duration: 0.24, ease: "back.out(1.1)" }, 0)
          .to(rings.motto, { rotation: 0, duration: 0.21, ease: "back.out(1.2)" }, 0.02)
          .to(rings.name, { rotation: 0, duration: 0.18, ease: "back.out(1.3)" }, 0.04)
          .to(rings.centre, { rotation: 0, scale: 1, autoAlpha: 1, duration: 0.18, ease: "power2.out" }, 0.02);

        // Then the values, one at a time round the rim.
        const first = 0.26;
        const step = 0.12;
        tl.to(words.slice(1), { opacity: 0.22, duration: 0.03 }, first - 0.03)
          .to(glow, { autoAlpha: 1, duration: 0.03 }, first - 0.03)
          .to(items[0], { autoAlpha: 1, y: 0, duration: 0.04 }, first - 0.04);
        for (let k = 1; k < words.length; k++) {
          const t = first + k * step;
          tl.to(spot, { a0: sectors[k][0], a1: sectors[k][1], duration: 0.06, ease: "power2.inOut", onUpdate: drawSpot }, t)
            .to(words[k - 1], { opacity: 0.22, duration: 0.03 }, t)
            .to(words[k], { opacity: 1, duration: 0.03 }, t + 0.03)
            .to(items[k - 1], { autoAlpha: 0, y: -12, duration: 0.03 }, t)
            .to(items[k], { autoAlpha: 1, y: 0, duration: 0.04 }, t + 0.03);
        }

        // And the whole wheel, lit.
        const whole = first + (words.length - 1) * step + 0.08;
        tl.to(words, { opacity: 1, duration: 0.04 }, whole)
          .to(glow, { autoAlpha: 0, duration: 0.04 }, whole)
          .to({}, { duration: 1 - whole - 0.04 }, whole + 0.04);
      }
    );
    return () => mm.revert();
  }, [geometry]);

  return (
    <section
      ref={sectionRef}
      id="values"
      aria-labelledby="values-title"
      className="relative w-full overflow-hidden bg-cream px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20 motion-safe:flex motion-safe:h-svh motion-safe:min-h-[620px] motion-safe:items-center motion-safe:py-5 motion-safe:md:py-10"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-x-14 lg:gap-y-8">
        <header className="lg:col-start-1 lg:row-start-1 lg:motion-safe:self-end">
          <p className="mb-3 font-body text-xs font-bold uppercase tracking-[0.3em] text-brown">
            The NAXIS wheel
          </p>
          <h2
            id="values-title"
            className="font-headline text-[clamp(2.4rem,5.2vw,4.75rem)] uppercase leading-[0.95] tracking-[-0.01em] text-ink"
          >
            Six words <span className="text-gradient-brand-deep">we work by.</span>
          </h2>
        </header>

        <div className="relative mx-auto aspect-square w-[min(94vw,46svh)] lg:col-start-2 lg:row-start-1 lg:w-[min(100%,88svh)] lg:motion-safe:row-span-2">
          {art}
        </div>

        {/* The six values. While the wheel turns they share one place
            and take turns; under reduced motion they're a list below it.
            Side by side with the wheel only from lg: a portrait tablet
            stacks like a phone, with room for a bigger wheel. */}
        <ol className="grid gap-10 sm:grid-cols-2 motion-safe:gap-0 motion-safe:sm:grid-cols-1 lg:motion-safe:col-start-1 lg:motion-safe:row-start-2 lg:motion-safe:self-start lg:motion-reduce:col-span-2 lg:motion-reduce:grid-cols-3 lg:motion-reduce:gap-x-12">
          {WHEEL_VALUES.map((value, i) => (
            <li
              key={value.word}
              data-value-item
              className="motion-safe:[grid-area:1/1] motion-safe:not-first:invisible"
            >
              <p className="mb-1 font-body text-[0.7rem] font-bold uppercase tabular-nums tracking-[0.3em] text-ink/45">
                {String(i + 1).padStart(2, "0")} / {String(WHEEL_VALUES.length).padStart(2, "0")}
              </p>
              <p className="w-fit font-headline text-[clamp(2.75rem,6vw,5.5rem)] uppercase leading-none text-gradient-brand-deep">
                {value.word}
              </p>
              <blockquote className="mt-3 max-w-md font-serif text-lg italic leading-snug text-ink/75 md:text-xl">
                “{value.line}”
              </blockquote>
              <Link
                href={value.source.href}
                className="mt-4 inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-emerald transition-colors hover:text-ink"
              >
                {value.source.label} <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
