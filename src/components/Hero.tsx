"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { onReveal } from "@/lib/intro";
import { VEIL_EXIT_MS, INTRO_SESSION_KEY } from "@/components/Preloader";

gsap.registerPlugin(ScrollTrigger);

// Layout effects don't run during SSR; fall back to useEffect there to avoid
// the React warning, while still getting pre-paint timing in the browser.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const line1WrapRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const sixRef = useRef<HTMLSpanElement>(null);

  const kickerWrapRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);

  const line2WrapRef = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const standardRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const media = mediaRef.current;
    const content = contentRef.current;
    const line1Wrap = line1WrapRef.current;
    const line1 = line1Ref.current;
    const sixEl = sixRef.current;
    const kickerEl = kickerRef.current;
    const line2Wrap = line2WrapRef.current;
    const line2 = line2Ref.current;
    const standardEl = standardRef.current;

    if (
      !section ||
      !media ||
      !content ||
      !line1Wrap ||
      !line1 ||
      !sixEl ||
      !kickerEl ||
      !line2Wrap ||
      !line2 ||
      !standardEl
    ) {
      return;
    }

    let entrance: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Release masks once entrance completes so shadows/descenders never clip
      const releaseMasks = () => {
        gsap.set([line1Wrap, line2Wrap], { overflow: "visible" });
      };

      // The scroll interaction is armed once the entrance finishes.
      // SIX and STANDARD sit apart from their neighbors at rest (SIX away
      // from COUNTRIES,, STANDARD away from ONE). On scroll, the section
      // pins, and they smoothly glide inward to close the gap into the
      // compact "SIX COUNTRIES, ONE STANDARD." statement.
      //
      // Once aligned (around ~50% of the pin), a deliberate reading delay
      // keeps them locked in place so the user can comfortably read and
      // digest the message before the pin releases into Mission.
      const armScrollInteraction = () => {
        releaseMasks();

        const pinDuration = window.innerHeight * 0.65;

        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + pinDuration,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            refreshPriority: 10,
          },
        });

        // Slow cinematic background zoom across the pin
        scrollTl.to(media, { scale: 1.08, ease: "none", duration: 1 }, 0);

        // Words slide inward to close the gap into crisp alignment
        scrollTl.to(
          sixEl,
          { x: 0, ease: "power2.out", duration: 0.75 },
          0.1
        );
        scrollTl.to(
          standardEl,
          { x: 0, ease: "power2.out", duration: 0.75 },
          0.1
        );

        // Notify downstream triggers and refresh ScrollTrigger
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("hero:pinned"));
        }
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      };

      if (reduceMotion) {
        // Instant static layout for reduced-motion preference
        gsap.set(media, { opacity: 1, scale: 1 });
        gsap.set([line1, line2], { y: "0%", opacity: 1, filter: "none" });
        gsap.set([sixEl, standardEl], { x: 0 });
        gsap.set(kickerEl, { opacity: 1, y: 0 });
        releaseMasks();
        return;
      }

      // Initial gap offset at rest:
      // SIX starts pulled left from COUNTRIES,; STANDARD starts pulled right from ONE.
      // Both are fully legible and on-screen, spaced apart until scroll closes them.
      // Capped to the content's own left padding (less a small margin) so
      // SIX can never be pushed past the viewport edge — on phones the
      // 32px floor alone exceeded the 24px mobile padding.
      const vw = window.innerWidth || 1024;
      const padLeft = parseFloat(getComputedStyle(content).paddingLeft) || 24;
      const initialOffset = Math.min(
        Math.max(vw * 0.045, 32),
        65,
        padLeft - 8
      );

      gsap.set(sixEl, { x: -initialOffset });
      gsap.set(standardEl, { x: initialOffset });
      gsap.set(media, { opacity: 0, scale: 1.15 });

      // If already seen in this session, entrance fires immediately;
      // otherwise it waits for the preloader iris to close.
      let alreadySeen = false;
      try {
        alreadySeen = sessionStorage.getItem(INTRO_SESSION_KEY) === "done";
      } catch {
        // storage disabled / private mode
      }

      const textStart = alreadySeen ? 0.05 : VEIL_EXIT_MS / 1000 + 0.08;

      entrance = () => {
        const tl = gsap.timeline({ onComplete: armScrollInteraction });

        // Video reveals and settles
        tl.fromTo(
          media,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: "power1.out" },
          0
        ).fromTo(
          media,
          { scale: 1.15 },
          { scale: 1, duration: 1.8, ease: "expo.out" },
          0.1
        );

        // Kicker / Subhead reveal
        tl.fromTo(
          kickerEl,
          { opacity: 0, y: 14, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.75,
            ease: "expo.out",
          },
          textStart
        );

        // Line 1: "SIX COUNTRIES,"
        tl.fromTo(
          line1,
          { opacity: 0, y: "100%", filter: "blur(10px)" },
          {
            opacity: 1,
            y: "0%",
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
          },
          textStart + 0.12
        );

        // Line 2: "ONE STANDARD."
        tl.fromTo(
          line2,
          { opacity: 0, y: "100%", filter: "blur(10px)" },
          {
            opacity: 1,
            y: "0%",
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
          },
          textStart + 0.24
        );
      };
    }, section);

    // Held back until the intro veil lifts, so the entrance isn't spent
    // playing behind an opaque screen. Fires immediately if already revealed.
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
      {/* Cinematic video backdrop + multi-stop contrast vignette */}
      <div ref={mediaRef} className="absolute inset-0">
        <video
          data-hero-video
          className="h-full w-full object-cover"
          src="/videos/hero-compressed-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        {/* Balanced gradient grade so footage details and text contrast remain clean */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/20" />
        <div className="absolute inset-0 bg-radial-[circle_at_center] from-transparent via-ink/20 to-ink/65" />
      </div>

      {/* Accessible heading text for screen readers & SEO */}
      <h1 className="sr-only">Six countries. One standard.</h1>

      <div
        ref={contentRef}
        className="relative z-10 w-full px-6 pb-8 pt-24 sm:px-10 sm:pb-10 md:px-16 md:pb-12 lg:px-20 lg:pb-14"
      >
        {/* Only the two split headline lines are aria-hidden (the sr-only h1
            above already reads them) — the kicker between them is real
            copy that screen readers must still reach. */}
        <div className="font-display font-black uppercase text-cream tracking-[-0.04em] leading-[0.94] select-none text-[clamp(2.75rem,7.5vw,7.5rem)] [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">
          {/* LINE 1: "SIX COUNTRIES," */}
          <div
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
                style={{ display: "inline-block" }}
                className="will-change-transform text-cream mr-3 sm:mr-4 md:mr-6"
              >
                SIX
              </span>
              <span style={{ display: "inline-block" }} className="text-cream">
                COUNTRIES,
              </span>
            </span>
          </div>

          {/* EDITORIAL SUBHEAD / KICKER */}
          <div
            ref={kickerWrapRef}
            className="my-3 sm:my-4 md:my-5 max-w-xl"
          >
            <p
              ref={kickerRef}
              className="font-body text-xs sm:text-sm md:text-[0.95rem] font-normal normal-case tracking-normal leading-relaxed text-cream/80 opacity-0"
            >
              Offshore garment manufacturing engineered for global brands across
              certified partner facilities.
            </p>
          </div>

          {/* LINE 2: "ONE STANDARD." */}
          <div
            ref={line2WrapRef}
            aria-hidden="true"
            className="block overflow-hidden text-left"
          >
            <span
              ref={line2Ref}
              style={{ display: "block", transform: "translateY(100%)" }}
              className="text-cream"
            >
              <span
                style={{ display: "inline-block" }}
                className="text-cream mr-3 sm:mr-4 md:mr-6"
              >
                ONE
              </span>
              <span
                ref={standardRef}
                style={{ display: "inline-block" }}
                className="will-change-transform text-coral"
              >
                STANDARD.
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
