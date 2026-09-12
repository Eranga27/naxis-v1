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
  const kicker2Ref = useRef<HTMLParagraphElement>(null);
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
      // SIX and STANDARD sit naturally in place at rest ("SIX COUNTRIES,"
      // and "ONE STANDARD." read as ordinary compact lines), then on
      // scroll they pull apart from their neighbors — SIX left, STANDARD
      // right — before the two lines (not either kicker, which stay put
      // throughout) fade and lift away as the video keeps drifting inward,
      // so the section's message is finished — not interrupted — by the
      // time Mission takes over.
      const armScrollInteraction = () => {
        releaseMasks();
        const vw = window.innerWidth || 1024;

        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => "+=" + window.innerHeight,
              pin: true,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          // First third of the pinned scroll: SIX and STANDARD pull apart
          // from COUNTRIES,/ONE.
          .to(sixEl, { x: -vw * 0.11, ease: "none", duration: 0.35 }, 0)
          .to(standardEl, { x: vw * 0.18, ease: "none", duration: 0.35 }, 0)
          // Only once that's resolved does the headline fade and lift away.
          .to([line1, line2], { opacity: 0, y: -48, ease: "power1.in", duration: 0.65 }, 0.35)
          .to(media, { scale: 1.08, ease: "none", duration: 1 }, 0);
      };

      if (reduceMotion) {
        // No pin/scrub for reduced motion: the section is skipped straight
        // to its final state with no scroll-hijacking at all.
        gsap.set([kickerRef.current, kicker2Ref.current], { opacity: 1, y: 0 });
        gsap.set([line1, line2], { opacity: 1, y: 0 });
        gsap.set([sixEl, standardEl], { x: 0 });
        gsap.set(media, { opacity: 1, scale: 1 });
        releaseMasks();
        return;
      }

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
            [kickerRef.current, kicker2Ref.current],
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

      {/* Sits to the right, roughly level with the gap between the two
          headline lines — a second, quiet line of small print, mirroring
          the first kicker's treatment. Stays put through the scroll, same
          as the first kicker.
          TODO: placeholder copy — replace with the real second line. */}
      <p
        ref={kicker2Ref}
        className="absolute bottom-[40%] right-6 max-w-[20ch] text-right font-body text-[0.65rem] font-bold uppercase tracking-[0.3em] text-white opacity-0 sm:right-10 sm:text-xs md:right-16 md:text-sm lg:right-20"
      >
        Certified partners. Uncompromising standards.
      </p>

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
            className="block overflow-hidden text-left"
          >
            <span
              ref={line1Ref}
              style={{ display: "block", transform: "translateY(100%)" }}
              className="text-cream"
            >
              <span ref={sixRef} style={{ display: "inline-block" }}>
                SIX
              </span>{" "}
              COUNTRIES,
            </span>
          </span>

          {/* Small print tucked under the first line, plain and quiet —
              a real, readable tagline (not aria-hidden). */}
          <p
            ref={kickerRef}
            className="mb-6 mt-4 max-w-[26ch] font-body text-[0.65rem] font-bold uppercase tracking-[0.3em] text-white opacity-0 sm:mb-8 sm:mt-5 sm:text-xs md:mb-10 md:text-sm"
          >
            Delivering excellence through experience.
          </p>

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
              ONE{" "}
              <span
                ref={standardRef}
                style={{ display: "inline-block" }}
                className="text-coral"
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
