"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Country specializations sourced from the NAXIS Australia client materials.
const COUNTRIES = [
  {
    name: "Sri Lanka",
    note: "Apparel & Activewear",
  },
  {
    name: "India",
    note: "Knits & Workwear",
  },
  {
    name: "Bangladesh",
    note: "Woven & Denim",
  },
  {
    name: "Vietnam",
    note: "Sportswear & Outerwear",
  },
  {
    name: "China",
    note: "Technical Fabrics",
  },
  {
    name: "Italy",
    note: "Luxury & Technical",
  },
];

export default function GlobalNetwork() {
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
      id="global-network"
      className="relative w-full bg-cream px-6 py-24 sm:px-10 md:px-16 md:py-32 lg:px-20"
    >
      <p
        ref={(el) => {
          revealRefs.current[0] = el;
        }}
        className="mb-6 font-body text-xs font-bold uppercase tracking-[0.35em] text-brown opacity-0 md:mb-8 md:text-sm"
      >
        Global Network
      </p>

      <h2
        ref={(el) => {
          revealRefs.current[1] = el;
        }}
        className="mb-14 max-w-4xl font-headline uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2rem,6vw,4.5rem)] text-ink opacity-0 md:mb-20"
      >
        Six countries. One connected supply chain.
      </h2>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-3">
        {COUNTRIES.map((country, i) => (
          <div
            key={country.name}
            ref={(el) => {
              revealRefs.current[2 + i] = el;
            }}
            className="flex flex-col gap-3 bg-cream px-6 py-10 opacity-0 md:px-8 md:py-14"
          >
            <span className="font-body text-xs font-semibold text-ink/40">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-headline text-2xl uppercase tracking-[-0.01em] text-ink md:text-3xl">
              {country.name}
            </span>
            <span className="font-body text-xs uppercase tracking-[0.2em] text-ink/40">
              {country.note}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
