"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { INTRO_SESSION_KEY, onReveal } from "@/lib/intro";
import { GOLD } from "@/lib/brand";
import { CARD_CLIP_PHONE, CARD_CLIP_WIDE, FULL_CLIP } from "@/lib/motion";
import { COUNTRIES } from "@/content/countries";
import { VEIL_EXIT_MS } from "@/components/Preloader";

gsap.registerPlugin(ScrollTrigger);

// Layout effects don't run during SSR; fall back to useEffect there to avoid
// the React warning, while still getting pre-paint timing in the browser.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The six countries behind the headline's "SIX" are listed beside it on
// desktop (and rolled through below lg) so the claim is concrete.

// From the client's company profile — same list as CinematicDivider.
const CERTIFICATIONS = ["WRAP", "SMETA", "BSCI", "C-TPAT", "OEKO-TEX"];

const COUNTRY_REST_COLOR = "rgba(244, 239, 228, 0.55)"; // cream/55

// Each headline line rises out of a mask during the entrance. The mask
// clips vertically only, and reaches a little above and below the tight
// 0.94 line box: an overflow-hidden mask used to shave the comma's tail and
// the text shadow (and, when SIX/STANDARD rested nudged sideways, cut them
// to "IX" / "STANDARI") until it was released and the missing parts popped
// in. The hidden start sits far enough down to clear that extra reach.
const LINE_MASK = "inset(-0.3em -100vw -0.25em -100vw)";
const LINE_HIDDEN_Y = "135%";

// Static film grain, as an inline SVG turbulence tile. Breaks up the flat
// digital gradient over the video so the hero reads as footage, not a
// screen.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** Layout offset of el inside ancestor — unaffected by transforms. */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let top = 0;
  let left = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    top += node.offsetTop;
    left += node.offsetLeft;
    node = node.offsetParent as HTMLElement | null;
  }
  return { top, left };
}

/** Width of a headline line's words, not of its full-width block. */
function wordsWidth(line: HTMLElement) {
  const words = Array.from(line.children) as HTMLElement[];
  const first = words[0];
  const last = words[words.length - 1];
  if (!first || !last) return line.offsetWidth;
  return last.offsetLeft + last.offsetWidth - first.offsetLeft;
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);

  const line1WrapRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);

  const kickerRef = useRef<HTMLParagraphElement>(null);

  const line2WrapRef = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);

  const countryListRef = useRef<HTMLDivElement>(null);
  const countryRefs = useRef<Array<HTMLLIElement | null>>([]);
  const countryNameRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rollerRef = useRef<HTMLDivElement>(null);
  const rollerNameRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const railRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const media = mediaRef.current;
    const dim = dimRef.current;
    const content = contentRef.current;
    const headline = headlineRef.current;
    const line1Wrap = line1WrapRef.current;
    const line1 = line1Ref.current;
    const kickerEl = kickerRef.current;
    const line2Wrap = line2WrapRef.current;
    const line2 = line2Ref.current;
    const rail = railRef.current;
    const countryList = countryListRef.current;
    const roller = rollerRef.current;

    if (
      !section ||
      !frame ||
      !media ||
      !dim ||
      !content ||
      !headline ||
      !line1Wrap ||
      !line1 ||
      !kickerEl ||
      !line2Wrap ||
      !line2 ||
      !rail ||
      !countryList ||
      !roller
    ) {
      return;
    }

    const countries = countryRefs.current.filter(
      (el): el is HTMLLIElement => el !== null
    );
    const countryNames = countryNameRefs.current.filter(
      (el): el is HTMLSpanElement => el !== null
    );
    const rollerNames = rollerNameRefs.current.filter(
      (el): el is HTMLSpanElement => el !== null
    );

    let entrance: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Release masks once entrance completes so nothing stays clipped —
      // and only then deepen the headline's shadow (hero-headline in
      // globals), which the masks would otherwise have cut off below the
      // letters mid-rise.
      const releaseMasks = () => {
        gsap.set([line1Wrap, line2Wrap], { clipPath: "none" });
        headlineRef.current?.classList.add("is-lit");
      };

      // A slow gold sweep down the country list, one country at a time —
      // a quiet sign of life once the headline has settled. Below lg,
      // where the list doesn't fit, the roller under the headline turns
      // over to the next country on the same beat. Both pause while the
      // hero is off screen.
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
        // The roller turns over from a self-rescheduling call rather than
        // the looping timeline: its first country has to both leave and
        // come back within one loop, which a repeating timeline renders
        // unreliably at the loop point. Routed through ctx.add so tweens
        // made in the later callback are still reverted on unmount.
        let shown = 0;
        const turnRoller = gsap.delayedCall(step, () => {
          ctx.add(() => {
            const leaving = rollerNames[shown];
            shown = (shown + 1) % rollerNames.length;
            const arriving = rollerNames[shown];
            gsap.to(leaving, { yPercent: -110, duration: 0.5, ease: "power2.inOut" });
            gsap.fromTo(
              arriving,
              { yPercent: 110 },
              { yPercent: 0, duration: 0.5, ease: "power2.inOut" }
            );
          });
          turnRoller.restart(true);
        });
        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            if (self.isActive) {
              cycle.play();
              turnRoller.resume();
            } else {
              cycle.pause();
              turnRoller.pause();
            }
          },
        });
      };

      // Geometry for the scroll sequence below. All of it comes from
      // layout offsets, which transforms don't affect, so it reads the
      // same whatever point the scrubbed timeline is at when ScrollTrigger
      // refreshes (every value using it is a function, re-read on each
      // refresh, so a resize or rotation re-derives it).
      const isPhone = () => window.innerWidth < 768;
      // The kicker's gap between the two lines, which closes on scroll.
      const lineGap = () =>
        line2Wrap.offsetTop - (line1Wrap.offsetTop + line1Wrap.offsetHeight);
      const statement = () => {
        const width = Math.max(wordsWidth(line1), wordsWidth(line2));
        const top = line1Wrap.offsetTop;
        const bottom = line2Wrap.offsetTop + line2Wrap.offsetHeight - lineGap();
        const at = offsetWithin(headline, section);
        return {
          // Centre of the closed-up two-line statement, in the headline's
          // own box and in the section's.
          originX: width / 2,
          originY: (top + bottom) / 2,
          centerX: at.left + width / 2,
          centerY: at.top + (top + bottom) / 2,
          width,
        };
      };
      // How big the statement grows at centre stage — capped so it keeps
      // a margin inside the card it ends up in.
      const stageScale = () => {
        const fit = (section.clientWidth * (isPhone() ? 0.86 : 0.74)) / statement().width;
        return Math.min(isPhone() ? 1.15 : 1.3, fit);
      };

      // The scroll interaction, armed once the entrance finishes. The
      // section pins, and over the pin:
      //
      //  1. The supporting copy (kicker, scroll cue, country list) falls
      //     away, ONE STANDARD. rises to lock under SIX COUNTRIES, and the
      //     statement travels from the bottom-left corner to centre stage,
      //     growing as the footage pushes in and darkens behind it.
      //  2. After a beat to read it, the full-bleed frame closes in to a
      //     rounded card on the cream of the next section — the footage
      //     keeps pushing in, the statement settles inside the card — so
      //     the pin releases straight into Mission with no seam.
      //
      // Same sequence on phones, with a card that keeps more of the width.
      const armScrollInteraction = () => {
        releaseMasks();
        startCountryCycle();

        let framed = false;
        const scrollTl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + window.innerHeight * (isPhone() ? 1.2 : 1.4),
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            refreshPriority: 10,
            // The header turns solid once the cream shows around the
            // card, rather than waiting for Mission — its logo would
            // otherwise sit on cream with nothing behind it.
            onUpdate: (self) => {
              const next = self.progress > 0.55;
              if (next === framed) return;
              framed = next;
              window.dispatchEvent(
                new CustomEvent("hero:framed", { detail: framed })
              );
            },
          },
        });

        // Phase 1 (0 -> 0.45)
        scrollTl.to(
          [kickerEl, roller, rail],
          { opacity: 0, y: 24, duration: 0.25, ease: "power1.in" },
          0
        );
        scrollTl.to(
          countryList,
          { opacity: 0, x: 24, duration: 0.25, ease: "power1.in" },
          0
        );
        scrollTl.to(line2Wrap, { y: () => -lineGap(), duration: 0.35 }, 0.05);
        scrollTl.fromTo(
          headline,
          { x: 0, y: 0, scale: 1 },
          {
            x: () => section.clientWidth / 2 - statement().centerX,
            y: () => section.clientHeight / 2 - statement().centerY,
            scale: stageScale,
            transformOrigin: () => `${statement().originX}px ${statement().originY}px`,
            duration: 0.45,
          },
          0
        );
        scrollTl.to(dim, { opacity: 0.45, duration: 0.45, ease: "none" }, 0);
        scrollTl.fromTo(media, { scale: 1 }, { scale: 1.25, duration: 1, ease: "none" }, 0);

        // Phase 2 (0.55 -> 1)
        scrollTl.fromTo(
          frame,
          { clipPath: FULL_CLIP },
          {
            clipPath: () => (isPhone() ? CARD_CLIP_PHONE : CARD_CLIP_WIDE),
            duration: 0.45,
          },
          0.55
        );
        scrollTl.to(
          headline,
          { scale: () => stageScale() * 0.84, duration: 0.45 },
          0.55
        );

        // Notify downstream triggers and refresh ScrollTrigger
        window.dispatchEvent(new CustomEvent("hero:pinned"));
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      };

      if (reduceMotion) {
        // Instant static layout for reduced-motion preference
        gsap.set(media, { opacity: 1, scale: 1 });
        gsap.set([line1, line2], { y: "0%", opacity: 1, filter: "none" });
        gsap.set(kickerEl, { opacity: 1, y: 0 });
        gsap.set([...countries, roller, rail], { opacity: 1, x: 0, y: 0 });
        releaseMasks();
        return;
      }

      gsap.set(media, { opacity: 0, scale: 1.15 });
      // The roller shows one country at a time, starting on the first.
      gsap.set(rollerNames, { yPercent: 110 });
      if (rollerNames[0]) gsap.set(rollerNames[0], { yPercent: 0 });

      // If already seen in this session, entrance fires immediately.
      // Otherwise the reveal fires as the preloader's name turns into a
      // window onto this hero, and the headline is timed to rise just as
      // the zoom through that name lands (see VEIL_EXIT_MS).
      let alreadySeen = false;
      try {
        alreadySeen = sessionStorage.getItem(INTRO_SESSION_KEY) === "done";
      } catch {
        // storage disabled / private mode
      }

      const textStart = alreadySeen ? 0.05 : VEIL_EXIT_MS / 1000 - 0.15;

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
          { opacity: 0, y: LINE_HIDDEN_Y, filter: "blur(10px)" },
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
          { opacity: 0, y: LINE_HIDDEN_Y, filter: "blur(10px)" },
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
          [roller, rail],
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 },
          textStart + 0.55
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
      // svh, not vh: on phones 100vh is the height with the browser bars
      // hidden, which pushed the headline and scroll cue under the bottom
      // bar on first load. The cream only shows once the frame below
      // closes in to a card on scroll.
      className="relative h-svh w-full overflow-hidden bg-cream"
    >
      {/* Accessible heading text for screen readers & SEO */}
      <h1 className="sr-only">Six countries. One standard.</h1>

      {/* The frame: everything visual, clipped to a card on scroll */}
      <div
        ref={frameRef}
        className="absolute inset-0 flex items-end overflow-hidden bg-ink"
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
        {/* Extra grade, faded up on scroll once the headline moves off the
            dark bottom edge to the brighter middle of the footage. */}
        <div
          ref={dimRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-ink opacity-0"
        />

        {/* A soft shade pooled behind the headline, bottom left, so the
            words stand off the footage without darkening the whole frame. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 75% 60% at 18% 88%, rgba(16,13,9,0.55), rgba(16,13,9,0.2) 55%, transparent 80%)",
          }}
        />

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

        <div
          ref={contentRef}
          className="relative z-10 w-full px-6 pb-6 pt-24 sm:px-10 sm:pb-8 md:px-16 md:pb-10 lg:px-20 lg:pb-10"
        >
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-12">
            {/* Only the two split headline lines are aria-hidden (the sr-only
                h1 above already reads them) — the kicker between them is real
                copy that screen readers must still reach. Positioned so the
                scroll sequence can measure the lines against it. */}
            <div
              ref={headlineRef}
              className="hero-headline relative font-headline uppercase text-cream tracking-[-0.01em] leading-[0.94] select-none text-[clamp(3.5rem,10vw,10rem)]"
            >
              {/* LINE 1: "SIX COUNTRIES," */}
              <div
                ref={line1WrapRef}
                aria-hidden="true"
                className="block text-left"
                style={{ clipPath: LINE_MASK }}
              >
                <span
                  ref={line1Ref}
                  style={{ display: "block", transform: `translateY(${LINE_HIDDEN_Y})` }}
                  className="text-cream"
                >
                  <span
                    style={{ display: "inline-block" }}
                    className="text-cream mr-3 sm:mr-4 md:mr-6"
                  >
                    SIX
                  </span>
                  <span style={{ display: "inline-block" }} className="text-cream">
                    COUNTRIES,
                  </span>
                </span>
              </div>

              {/* EDITORIAL SUBHEAD / KICKER */}
              <div className="my-3 sm:my-4 md:my-5 max-w-xl">
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
                className="block text-left"
                style={{ clipPath: LINE_MASK }}
              >
                <span
                  ref={line2Ref}
                  style={{ display: "block", transform: `translateY(${LINE_HIDDEN_Y})` }}
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
                      fill), so it gets drop-shadow filters instead. */}
                  <span
                    style={{ display: "inline-block" }}
                    className="hero-headline-gradient text-gradient-brand pr-[0.04em]"
                  >
                    STANDARD.
                  </span>
                </span>
              </div>
            </div>

            {/* The six countries, desktop only — on phones the headline
                already fills the screen. */}
            <div ref={countryListRef} className="hidden shrink-0 pb-3 lg:block">
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

          {/* The six countries below lg, where the list beside the
              headline doesn't fit: one at a time, turning over on the
              list's own beat. Under reduced motion it's the whole list,
              static. */}
          <div
            ref={rollerRef}
            className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-cream/50 opacity-0 lg:hidden"
          >
            <span>Operating across</span>
            <span className="sr-only">{COUNTRIES.join(", ")}</span>
            <span
              aria-hidden="true"
              className="relative inline-block h-[1.35em] w-32 overflow-hidden text-lg motion-reduce:hidden"
            >
              {COUNTRIES.map((country, i) => (
                <span
                  key={country}
                  ref={(el) => {
                    rollerNameRefs.current[i] = el;
                  }}
                  className="absolute inset-x-0 top-0 whitespace-nowrap font-headline leading-[1.35] tracking-[0.06em] text-gold"
                >
                  {country}
                </span>
              ))}
            </span>
            <span aria-hidden="true" className="hidden text-cream/70 motion-reduce:inline">
              {COUNTRIES.join(" · ")}
            </span>
          </div>

          {/* Bottom rail: scroll cue + certifications */}
          <div
            ref={railRef}
            className="mt-4 flex items-center justify-between gap-6 border-t border-cream/15 pt-4 opacity-0 md:pt-5 lg:mt-8"
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
      </div>
    </section>
  );
}
