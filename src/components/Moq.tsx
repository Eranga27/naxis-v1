"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import Link from "next/link";
import { MOQ } from "@/content/moq";
import { CONTACT_HREF } from "@/lib/navLinks";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;


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
      className="relative w-full bg-cream px-6 py-24 text-center sm:px-10 md:px-16 md:py-36 lg:px-20"
    >
      {/* Gold expanding rule */}
      <div
        ref={lineRef}
        className="bg-gradient-brand-deep mx-auto mb-10 h-px w-full max-w-5xl md:mb-14"
        style={{ transform: "scaleX(0)", transformOrigin: "left center" }}
      />

      <div className="mx-auto max-w-6xl">
        {/* Label */}
        <p
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="mx-auto mb-8 w-fit font-body text-xs font-bold uppercase tracking-[0.35em] text-brown opacity-0 md:text-sm"
        >
          Minimum Order Quantity
        </p>

        {/* Main headline — matches the client's large bold treatment */}
        <h2
          ref={(el) => {
            revealRefs.current[1] = el;
          }}
          className="mb-6 font-serif font-bold leading-[1] tracking-[-0.03em] text-[clamp(3rem,10vw,8.5rem)] text-brown opacity-0"
          aria-label="MOQ? Let's Talk."
        >
          MOQ?{" "}
          <span className="text-gradient-brand-deep pr-[0.04em]">Let&apos;s Talk.</span>
        </h2>

        {/* Sub-headline */}
        <p
          ref={(el) => {
            revealRefs.current[2] = el;
          }}
          className="mb-3 font-serif text-base italic text-ink/70 opacity-0 md:text-xl"
        >
          {MOQ.subline}
        </p>

        {/* Emphasis statement */}
        <p
          ref={(el) => {
            revealRefs.current[3] = el;
          }}
          className="mb-12 font-serif text-[clamp(1.6rem,4.2vw,3.25rem)] font-bold leading-[1.1] tracking-[-0.02em] text-brown opacity-0 md:mb-16"
        >
          {MOQ.statement}
        </p>

        {/* Body paragraphs */}
        <div className="mx-auto flex max-w-3xl flex-col gap-5 md:gap-6">
          {MOQ.body.map((para, i) => (
            <p
              key={i}
              ref={(el) => {
                revealRefs.current[4 + i] = el;
              }}
              className="font-serif text-base leading-relaxed text-ink/75 opacity-0 md:text-lg"
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
          <Link
            href={CONTACT_HREF}
            data-magnetic
            className="inline-flex items-center gap-3 rounded-full bg-brown px-8 py-4 font-body text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:bg-emerald"
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
          </Link>
        </div>
      </div>

      {/* Bottom rule */}
      {/* The client's sign-off lockup, as on their MOQ artboard */}
      <div className="mx-auto mt-16 flex max-w-5xl items-center gap-5 md:mt-20">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold" />
        <span className="text-gradient-brand-deep font-body text-base font-semibold uppercase tracking-[0.3em] md:text-lg">
          NAXIS Australia
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold" />
      </div>
      <p className="mt-2 font-body text-[0.65rem] uppercase tracking-[0.3em] text-ink/60 md:text-xs">
        Delivering excellence through experience.
      </p>
    </section>
  );
}
