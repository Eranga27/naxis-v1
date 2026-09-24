"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { GOLD } from "@/lib/brand";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Product categories sourced from the NAXIS Australia client PDF and
// network specialisation data. This list is intentionally open-ended:
// the gallery below is a horizontal, scroll-pinned strip rather than a
// fixed grid so it keeps working as-is whether there are 4 categories
// or 14 — adding a category is just appending to this array and
// CATEGORY_IMAGES, nothing structural.
const CATEGORIES = [
  "Activewear",
  "Teamwear",
  "Casualwear",
  "Workwear",
];

// TEMPORARY stand-ins, not cleared for production: cat2 and cat3 carry
// visible third-party branding (Mitre, an on-field sponsor logo, Under
// Armour), and cat3 additionally shows a real named school and an
// apparent minor. Approved for use on this branch only, to be swapped for
// real category photography before this ever reaches main.
const CATEGORY_IMAGES = [
  "/images/cat1.jpg",
  "/images/cat2.jpg",
  "/images/cat3.jpg",
  "/images/cat4.jpg",
];

// Generic, brand-free textile texture shots — deliberately NOT paired to
// any specific category, unlike the cards. Sits behind everything as a
// dim, grayscale ambient layer so the section doesn't read as a flat
// block of ink behind the cards.
const BACKDROP_IMAGES = [
  "/images/apparel3.jpg",
  "/images/apparel4.jpg",
  "/images/apparel6.jpg",
];

export default function Capabilities() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const bgWrapRefs = useRef<Array<HTMLDivElement | null>>([]);
  const bgInnerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardWrapRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardInnerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const galleryWrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const galleryWrap = galleryWrapRef.current;
    const track = trackRef.current;
    if (!section || !galleryWrap || !track) return;

    const ctx = gsap.context(() => {
      const reveals = revealRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      const bgWraps = bgWrapRefs.current.filter(
        (el): el is HTMLDivElement => el !== null
      );
      const bgInners = bgInnerRefs.current.filter(
        (el): el is HTMLDivElement => el !== null
      );
      const cardWraps = cardWrapRefs.current.filter(
        (el): el is HTMLDivElement => el !== null
      );
      const cardInners = cardInnerRefs.current.filter(
        (el): el is HTMLDivElement => el !== null
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        // No scroll-jacking, no drift — cards stay in their native,
        // swipeable horizontal strip (see the track's own overflow-x-auto)
        // and are simply visible, full stop.
        gsap.set(reveals, { opacity: 1, y: 0 });
        gsap.set([...bgWraps, ...cardWraps], { clipPath: "inset(0% 0 0 0)" });
        return;
      }

      gsap.fromTo(
        reveals,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
        }
      );

      // Every photo here — the dim background trio and the category
      // cards alike — rises into view like a curtain lifting (a masked
      // clip-path reveal, the same technique behind Obys Agency's own
      // image reveals), staggered left to right. Both groups run through
      // this same function so they move identically, just at different
      // depths. Scrubbed to scroll position, not a fixed-duration
      // autoplay, so it can't be scrolled past too fast to see.
      const setupCurtainReveal = (wraps: HTMLDivElement[]) => {
        const curtainTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            end: "top 20%",
            scrub: 0.6,
          },
        });
        wraps.forEach((wrap, i) => {
          curtainTl.fromTo(
            wrap,
            { clipPath: "inset(100% 0 0 0)" },
            { clipPath: "inset(0% 0 0 0)", ease: "none", duration: 1 },
            i * 0.4
          );
        });
      };
      setupCurtainReveal(bgWraps);
      setupCurtainReveal(cardWraps);

      // Background trio keeps its own gentle vertical drift regardless of
      // category count — pure ambience, unrelated to the gallery below.
      bgInners.forEach((inner) => {
        gsap.fromTo(
          inner,
          { yPercent: -13 },
          {
            yPercent: 13,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      // The category gallery itself: this is the part built to scale past
      // four. Rather than a grid that keeps growing taller as categories
      // are added, the section PINS in place once its top reaches the
      // viewport's top, and the vertical scroll you'd otherwise spend
      // scrolling past a tall grid instead drives the strip sideways —
      // the same "scroll-jacked horizontal gallery" technique behind most
      // Awwwards case-study/work sections. However many cards there are,
      // this scrolls the same way; only the pinned scroll DISTANCE grows.
      //
      // Only wired up at tablet width and above, and only without a
      // reduced-motion preference (guarded by the early return above) —
      // on a phone, scroll-jacking a horizontal gesture fights the
      // natural swipe-to-scroll instinct, so mobile instead gets the
      // track's native overflow-x-auto + scroll-snap for a normal
      // swipeable strip, no JS involved.
      ScrollTrigger.matchMedia({
        "(min-width: 768px)": () => {
          gsap.set(galleryWrap, { overflow: "visible" });
          gsap.set(track, { overflow: "visible" });

          const getMaxScroll = () =>
            Math.max(0, track.scrollWidth - galleryWrap.clientWidth);

          const tickCount = CATEGORIES.length;
          const ticks = tickRefs.current.filter(
            (el): el is HTMLSpanElement => el !== null
          );

          // Rest state (progress 0, before any scroll) — first tick reads
          // as active immediately rather than everything looking inert
          // until the pin first engages.
          if (ticks[0]) {
            gsap.set(ticks[0], { backgroundColor: GOLD, scaleY: 1.8 });
          }

          const pinTween = gsap.to(track, {
            x: () => -getMaxScroll(),
            ease: "none",
            scrollTrigger: {
              trigger: galleryWrap,
              start: "top top",
              end: () => "+=" + getMaxScroll(),
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
              // Sprocket-hole tick rail wayfinding: the active mark
              // advances the instant its card becomes the nearest one,
              // driven by the pin's own scroll progress.
              onUpdate: (self) => {
                const activeIndex = Math.round(
                  self.progress * (tickCount - 1)
                );
                ticks.forEach((tick, i) => {
                  gsap.set(tick, {
                    backgroundColor:
                      i === activeIndex ? GOLD : "rgba(244,239,228,0.25)",
                    scaleY: i === activeIndex ? 1.8 : 1,
                  });
                });
              },
            },
          });

          // Each card's photo drifts slightly against the direction of
          // travel as the strip scrolls — the same inner/outer parallax
          // split used elsewhere on this section, just running sideways
          // to match the gallery's own axis.
          cardInners.forEach((inner) => {
            gsap.fromTo(
              inner,
              { xPercent: -8 },
              {
                xPercent: 8,
                ease: "none",
                scrollTrigger: {
                  trigger: galleryWrap,
                  start: "top top",
                  end: () => "+=" + getMaxScroll(),
                  scrub: true,
                },
              }
            );
          });

          return () => {
            pinTween.scrollTrigger?.kill();
            pinTween.kill();
          };
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="capabilities"
      className="relative w-full overflow-hidden bg-ink px-6 py-20 sm:px-10 md:px-16 md:py-24 lg:px-20"
    >
      {/* Ambient texture only — three generic, brand-free textile shots as
          a dim backdrop, not a claim about specific product categories
          (that's what the cards below are for). */}
      <div className="absolute inset-0 grid grid-cols-3 opacity-55">
        {BACKDROP_IMAGES.map((src, i) => (
          <div
            key={src}
            ref={(el) => {
              bgWrapRefs.current[i] = el;
            }}
            className="relative h-full w-full overflow-hidden"
            style={{ clipPath: "inset(100% 0 0 0)" }}
          >
            <div
              ref={(el) => {
                bgInnerRefs.current[i] = el;
              }}
              className="absolute inset-[-20%]"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="34vw"
                className="object-cover grayscale"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-ink/75" />

      <div className="relative z-10">
        <p
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="mb-6 font-body text-xs font-bold uppercase tracking-[0.35em] text-gold opacity-0 md:mb-8 md:text-sm"
        >
          What We Make
        </p>

        <h2
          ref={(el) => {
            revealRefs.current[1] = el;
          }}
          className="mb-6 max-w-3xl font-headline uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2.75rem,7.5vw,5.75rem)] text-cream opacity-0 md:mb-8"
        >
          Built to spec, every time.
        </h2>

        <p
          ref={(el) => {
            revealRefs.current[2] = el;
          }}
          className="mb-10 max-w-xl font-body text-sm text-cream/70 opacity-0 md:mb-14 md:text-base"
        >
          From concept to finished garment, every category we produce is
          scoped, sampled, and confirmed with the client before a single
          unit ships.
        </p>
      </div>

      {/* The gallery is deliberately OUTSIDE the z-10 text wrapper's own
          padding-constrained flow so it can pin full-bleed — its own
          horizontal padding matches the section's so the cards still line
          up with the heading above at rest. */}
      <div ref={galleryWrapRef} className="relative z-10 mt-2">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORIES.map((category, i) => (
            <div
              key={i}
              ref={(el) => {
                revealRefs.current[3 + i] = el;
              }}
              className="w-[260px] flex-shrink-0 snap-center opacity-0 sm:w-[320px]"
            >
              <div
                ref={(el) => {
                  cardWrapRefs.current[i] = el;
                }}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl"
                style={{ clipPath: "inset(100% 0 0 0)" }}
              >
                <div
                  ref={(el) => {
                    cardInnerRefs.current[i] = el;
                  }}
                  className="absolute inset-[-20%]"
                >
                  <Image
                    src={CATEGORY_IMAGES[i]}
                    alt={`${category} garments`}
                    fill
                    sizes="(min-width: 640px) 320px, 78vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="block font-body text-xs font-semibold text-cream/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="block font-body text-xs uppercase tracking-[0.2em] text-cream">
                    {category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Wayfinding for the pinned gallery — without it there's no cue
            that scrolling further moves the strip rather than the page.
            A sprocket-hole tick rail whose active mark advances with the
            pin's own scroll progress. Desktop/tablet only, since mobile's
            native scroll-snap doesn't need one (the strip visibly
            continues past the viewport edge). */}
        <div className="mt-8 hidden items-center gap-2.5 md:flex">
          {CATEGORIES.map((_, i) => (
            <span
              key={i}
              ref={(el) => {
                tickRefs.current[i] = el;
              }}
              className="h-3 w-[3px] shrink-0 rounded-full bg-cream/25"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
