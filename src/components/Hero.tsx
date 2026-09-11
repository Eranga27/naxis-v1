"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Layout effects don't run during SSR; fall back to useEffect there to avoid
// the React warning, while still getting pre-paint timing in the browser.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Variant = "stagger" | "center";

export default function Hero() {
  const [variant, setVariant] = useState<Variant>("stagger");

  const sectionRef = useRef<HTMLElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const standardRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const standardEl = standardRef.current;
    if (!section || !line1 || !line2 || !standardEl) return;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // The scroll-triggered slide is armed only after the load-in settles.
      const armScrollInteraction = () => {
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
          .to(standardEl, { x: 0, ease: "none" }, 0);
      };

      if (reduceMotion) {
        // No pin/scrub for reduced motion: the section is skipped straight
        // to its final state with no scroll-hijacking at all.
        gsap.set(kickerRef.current, { opacity: 1, y: 0 });
        gsap.set([line1, line2], { opacity: 1, y: 0 });
        gsap.set(standardEl, { x: 0 });
        return;
      }

      // Explicit pixel value rather than letting GSAP parse the CSS
      // `vw`-based inline transform: viewport metrics can be momentarily
      // unreliable at this synchronous pre-paint point in some browser
      // contexts, which would otherwise corrupt the captured start position.
      // Positive offset (from further right) is safe here because
      // "STANDARD." is the last word on its line — nothing sits after it
      // to collide with as it slides toward its resting position.
      const vw = window.innerWidth || 1024;
      gsap.set(standardEl, { x: vw * 0.18 });

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
  }, [variant]);

  const isCenter = variant === "center";

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex h-screen w-full items-center overflow-hidden bg-ink"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/hero-compressed-video.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brown/45 via-ink/10 to-ink/35" />

      <div className="relative z-10 w-full px-6 py-24 sm:px-10 md:px-16 lg:px-20">
        <p
          ref={kickerRef}
          className="mb-6 font-body text-xs font-medium uppercase tracking-[0.35em] text-cream/70 opacity-0 md:mb-8 md:text-sm"
        >
          Precision Manufacturing
        </p>

        <h1
          aria-label="Manufacturing across six countries. Certified to one standard."
          className="font-display font-black uppercase leading-[1.05] tracking-[-0.03em] text-[clamp(1.9rem,5.4vw,5.5rem)] [text-shadow:0_4px_30px_rgba(0,0,0,0.45)]"
        >
          <span
            aria-hidden="true"
            className={`block overflow-hidden ${isCenter ? "text-right" : "text-left"}`}
          >
            <span
              ref={line1Ref}
              style={{ display: "block", transform: "translateY(100%)" }}
              className="text-cream"
            >
              MANUFACTURING ACROSS SIX COUNTRIES.
            </span>
          </span>

          <span
            aria-hidden="true"
            className={`block overflow-hidden ${
              isCenter ? "text-left" : "text-left sm:ml-[7vw]"
            }`}
          >
            <span
              ref={line2Ref}
              style={{ display: "block", transform: "translateY(100%)" }}
              className="text-cream"
            >
              CERTIFIED TO ONE{" "}
              <span
                ref={standardRef}
                style={{
                  display: "inline-block",
                  transform: "translateX(18vw)",
                }}
                className="text-emerald"
              >
                STANDARD.
              </span>
            </span>
          </span>
        </h1>
      </div>

      <div className="absolute bottom-6 left-6 z-20 flex gap-2 md:bottom-8 md:left-10">
        <button
          type="button"
          onClick={() => setVariant("stagger")}
          className={`rounded-full border px-3 py-1.5 font-body text-[11px] uppercase tracking-wide transition-colors ${
            variant === "stagger"
              ? "border-gold bg-gold text-ink"
              : "border-cream/30 text-cream/60 hover:border-cream/60"
          }`}
        >
          Stagger
        </button>
        <button
          type="button"
          onClick={() => setVariant("center")}
          className={`rounded-full border px-3 py-1.5 font-body text-[11px] uppercase tracking-wide transition-colors ${
            variant === "center"
              ? "border-gold bg-gold text-ink"
              : "border-cream/30 text-cream/60 hover:border-cream/60"
          }`}
        >
          Center-pull
        </button>
      </div>
    </section>
  );
}
