"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { WattleBack, WattleFront } from "@/components/WattleFoliage";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The client's brand phrase — multi-colored bold letters per the approved
// client asset. Each letter is assigned its brand color individually.
// Massive Bebas Neue letters fill the viewport, each a distinct brand color.
// The palette lives in globals.css as --color-phrase-* tokens, sampled
// from the artboard itself; the face is Poppins Black to match it.
const LINES: Array<Array<{ char: string; color: string }>> = [
  [
    { char: "W", color: "var(--color-phrase-green)" },
    { char: "E", color: "var(--color-phrase-yellow)" },
    { char: " ", color: "transparent" },
    { char: "M", color: "var(--color-phrase-red)" },
    { char: "A", color: "var(--color-phrase-blue)" },
    { char: "K", color: "var(--color-phrase-brown)" },
    { char: "E", color: "var(--color-phrase-purple)" },
  ],
  [
    { char: "I", color: "var(--color-phrase-purple)" },
    { char: "D", color: "var(--color-phrase-blue)" },
    { char: "E", color: "var(--color-phrase-green)" },
    { char: "A", color: "var(--color-phrase-yellow)" },
    { char: "S", color: "var(--color-phrase-red)" },
  ],
  [
    { char: "W", color: "var(--color-phrase-blue)" },
    { char: "E", color: "var(--color-phrase-yellow)" },
    { char: "A", color: "var(--color-phrase-red)" },
    { char: "R", color: "var(--color-phrase-brown)" },
    { char: "A", color: "var(--color-phrase-purple)" },
    { char: "B", color: "var(--color-phrase-green)" },
    { char: "L", color: "var(--color-phrase-blue)" },
    { char: "E", color: "var(--color-phrase-red)" },
    { char: ".", color: "var(--color-phrase-yellow)" },
  ],
];

export default function IdeasWearable() {
  const sectionRef = useRef<HTMLElement>(null);
  const foliageBackRef = useRef<HTMLDivElement>(null);
  const foliageFrontRef = useRef<HTMLDivElement>(null);
  const linesWrapRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<Array<HTMLDivElement | null>>([]);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const lines = linesRef.current.filter(
        (el): el is HTMLDivElement => el !== null
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        gsap.set(lines, { opacity: 1, y: 0, scale: 1 });
        if (taglineRef.current) gsap.set(taglineRef.current, { opacity: 1, y: 0 });
        return;
      }

      ScrollTrigger.matchMedia({
        // DESKTOP & TABLET: Innovative pinned kinetic typography & optical portal
        "(min-width: 768px)": () => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              // Read live on every refresh so a resize re-derives it.
              end: () => "+=" + window.innerHeight * 1.35,
              pin: true,
              anticipatePin: 1,
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                if (progressFillRef.current) {
                  gsap.set(progressFillRef.current, { scaleX: self.progress });
                }
              },
            },
          });

          // Set initial rest state before pin engages
          gsap.set(lines[0], { xPercent: -10, opacity: 0.18, letterSpacing: "0.04em" });
          gsap.set(lines[1], { scale: 0.85, opacity: 0.18, transformOrigin: "center center" });
          gsap.set(lines[2], { xPercent: 10, opacity: 0.18, letterSpacing: "0.04em" });
          // Foliage starts spread wide and gathers in around the phrase,
          // the front layer travelling further than the back for depth.
          gsap.set(foliageBackRef.current, { scale: 1.18, opacity: 0.5 });
          gsap.set(foliageFrontRef.current, { scale: 1.35, opacity: 0.6 });
          if (taglineRef.current) {
            gsap.set(taglineRef.current, { opacity: 0, y: 20, letterSpacing: "0.25em" });
          }

          // PHASE 1: KINETIC GATHERING & PRECISION LOCKUP (0.00 -> 0.35)
          tl.to(
            lines[0],
            {
              xPercent: 0,
              opacity: 1,
              letterSpacing: "-0.01em",
              ease: "power2.out",
              duration: 0.35,
            },
            0
          );
          tl.to(
            lines[1],
            {
              scale: 1.0,
              opacity: 1,
              ease: "power2.out",
              duration: 0.35,
            },
            0
          );
          tl.to(
            lines[2],
            {
              xPercent: 0,
              opacity: 1,
              letterSpacing: "-0.01em",
              ease: "power2.out",
              duration: 0.35,
            },
            0
          );
          tl.to(
            foliageBackRef.current,
            { scale: 1, opacity: 1, ease: "power2.out", duration: 0.35 },
            0
          );
          tl.to(
            foliageFrontRef.current,
            { scale: 1, opacity: 1, ease: "power2.out", duration: 0.35 },
            0
          );

          // PHASE 2: GOLDEN LOCKUP & READING BREATH (0.35 -> 0.65)
          if (taglineRef.current) {
            tl.to(
              taglineRef.current,
              {
                opacity: 1,
                y: 0,
                letterSpacing: "0.35em",
                ease: "power2.out",
                duration: 0.2,
              },
              0.35
            );
          }
          if (linesWrapRef.current) {
            tl.to(
              linesWrapRef.current,
              {
                scale: 1.03,
                ease: "none",
                duration: 0.3,
              },
              0.35
            );
          }

          // PHASE 3: OPTICAL APERTURE PORTAL INTO THE PROCESS SECTION (0.65 -> 1.00)
          tl.to(
            lines[0],
            {
              yPercent: -30,
              opacity: 0.2,
              letterSpacing: "0.06em",
              ease: "power2.in",
              duration: 0.35,
            },
            0.65
          );
          tl.to(
            lines[2],
            {
              yPercent: 30,
              opacity: 0.2,
              letterSpacing: "0.06em",
              ease: "power2.in",
              duration: 0.35,
            },
            0.65
          );
          tl.to(
            lines[1],
            {
              scale: 1.4,
              opacity: 0.08,
              letterSpacing: "0.12em",
              ease: "power2.in",
              duration: 0.35,
            },
            0.65
          );
          if (taglineRef.current) {
            tl.to(
              taglineRef.current,
              {
                opacity: 0,
                y: -14,
                ease: "power2.in",
                duration: 0.2,
              },
              0.65
            );
          }
          // The foliage parts outward like a curtain, opening onto the
          // next section.
          tl.to(
            foliageBackRef.current,
            { scale: 1.25, opacity: 0.35, ease: "power2.in", duration: 0.35 },
            0.65
          );
          tl.to(
            foliageFrontRef.current,
            { scale: 1.6, opacity: 0, ease: "power2.in", duration: 0.35 },
            0.65
          );

          return () => {
            tl.scrollTrigger?.kill();
            tl.kill();
          };
        },

        // MOBILE: Scrubbed kinetic parallax (no lock-pin for natural thumb gesture)
        "(max-width: 767px)": () => {
          const mobileTl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              end: "bottom 20%",
              scrub: true,
            },
          });

          mobileTl
            .fromTo(
              lines[0],
              { opacity: 0.2, xPercent: -8 },
              { opacity: 1, xPercent: 0, ease: "none", duration: 0.3 }
            )
            .fromTo(
              lines[1],
              { opacity: 0.2, scale: 0.88 },
              { opacity: 1, scale: 1, ease: "none", duration: 0.3 },
              0.1
            )
            .fromTo(
              lines[2],
              { opacity: 0.2, xPercent: 8 },
              { opacity: 1, xPercent: 0, ease: "none", duration: 0.3 },
              0.2
            );

          if (taglineRef.current) {
            mobileTl.fromTo(
              taglineRef.current,
              { opacity: 0, y: 14 },
              { opacity: 1, y: 0, ease: "none", duration: 0.2 },
              0.3
            );
          }

          return () => {
            mobileTl.scrollTrigger?.kill();
            mobileTl.kill();
          };
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ideas-wearable"
      className="relative flex h-screen min-h-[560px] w-full items-center justify-center overflow-hidden bg-bark"
    >
      {/* Wattle & eucalyptus framing, in two depth layers */}
      <div
        ref={foliageBackRef}
        aria-hidden="true"
        className="absolute inset-0 opacity-90 blur-[1.5px] will-change-transform"
      >
        <WattleBack />
      </div>
      <div
        ref={foliageFrontRef}
        aria-hidden="true"
        className="absolute inset-0 will-change-transform"
      >
        <WattleFront />
      </div>

      {/* Darkened centre keeps the letters crisp over the foliage */}
      <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-bark/85 via-bark/40 to-transparent" />

      {/* The per-letter lines below are aria-hidden (a screen reader would
          otherwise spell them out), so the phrase is given once here. */}
      <h2 className="sr-only">We make ideas wearable.</h2>

      {/* Main Kinetic Typography Block */}
      <div
        ref={linesWrapRef}
        className="relative z-10 flex w-full flex-col items-center justify-center px-4 text-center sm:px-6 will-change-transform"
      >
        {LINES.map((chars, lineIdx) => (
          <div
            key={lineIdx}
            ref={(el) => {
              linesRef.current[lineIdx] = el;
            }}
            className="flex items-center justify-center font-display text-[clamp(2.6rem,12.2vw,12rem)] font-black leading-[0.98] tracking-[-0.02em] will-change-transform select-none"
            aria-hidden="true"
          >
            {chars.map((c, charIdx) =>
              c.char === " " ? (
                <span key={charIdx} style={{ width: "0.16em" }} />
              ) : (
                <span
                  key={charIdx}
                  style={{
                    color: c.color,
                    display: "inline-block",
                    textShadow: "0 4px 18px rgba(0,0,0,0.55)",
                    transition: "transform 0.25s ease",
                  }}
                  className="hover:scale-105"
                >
                  {c.char}
                </span>
              )
            )}
          </div>
        ))}

        {/* Elegant Gold Tagline */}
        <p
          ref={taglineRef}
          className="mt-8 px-4 font-body text-[0.65rem] font-bold uppercase tracking-[0.35em] text-cream/80 will-change-transform sm:text-xs md:mt-10 md:text-sm"
        >
          NAXIS Australia — Delivering Excellence Through Experience
        </p>
      </div>

      {/* Ambient Micro-Progress Line (Desktop only) */}
      <div className="absolute bottom-6 left-1/2 hidden h-[2px] w-32 -translate-x-1/2 overflow-hidden rounded-full bg-cream/10 md:block">
        <div
          ref={progressFillRef}
          className="h-full w-full origin-left bg-gold/60 will-change-transform"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </section>
  );
}
