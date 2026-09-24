"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// About copy sourced from the NAXIS Australia client document.
const PARAGRAPHS = [
  "NAXIS Australia is an Australian-based apparel product development, manufacturing and complete supply chain solutions company, supported by our own manufacturing facilities and a trusted global network of specialised partner factories.",
  "Backed by decades of hands-on apparel industry experience, we manage the complete journey — from concept, design and product development through sourcing, manufacturing, quality assurance, logistics and final delivery.",
  "With direct access to our own factories and specialist manufacturing partners, we offer the flexibility, technical expertise and production capability to support small to large-scale manufacturing programs across a diverse range of apparel.",
  "We believe great apparel is built through experience, innovation, integrity and strong partnerships. We don't simply source products — we take responsibility for the entire journey, from factory floor to your door.",
];

export default function AboutNaxis() {
  const sectionRef = useRef<HTMLElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const imgInnerRef = useRef<HTMLDivElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const lineLeftRef = useRef<HTMLDivElement>(null);
  const lineRightRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const imgWrap = imgWrapRef.current;
    const imgInner = imgInnerRef.current;
    if (!section || !imgWrap || !imgInner) return;

    const ctx = gsap.context(() => {
      const reveals = revealRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        gsap.set(reveals, { opacity: 1, y: 0 });
        gsap.set(imgWrap, { clipPath: "inset(0% 0 0 0)" });
        if (lineLeftRef.current) gsap.set(lineLeftRef.current, { scaleX: 1 });
        if (lineRightRef.current) gsap.set(lineRightRef.current, { scaleX: 1 });
        if (taglineRef.current) gsap.set(taglineRef.current, { opacity: 1 });
        return;
      }

      // Image curtain lift — matches the established reveal pattern in Capabilities.
      gsap.fromTo(
        imgWrap,
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          ease: "power3.out",
          duration: 1.2,
          scrollTrigger: { trigger: section, start: "top 80%", once: true },
        }
      );

      // Subtle vertical parallax on the photo itself — keeps the outer
      // clip-path perfectly still while the image drifts.
      gsap.fromTo(
        imgInner,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      // Text block stagger — label, headline, then each paragraph.
      gsap.fromTo(
        reveals,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: section, start: "top 72%", once: true },
        }
      );

      // Gold rules expand outward as the tagline comes into view.
      if (lineLeftRef.current) {
        gsap.fromTo(
          lineLeftRef.current,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 1,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: taglineRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      if (lineRightRef.current) {
        gsap.fromTo(
          lineRightRef.current,
          { scaleX: 0, transformOrigin: "right center" },
          {
            scaleX: 1,
            duration: 1,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: taglineRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      if (taglineRef.current) {
        gsap.fromTo(
          taglineRef.current,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            delay: 0.3,
            scrollTrigger: {
              trigger: taglineRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full bg-cream px-6 py-24 sm:px-10 md:px-16 md:py-36 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        {/* Label */}
        <p
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="mb-8 font-body text-xs font-bold uppercase tracking-[0.35em] text-brown opacity-0 md:text-sm"
        >
          About NAXIS Australia
        </p>

        {/* Two-column layout: photo left, text right */}
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16 xl:gap-24">
          {/* Photo column */}
          <div
            ref={imgWrapRef}
            className="relative aspect-[3/4] w-full flex-shrink-0 overflow-hidden rounded-2xl lg:w-[38%]"
            style={{ clipPath: "inset(100% 0 0 0)" }}
          >
            <div ref={imgInnerRef} className="absolute inset-[-15%]">
              <Image
                src="/images/about-hero.jpg"
                alt="NAXIS apparel product development and manufacturing"
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
            {/* Subtle ink vignette at the bottom */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/20 to-transparent" />
          </div>

          {/* Text column */}
          <div className="flex flex-col justify-center lg:pt-4">
            {/* Headline */}
            <h2
              ref={(el) => {
                revealRefs.current[1] = el;
              }}
              className="mb-10 font-headline uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2.5rem,5.5vw,4.25rem)] text-ink opacity-0"
            >
              Delivering excellence through experience.
            </h2>

            {/* Paragraphs */}
            <div className="flex flex-col gap-6">
              {PARAGRAPHS.map((para, i) => (
                <p
                  key={i}
                  ref={(el) => {
                    revealRefs.current[2 + i] = el;
                  }}
                  className="font-body text-sm leading-relaxed text-ink/75 opacity-0 md:text-base md:leading-loose"
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Tagline with expanding gold rules */}
            <div className="mt-12 flex items-center gap-5">
              <div
                ref={lineLeftRef}
                className="h-px flex-1 bg-gold"
                style={{ transform: "scaleX(0)", transformOrigin: "left center" }}
              />
              <p
                ref={taglineRef}
                className="font-body text-sm font-bold uppercase tracking-[0.2em] text-brown opacity-0"
              >
                From Concept to Creation. Factory to You.
              </p>
              <div
                ref={lineRightRef}
                className="h-px flex-1 bg-gold"
                style={{ transform: "scaleX(0)", transformOrigin: "right center" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
