"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
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

// "A to Z" — the client's mark for the whole journey, in their Giant
// Wheel's own gold, green and brown (giantWheel.ts: the values' gold, the
// bars' green, the motto's brown).
const A_TO_Z = { a: "#b06d21", dash: "#005839", z: "#4e2518" };
// The journey the dash runs through, in the client's words (the second
// paragraph), and what it adds up to.
const STAGES = [
  "Concept",
  "Design",
  "Product development",
  "Sourcing",
  "Manufacturing",
  "Quality assurance",
  "Logistics",
  "Final delivery",
];
const JOURNEY = [...STAGES, "The complete journey"];

export default function AboutNaxis() {
  const sectionRef = useRef<HTMLElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLSpanElement>(null);
  const dashRef = useRef<HTMLSpanElement>(null);
  const zRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const stagesRef = useRef<HTMLSpanElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const lineLeftRef = useRef<HTMLDivElement>(null);
  const lineRightRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const journey = journeyRef.current;
    const a = aRef.current;
    const dash = dashRef.current;
    const z = zRef.current;
    const caption = captionRef.current;
    const stages = stagesRef.current;
    if (!section || !journey || !a || !dash || !z || !caption || !stages) return;
    // One line of the caption, as a share of the whole stack.
    const line = 100 / JOURNEY.length;

    const ctx = gsap.context(() => {
      const reveals = revealRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        gsap.set(reveals, { opacity: 1, y: 0 });
        // The finished mark, the caption on where the journey ends.
        gsap.set(stages, { yPercent: -line * STAGES.length });
        if (lineLeftRef.current) gsap.set(lineLeftRef.current, { scaleX: 1 });
        if (lineRightRef.current) gsap.set(lineRightRef.current, { scaleX: 1 });
        if (taglineRef.current) gsap.set(taglineRef.current, { opacity: 1 });
        return;
      }

      // A to Z, played as the journey: A rises in gold, the green dash
      // draws out from it like a thread while the caption steps through
      // the stages, and Z lands in brown at the end of it. On wide
      // screens the mark holds beside the text (sticky) and this plays
      // across the reading of it — Z arrives about when "from factory
      // floor to your door" does; stacked, it plays as the mark scrolls
      // through.
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const rise = { yPercent: 0, rotationX: 0, duration: 0.1, ease: "power3.out" };
      const sunk = { yPercent: 108, rotationX: -70, transformPerspective: 600, transformOrigin: "50% 100%" };
      const play = gsap.timeline({
        scrollTrigger: {
          trigger: wide ? section : journey,
          start: wide ? "top 55%" : "top 85%",
          end: wide ? "bottom 80%" : "bottom 30%",
          scrub: 1,
        },
      });
      play
        .fromTo(a, sunk, rise, 0)
        .fromTo(caption, { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.06)
        .fromTo(dash, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.68, ease: "none" }, 0.1)
        .fromTo(z, sunk, { ...rise, ease: "back.out(1.8)" }, 0.8);
      // A stage per stretch of the dash, each rolling in like an odometer.
      STAGES.slice(1).forEach((_, i) => {
        play.to(stages, { yPercent: -line * (i + 1), duration: 0.035, ease: "power2.inOut" }, 0.1 + (0.68 * (i + 1)) / STAGES.length);
      });
      play.to(stages, { yPercent: -line * STAGES.length, duration: 0.05, ease: "power2.inOut" }, 0.92);

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

        {/* Two columns: the A–Z mark left (the client's call, in place of
            a photo), text right */}
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16 xl:gap-24">
          <div
            ref={journeyRef}
            aria-hidden="true"
            className="flex w-full flex-shrink-0 flex-col items-center py-4 lg:sticky lg:top-[30vh] lg:w-[38%] lg:py-0"
          >
            <div
              className="flex items-center font-mark text-[clamp(6.5rem,30vw,10rem)] font-black leading-none lg:text-[clamp(6rem,13vw,13rem)]"
              style={{ textShadow: "0 0.04em 0.08em rgba(74,42,28,0.18)" }}
            >
              {/* Each letter rises out of its own slot. */}
              <span className="block overflow-hidden px-[0.03em] pb-[0.02em]">
                <span ref={aRef} className="block" style={{ color: A_TO_Z.a }}>
                  A
                </span>
              </span>
              <span
                ref={dashRef}
                className="mx-[0.1em] block h-[0.13em] w-[0.5em] shadow-[0_0.04em_0.08em_rgba(74,42,28,0.18)]"
                style={{ background: A_TO_Z.dash }}
              />
              <span className="block overflow-hidden px-[0.03em] pb-[0.02em]">
                <span ref={zRef} className="block" style={{ color: A_TO_Z.z }}>
                  Z
                </span>
              </span>
            </div>
            {/* The stage the dash has reached, rolling on as it draws. */}
            <div
              ref={captionRef}
              className="mt-5 h-[1.8em] overflow-hidden font-body text-[0.7rem] font-semibold uppercase tracking-[0.3em] md:mt-7 md:text-xs lg:text-sm"
            >
              <span ref={stagesRef} className="block">
                {JOURNEY.map((stage, i) => (
                  <span key={stage} className="flex h-[1.8em] items-center justify-center gap-3 whitespace-nowrap">
                    {i < STAGES.length && <span style={{ color: A_TO_Z.a }}>{String(i + 1).padStart(2, "0")}</span>}
                    <span className={i < STAGES.length ? "text-ink/65" : "text-brown"}>{stage}</span>
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* Text column */}
          <div className="flex flex-col justify-center lg:pt-4">
            {/* Headline */}
            <h2
              ref={(el) => {
                revealRefs.current[1] = el;
              }}
              className="mb-10 font-serif font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2.1rem,4.6vw,3.75rem)] text-brown opacity-0"
            >
              We take responsibility for the entire journey.
            </h2>

            {/* Paragraphs */}
            <div className="flex flex-col gap-6">
              {PARAGRAPHS.map((para, i) => (
                <p
                  key={i}
                  ref={(el) => {
                    revealRefs.current[2 + i] = el;
                  }}
                  className="font-serif text-base leading-relaxed text-ink/80 opacity-0 md:text-lg md:leading-relaxed"
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Tagline with expanding gold rules */}
            <div className="mt-12 flex items-center gap-5">
              <div
                ref={lineLeftRef}
                className="h-px flex-1 bg-gradient-to-r from-emerald to-gold"
                style={{ transform: "scaleX(0)", transformOrigin: "left center" }}
              />
              <p
                ref={taglineRef}
                className="text-center font-serif text-base font-semibold text-brown opacity-0 md:text-xl"
              >
                From Concept to Creation. Factory to You.
              </p>
              <div
                ref={lineRightRef}
                className="h-px flex-1 bg-gradient-to-r from-gold to-emerald"
                style={{ transform: "scaleX(0)", transformOrigin: "right center" }}
              />
            </div>

            {/* The client's sign-off lockup, as on their artboards */}
            <div
              ref={(el) => {
                revealRefs.current[2 + PARAGRAPHS.length] = el;
              }}
              className="mt-8 text-center opacity-0"
            >
              <p className="font-body text-lg font-semibold uppercase tracking-[0.3em] text-gradient-brand-deep mx-auto w-fit md:text-xl">
                NAXIS Australia
              </p>
              <p className="mt-2 font-body text-[0.65rem] uppercase tracking-[0.3em] text-ink/60 md:text-xs">
                Delivering excellence through experience.
              </p>
              <Link
                href="/about"
                className="group mt-10 inline-flex items-center gap-3 rounded-full border border-ink/20 px-6 py-3 font-body text-xs font-semibold uppercase tracking-[0.15em] text-ink transition-colors hover:border-emerald hover:text-emerald md:text-sm"
              >
                More about NAXIS
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
