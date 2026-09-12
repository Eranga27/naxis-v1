"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { onReveal } from "@/lib/intro";

gsap.registerPlugin(ScrollTrigger);

// Layout effects don't run during SSR; fall back to useEffect there to avoid
// the React warning, while still getting pre-paint timing in the browser.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const line1WrapRef = useRef<HTMLSpanElement>(null);
  const line2WrapRef = useRef<HTMLSpanElement>(null);
  const sixRef = useRef<HTMLSpanElement>(null);
  const standardRef = useRef<HTMLSpanElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const line1Wrap = line1WrapRef.current;
    const line2Wrap = line2WrapRef.current;
    const sixEl = sixRef.current;
    const standardEl = standardRef.current;
    const media = mediaRef.current;
    if (
      !section || !line1 || !line2 || !line1Wrap || !line2Wrap ||
      !sixEl || !standardEl || !media
    )
      return;

    let entrance: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Once the load-in reveal has run, the per-line masks (used only to
      // clip the vertical reveal) are released so the horizontal slide
      // below isn't clipped by them.
      const releaseMasks = () => {
        gsap.set([line1Wrap, line2Wrap], { overflow: "visible" });
      };

      // The scroll-triggered slide is armed only after the load-in settles.
      const armScrollInteraction = () => {
        releaseMasks();

        // Pin span is fixed at exactly one viewport height — not shorter,
        // not longer. The word slide runs on a *separate* ScrollTrigger that
        // shares this same start but keeps going past this trigger's end, so
        // alignment continues progressing after the section unpins and
        // starts scrolling away underneath Mission.
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => "+=" + window.innerHeight,
          pin: true,
          invalidateOnRefresh: true,
        });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              // One pinned viewport, plus 60% more of ordinary scroll while
              // the section scrolls away underneath Mission — that tail is
              // where the words are still allowed to finish.
              end: () => "+=" + (window.innerHeight + window.innerHeight * 0.6),
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          // First 15% of the range is a deliberate hold — roughly the first
          // half-second of scrolling stays put, entirely inside the pin,
          // before either word starts moving.
          .to(sixEl, { x: 0, ease: "none", duration: 0.85 }, 0.15)
          .to(standardEl, { x: 0, ease: "none", duration: 0.85 }, 0.15);
      };

      if (reduceMotion) {
        // No pin/scrub for reduced motion: the section is skipped straight
        // to its final state with no scroll-hijacking at all.
        gsap.set(kickerRef.current, { opacity: 1, y: 0 });
        gsap.set([line1, line2], { opacity: 1, y: 0 });
        gsap.set([sixEl, standardEl], { x: 0 });
        gsap.set(media, { opacity: 1, scale: 1 });
        releaseMasks();
        return;
      }

      // Explicit pixel values rather than letting GSAP parse the CSS
      // `vw`-based inline transform: viewport metrics can be momentarily
      // unreliable at this synchronous pre-paint point in some browser
      // contexts, which would otherwise corrupt the captured start position.
      // "SIX" is the first word on its line and "STANDARD." the last on
      // its — sliding them in from outside the sentence, in opposite
      // directions, so neither travels through a static neighbor.
      const vw = window.innerWidth || 1024;
      gsap.set(sixEl, { x: vw * -0.1 });
      gsap.set(standardEl, { x: vw * 0.1 });
      gsap.set(media, { opacity: 0, scale: 1.18 });

      entrance = () => {
        gsap
          .timeline({ onComplete: armScrollInteraction })
          // Opacity rises early — while the veil is still opaque — so the
          // clearing white never exposes the bare dark background.
          .fromTo(
            media,
            { opacity: 0 },
            { opacity: 1, duration: 0.35, ease: "power1.out" },
            0
          )
          // Scale settles slowly and starts slightly late, so the bulk of the
          // "flying in" is still visibly in motion once the white has gone.
          .fromTo(
            media,
            { scale: 1.18 },
            { scale: 1, duration: 1.8, ease: "power2.out" },
            0.2
          )
          .fromTo(
            kickerRef.current,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
            0.8
          )
          .fromTo(
            line1,
            { opacity: 0, y: "100%" },
            { opacity: 1, y: "0%", duration: 0.9, ease: "power3.out" },
            0.95
          )
          .fromTo(
            line2,
            { opacity: 0, y: "100%" },
            { opacity: 1, y: "0%", duration: 0.9, ease: "power3.out" },
            1.1
          );
      };
    }, section);

    // Held back until the intro veil lifts, so the entrance isn't spent
    // playing behind a white screen. Fires immediately if already revealed.
    const unsubscribe = onReveal(() => {
      if (entrance) ctx.add(entrance);
    });

    return () => {
      unsubscribe();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex h-screen w-full items-end overflow-hidden bg-ink"
    >
      {/* Video + grade move as one unit so the entrance is a single transform. */}
      <div ref={mediaRef} className="absolute inset-0">
        <video
          data-hero-video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/hero-compressed-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brown/55 via-ink/15 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-6 pt-24 sm:px-10 sm:pb-8 md:px-16 md:pb-10 lg:px-20 lg:pb-14">
        {/* Real accessible heading text — the visual lines below are
            decorative duplicates, individually aria-hidden. */}
        <h1 className="sr-only">Six countries. One standard.</h1>

        <div className="font-headline w-full uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2.5rem,10vw,9.5rem)] [text-shadow:0_2px_6px_rgba(0,0,0,0.3)]">
          <span
            ref={line1WrapRef}
            aria-hidden="true"
            className="block w-full overflow-hidden text-left"
          >
            <span
              ref={line1Ref}
              style={{ transform: "translateY(100%)" }}
              className="flex w-full items-baseline justify-between text-cream"
            >
              <span
                ref={sixRef}
                style={{ display: "inline-block", transform: "translateX(-10vw)" }}
              >
                SIX
              </span>
              <span>COUNTRIES.</span>
            </span>
          </span>

          {/* Sits in the gap between the two headline lines — a real,
              readable tagline (not aria-hidden), set apart from the
              decorative lines around it with a rule and generous padding. */}
          <p
            ref={kickerRef}
            className="my-6 max-w-[20ch] border-l-2 border-white/40 py-1 pl-5 font-body text-[0.65rem] font-bold uppercase leading-relaxed tracking-[0.3em] text-white opacity-0 sm:my-7 sm:text-xs sm:tracking-[0.35em] md:my-9 md:text-sm"
          >
            Delivering excellence through experience.
          </p>

          <span
            ref={line2WrapRef}
            aria-hidden="true"
            className="block w-full overflow-hidden text-left"
          >
            <span
              ref={line2Ref}
              style={{ transform: "translateY(100%)" }}
              className="flex w-full items-baseline justify-between text-cream"
            >
              <span>ONE</span>
              <span
                ref={standardRef}
                style={{
                  display: "inline-block",
                  transform: "translateX(10vw)",
                }}
                className="text-emerald"
              >
                STANDARD.
              </span>
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
