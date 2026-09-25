"use client";

import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { ABOUT, BELIEFS } from "@/content/about";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * The client's belief — "great apparel is built through experience,
 * innovation, integrity and strong partnerships" — as four words set huge,
 * each filling with the brand gradient left to right as the page scrolls
 * through them, one after another. Under reduced motion they're filled.
 */
export default function BeliefWords() {
  const sectionRef = useRef<HTMLElement>(null);
  const fillRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const fills = fillRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    if (!section) return;
    if (prefersReducedMotion()) {
      gsap.set(fills, { clipPath: "inset(0 0% 0 0)" });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.to(fills, {
        clipPath: "inset(0 0% 0 0)",
        ease: "none",
        stagger: 1,
        duration: 1,
        scrollTrigger: {
          trigger: section,
          start: "top 60%",
          end: "bottom 60%",
          scrub: 0.5,
        },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-ink px-6 py-24 sm:px-10 md:px-16 md:py-36 lg:px-20"
    >
      <h2 className="sr-only">{ABOUT.belief}</h2>
      <p aria-hidden="true" className="mb-8 max-w-xl font-serif text-xl italic text-cream/70 md:mb-12 md:text-3xl">
        We believe great apparel is built through
      </p>
      <div aria-hidden="true" className="flex flex-col">
        {BELIEFS.map((word, i) => (
          <span
            key={word}
            className="relative block w-fit font-headline text-[clamp(3.25rem,12vw,11rem)] uppercase leading-[0.92] tracking-[-0.01em]"
          >
            <span className="text-cream/10">{word}</span>
            <span
              ref={(el) => {
                fillRefs.current[i] = el;
              }}
              className="text-gradient-brand absolute inset-0 pr-[0.04em]"
              style={{ clipPath: "inset(0 100% 0 0)" }}
            >
              {word}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
