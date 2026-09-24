"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { onReveal } from "@/lib/intro";
import { GOLD } from "@/lib/brand";
import { VEIL_EXIT_MS, INTRO_SESSION_KEY } from "@/components/Preloader";

gsap.registerPlugin(ScrollTrigger);

// Layout effects don't run during SSR; fall back to useEffect there to avoid
// the React warning, while still getting pre-paint timing in the browser.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The six countries behind the headline's "SIX" — listed beside it on
// desktop so the claim is immediately concrete.
const COUNTRIES = [
  "Sri Lanka",
  "India",
  "Bangladesh",
  "Vietnam",
  "China",
  "Italy",
];

// From the client's company profile — same list as CinematicDivider.
const CERTIFICATIONS = ["WRAP", "SMETA", "BSCI", "C-TPAT", "OEKO-TEX"];

const COUNTRY_REST_COLOR = "rgba(244, 239, 228, 0.55)"; // cream/55

// Static film grain, as an inline SVG turbulence tile. Breaks up the flat
// digital gradient over the video so the hero reads as footage, not a
// screen.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

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

  const countryRefs = useRef<Array<HTMLLIElement | null>>([]);
  const countryNameRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const railRef = useRef<HTMLDivElement>(null);

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
    const rail = railRef.current;

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
      !standardEl ||
      !rail
    ) {
      return;
    }

    const countries = countryRefs.current.filter(
      (el): el is HTMLLIElement => el !== null
    );
    const countryNames = countryNameRefs.current.filter(
      (el): el is HTMLSpanElement => el !== null
    );

    let entrance: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Release masks once entrance completes so shadows/descenders never clip
      const releaseMasks = () => {
        gsap.set([line1Wrap, line2Wrap], { overflow: "visible" });
      };

      // Resting gap between SIX/STANDARD and their neighbors. A function,
      // not a one-off number, so a resize re-derives it (see the fromTo
      // tweens below, re-evaluated on every refresh). Capped to the
      // content's own left padding (less a small margin) so SIX can never
      // be pushed past the viewport edge — on phones the 32px floor alone
      // exceeded the 24px mobile padding.
      const getOffset = () => {
        const vw = window.innerWidth || 1024;
        const padLeft =
          parseFloat(getComputedStyle(content).paddingLeft) || 24;
        return Math.min(Math.max(vw * 0.045, 32), 65, padLeft - 8);
      };

      // A slow gold sweep down the country list, one country at a time —
      // a quiet sign of life once the headline has settled. Paused while
      // the hero is off screen.
      const startCountryCycle = () => {
        if (!countryNames.length) return;
        const step = 1.4;
        const cycle = gsap.timeline({ repeat: -1 });
        countryNames.forEach((name, i) => {
          cycle
            .to(name, { color: GOLD, duration: 0.45, ease: "power2.out" }, i * step)
            .to(
              name,
              { color: COUNTRY_REST_COLOR, duration: 0.8, ease: "power2.inOut" },
              i * step + 1.1
            );
        });
        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? cycle.play() : cycle.pause()),
        });
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
        startCountryCycle();

        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            // Read live on every refresh, so a resize re-derives the pin
            // length instead of keeping the load-time viewport height.
            end: () => "+=" + window.innerHeight * 0.65,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            refreshPriority: 10,
          },
        });

        // Slow cinematic background zoom across the pin
        scrollTl.to(media, { scale: 1.08, ease: "none", duration: 1 }, 0);

        // Words slide inward to close the gap into crisp alignment
        scrollTl.fromTo(
          sixEl,
          { x: () => -getOffset() },
          { x: 0, ease: "power2.out", duration: 0.75 },
          0.1
        );
        scrollTl.fromTo(
          standardEl,
          { x: () => getOffset() },
          { x: 0, ease: "power2.out", duration: 0.75 },
          0.1
        );

        // The scroll cue has done its job once scrolling starts
        scrollTl.to(rail, { opacity: 0, y: 12, ease: "power1.in", duration: 0.3 }, 0);

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
        gsap.set([...countries, rail], { opacity: 1, x: 0, y: 0 });
        releaseMasks();
        return;
      }

      // Initial gap offset at rest:
      // SIX starts pulled left from COUNTRIES,; STANDARD starts pulled right from ONE.
      // Both are fully legible and on-screen, spaced apart until scroll closes them.
      gsap.set(sixEl, { x: -getOffset() });
      gsap.set(standardEl, { x: getOffset() });
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
        // Routed through ctx.add: tweens and triggers created in a later
        // callback aren't otherwise recorded by the context, so the pin
        // would survive ctx.revert() on unmount.
        const tl = gsap.timeline({
          onComplete: () => {
            ctx.add(armScrollInteraction);
          },
        });

        // Video reveals and settles. power3, not expo: expo.out spends ~90%
        // of its motion in the first third, which on a full-bleed element
        // reads as a pop-then-freeze. Fine for the small kicker below.
        tl.fromTo(
          media,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: "power1.out" },
          0
        ).fromTo(
          media,
          { scale: 1.15 },
          { scale: 1, duration: 1.8, ease: "power3.out" },
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

        // Country list and bottom rail follow the headline
        tl.fromTo(
          countries,
          { opacity: 0, x: 14 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.06,
          },
          textStart + 0.45
        );
        tl.fromTo(
          rail,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
          textStart + 0.6
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
          // 1080p re-encode (~1.7MB) of the 4K master kept in
          // media-library/ — the 4K file was ~7MB for a background that
          // sits under a dark grade. The poster paints instantly while the
          // video buffers.
          src="/videos/hero-1080.mp4"
          poster="/images/hero-poster.jpg"
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

      {/* Brand light: a warm gold glow rising behind the headline and a
          cooler emerald one off the right edge — gives the grade some
          color instead of a flat black fade. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 55% at 12% 100%, rgba(255,201,74,0.16), transparent 70%), radial-gradient(ellipse 45% 60% at 100% 75%, rgba(47,208,138,0.13), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.09] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />

      {/* Accessible heading text for screen readers & SEO */}
      <h1 className="sr-only">Six countries. One standard.</h1>

      <div
        ref={contentRef}
        className="relative z-10 w-full px-6 pb-6 pt-24 sm:px-10 sm:pb-8 md:px-16 md:pb-10 lg:px-20 lg:pb-10"
      >
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-12">
          {/* Only the two split headline lines are aria-hidden (the sr-only
              h1 above already reads them) — the kicker between them is real
              copy that screen readers must still reach. */}
          <div className="font-headline uppercase text-cream tracking-[-0.01em] leading-[0.94] select-none text-[clamp(3.5rem,10vw,10rem)] [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">
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
                Australian-based private label apparel development and
                manufacturing — through our own facilities and a trusted
                global network of specialised partner factories.
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
                {/* Gradient-clipped text can't carry the parent's
                    text-shadow (it would show through the transparent
                    fill), so it gets a drop-shadow filter instead. */}
                <span
                  ref={standardRef}
                  style={{ display: "inline-block" }}
                  className="will-change-transform text-gradient-brand pr-[0.04em] [text-shadow:none] [filter:drop-shadow(0_2px_12px_rgba(0,0,0,0.45))]"
                >
                  STANDARD.
                </span>
              </span>
            </div>
          </div>

          {/* The six countries, desktop only — on phones the headline
              already fills the screen. */}
          <div className="hidden shrink-0 pb-3 lg:block">
            <p className="mb-4 font-body text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-cream/50">
              Operating across
            </p>
            <ol className="flex flex-col gap-1.5 border-l border-cream/15 pl-5">
              {COUNTRIES.map((country, i) => (
                <li
                  key={country}
                  ref={(el) => {
                    countryRefs.current[i] = el;
                  }}
                  className="flex items-baseline gap-3 opacity-0"
                >
                  <span className="w-5 font-body text-[0.7rem] font-semibold tabular-nums text-cream/35">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    ref={(el) => {
                      countryNameRefs.current[i] = el;
                    }}
                    className="font-headline text-2xl tracking-[0.02em] xl:text-[1.7rem]"
                    style={{ color: COUNTRY_REST_COLOR }}
                  >
                    {country}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Bottom rail: scroll cue + certifications */}
        <div
          ref={railRef}
          className="mt-6 flex items-center justify-between gap-6 border-t border-cream/15 pt-4 opacity-0 md:mt-8 md:pt-5"
        >
          <div className="flex items-center gap-3 font-body text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-cream/60">
            <span className="relative block h-7 w-px overflow-hidden bg-cream/20">
              <span className="hero-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-gold to-emerald-bright motion-reduce:animate-none" />
            </span>
            Scroll to explore
          </div>

          <p className="hidden font-body text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-cream/60 md:block">
            <span className="text-gradient-brand">Certified</span>
            <span className="mx-3 text-cream/25">/</span>
            {CERTIFICATIONS.join(" · ")}
          </p>
        </div>
      </div>
    </section>
  );
}
