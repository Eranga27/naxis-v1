"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

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

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const line1Wrap = line1WrapRef.current;
    const line2Wrap = line2WrapRef.current;
    const sixEl = sixRef.current;
    const standardEl = standardRef.current;
    if (!section || !line1 || !line2 || !line1Wrap || !line2Wrap || !sixEl || !standardEl)
      return;

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
          .to(sixEl, { x: 0, ease: "none" }, 0)
          .to(standardEl, { x: 0, ease: "none" }, 0);
      };

      if (reduceMotion) {
        // No pin/scrub for reduced motion: the section is skipped straight
        // to its final state with no scroll-hijacking at all.
        gsap.set(kickerRef.current, { opacity: 1, y: 0 });
        gsap.set([line1, line2], { opacity: 1, y: 0 });
        gsap.set([sixEl, standardEl], { x: 0 });
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
      gsap.set(sixEl, { x: vw * -0.22 });
      gsap.set(standardEl, { x: vw * 0.22 });

      gsap
        .timeline({ onComplete: armScrollInteraction })
        .fromTo(
          kickerRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
          0
        )
        .fromTo(
          line1,
          { opacity: 0, y: "100%" },
          { opacity: 1, y: "0%", duration: 0.9, ease: "power3.out" },
          0.15
        )
        .fromTo(
          line2,
          { opacity: 0, y: "100%" },
          { opacity: 1, y: "0%", duration: 0.9, ease: "power3.out" },
          0.3
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex h-screen w-full items-end overflow-hidden bg-ink"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/hero-compressed-video.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brown/55 via-ink/15 to-transparent" />

      <div className="relative z-10 w-full px-6 pb-16 pt-24 sm:px-10 sm:pb-20 md:px-16 md:pb-24 lg:px-20 lg:pb-28">
        <p
          ref={kickerRef}
          className="mb-6 font-body text-xs font-medium uppercase tracking-[0.35em] text-cream/70 opacity-0 md:mb-8 md:text-sm"
        >
          Delivering excellence through experience.
        </p>

        <h1
          aria-label="Six countries. One standard."
          className="font-headline uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2.75rem,11vw,10.5rem)] [text-shadow:0_2px_6px_rgba(0,0,0,0.3)]"
        >
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
              <span
                ref={sixRef}
                style={{ display: "inline-block", transform: "translateX(-22vw)" }}
              >
                SIX
              </span>{" "}
              COUNTRIES.
            </span>
          </span>

          <span
            ref={line2WrapRef}
            aria-hidden="true"
            className="block overflow-hidden text-left sm:ml-[7vw]"
          >
            <span
              ref={line2Ref}
              style={{ display: "block", transform: "translateY(100%)" }}
              className="text-cream"
            >
              ONE{" "}
              <span
                ref={standardRef}
                style={{
                  display: "inline-block",
                  transform: "translateX(22vw)",
                }}
                className="text-emerald"
              >
                STANDARD.
              </span>
            </span>
          </span>
        </h1>
      </div>
    </section>
  );
}
