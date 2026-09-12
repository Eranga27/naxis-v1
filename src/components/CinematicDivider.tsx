"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const CERTIFICATIONS = ["SEDEX", "WRAP", "CT-PAT"];

export default function CinematicDivider() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);

  // Only decode this video while it's near the viewport — two autoplaying
  // videos running at once is wasteful, and it keeps the hero's load clear.
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // autoplay can still be refused; the poster remains as fallback
          });
        } else {
          video.pause();
        }
      },
      { rootMargin: "25%" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

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
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.13,
          scrollTrigger: { trigger: section, start: "top 70%", once: true },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="compliance"
      className="relative flex min-h-[88vh] w-full items-center overflow-hidden bg-ink"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/divider.mp4"
        poster="/images/divider-poster.jpg"
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/60 to-brown/40" />

      <div className="relative z-10 w-full px-6 py-24 sm:px-10 md:px-16 lg:px-20">
        <p
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="mb-6 font-body text-xs font-bold uppercase tracking-[0.35em] text-gold opacity-0 md:mb-8 md:text-sm"
        >
          Compliance
        </p>

        <h2
          aria-label="Every partner factory. Fully compliant."
          className="font-headline uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2.5rem,8.5vw,8rem)] [text-shadow:0_2px_6px_rgba(0,0,0,0.35)]"
        >
          <span
            ref={(el) => {
              revealRefs.current[1] = el;
            }}
            aria-hidden="true"
            className="block text-cream opacity-0"
          >
            Every partner factory.
          </span>
          <span
            ref={(el) => {
              revealRefs.current[2] = el;
            }}
            aria-hidden="true"
            className="block text-gold opacity-0 sm:ml-[7vw]"
          >
            Fully compliant.
          </span>
        </h2>

        <ul
          ref={(el) => {
            revealRefs.current[3] = el;
          }}
          className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 opacity-0 md:mt-16 md:gap-x-14"
        >
          {CERTIFICATIONS.map((cert) => (
            <li
              key={cert}
              className="font-body text-sm font-semibold uppercase tracking-[0.25em] text-cream/85 md:text-base"
            >
              {cert}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
