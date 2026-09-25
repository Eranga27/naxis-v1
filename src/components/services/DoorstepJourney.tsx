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
// Home is Australia; the shipment leaves from it (as on the homepage
// globe) for the six countries.
const { width: W, height: H, origins: PLACES, destination: HOME } = NETWORK_MAP;

// Where the main route ends and fans out to each country — a point in the
// Indian Ocean, standing for "the shipment", not a real port.
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
const ROUTE_BEND = -0.25;
const ROUTE_CONTROL = control(HOME, HUB, ROUTE_BEND);
const ROUTE = arc(HOME, HUB, ROUTE_BEND);
// Where along the route the first three stages sit (t on the curve):
// documents at home, freight under way, customs where it fans out. The
// fourth, the doorstep, is at each country.
const STOPS = [0, 0.5, 1];
const pointAt = (t: number) => ({
  x: (1 - t) ** 2 * HOME.x + 2 * (1 - t) * t * ROUTE_CONTROL.x + t ** 2 * HUB.x,
  y: (1 - t) ** 2 * HOME.y + 2 * (1 - t) * t * ROUTE_CONTROL.y + t ** 2 * HUB.y,
});

// The timeline, in scroll progress: the ride out to the hub, then the
// routes fanning out to each country.
const RIDE = { start: 0.08, length: 0.46 };
const FAN = { start: 0.56, length: 0.2, stagger: 0.025 };
// Progress at which each stage is reached.
const REACHED = [0.05, RIDE.start + RIDE.length * STOPS[1], RIDE.start + RIDE.length, 0.8];

/**
 * Logistics' signature: "we manage the journey from factory to your
 * doorstep", on the homepage's route map, running out from Australia as
 * the homepage globe does. The section pins; the shipment leaves NAXIS
 * Australia with its documents, travels out past freight and customs,
 * and fans out to each of the six countries, where a door pin lands —
 * the client's four stages lighting in the list beside the map as it
 * goes. Under reduced motion the whole journey is drawn and every stage
 * is marked.
 */
export default function DoorstepJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const travellerRef = useRef<SVGGElement>(null);
  const stageRefs = useRef<Array<HTMLLIElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const route = routeRef.current;
    const traveller = travellerRef.current;
    if (!section || !route || !traveller) return;
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
          gsap.set(q("[data-parcel]"), { autoAlpha: 0 });
          mark(STAGES.length);
          return;
        }

        const length = route.getTotalLength();
        const ride = { t: 0 };
        const moveTraveller = () => {
          const point = route.getPointAtLength(length * ride.t);
          gsap.set(traveller, { x: point.x, y: point.y });
        };
        // A small parcel rides each fan-out route as it draws.
        const feeders = Array.from(section.querySelectorAll<SVGPathElement>("[data-feeder]"));
        const parcels = Array.from(section.querySelectorAll<SVGCircleElement>("[data-parcel-small]"));
        const fans = feeders.map((feeder, i) => {
          const total = feeder.getTotalLength();
          const state = { t: 0 };
          return {
            state,
            move: () => {
              const point = feeder.getPointAtLength(total * state.t);
              gsap.set(parcels[i], { attr: { cx: point.x, cy: point.y } });
            },
          };
        });

        gsap.set(q("[data-feeder], [data-route]"), { drawSVG: "0%" });
        gsap.set(q("[data-place], [data-stop], [data-door], [data-home]"), { autoAlpha: 0 });
        gsap.set(q("[data-parcel]"), { autoAlpha: 0 });
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

        // Home lights, with the first stop: the documents.
        tl.to(q("[data-home]"), { autoAlpha: 1, duration: 0.04 }, 0)
          .to(q("[data-stop='0']"), { autoAlpha: 1, duration: 0.03 }, 0.03)
          .to(traveller, { autoAlpha: 1, duration: 0.03 }, RIDE.start - 0.02)
          // The shipment travels out, drawing the route behind it.
          .to(ride, { t: 1, duration: RIDE.length, onUpdate: moveTraveller }, RIDE.start)
          .to(q("[data-route]"), { drawSVG: "100%", duration: RIDE.length }, RIDE.start);
        STOPS.slice(1).forEach((stop, i) => {
          tl.to(q(`[data-stop='${i + 1}']`), { autoAlpha: 1, duration: 0.03 }, RIDE.start + stop * RIDE.length - 0.02);
        });
        // Then fans out to each country, where a door lands.
        tl.to(traveller, { autoAlpha: 0, duration: 0.03 }, FAN.start);
        fans.forEach((fan, i) => {
          const at = FAN.start + i * FAN.stagger;
          tl.to(parcels[i], { autoAlpha: 1, duration: 0.02 }, at)
            .to(feeders[i], { drawSVG: "100%", duration: FAN.length }, at)
            .to(fan.state, { t: 1, duration: FAN.length, onUpdate: fan.move }, at)
            .to(parcels[i], { autoAlpha: 0, duration: 0.02 }, at + FAN.length - 0.01)
            .to(q(`[data-place='${i}']`), { autoAlpha: 1, duration: 0.03 }, at + FAN.length - 0.02)
            .fromTo(
              q(`[data-door='${i}']`),
              { autoAlpha: 0, y: -14 },
              { autoAlpha: 1, y: 0, duration: 0.06, ease: "back.out(2)" },
              at + FAN.length - 0.01
            );
        });
        tl.to({}, { duration: 0.1 });
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
        {/* The map */}
        <div className="relative overflow-hidden rounded-3xl bg-cream">
          <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
            <Image
              src="/images/network-map.svg"
              alt="Map of the route from NAXIS Australia out to the six countries in its network"
              fill
              unoptimized
              className="select-none"
            />
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id="journey-gradient" x1="1" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="var(--color-emerald)" />
                  <stop offset="100%" stopColor="var(--color-gold)" />
                </linearGradient>
              </defs>
              {/* Fan-out routes, drawn from the hub outwards */}
              {PLACES.map((place) => (
                <path
                  key={`fan-${place.name}`}
                  data-feeder
                  d={arc(HUB, place, -0.18)}
                  fill="none"
                  stroke="var(--color-gold)"
                  strokeOpacity={0.7}
                  strokeWidth={2}
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
              {/* Home: NAXIS Australia */}
              <g data-home>
                <circle cx={HOME.x} cy={HOME.y} r={24} fill="var(--color-emerald)" fillOpacity={0.15} className="network-pulse" />
                <circle cx={HOME.x} cy={HOME.y} r={10} fill="var(--color-emerald)" stroke="var(--color-cream)" strokeWidth={3} />
              </g>
              {PLACES.map((place, i) => (
                <circle key={`p-${place.name}`} data-place={i} cx={place.x} cy={place.y} r={6} fill="var(--color-gold)" stroke="var(--color-ink)" strokeWidth={1.5} />
              ))}
              {STOPS.map((stop, i) => {
                const p = pointAt(stop);
                // The first stop sits just off home, so its marker doesn't
                // cover Australia's.
                const dx = i === 0 ? -34 : 0;
                const dy = i === 0 ? -10 : 0;
                return (
                  <g key={stop} data-stop={i}>
                    <circle cx={p.x + dx} cy={p.y + dy} r={15} fill="var(--color-cream)" stroke="var(--color-emerald)" strokeWidth={3} />
                    <text x={p.x + dx} y={p.y + dy + 5.5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--color-emerald)" className="font-body">
                      {String(i + 1).padStart(2, "0")}
                    </text>
                  </g>
                );
              })}
              {PLACES.map((place) => (
                <circle key={`parcel-${place.name}`} data-parcel data-parcel-small r={5} cx={HUB.x} cy={HUB.y} fill="var(--color-gold)" stroke="var(--color-ink)" strokeWidth={1.2} />
              ))}
              <g ref={travellerRef} data-parcel>
                <circle r={13} fill="var(--color-gold)" fillOpacity={0.3} />
                <rect x={-6} y={-6} width={12} height={12} rx={2} fill="var(--color-gold)" stroke="var(--color-ink)" strokeWidth={1.5} />
              </g>
              {/* A door at each country. Placed by the outer group; the
                  inner one drops in (a GSAP y on the placed group would
                  replace its translate). */}
              {PLACES.map((place, i) => (
                <g key={`door-${place.name}`} transform={`translate(${place.x} ${place.y - 22})`}>
                  <g data-door={i}>
                    <path d="M0 16 C -7 8 -9 4 -9 0 A 9 9 0 1 1 9 0 C 9 4 7 8 0 16 Z" fill="var(--color-emerald)" stroke="var(--color-cream)" strokeWidth={1.8} />
                    <path d="M-3.8 1.5 L0 -2.2 L3.8 1.5 M-2.6 0.8 V4 H2.6 V0.8" fill="none" stroke="var(--color-cream)" strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round" />
                  </g>
                </g>
              ))}
            </svg>
            {/* Right-anchored, running left from under the marker, so it
                stays inside the map at any width. */}
            <span className="pointer-events-none absolute whitespace-nowrap rounded-full bg-emerald px-2 py-0.5 font-body text-[0.45rem] font-bold uppercase tracking-[0.15em] text-cream sm:text-[0.5rem]"
              style={{ right: `${100 - (HOME.x / W) * 100 - 2}%`, top: `${(HOME.y / H) * 100 + 3.5}%` }}
            >
              NAXIS Australia
            </span>
          </div>
          {/* The key: what the pins mean */}
          <p className="absolute bottom-3 left-4 flex items-center gap-2 font-body text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-brown sm:bottom-4 sm:left-5 sm:text-xs">
            <svg viewBox="-10 -10 20 28" className="h-4 w-3" aria-hidden="true">
              <path d="M0 16 C -7 8 -9 4 -9 0 A 9 9 0 1 1 9 0 C 9 4 7 8 0 16 Z" fill="var(--color-emerald)" />
            </svg>
            Your door
          </p>
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
