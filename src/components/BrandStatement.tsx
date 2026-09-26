"use client";

import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

// The client's "We make ideas wearable" artboards, letter by letter in
// their own colours (sampled from the ivory artboard).
const GREEN = "#018c4d";
const YELLOW = "#feda18";
const RED = "#f80608";
const BLUE = "#004afe";
const BROWN = "#ad520a";
const PURPLE = "#7e04fb";
const LINES: { text: string; colours: string[] }[] = [
  { text: "WE MAKE", colours: [GREEN, YELLOW, "", RED, BLUE, BROWN, PURPLE] },
  { text: "IDEAS", colours: [PURPLE, BLUE, GREEN, YELLOW, RED] },
  { text: "WEARABLE.", colours: [BLUE, YELLOW, RED, BROWN, PURPLE, GREEN, BLUE, RED, YELLOW] },
];

// NAXIS in bright gold, as foil: bright at the top, deepening to the
// wheel's own gold at the foot (so it holds on cream), with a highlight
// that runs across once the letters have landed.
const GOLD_FOIL: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(112deg, transparent 38%, rgba(255,251,232,0.95) 50%, transparent 62%), linear-gradient(180deg, #ffe7a3 0%, #ffcf57 30%, #f0ad32 58%, #c8801f 100%)",
  backgroundSize: "260% 100%, 100% 100%",
  backgroundPosition: "160% 0%, 0% 0%",
  backgroundRepeat: "no-repeat",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

// Wattle, out of focus: soft gold discs (and two of eucalyptus green) at
// their own depths — the artboards' ground, as a lens would see it. Deeper
// ones (higher `depth`) drift further as the page scrolls.
const BOKEH = [
  // Near the lens: large and faint.
  { x: 9, y: 22, size: 38, rgb: "255,196,46", alpha: 0.26, depth: 1.5 },
  { x: 90, y: 72, size: 34, rgb: "252,192,44", alpha: 0.26, depth: 1.35 },
  { x: 58, y: 96, size: 26, rgb: "255,200,60", alpha: 0.24, depth: 1.15 },
  // Further off: small and brighter, towards the edges.
  { x: 31, y: 7, size: 7, rgb: "250,188,40", alpha: 0.5, depth: 0.5 },
  { x: 77, y: 11, size: 11, rgb: "255,205,70", alpha: 0.42, depth: 0.7 },
  { x: 17, y: 88, size: 9, rgb: "255,210,80", alpha: 0.46, depth: 0.6 },
  { x: 96, y: 33, size: 6, rgb: "255,214,90", alpha: 0.52, depth: 0.4 },
  // Eucalyptus.
  { x: 3, y: 64, size: 20, rgb: "122,152,116", alpha: 0.16, depth: 1 },
  { x: 84, y: 4, size: 16, rgb: "122,152,116", alpha: 0.14, depth: 1.1 },
];

const FADE_TOP = "linear-gradient(to bottom, transparent 0%, #000 24%)";

/**
 * The homepage's second section (V2, the client's call): NAXIS
 * Australia — NAXIS in bright gold, Australia in brown, as on their wheel
 * — and alongside it their line, "We make ideas wearable.", in the
 * artboards' own colours and heavy geometric sans.
 *
 * It follows the hero's card on the same cream. As it rises, the name
 * comes up letter by letter in the middle of the stage, a light runs
 * across the gold and Australia draws in between two gold rules. Pinned,
 * the name steps aside (up, on narrow screens), a rule draws between
 * them, and the line arrives letter by letter, each popping in in its
 * colour. Wattle drifts past, out of focus, at its own depths.
 *
 * Under reduced motion it's the finished composition, no pin.
 */
export default function BrandStatement() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const australiaRef = useRef<HTMLSpanElement>(null);
  const dividerRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const lockup = lockupRef.current;
    const name = nameRef.current;
    const australia = australiaRef.current;
    const divider = dividerRef.current;
    const line = lineRef.current;
    if (!section || !stage || !lockup || !name || !australia || !divider || !line) return;
    const letters = gsap.utils.toArray<HTMLElement>("[data-letter]", name);
    const rules = gsap.utils.toArray<HTMLElement>("[data-rule]", lockup);
    const marks = gsap.utils.toArray<HTMLElement>("[data-mark]", line);
    const bokeh = gsap.utils.toArray<HTMLElement>("[data-bokeh]", section);
    const depthOf = (el: HTMLElement) => Number(el.dataset.bokeh);

    // Where the name sits on its own: the middle of the stage. Measured
    // from layout offsets (which the tweens don't change), so it's right
    // at any point in the pin.
    const toMiddle = (stacked: boolean) => ({
      x: stacked ? 0 : stage.offsetWidth / 2 - (lockup.offsetLeft + lockup.offsetWidth / 2),
      y: stacked ? stage.offsetHeight / 2 - (lockup.offsetTop + lockup.offsetHeight / 2) : 0,
    });

    const mm = gsap.matchMedia();
    mm.add(
      {
        stacked: "(max-width: 1023px)",
        row: "(min-width: 1024px)",
        phone: "(max-width: 767px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { stacked, phone, reduce } = context.conditions as Record<string, boolean>;
        if (reduce) return;

        // Rising into view: the name comes up in the middle of the stage.
        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: { trigger: section, start: "top 82%", end: "top top", scrub: 1, invalidateOnRefresh: true },
          })
          .fromTo(
            letters,
            { yPercent: 108, rotationX: -75, transformPerspective: 600, transformOrigin: "50% 100%" },
            { yPercent: 0, rotationX: 0, duration: 0.5, stagger: 0.07 },
            0
          )
          .fromTo(letters, { backgroundPosition: "160% 0%, 0% 0%" }, { backgroundPosition: "-60% 0%, 0% 0%", duration: 0.4, stagger: 0.05, ease: "power1.inOut" }, 0.5)
          .fromTo(australia, { opacity: 0, letterSpacing: "1.3em" }, { opacity: 1, letterSpacing: "0.55em", duration: 0.55, ease: "power2.out" }, 0.35)
          .fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.inOut" }, 0.5)
          .fromTo(bokeh, { yPercent: (i) => 60 * depthOf(bokeh[i]) }, { yPercent: 0, duration: 1, ease: "none" }, 0);

        // Pinned: the name steps aside and the line arrives beside it.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => "+=" + window.innerHeight * (phone ? 0.9 : 1.2),
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(
            lockup,
            { x: () => toMiddle(stacked).x, y: () => toMiddle(stacked).y },
            { x: 0, y: 0, duration: 0.3, ease: "power2.inOut" },
            0
          )
          .fromTo(
            divider,
            stacked ? { scaleX: 0, opacity: 0 } : { scaleY: 0, opacity: 0 },
            { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.18, ease: "power2.out" },
            0.16
          )
          .fromTo(
            marks,
            // Deterministic tilts, -10 to 10 degrees.
            { opacity: 0, yPercent: 55, scale: 0.35, rotation: (i) => ((i * 37) % 21) - 10 },
            { opacity: 1, yPercent: 0, scale: 1, rotation: 0, duration: 0.16, stagger: 0.026, ease: "back.out(2.2)" },
            0.26
          )
          .fromTo(bokeh, { yPercent: 0 }, { yPercent: (i) => -45 * depthOf(bokeh[i]), duration: 1, ease: "none", immediateRender: false }, 0);
      }
    );

    // The layout (and so where the middle is) changes when the webfont
    // lands.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="naxis"
      // The header comes back once this reaches it (see Nav). With motion,
      // the hero's frame closes to a card on this cream before its pin
      // lets go; without, the hero stays full-bleed and dark, and this
      // slides over it as a rounded, shadowed sheet.
      data-after-hero
      className="relative z-20 h-svh min-h-[620px] w-full overflow-hidden bg-cream motion-reduce:rounded-t-[24px] motion-reduce:shadow-[0_-25px_60px_rgba(16,13,9,0.55)] motion-reduce:sm:rounded-t-[32px] motion-reduce:md:rounded-t-[44px]"
    >
      <h2 className="sr-only">NAXIS Australia. We make ideas wearable.</h2>

      {/* A soft pool of light on the cream, falling off to warm edges —
          but not at the top, where this cream meets the hero's below its
          card: both fade out there (FADE_TOP), so no seam shows. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 58% at 50% 46%, rgba(255,253,246,0.9) 0%, rgba(255,253,246,0) 70%), radial-gradient(ellipse 90% 85% at 50% 50%, transparent 60%, rgba(173,122,52,0.14) 100%)",
          maskImage: FADE_TOP,
          WebkitMaskImage: FADE_TOP,
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ maskImage: FADE_TOP, WebkitMaskImage: FADE_TOP }}>
        {BOKEH.map((b, i) => (
          <span
            key={i}
            data-bokeh={b.depth}
            className="absolute block"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}vmin`,
              height: `${b.size}vmin`,
              margin: `-${b.size / 2}vmin 0 0 -${b.size / 2}vmin`,
            }}
          >
            <span
              className="brand-float block h-full w-full rounded-full"
              style={{
                animationDelay: `${-i * 1.7}s`,
                animationDuration: `${11 + (i % 4) * 2.5}s`,
                background: `radial-gradient(circle, rgba(${b.rgb},${b.alpha}) 0%, rgba(${b.rgb},${b.alpha * 0.5}) 38%, rgba(${b.rgb},0) 70%)`,
              }}
            />
          </span>
        ))}
      </div>

      <div
        ref={stageRef}
        aria-hidden="true"
        className="relative flex h-full flex-col items-center justify-center gap-8 px-6 sm:gap-10 lg:flex-row lg:gap-[3.8vw] lg:px-12"
      >
        <div ref={lockupRef} className="flex flex-col items-center">
          <div
            ref={nameRef}
            className="flex font-mark text-[clamp(4rem,20vw,10rem)] font-extrabold leading-none lg:text-[clamp(6rem,12vw,14rem)] md:[filter:drop-shadow(0_14px_20px_rgba(140,84,20,0.22))]"
          >
            {"NAXIS".split("").map((letter, i) => (
              // Each letter rises out of its own slot.
              <span key={i} className="block overflow-hidden px-[0.04em]">
                <span data-letter className="block" style={GOLD_FOIL}>
                  {letter}
                </span>
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-4 lg:mt-4 lg:gap-6">
            <span data-rule className="block h-px w-10 origin-right bg-gradient-to-r from-transparent to-[#c8801f] sm:w-16 lg:w-20" />
            <span
              ref={australiaRef}
              className="block font-mark text-[clamp(0.95rem,4.4vw,2rem)] font-semibold uppercase text-brown lg:text-[clamp(1.1rem,2.1vw,2.3rem)]"
              // The last letter's tracking would push it off centre.
              style={{ letterSpacing: "0.55em", marginRight: "-0.55em" }}
            >
              Australia
            </span>
            <span data-rule className="block h-px w-10 origin-left bg-gradient-to-l from-transparent to-[#c8801f] sm:w-16 lg:w-20" />
          </div>
        </div>

        <span
          ref={dividerRef}
          className="block h-px w-24 bg-gradient-to-r from-transparent via-[#c8801f] to-transparent lg:h-[34vh] lg:w-px lg:bg-gradient-to-b"
        />

        <p
          ref={lineRef}
          className="text-center font-mark text-[clamp(2.4rem,11.5vw,6rem)] font-black leading-[0.98] tracking-[-0.01em] lg:text-[clamp(3.2rem,6vw,7rem)]"
        >
          {LINES.map(({ text, colours }) => (
            <span key={text} className="block whitespace-nowrap">
              {text.split("").map((char, i) =>
                char === " " ? (
                  <span key={i} className="inline-block w-[0.26em]" />
                ) : (
                  <span
                    key={i}
                    data-mark
                    className="inline-block"
                    style={{ color: colours[i], textShadow: "0 0.05em 0.1em rgba(74,42,28,0.2)" }}
                  >
                    {char}
                  </span>
                )
              )}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
