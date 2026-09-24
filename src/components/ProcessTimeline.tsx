"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { GOLD } from "@/lib/brand";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// 7-step manufacturing process from the NAXIS Australia PDF.
// Confirmed count: Design → Pattern Making → Sampling → Sourcing
//                  → Sewing → Quality Control → Order Shipment
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
      "Production is managed through certified partner factories operating to strict quality and ethical standards. Every line, every stitch — supervised and on-spec.",
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

      // Pin the full section on desktop/tablet so header & wayfinding remain beautifully framed
      ScrollTrigger.matchMedia({
        "(min-width: 768px)": () => {
          gsap.set(galleryWrap, { overflow: "visible" });
          gsap.set(track, { overflow: "visible" });

          const getMaxScroll = () =>
            Math.max(0, track.scrollWidth - galleryWrap.clientWidth);

          const maxScroll = getMaxScroll();
          // Dwell buffer so Card 07 and the Transition card are easily read before unpinning
          const dwell = Math.min(window.innerHeight * 0.45, 420);
          const totalDistance = maxScroll + dwell;
          const tickCount = STEPS.length;

          // First tick active at rest
          if (ticks[0]) {
            gsap.set(ticks[0], { backgroundColor: GOLD, scaleY: 1.8 });
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => "+=" + totalDistance,
              pin: true,
              anticipatePin: 1,
              scrub: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const scrollFraction = maxScroll / (totalDistance || 1);
                const progressOnTrack = Math.min(1, self.progress / scrollFraction);

                const activeIndex = Math.min(
                  tickCount - 1,
                  Math.floor(progressOnTrack * tickCount)
                );

                ticks.forEach((tick, i) => {
                  const isActive = i === activeIndex;
                  gsap.set(tick, {
                    backgroundColor: isActive ? GOLD : "rgba(16, 13, 9, 0.2)",
                    scaleY: isActive ? 1.8 : 1,
                  });
                });

                if (stepLabelRef.current) {
                  if (progressOnTrack >= 0.95) {
                    stepLabelRef.current.textContent = "7 Stages Complete · Next: Global Network";
                  } else {
                    stepLabelRef.current.textContent = `Stage ${STEPS[activeIndex].number} / 07 — ${STEPS[activeIndex].label}`;
                  }
                }

                if (statusHintRef.current) {
                  if (progressOnTrack >= 0.95) {
                    statusHintRef.current.textContent = "Scroll into Global Network ↓";
                  } else {
                    statusHintRef.current.textContent = "Scroll to explore stages →";
                  }
                }
              },
            },
          });

          // Horizontal translation of track
          tl.to(track, {
            x: () => -getMaxScroll(),
            ease: "none",
            duration: maxScroll,
          });

          // Dwell buffer
          tl.to({}, { duration: dwell });

          // Horizontal parallax on card photos
          cardImgInners.forEach((inner) => {
            gsap.fromTo(
              inner,
              { xPercent: -7 },
              {
                xPercent: 7,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top top",
                  end: () => "+=" + maxScroll,
                  scrub: true,
                },
              }
            );
          });

          return () => {
            tl.scrollTrigger?.kill();
            tl.kill();
          };
        },
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
            Seven precision stages. One seamless supply chain.
          </p>
        </div>
      </div>

      {/* Horizontal Gallery Track */}
      <div ref={galleryWrapRef} className="relative z-10 my-auto w-full overflow-visible">
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
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
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
                      <span className="font-body text-xs font-bold text-gold">
                        {step.number}
                      </span>
                      <div className="h-px flex-1 bg-ink/10" />
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

          {/* Transition Card into Global Network */}
          <div className="flex w-[280px] shrink-0 snap-center flex-col sm:w-[320px] md:w-[350px] lg:w-[370px]">
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ink/15 bg-ink p-6 text-cream shadow-md md:p-7">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-body text-xs font-bold text-gold">
                    NEXT CHAPTER
                  </span>
                  <div className="h-px flex-1 bg-cream/20" />
                </div>
                <h3 className="font-headline text-2xl uppercase tracking-[-0.01em] text-cream md:text-3xl">
                  Global Network
                </h3>
                <p className="font-body text-xs leading-relaxed text-cream/75 sm:text-sm md:text-base">
                  From design room to international dispatch — explore the 6 specialized manufacturing hubs powering our 7-stage process.
                </p>
              </div>

              <a
                href="#global-network"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("global-network")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group mt-6 flex items-center justify-between rounded-xl border border-cream/20 bg-cream/10 px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-cream transition-all hover:border-gold hover:bg-gold hover:text-ink md:text-sm"
              >
                <span>Explore Facilities</span>
                <span className="text-base text-gold transition-transform duration-200 group-hover:translate-x-1">
                  ↓
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
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                ref={(el) => {
                  tickRefs.current[i] = el;
                }}
                className="h-3 w-[3px] shrink-0 rounded-full bg-ink/20 transition-all duration-300"
              />
            ))}
          </div>
          <span
            ref={stepLabelRef}
            className="font-body text-xs font-semibold uppercase tracking-wider text-brown"
          >
            Stage 01 / 07 — Design
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
