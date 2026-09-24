"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { EMERALD, GOLD } from "@/lib/brand";
import { createPinnedGallery } from "@/lib/pinnedGallery";
import TickRail from "@/components/TickRail";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The manufacturing process from the NAXIS Australia PDF (page 1):
// Design → Pattern Making → Sampling → Sourcing → Sewing
// → Quality Control → Order Shipment → Your Success.
// The first seven are photo cards; "Your Success" is the closing card
// below the list (SUCCESS_STEP), as in the client's own diagram.
const STEPS = [
  {
    number: "01",
    label: "Design",
    description:
      "Our design team works closely with your brand to translate ideas into technical specifications — tech packs, CADs, fabric recommendations and construction details.",
    image: "/images/about-design.jpg",
    imageAlt: "Design and technical pack development",
  },
  {
    number: "02",
    label: "Pattern Making",
    description:
      "Precision pattern drafting transforms designs into production-ready templates. Every seam, measurement and tolerance is engineered for consistency at scale.",
    image: "/images/process-pattern-making.jpg",
    imageAlt: "Pattern making and grading",
  },
  {
    number: "03",
    label: "Sampling",
    description:
      "Pre-production samples are crafted and sent for approval before mass production begins — ensuring fit, finish and fabric performance match the specification exactly.",
    image: "/images/process-sampling.jpg",
    imageAlt: "Garment sampling and approval",
  },
  {
    number: "04",
    label: "Sourcing",
    description:
      "Leveraging our global supplier network, we source the right fabrics, trims and accessories — balancing quality, lead time and cost to meet your program requirements.",
    image: "/images/about-fabric.jpg",
    imageAlt: "Fabric and trim sourcing",
  },
  {
    number: "05",
    label: "Sewing",
    description:
      "Production runs through our own facilities and specialist partner factories, operating to strict quality and ethical standards. Every line, every stitch — supervised and on-spec.",
    image: "/images/process-sewing.jpg",
    imageAlt: "Garment sewing and production",
  },
  {
    number: "06",
    label: "Quality Control",
    description:
      "Multi-point quality audits are conducted throughout production and at final inspection — ensuring every unit leaving the factory meets your exact brief.",
    image: "/images/process-qc.jpg",
    imageAlt: "Quality control and inspection",
  },
  {
    number: "07",
    label: "Order Shipment",
    description:
      "End-to-end logistics management — from factory floor to your warehouse. We coordinate freight, customs documentation and final delivery to your door.",
    image: "/images/process-shipment.jpg",
    imageAlt: "Packing and order shipment",
  },
];

const SUCCESS_STEP = { number: "08", label: "Your Success" };
const TOTAL_STEPS = STEPS.length + 1;

export default function ProcessTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const galleryWrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const tickRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const cardImgRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardImgInnerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const stepLabelRef = useRef<HTMLSpanElement>(null);
  const statusHintRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const galleryWrap = galleryWrapRef.current;
    const track = trackRef.current;
    if (!section || !galleryWrap || !track) return;

    const ctx = gsap.context(() => {
      const reveals = revealRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      const ticks = tickRefs.current.filter(
        (el): el is HTMLSpanElement => el !== null
      );
      const cardImgs = cardImgRefs.current.filter(
        (el): el is HTMLDivElement => el !== null
      );
      const cardImgInners = cardImgInnerRefs.current.filter(
        (el): el is HTMLDivElement => el !== null
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        gsap.set(reveals, { opacity: 1, y: 0 });
        gsap.set(cardImgs, { clipPath: "inset(0% 0 0 0)" });
        if (ticks[0]) gsap.set(ticks[0], { backgroundColor: GOLD, scaleY: 1.8 });
        return;
      }

      // Header block stagger reveal
      gsap.fromTo(
        reveals,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
        }
      );

      // Curtain reveal on each card photo
      cardImgs.forEach((wrap, i) => {
        gsap.fromTo(
          wrap,
          { clipPath: "inset(100% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            ease: "power3.out",
            duration: 1.1,
            delay: i * 0.04,
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              once: true,
            },
          }
        );
      });

      // Pin the full section on desktop/tablet so header & wayfinding
      // remain framed while the strip scrolls
      ScrollTrigger.matchMedia({
        "(min-width: 768px)": () =>
          createPinnedGallery({
            pin: section,
            viewport: galleryWrap,
            track,
            ticks,
            tickIdle: "rgba(16, 13, 9, 0.2)",
            tickDone: EMERALD,
            // Dwell so Card 07 and the transition card are easily read
            // before unpinning
            dwell: () => Math.min(window.innerHeight * 0.45, 420),
            parallax: cardImgInners,
            parallaxRange: 7,
            onUpdate: (activeIndex, trackProgress) => {
              const step =
                activeIndex < STEPS.length ? STEPS[activeIndex] : SUCCESS_STEP;
              if (stepLabelRef.current) {
                stepLabelRef.current.textContent = `Stage ${step.number} / 08 — ${step.label}`;
              }
              if (statusHintRef.current) {
                statusHintRef.current.textContent =
                  trackProgress >= 0.95
                    ? "Keep scrolling ↓"
                    : "Scroll to explore stages →";
              }
            },
          }),
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="process"
      className="relative w-full overflow-hidden bg-cream px-6 py-16 sm:px-10 md:flex md:h-screen md:min-h-[680px] md:max-h-[1050px] md:flex-col md:justify-between md:px-16 md:pb-8 md:pt-24 lg:px-20"
    >
      {/* Header — Stays in view when pinned on desktop */}
      <div className="relative z-10 mb-6 shrink-0 md:mb-4">
        <p
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="mb-2 font-body text-xs font-bold uppercase tracking-[0.35em] text-brown opacity-0 md:mb-3 md:text-sm"
        >
          How We Work
        </p>

        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <h2
            ref={(el) => {
              revealRefs.current[1] = el;
            }}
            className="max-w-2xl font-headline uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2rem,5vw,4.25rem)] text-ink opacity-0"
          >
            From sketch to shipment.
          </h2>
          <p
            ref={(el) => {
              revealRefs.current[2] = el;
            }}
            className="max-w-md font-body text-sm text-ink/65 opacity-0 md:text-right md:text-base"
          >
            Every stage managed. One seamless supply chain.
          </p>
        </div>
      </div>

      {/* Horizontal Gallery Track */}
      <div
        ref={galleryWrapRef}
        data-cursor="Scroll"
        className="relative z-10 my-auto w-full overflow-visible"
      >
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto pb-4 will-change-transform [-ms-overflow-style:none] [scrollbar-width:none] md:gap-6 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
          style={{ width: "max-content" }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className="flex w-[280px] shrink-0 snap-center flex-col sm:w-[320px] md:w-[350px] lg:w-[370px]"
            >
              {/* Card */}
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                <span
                  aria-hidden="true"
                  className="bg-gradient-brand-deep absolute inset-x-0 bottom-0 z-10 h-[3px] origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                />
                {/* Image */}
                <div
                  ref={(el) => {
                    cardImgRefs.current[i] = el;
                  }}
                  className="relative aspect-[16/10] overflow-hidden bg-ink/5"
                  style={{ clipPath: "inset(100% 0 0 0)" }}
                >
                  <div
                    ref={(el) => {
                      cardImgInnerRefs.current[i] = el;
                    }}
                    className="absolute inset-[-15%]"
                  >
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 370px, (min-width: 768px) 350px, 280px"
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      {/* Brown, not gold: gold on the white card was ~1.5:1. */}
                      <span className="font-body text-xs font-bold text-brown">
                        {step.number}
                      </span>
                      {/* Gold dashed arrow, as in the client's diagram */}
                      <svg
                        viewBox="0 0 100 10"
                        preserveAspectRatio="none"
                        className="h-2.5 flex-1"
                        aria-hidden="true"
                      >
                        <line
                          x1="0"
                          y1="5"
                          x2="94"
                          y2="5"
                          stroke="var(--color-gold)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          vectorEffect="non-scaling-stroke"
                        />
                        <path
                          d="M92 1 L 99 5 L 92 9"
                          fill="none"
                          stroke="var(--color-gold)"
                          strokeWidth="1.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                    <h3 className="font-headline text-xl uppercase tracking-[-0.01em] text-ink md:text-2xl">
                      {step.label}
                    </h3>
                  </div>
                  <p className="mt-2.5 font-body text-xs leading-relaxed text-ink/70 sm:text-sm md:text-[0.925rem]">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* 08 — Your Success: the client's own final stage */}
          <div className="flex w-[280px] shrink-0 snap-center flex-col sm:w-[320px] md:w-[350px] lg:w-[370px]">
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-ink p-6 text-cream shadow-md md:p-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald/30 blur-3xl"
              />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-body text-xs font-bold text-gold">
                    {SUCCESS_STEP.number}
                  </span>
                  <span className="bg-gradient-brand h-px flex-1 opacity-50" />
                </div>
                {/* Flag, echoing the finish marker in the client's diagram */}
                <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden="true">
                  <circle cx="24" cy="24" r="23" fill="none" stroke="var(--color-emerald-bright)" strokeOpacity="0.5" />
                  <path d="M18 36 V 12" stroke="var(--color-cream)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 13 C 24 10, 28 16, 34 13 V 24 C 28 27, 24 21, 18 24 Z" fill="var(--color-emerald-bright)" />
                </svg>
                <h3 className="text-gradient-brand w-fit font-headline text-3xl uppercase tracking-[-0.01em] md:text-4xl">
                  {SUCCESS_STEP.label}
                </h3>
                <p className="font-body text-xs leading-relaxed text-cream/75 sm:text-sm md:text-base">
                  Every stage leads here — a finished product, delivered to
                  your door, ready for your customers.
                </p>
              </div>

              <a
                href="#contact"
                className="group relative mt-6 flex items-center justify-between rounded-xl border border-cream/20 bg-cream/10 px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-cream transition-all hover:border-gold hover:bg-gold hover:text-ink md:text-sm"
              >
                <span>Start your project</span>
                <span className="text-base text-gold transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wayfinding & Transition Cue */}
      <div className="relative z-10 hidden shrink-0 items-center justify-between border-t border-ink/10 pt-4 md:flex">
        {/* Left: Sprocket ticks + Current Stage Indicator */}
        <div className="flex items-center gap-4">
          <TickRail count={TOTAL_STEPS} tickRefs={tickRefs} tone="dark" />
          <span
            ref={stepLabelRef}
            className="font-body text-xs font-semibold uppercase tracking-wider text-brown"
          >
            Stage 01 / 08 — Design
          </span>
        </div>

        {/* Right: Progress Hint */}
        <div className="flex items-center gap-2 font-body text-xs font-medium text-ink/60">
          <span ref={statusHintRef}>Scroll to explore stages →</span>
        </div>
      </div>
    </section>
  );
}
