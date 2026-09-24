"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// MOQ copy sourced directly from the client-provided document.
const BODY_PARAS = [
  "Talk to us. Tell us what you want to create, how many you need, and where you want to go with your idea. We'll listen, understand, and work with you to find a way forward.",
  "With our flexible manufacturing network, hands-on product development expertise and complete supply chain capabilities, we don't simply look at the numbers — we look at the possibilities.",
  "Your idea matters to us. Whatever the quantity, talk to us first. Together, we'll find a way to make it happen.",
];

export default function Moq() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const lineRef = useRef<HTMLDivElement>(null);

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
        if (lineRef.current) gsap.set(lineRef.current, { scaleX: 1 });
        return;
      }

      // Gold rule expands first, then text cascade reveals underneath
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 1.1,
            ease: "power3.inOut",
            scrollTrigger: { trigger: section, start: "top 80%", once: true },
          }
        );
      }

      gsap.fromTo(
        reveals,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="moq"
      className="relative w-full bg-ink px-6 py-24 sm:px-10 md:px-16 md:py-36 lg:px-20"
    >
      {/* Gold expanding rule */}
      <div
        ref={lineRef}
        className="bg-gradient-brand mb-10 h-px w-full md:mb-14"
        style={{ transform: "scaleX(0)", transformOrigin: "left center" }}
      />

      <div className="mx-auto max-w-6xl">
        {/* Label */}
        <p
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="mb-8 font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand w-fit opacity-0 md:text-sm"
        >
          Minimum Order Quantity
        </p>

        {/* Main headline — matches the client's large bold treatment */}
        <h2
          ref={(el) => {
            revealRefs.current[1] = el;
          }}
          className="mb-4 font-headline uppercase leading-[1.02] tracking-[-0.01em] text-[clamp(3rem,11vw,9.5rem)] text-cream opacity-0"
          aria-label="MOQ? Let's Talk."
        >
          MOQ?{" "}
          <span className="text-gradient-brand pr-[0.04em]">Let&apos;s Talk.</span>
        </h2>

        {/* Sub-headline */}
        <p
          ref={(el) => {
            revealRefs.current[2] = el;
          }}
          className="mb-2 font-body text-sm font-medium italic text-cream/60 opacity-0 md:text-base"
        >
          Everything is possible when there&apos;s a willingness to find a way.
        </p>

        {/* Emphasis statement */}
        <p
          ref={(el) => {
            revealRefs.current[3] = el;
          }}
          className="mb-12 font-headline text-[clamp(1.5rem,4.5vw,3.5rem)] uppercase leading-[1.1] text-cream opacity-0 md:mb-16"
        >
          Don&apos;t let MOQ hold your idea back.
        </p>

        {/* Body paragraphs */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
          {BODY_PARAS.map((para, i) => (
            <p
              key={i}
              ref={(el) => {
                revealRefs.current[4 + i] = el;
              }}
              className="font-body text-sm leading-relaxed text-cream/65 opacity-0 md:text-base md:leading-loose"
            >
              {para}
            </p>
          ))}
        </div>

        {/* CTA nudge */}
        <div
          ref={(el) => {
            revealRefs.current[7] = el;
          }}
          className="mt-14 opacity-0 md:mt-20"
        >
          <a
            href="#contact"
            data-magnetic
            className="inline-flex items-center gap-3 rounded-full bg-gold px-8 py-4 font-body text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-gold-light"
          >
            Start the Conversation
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="mt-16 h-px w-full bg-cream/10 md:mt-20" />
    </section>
  );
}
