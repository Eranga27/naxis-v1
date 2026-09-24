"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The client's brand phrase — multi-colored bold letters per the approved
// client asset. Each letter is assigned its brand color individually.
// Massive Bebas Neue letters fill the viewport, each a distinct brand color.
const LINES: Array<Array<{ char: string; color: string }>> = [
  [
    { char: "W", color: "#0b8a44" }, // green
    { char: "E", color: "#ffc94a" }, // gold/yellow
    { char: " ", color: "transparent" },
    { char: "M", color: "#e53c3c" }, // red
    { char: "A", color: "#1976d2" }, // blue
    { char: "K", color: "#8d4c1f" }, // brown
    { char: "E", color: "#7b1fa2" }, // purple
  ],
  [
    { char: "I", color: "#7b1fa2" }, // purple
    { char: "D", color: "#1976d2" }, // blue
    { char: "E", color: "#0b8a44" }, // green
    { char: "A", color: "#ffc94a" }, // gold
    { char: "S", color: "#e53c3c" }, // red
  ],
  [
    { char: "W", color: "#1976d2" }, // blue
    { char: "E", color: "#ffc94a" }, // gold
    { char: "A", color: "#e53c3c" }, // red
    { char: "R", color: "#8d4c1f" }, // brown
    { char: "A", color: "#7b1fa2" }, // purple
    { char: "B", color: "#0b8a44" }, // green
    { char: "L", color: "#1976d2" }, // blue
    { char: "E", color: "#e53c3c" }, // red
    { char: ".", color: "#ffc94a" }, // gold
  ],
];

export default function IdeasWearable() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const linesWrapRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<Array<HTMLDivElement | null>>([]);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  // Lazy-load the video when near the viewport
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay fallback to poster
          });
        } else {
          video.pause();
        }
      },
      { rootMargin: "30%" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const lines = linesRef.current.filter(
        (el): el is HTMLDivElement => el !== null
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        gsap.set(lines, { opacity: 1, y: 0, scale: 1 });
        if (taglineRef.current) gsap.set(taglineRef.current, { opacity: 1, y: 0 });
        return;
      }

      ScrollTrigger.matchMedia({
        // DESKTOP & TABLET: Innovative pinned kinetic typography & optical portal
        "(min-width: 768px)": () => {
          const pinDuration = window.innerHeight * 1.35;

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => "+=" + pinDuration,
              pin: true,
              anticipatePin: 1,
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                if (progressFillRef.current) {
                  gsap.set(progressFillRef.current, { scaleX: self.progress });
                }
              },
            },
          });

          // Set initial rest state before pin engages
          gsap.set(lines[0], { xPercent: -10, opacity: 0.18, letterSpacing: "0.04em" });
          gsap.set(lines[1], { scale: 0.85, opacity: 0.18, transformOrigin: "center center" });
          gsap.set(lines[2], { xPercent: 10, opacity: 0.18, letterSpacing: "0.04em" });
          if (videoRef.current) {
            gsap.set(videoRef.current, { scale: 1.15, opacity: 0.2 });
          }
          if (taglineRef.current) {
            gsap.set(taglineRef.current, { opacity: 0, y: 20, letterSpacing: "0.25em" });
          }

          // PHASE 1: KINETIC GATHERING & PRECISION LOCKUP (0.00 -> 0.35)
          tl.to(
            lines[0],
            {
              xPercent: 0,
              opacity: 1,
              letterSpacing: "-0.01em",
              ease: "power2.out",
              duration: 0.35,
            },
            0
          );
          tl.to(
            lines[1],
            {
              scale: 1.0,
              opacity: 1,
              ease: "power2.out",
              duration: 0.35,
            },
            0
          );
          tl.to(
            lines[2],
            {
              xPercent: 0,
              opacity: 1,
              letterSpacing: "-0.01em",
              ease: "power2.out",
              duration: 0.35,
            },
            0
          );
          if (videoRef.current) {
            tl.to(
              videoRef.current,
              {
                scale: 1.04,
                opacity: 0.35,
                ease: "power1.out",
                duration: 0.35,
              },
              0
            );
          }

          // PHASE 2: GOLDEN LOCKUP & READING BREATH (0.35 -> 0.65)
          if (taglineRef.current) {
            tl.to(
              taglineRef.current,
              {
                opacity: 1,
                y: 0,
                letterSpacing: "0.35em",
                ease: "power2.out",
                duration: 0.2,
              },
              0.35
            );
          }
          if (linesWrapRef.current) {
            tl.to(
              linesWrapRef.current,
              {
                scale: 1.03,
                ease: "none",
                duration: 0.3,
              },
              0.35
            );
          }

          // PHASE 3: OPTICAL APERTURE PORTAL INTO CAPABILITIES (0.65 -> 1.00)
          tl.to(
            lines[0],
            {
              yPercent: -30,
              opacity: 0.2,
              letterSpacing: "0.06em",
              ease: "power2.in",
              duration: 0.35,
            },
            0.65
          );
          tl.to(
            lines[2],
            {
              yPercent: 30,
              opacity: 0.2,
              letterSpacing: "0.06em",
              ease: "power2.in",
              duration: 0.35,
            },
            0.65
          );
          tl.to(
            lines[1],
            {
              scale: 1.4,
              opacity: 0.08,
              letterSpacing: "0.12em",
              ease: "power2.in",
              duration: 0.35,
            },
            0.65
          );
          if (taglineRef.current) {
            tl.to(
              taglineRef.current,
              {
                opacity: 0,
                y: -14,
                ease: "power2.in",
                duration: 0.2,
              },
              0.65
            );
          }
          if (videoRef.current) {
            tl.to(
              videoRef.current,
              {
                scale: 1.0,
                opacity: 0.12,
                ease: "power1.in",
                duration: 0.35,
              },
              0.65
            );
          }

          return () => {
            tl.scrollTrigger?.kill();
            tl.kill();
          };
        },

        // MOBILE: Scrubbed kinetic parallax (no lock-pin for natural thumb gesture)
        "(max-width: 767px)": () => {
          const mobileTl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              end: "bottom 20%",
              scrub: true,
            },
          });

          mobileTl
            .fromTo(
              lines[0],
              { opacity: 0.2, xPercent: -8 },
              { opacity: 1, xPercent: 0, ease: "none", duration: 0.3 }
            )
            .fromTo(
              lines[1],
              { opacity: 0.2, scale: 0.88 },
              { opacity: 1, scale: 1, ease: "none", duration: 0.3 },
              0.1
            )
            .fromTo(
              lines[2],
              { opacity: 0.2, xPercent: 8 },
              { opacity: 1, xPercent: 0, ease: "none", duration: 0.3 },
              0.2
            );

          if (taglineRef.current) {
            mobileTl.fromTo(
              taglineRef.current,
              { opacity: 0, y: 14 },
              { opacity: 1, y: 0, ease: "none", duration: 0.2 },
              0.3
            );
          }

          return () => {
            mobileTl.scrollTrigger?.kill();
            mobileTl.kill();
          };
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ideas-wearable"
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-ink"
    >
      {/* Background Video with smooth cinematic grade */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-25 will-change-transform"
        src="/videos/ideas-wearable.mp4"
        poster="/images/ideas-wearable-bg.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />

      {/* Multi-layer scrim for optimal contrast and vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/65 to-ink/75" />
      <div className="absolute inset-0 bg-radial-[circle_at_center] from-transparent via-ink/30 to-ink/80" />

      {/* The per-letter lines below are aria-hidden (a screen reader would
          otherwise spell them out), so the phrase is given once here. */}
      <h2 className="sr-only">We make ideas wearable.</h2>

      {/* Main Kinetic Typography Block */}
      <div
        ref={linesWrapRef}
        className="relative z-10 flex w-full flex-col items-center justify-center px-4 text-center sm:px-6 will-change-transform"
      >
        {LINES.map((chars, lineIdx) => (
          <div
            key={lineIdx}
            ref={(el) => {
              linesRef.current[lineIdx] = el;
            }}
            className="flex items-center justify-center leading-none will-change-transform select-none"
            style={{
              fontSize: "clamp(3.75rem, 17vw, 16.5rem)",
              fontFamily: "var(--font-bebas-neue)",
              lineHeight: 0.92,
            }}
            aria-hidden="true"
          >
            {chars.map((c, charIdx) =>
              c.char === " " ? (
                <span key={charIdx} style={{ width: "0.22em" }} />
              ) : (
                <span
                  key={charIdx}
                  style={{
                    color: c.color,
                    display: "inline-block",
                    textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                    transition: "transform 0.25s ease",
                  }}
                  className="hover:scale-105"
                >
                  {c.char}
                </span>
              )
            )}
          </div>
        ))}

        {/* Elegant Gold Tagline */}
        <p
          ref={taglineRef}
          className="mt-8 font-body text-xs font-bold uppercase tracking-[0.35em] text-cream/75 will-change-transform md:mt-10 md:text-sm"
        >
          NAXIS Australia — Delivering Excellence Through Experience
        </p>
      </div>

      {/* Ambient Micro-Progress Line (Desktop only) */}
      <div className="absolute bottom-6 left-1/2 hidden h-[2px] w-32 -translate-x-1/2 overflow-hidden rounded-full bg-cream/10 md:block">
        <div
          ref={progressFillRef}
          className="h-full w-full origin-left bg-gold/60 will-change-transform"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </section>
  );
}
