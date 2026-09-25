"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { NETWORK_MAP } from "@/content/networkMap";
import { getService } from "@/content/services";
import { useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

const LOGISTICS = getService("logistics")!;
const STAGES = LOGISTICS.stages!;
const { width: W, height: H, origins, destination } = NETWORK_MAP;

// Where the feeder routes meet and the journey proper begins — a point in
// the Indian Ocean, standing for "the shipment", not a real port.
const HUB = { x: 640, y: 380 };

// A gentle arc between two points: a quadratic curve whose control point
// sits off the midpoint, perpendicular to the chord (as on the homepage).
const control = (from: { x: number; y: number }, to: { x: number; y: number }, bend: number) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return { x: (from.x + to.x) / 2 + dy * bend, y: (from.y + to.y) / 2 - dx * bend };
};
const arc = (from: { x: number; y: number }, to: { x: number; y: number }, bend = 0.2) => {
  const c = control(from, to, bend);
  return `M ${from.x} ${from.y} Q ${c.x} ${c.y} ${to.x} ${to.y}`;
};
const ROUTE_CONTROL = control(HUB, destination, 0.25);
const ROUTE = arc(HUB, destination, 0.25);
// Where along the route each stage sits (t on the curve).
const STOPS = [0, 0.38, 0.72, 1];
const pointAt = (t: number) => ({
  x: (1 - t) ** 2 * HUB.x + 2 * (1 - t) * t * ROUTE_CONTROL.x + t ** 2 * destination.x,
  y: (1 - t) ** 2 * HUB.y + 2 * (1 - t) * t * ROUTE_CONTROL.y + t ** 2 * destination.y,
});
// Scroll progress at which each stage is reached (see the timeline).
const REACHED = [0.18, 0.47, 0.66, 0.8];

/**
 * Logistics' signature: "we manage the journey from factory to your
 * doorstep", on the homepage's route map. The section pins; the six
 * countries' routes feed into the shipment, which then travels one route
 * to Australia, passing the client's four stages (documentation, freight,
 * customs, doorstep) as it goes — each lights up in the list beside the
 * map — and the map finally closes in on Australia, where "your door" is
 * pinned. Under reduced motion the whole journey is drawn and every stage
 * is marked.
 */
export default function DoorstepJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const travellerRef = useRef<SVGGElement>(null);
  const stageRefs = useRef<Array<HTMLLIElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const map = mapRef.current;
    const route = routeRef.current;
    const traveller = travellerRef.current;
    if (!section || !map || !route || !traveller) return;
    const q = gsap.utils.selector(section);
    const stages = stageRefs.current.filter((el): el is HTMLLIElement => el !== null);
    const mark = (reached: number) =>
      stages.forEach((stage, i) => {
        stage.dataset.state = i < reached ? "done" : i === reached ? "current" : "todo";
      });

    const mm = gsap.matchMedia();
    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
      (context) => {
        if ((context.conditions as { reduce: boolean }).reduce) {
          gsap.set(traveller, { autoAlpha: 0 });
          gsap.set(q("[data-door]"), { autoAlpha: 1 });
          mark(STAGES.length);
          return;
        }

        const length = route.getTotalLength();
        const ride = { t: 0 };
        const moveTraveller = () => {
          const point = route.getPointAtLength(length * ride.t);
          gsap.set(traveller, { x: point.x, y: point.y });
        };

        gsap.set(q("[data-feeder], [data-route]"), { drawSVG: "0%" });
        gsap.set(q("[data-origin], [data-stop], [data-door]"), { autoAlpha: 0 });
        gsap.set(traveller, { autoAlpha: 0 });
        moveTraveller();
        mark(-1);

        let shown = -2;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + window.innerHeight * 2,
            pin: true,
            scrub: 0.7,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const reached = REACHED.reduce((last, at, i) => (self.progress >= at ? i : last), -1);
              if (reached !== shown) {
                shown = reached;
                mark(reached);
              }
            },
          },
        });

        tl.to(q("[data-origin]"), { autoAlpha: 1, duration: 0.05, stagger: 0.01 }, 0)
          .to(q("[data-feeder]"), { drawSVG: "100%", duration: 0.12, stagger: 0.01 }, 0.04)
          .to(q("[data-stop='0']"), { autoAlpha: 1, duration: 0.03 }, 0.17)
          .to(traveller, { autoAlpha: 1, duration: 0.03 }, 0.18)
          // The shipment travels the route, drawing it behind itself.
          .to(ride, { t: 1, duration: 0.6, onUpdate: moveTraveller }, 0.2)
          .to(q("[data-route]"), { drawSVG: "100%", duration: 0.6 }, 0.2);
        STOPS.slice(1).forEach((stop, i) => {
          tl.to(q(`[data-stop='${i + 1}']`), { autoAlpha: 1, duration: 0.03 }, 0.2 + stop * 0.6 - 0.02);
        });
        // Closing in on Australia: your door.
        tl.to(map, { scale: 2.3, duration: 0.18, ease: "power2.inOut" }, 0.81)
          .to(traveller, { autoAlpha: 0, duration: 0.04 }, 0.86)
          .fromTo(q("[data-door]"), { autoAlpha: 0, y: -18 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: "back.out(2)" }, 0.9);
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="From factory to your doorstep"
      className="relative flex min-h-svh w-full flex-col justify-center overflow-hidden bg-cream px-6 pb-8 pt-24 sm:px-10 md:px-16 lg:h-svh lg:px-20 lg:py-16"
    >
      <p className="mb-3 font-body text-xs font-bold uppercase tracking-[0.35em] text-brown md:text-sm">
        The journey
      </p>
      <h2 className="max-w-3xl font-serif text-[clamp(1.9rem,4.2vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-brown">
        From factory to <span className="text-gradient-brand-deep">your doorstep.</span>
      </h2>

      <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
        {/* The map, which closes in on Australia at the end */}
        <div className="relative overflow-hidden rounded-3xl bg-cream">
          <div
            ref={mapRef}
            className="relative w-full"
            style={{
              aspectRatio: `${W} / ${H}`,
              transformOrigin: `${(destination.x / W) * 100}% ${(destination.y / H) * 100}%`,
            }}
          >
            <Image
              src="/images/network-map.svg"
              alt="Map of the route from NAXIS's six countries to a door in Australia"
              fill
              unoptimized
              className="select-none"
            />
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id="journey-gradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--color-gold)" />
                  <stop offset="100%" stopColor="var(--color-emerald)" />
                </linearGradient>
              </defs>
              {origins.map((origin) => (
                <path
                  key={`feed-${origin.name}`}
                  data-feeder
                  d={arc(origin, HUB, 0.18)}
                  fill="none"
                  stroke="var(--color-gold)"
                  strokeOpacity={0.55}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              ))}
              <path
                ref={routeRef}
                data-route
                d={ROUTE}
                fill="none"
                stroke="url(#journey-gradient)"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
              {origins.map((origin) => (
                <circle key={`o-${origin.name}`} data-origin cx={origin.x} cy={origin.y} r={6} fill="var(--color-gold)" stroke="var(--color-ink)" strokeWidth={1.5} />
              ))}
              {STOPS.map((stop, i) => {
                const p = pointAt(stop);
                return (
                  <g key={stop} data-stop={i}>
                    <circle cx={p.x} cy={p.y} r={15} fill="var(--color-cream)" stroke="var(--color-emerald)" strokeWidth={3} />
                    <text x={p.x} y={p.y + 5.5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--color-emerald)" className="font-body">
                      {String(i + 1).padStart(2, "0")}
                    </text>
                  </g>
                );
              })}
              <g ref={travellerRef}>
                <circle r={13} fill="var(--color-gold)" fillOpacity={0.3} />
                <rect x={-6} y={-6} width={12} height={12} rx={2} fill="var(--color-gold)" stroke="var(--color-ink)" strokeWidth={1.5} />
              </g>
              {/* Your door */}
              {/* Placed by the outer group; the inner one drops in (a GSAP y
                  on the placed group would replace its translate). */}
              <g transform={`translate(${destination.x} ${destination.y - 26})`}>
                <g data-door>
                  <path d="M0 22 C -9 10 -12 5 -12 0 A 12 12 0 1 1 12 0 C 12 5 9 10 0 22 Z" fill="var(--color-emerald)" stroke="var(--color-cream)" strokeWidth={2} />
                  <path d="M-5 2 L0 -3 L5 2 M-3.5 1 V5.5 H3.5 V1" fill="none" stroke="var(--color-cream)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
                </g>
              </g>
            </svg>
            <span
              data-door
              className="pointer-events-none absolute whitespace-nowrap rounded-full bg-emerald px-2 py-0.5 font-body text-[0.45rem] font-bold uppercase tracking-[0.15em] text-cream sm:text-[0.5rem]"
              style={{ left: `${(destination.x / W) * 100 + 1.6}%`, top: `${(destination.y / H) * 100 - 5.5}%` }}
            >
              Your door
            </span>
          </div>
        </div>

        {/* The client's four stages */}
        <ol className="flex flex-col">
          {STAGES.map((stage, i) => (
            <li
              key={stage.label}
              ref={(el) => {
                stageRefs.current[i] = el;
              }}
              data-state="done"
              className="group flex items-start gap-4 border-t border-ink/10 py-3 transition-opacity duration-300 last:border-b data-[state=todo]:opacity-35 md:py-4"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink/20 font-body text-[0.65rem] font-bold tabular-nums text-ink/50 transition-colors duration-300 group-data-[state=current]:border-gold group-data-[state=current]:bg-gold group-data-[state=current]:text-ink group-data-[state=done]:border-emerald group-data-[state=done]:text-emerald">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-headline text-xl uppercase leading-tight tracking-[-0.01em] text-ink md:text-2xl">
                  {stage.label}
                </span>
                <span className="block font-body text-xs text-ink/60 md:text-sm">{stage.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
