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
  const mediaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line1WrapRef = useRef<HTMLSpanElement>(null);
  const line2WrapRef = useRef<HTMLSpanElement>(null);
  const sixRef = useRef<HTMLSpanElement>(null);
  const standardRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const media = mediaRef.current;
    const content = contentRef.current;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const line1Wrap = line1WrapRef.current;
    const line2Wrap = line2WrapRef.current;
    const sixEl = sixRef.current;
    const standardEl = standardRef.current;
    if (
      !section || !media || !content || !line1 || !line2 ||
      !line1Wrap || !line2Wrap || !sixEl || !standardEl
    )
      return;

    let entrance: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Once the load-in reveal has run, the per-line masks (used only to
      // clip the vertical reveal) are released — nothing else needs them.
      const releaseMasks = () => {
        gsap.set([line1Wrap, line2Wrap], { overflow: "visible" });
      };

      // The scroll interaction is armed only after the load-in settles.
      // SIX and STANDARD sit apart from their neighbors at rest (SIX away
      // from COUNTRIES,, STANDARD away from ONE), fully legible the whole
      // time, then on scroll they slide inward and close that gap — SIX
      // right, STANDARD left — settling into the compact
      // "SIX COUNTRIES," / "ONE STANDARD." reading, with the video
      // continuing a slow zoom alongside them. The pin is short — just
      // long enough for that settle — and nothing fades: once settled, the
      // pin releases and the page keeps scrolling straight into Mission,
      // so the transition reads as one continuous scroll rather than a
      // stall-then-fade.
      const armScrollInteraction = () => {
        releaseMasks();

        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => "+=" + window.innerHeight * 0.6,
              pin: true,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          // A brief hold, then SIX and STANDARD slide inward, closing the
          // gap to COUNTRIES,/ONE, finishing exactly as the pin releases.
          .to(sixEl, { x: 0, ease: "none", duration: 0.85 }, 0.15)
          .to(standardEl, { x: 0, ease: "none", duration: 0.85 }, 0.15)
          .to(media, { scale: 1.08, ease: "none", duration: 1 }, 0);
      };

      if (reduceMotion) {
        // No pin/scrub for reduced motion: the section is skipped straight
        // to its final (compact) state with no scroll-hijacking at all.
        gsap.set(kickerRef.current, { opacity: 1, y: 0 });
        gsap.set([line1, line2], { opacity: 1, y: 0 });
        gsap.set([sixEl, standardEl], { x: 0 });
        gsap.set(media, { opacity: 1, scale: 1 });
        releaseMasks();
        return;
      }

      // SIX starts pulled left, away from COUNTRIES,; STANDARD starts
      // pulled right, away from ONE — both still fully on-screen and
      // legible, just spaced apart, until scroll closes the gap.
      const vw = window.innerWidth || 1024;
      gsap.set(sixEl, { x: -vw * 0.03 });
      gsap.set(standardEl, { x: vw * 0.03 });
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

      <div
        ref={contentRef}
        className="relative z-10 w-full px-6 pb-6 pt-24 sm:px-10 sm:pb-8 md:px-16 md:pb-10 lg:px-20 lg:pb-14"
      >
        {/* Real accessible heading text — the visual lines below are
            decorative duplicates, individually aria-hidden. */}
        <h1 className="sr-only">Six countries. One standard.</h1>

        <div className="font-headline uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2.75rem,10.5vw,9.5rem)] [text-shadow:0_2px_6px_rgba(0,0,0,0.3)]">
          <span
            ref={line1WrapRef}
            aria-hidden="true"
            className="block overflow-hidden text-left ml-[6vw] sm:ml-[8vw] md:ml-[15vw] lg:ml-[7vw]"
          >
            <span
              ref={line1Ref}
              style={{ display: "block", transform: "translateY(100%)" }}
              className="text-cream"
            >
              {/* WORD 1: "SIX" — edit the OUTER span's className to move
                  just this word: className="translate-x-4" (right),
                  "-translate-x-4" (left), "translate-y-4" (down),
                  "-translate-y-4" (up) — combine two, e.g.
                  "translate-x-4 translate-y-4". Use translate-*, not
                  margin: margin on a word sharing a line pushes its
                  neighbors too; translate only moves this one, and
                  never fights the scroll animation on the inner span. */}
              <span className="translate-y-52" style={{ display: "inline-block" }}>
                <span ref={sixRef} style={{ display: "inline-block" }}>
                  SIX
                </span>
              </span>{" "}
              {/* WORD 2: "COUNTRIES," — same idea: edit this span's
                  className with translate-x-* or translate-y-* (see WORD 1). */}
              <span className="translate-y-52" style={{ display: "inline-block" }}>
                COUNTRIES,
              </span>
            </span>
          </span>

          {/* KICKER 1: "DELIVERING EXCELLENCE..." — mt-* and mb-* on THIS
              wrapper reserve the actual GAP between "SIX COUNTRIES," and
              "ONE STANDARD.", so changing those also moves "ONE STANDARD."
              down/up with it (usually what you want when adjusting space
              between the two lines). translate-x-* or translate-y-* on
              THIS wrapper nudge it without moving "ONE STANDARD.". Put
              both kinds of classes on THIS wrapper, NOT the <p> inside it
              — the <p> is what the entrance animation fades/moves in on
              load, so a translate-y-* there gets silently overwritten
              once that finishes; this wrapper is never touched by it. */}
          <div className="mb-6 mt-4 translate-y-48 translate-x-28 sm:mb-8 sm:mt-0 md:mb-10">
            <p
              ref={kickerRef}
              className="max-w-[26ch] font-body text-[0.65rem] font-bold uppercase tracking-[0.3em] text-white opacity-0 sm:text-xs md:text-sm"
            >
              Delivering excellence through experience.
            </p>
          </div>

          <span
            ref={line2WrapRef}
            aria-hidden="true"
            className="block overflow-hidden text-left ml-[6vw] sm:ml-[8vw] md:ml-[10vw] lg:ml-[12vw]"
          >
            <span
              ref={line2Ref}
              style={{ display: "block", transform: "translateY(100%)" }}
              className="text-cream"
            >
              {/* WORD 3: "ONE" — edit this span's className with
                  translate-x-* or translate-y-* (see WORD 1's comment for
                  the full explanation of why translate, not margin). */}
              <span className="translate-x-20 translate-y-12 " style={{ display: "inline-block" }}>
                ONE
              </span>{" "}
              {/* WORD 4: "STANDARD." — its color (text-coral) lives on the
                  INNER span, already used by the scroll animation. Add
                  translate-x-* or translate-y-* to the OUTER span instead, so
                  a manual nudge never fights the animated one. */}
              <span className="translate-x-20 translate-y-12" style={{ display: "inline-block" }}>
                <span
                  ref={standardRef}
                  style={{ display: "inline-block" }}
                  className="text-coral"
                >
                  STANDARD.
                </span>
              </span>
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
