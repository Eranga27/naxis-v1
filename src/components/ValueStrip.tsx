"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type IconName = "shield" | "globe" | "chat";

const VALUES: Array<{ label: string; icon: IconName }> = [
  { label: "Certified Facilities", icon: "shield" },
  { label: "Six Countries", icon: "globe" },
  { label: "Direct Communication", icon: "chat" },
];

function Icon({ name }: { name: IconName }) {
  const common = "h-7 w-7 md:h-8 md:w-8";
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={common}>
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "globe") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={common}>
      <path d="M4 5h16v10H8l-4 4V5z" strokeLinejoin="round" />
    </svg>
  );
}

export default function ValueStrip() {
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
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: section, start: "top 78%", once: true },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-cream px-6 py-20 sm:px-10 md:px-16 md:py-24 lg:px-20"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
        {VALUES.map((value, i) => (
          <div
            key={value.label}
            ref={(el) => {
              revealRefs.current[i] = el;
            }}
            className="flex flex-col items-center gap-4 text-center opacity-0"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/5 text-brown md:h-16 md:w-16">
              <Icon name={value.icon} />
            </span>
            <span className="font-body text-sm font-semibold uppercase tracking-[0.15em] text-ink md:text-base">
              {value.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
