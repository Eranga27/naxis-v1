"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Only categories confirmed by the client belong here. The placeholder is
// deliberate — replace it once the remaining categories are supplied.
const CATEGORIES = ["Sports fits", "Belts", "[CONFIRM WITH CLIENT]"];

export default function Mission() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const list = listRef.current;
    if (!section || !list) return;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const reveals = revealRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      const items = itemRefs.current.filter(
        (el): el is HTMLSpanElement => el !== null
      );

      if (reduceMotion) {
        // Static: every category stays listed, nothing auto-rotates.
        gsap.set(reveals, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        reveals,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: section, start: "top 72%", once: true },
        }
      );

      if (items.length < 2) return;

      // Collapse the statically-stacked list into a single rotating slot.
      gsap.set(list, { height: "1.2em", position: "relative" });
      gsap.set(items, { position: "absolute", top: 0, left: 0, width: "100%" });
      gsap.set(items, { yPercent: 100, opacity: 0 });
      gsap.set(items[0], { yPercent: 0, opacity: 1 });

      const rotate = gsap.timeline({ repeat: -1 });
      items.forEach((item, i) => {
        const next = items[(i + 1) % items.length];
        rotate
          .to({}, { duration: 2.4 })
          .to(item, {
            yPercent: -100,
            opacity: 0,
            duration: 0.55,
            ease: "power2.inOut",
          })
          .fromTo(
            next,
            { yPercent: 100, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.55, ease: "power2.inOut" },
            "<"
          );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="mission"
      className="relative w-full bg-ink px-6 py-28 sm:px-10 md:px-16 md:py-36 lg:px-20 lg:py-44"
    >
      <div className="max-w-5xl">
        <p
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="mb-8 font-body text-xs font-bold uppercase tracking-[0.35em] text-gold opacity-0 md:mb-10 md:text-sm"
        >
          Who we are
        </p>

        <p
          ref={(el) => {
            revealRefs.current[1] = el;
          }}
          className="max-w-4xl font-body text-[clamp(1.35rem,3vw,2.6rem)] font-medium leading-[1.35] text-cream opacity-0"
        >
          An offshore garment manufacturing service provider, operating through
          certified partner factories across six countries.
        </p>

        <div
          ref={(el) => {
            revealRefs.current[2] = el;
          }}
          className="mt-16 opacity-0 md:mt-20"
        >
          <p className="mb-4 font-body text-xs font-medium uppercase tracking-[0.3em] text-cream/50 md:text-sm">
            What we make
          </p>

          <div
            ref={listRef}
            className="overflow-hidden font-headline text-[clamp(2rem,6vw,4.5rem)] uppercase leading-[1.2] tracking-[-0.01em] text-emerald"
          >
            {CATEGORIES.map((category, i) => (
              <span
                key={category}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="block"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
