"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Real category names aren't established yet — placeholders until the
// client confirms what actually belongs here. The three photos behind
// this section are generic textile/garment texture shots, used purely as
// ambient backdrop — deliberately NOT paired 1:1 with these slots, since
// none of them are verified photos of what NAXIS actually produces.
const CATEGORIES = [
  "[CONFIRM WITH CLIENT]",
  "[CONFIRM WITH CLIENT]",
  "[CONFIRM WITH CLIENT]",
  "[CONFIRM WITH CLIENT]",
];

const BACKDROP_IMAGES = [
  "/images/apparel3.jpg",
  "/images/apparel4.jpg",
  "/images/apparel6.jpg",
];

export default function Capabilities() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const reveals = revealRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        gsap.set(reveals, { opacity: 1, y: 0 });
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
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="capabilities"
      className="relative w-full overflow-hidden bg-ink px-6 py-24 sm:px-10 md:px-16 md:py-32 lg:px-20"
    >
      {/* Ambient texture only — three generic, brand-free textile shots as
          a backdrop, not a claim about specific product categories. */}
      <div className="absolute inset-0 grid grid-cols-3 opacity-40">
        {BACKDROP_IMAGES.map((src) => (
          <div key={src} className="relative h-full w-full">
            <Image
              src={src}
              alt=""
              fill
              sizes="34vw"
              className="object-cover grayscale"
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-ink/80" />

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
          scoped, sampled, and confirmed with the client before a single
          unit ships.
        </p>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-cream/10 bg-cream/10 sm:grid-cols-4">
          {CATEGORIES.map((category, i) => (
            <div
              key={i}
              ref={(el) => {
                revealRefs.current[3 + i] = el;
              }}
              className="flex flex-col gap-3 bg-ink px-6 py-10 opacity-0 md:px-7 md:py-12"
            >
              <span className="font-body text-xs font-semibold text-cream/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-body text-xs uppercase tracking-[0.2em] text-cream/60">
                {category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
