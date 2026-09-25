"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { CERTIFICATIONS } from "@/content/compliance";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
      id="certifications"
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
          className="mb-6 font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand w-fit opacity-0 md:mb-8 md:text-sm"
        >
          Compliance
        </p>

        <h2
          aria-label="Independently audited. Responsibly made."
          className="font-headline uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2.5rem,8.5vw,8rem)] [text-shadow:0_2px_6px_rgba(0,0,0,0.35)]"
        >
          <span
            ref={(el) => {
              revealRefs.current[1] = el;
            }}
            aria-hidden="true"
            className="block text-cream opacity-0"
          >
            Independently audited.
          </span>
          <span
            ref={(el) => {
              revealRefs.current[2] = el;
            }}
            aria-hidden="true"
            // Gradient-clipped text can't carry the h2's text-shadow (it
            // would show through the transparent fill) — drop-shadow instead.
            className="text-gradient-brand block w-fit pr-[0.04em] opacity-0 [text-shadow:none] [filter:drop-shadow(0_2px_6px_rgba(0,0,0,0.35))] sm:ml-[7vw]"
          >
            Responsibly made.
          </span>
        </h2>

        <p
          ref={(el) => {
            revealRefs.current[3] = el;
          }}
          className="mt-8 max-w-lg font-body text-sm leading-relaxed text-cream/60 opacity-0 md:mt-10 md:text-base"
        >
          Our customers look for more than quality and value — they look for
          partners with a good track record in social compliance. Our offshore
          manufacturing facilities have participated in various independent
          audits reviewing our compliance, with excellent results.
        </p>

        <ul
          ref={(el) => {
            revealRefs.current[4] = el;
          }}
          className="mt-12 grid grid-cols-1 gap-x-8 gap-y-5 opacity-0 sm:grid-cols-2 md:mt-16 lg:grid-cols-5"
        >
          {CERTIFICATIONS.map((cert) => (
            <li key={cert.code} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-bright shadow-[0_0_10px_rgba(47,208,138,0.7)]"
              />
              <span>
                <span className="block font-body text-sm font-semibold uppercase tracking-[0.25em] text-cream md:text-base">
                  {cert.code}
                </span>
                <span className="mt-1 block font-body text-xs leading-snug text-cream/60">
                  {cert.name}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
