"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { NETWORK_MAP } from "@/content/networkMap";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The logistics journey from the client's company profile (page 5) —
// what happens between each origin and the destination.
const JOURNEY = [
  "Shipping documentation",
  "Freight coordination",
  "Customs clearance",
  "Doorstep delivery",
];

const { width: W, height: H, origins, destination } = NETWORK_MAP;

// India sits just left of Bangladesh, so its label goes on the left side
// of its marker to keep the two from colliding.
const LABEL_LEFT = new Set(["India"]);

// A gentle arc from each origin down to Australia: a quadratic curve whose
// control point sits off the midpoint, perpendicular to the chord, so every
// route bows the same way.
const arcPath = (x: number, y: number) => {
  const mx = (x + destination.x) / 2;
  const my = (y + destination.y) / 2;
  const dx = destination.x - x;
  const dy = destination.y - y;
  const bend = 0.22;
  const cx = mx + dy * bend;
  const cy = my - dx * bend;
  return `M ${x} ${y} Q ${cx} ${cy} ${destination.x} ${destination.y}`;
};

export default function GlobalNetwork() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const arcRefs = useRef<Array<SVGPathElement | null>>([]);
  const travelerRefs = useRef<Array<SVGCircleElement | null>>([]);
  const originRefs = useRef<Array<SVGGElement | null>>([]);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const destRef = useRef<SVGGElement>(null);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const dest = destRef.current;
    if (!section || !stage || !dest) return;

    const compact = <T,>(list: Array<T | null>) =>
      list.filter((el): el is T => el !== null);
    const reveals = compact(revealRefs.current);
    const arcs = compact(arcRefs.current);
    const travelers = compact(travelerRefs.current);
    const originDots = compact(originRefs.current);
    const labels = compact(labelRefs.current);
    const steps = compact(stepRefs.current);

    let mm: gsap.MatchMedia | null = null;
    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Draw-on setup: each route hidden behind a dash offset of its own
      // full length.
      const lengths = arcs.map((arc) => arc.getTotalLength());
      arcs.forEach((arc, i) => {
        arc.style.strokeDasharray = `${lengths[i]}`;
        arc.style.strokeDashoffset = `${lengths[i]}`;
      });

      if (reduceMotion) {
        gsap.set(reveals, { opacity: 1, y: 0 });
        arcs.forEach((arc) => (arc.style.strokeDashoffset = "0"));
        gsap.set([...originDots, dest], { opacity: 1, scale: 1 });
        gsap.set([...labels, ...steps], { opacity: 1 });
        gsap.set(travelers, { opacity: 0 });
        return;
      }

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

      gsap.set([...originDots, dest], {
        opacity: 0,
        scale: 0.3,
        transformOrigin: "50% 50%",
      });
      // Opacity only — the labels are positioned with CSS translate, which
      // a GSAP x/y tween would overwrite.
      gsap.set(labels, { opacity: 0 });
      gsap.set(steps, { opacity: 0.25 });
      gsap.set(travelers, { opacity: 0 });

      // One timeline, scrubbed to scroll: the six countries light up,
      // their routes draw toward Australia with a traveller riding each
      // line, Australia arrives, then the logistics steps tick through.
      // Desktop pins the map so the whole journey plays in place; phones
      // scrub it over the section's natural scroll instead.
      const build = (pin: boolean) => {
        const progress = { t: 0 };
        const tl = gsap.timeline({
          scrollTrigger: pin
            ? {
                trigger: section,
                start: "top top",
                end: () => "+=" + window.innerHeight * 1.1,
                pin: true,
                scrub: 0.8,
                invalidateOnRefresh: true,
              }
            : {
                trigger: stage,
                start: "top 80%",
                end: "bottom 45%",
                scrub: 0.8,
              },
        });

        tl.to(originDots, {
          opacity: 1,
          scale: 1,
          ease: "back.out(2)",
          stagger: 0.06,
          duration: 0.2,
        }, 0);
        tl.to(labels, { opacity: 1, stagger: 0.06, duration: 0.2 }, 0.05);

        tl.to(progress, {
          t: 1,
          ease: "none",
          duration: 1,
          onUpdate: () => {
            arcs.forEach((arc, i) => {
              // Staggered starts so the routes don't all move as one.
              const local = gsap.utils.clamp(0, 1, progress.t * 1.35 - i * 0.07);
              arc.style.strokeDashoffset = `${lengths[i] * (1 - local)}`;
              const traveler = travelers[i];
              if (!traveler) return;
              const point = arc.getPointAtLength(lengths[i] * local);
              traveler.setAttribute("cx", `${point.x}`);
              traveler.setAttribute("cy", `${point.y}`);
              traveler.style.opacity = local > 0 && local < 1 ? "1" : "0";
            });
          },
        }, 0.3);

        tl.to(dest, { opacity: 1, scale: 1, ease: "back.out(2)", duration: 0.25 }, 1.05);
        steps.forEach((step, i) => {
          tl.to(step, { opacity: 1, duration: 0.12 }, 1.1 + i * 0.12);
        });
        return tl;
      };

      mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        build(true);
      });
      mm.add("(max-width: 1023px)", () => {
        build(false);
      });
    }, section);

    return () => {
      mm?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="global-network"
      className="relative w-full overflow-hidden bg-cream px-6 py-20 sm:px-10 md:px-16 md:py-24 lg:flex lg:h-screen lg:min-h-[640px] lg:flex-col lg:justify-center lg:px-20 lg:py-16"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:items-center lg:gap-14">
        {/* Copy column */}
        <div>
          <p
            ref={(el) => {
              revealRefs.current[0] = el;
            }}
            className="mb-5 font-body text-xs font-bold uppercase tracking-[0.35em] text-brown opacity-0 md:text-sm"
          >
            Global Network
          </p>
          <h2
            ref={(el) => {
              revealRefs.current[1] = el;
            }}
            className="mb-6 font-headline uppercase leading-[1.02] tracking-[-0.01em] text-[clamp(2.25rem,5.5vw,4.5rem)] text-ink opacity-0"
          >
            Six countries. <br className="hidden sm:block" />
            One journey to your door.
          </h2>
          <p
            ref={(el) => {
              revealRefs.current[2] = el;
            }}
            className="mb-8 max-w-md font-body text-sm leading-relaxed text-ink/70 opacity-0 md:text-base"
          >
            We manage the journey from factory to your doorstep — evaluating
            the shipping options for each order to find the right balance of
            cost, transit time and reliability.
          </p>

          <ol className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-ink/10 pt-6">
            {JOURNEY.map((step, i) => (
              <li
                key={step}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 font-body text-xs font-bold tabular-nums text-emerald">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-body text-sm font-semibold text-ink md:text-[0.95rem]">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Map column */}
        <div
          ref={stageRef}
          className="relative w-full"
          style={{ aspectRatio: `${W} / ${H}` }}
        >
          <Image
            src="/images/network-map.svg"
            alt="Map of the NAXIS network: Italy, India, Sri Lanka, Bangladesh, China and Vietnam, connected to Australia"
            fill
            unoptimized
            className="select-none"
          />

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="route-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-gold)" />
                <stop offset="100%" stopColor="var(--color-emerald)" />
              </linearGradient>
            </defs>

            {origins.map((origin, i) => (
              <path
                key={origin.name}
                ref={(el) => {
                  arcRefs.current[i] = el;
                }}
                d={arcPath(origin.x, origin.y)}
                fill="none"
                stroke="url(#route-gradient)"
                strokeWidth={2.2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {origins.map((origin, i) => (
              <circle
                key={`traveler-${origin.name}`}
                ref={(el) => {
                  travelerRefs.current[i] = el;
                }}
                cx={origin.x}
                cy={origin.y}
                r={5}
                fill="var(--color-emerald)"
                opacity={0}
              />
            ))}

            {origins.map((origin, i) => (
              <g
                key={`dot-${origin.name}`}
                ref={(el) => {
                  originRefs.current[i] = el;
                }}
              >
                <circle cx={origin.x} cy={origin.y} r={13} fill="var(--color-gold)" fillOpacity={0.22} />
                <circle cx={origin.x} cy={origin.y} r={6} fill="var(--color-gold)" stroke="var(--color-ink)" strokeWidth={1.5} />
              </g>
            ))}

            <g ref={destRef}>
              <circle cx={destination.x} cy={destination.y} r={24} fill="var(--color-emerald)" fillOpacity={0.15} className="network-pulse" />
              <circle cx={destination.x} cy={destination.y} r={10} fill="var(--color-emerald)" stroke="var(--color-cream)" strokeWidth={3} />
            </g>
          </svg>

          {/* Labels as HTML, positioned in % of the same viewBox, so they
              stay crisp and readable at any size instead of shrinking with
              the SVG. */}
          {origins.map((origin, i) => (
            <span
              key={`label-${origin.name}`}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              className={`pointer-events-none absolute -translate-y-1/2 whitespace-nowrap font-body text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink sm:text-xs ${
                LABEL_LEFT.has(origin.name)
                  ? "-translate-x-full pr-3 sm:pr-4"
                  : "pl-3 sm:pl-4"
              }`}
              style={{ left: `${(origin.x / W) * 100}%`, top: `${(origin.y / H) * 100}%` }}
            >
              {origin.name}
            </span>
          ))}
          <span
            className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap pt-6 font-headline text-lg uppercase tracking-[0.04em] text-emerald sm:pt-8 sm:text-2xl"
            style={{ left: `${(destination.x / W) * 100}%`, top: `${(destination.y / H) * 100}%` }}
          >
            Australia
          </span>
        </div>
      </div>
    </section>
  );
}
