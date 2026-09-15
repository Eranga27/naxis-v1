"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Real category names aren't established yet — placeholders until the
// client confirms what actually belongs here.
const CATEGORIES = [
  "[CONFIRM WITH CLIENT]",
  "[CONFIRM WITH CLIENT]",
  "[CONFIRM WITH CLIENT]",
  "[CONFIRM WITH CLIENT]",
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

export default function Capabilities() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const imageWrapRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imageInnerRefs = useRef<Array<HTMLDivElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const reveals = revealRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      const imageWraps = imageWrapRefs.current.filter(
        (el): el is HTMLDivElement => el !== null
      );
      const imageInners = imageInnerRefs.current.filter(
        (el): el is HTMLDivElement => el !== null
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        gsap.set(reveals, { opacity: 1, y: 0 });
        gsap.set(imageWraps, { clipPath: "inset(0% 0 0 0)" });
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

      // This section's signature moment, deliberately different from the
      // plain fade-up used everywhere else: each category photo rises
      // into view like a curtain lifting (a masked clip-path reveal, the
      // same technique behind Obys Agency's own image reveals), staggered
      // left to right.
      //
      // This is scrubbed to scroll position, not a fixed-duration autoplay
      // — a "once" trigger plays out over its own real-time duration the
      // instant it fires, so scrolling at normal speed blows straight past
      // it and the lift is never actually seen happening. Tying it to a
      // single timeline under one scrubbed ScrollTrigger means its
      // progress IS how far you've scrolled, so it can't be missed.
      const curtainTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          end: "top 20%",
          scrub: 0.6,
        },
      });
      imageWraps.forEach((wrap, i) => {
        curtainTl.fromTo(
          wrap,
          { clipPath: "inset(100% 0 0 0)" },
          { clipPath: "inset(0% 0 0 0)", ease: "none", duration: 1 },
          i * 0.4
        );
      });

      // Wider drift than a typical parallax touch — this is the section's
      // one big "look how alive this feels" moment, so it's spent here
      // rather than spread thin everywhere.
      imageInners.forEach((inner) => {
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
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="capabilities"
      className="relative w-full bg-ink px-6 py-24 sm:px-10 md:px-16 md:py-32 lg:px-20"
    >
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
        className="mb-14 max-w-3xl font-headline uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2rem,6vw,4.5rem)] text-cream opacity-0 md:mb-20"
      >
        Built to spec, every time.
      </h2>

      <p
        ref={(el) => {
          revealRefs.current[2] = el;
        }}
        className="mb-14 max-w-xl font-body text-sm text-cream/70 opacity-0 md:mb-20 md:text-base"
      >
        From concept to finished garment, every category we produce is
        scoped, sampled, and confirmed with the client before a single unit
        ships.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((category, i) => (
          <div
            key={i}
            ref={(el) => {
              revealRefs.current[3 + i] = el;
            }}
            className="opacity-0"
          >
            <div
              ref={(el) => {
                imageWrapRefs.current[i] = el;
              }}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl"
              style={{ clipPath: "inset(100% 0 0 0)" }}
            >
              <div
                ref={(el) => {
                  imageInnerRefs.current[i] = el;
                }}
                className="absolute inset-[-20%]"
              >
                <Image
                  src={CATEGORY_IMAGES[i]}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 90vw"
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
    </section>
  );
}
