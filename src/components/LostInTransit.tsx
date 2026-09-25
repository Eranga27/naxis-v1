"use client";

import { useRef } from "react";
import gsap from "gsap";
import { NETWORK_MAP } from "@/content/networkMap";
import { useIsomorphicLayoutEffect } from "@/lib/motion";

const { width: W, height: H, origins, destination } = NETWORK_MAP;

// A loop through the network — Italy, China, Vietnam, Australia, Sri
// Lanka, India and round again — for a parcel that never arrives.
const byName = (name: string) => origins.find((o) => o.name === name)!;
const LOOP = [byName("Italy"), byName("China"), byName("Vietnam"), destination, byName("Sri Lanka"), byName("India")];

// A smooth closed curve through the points (Catmull-Rom, as cubic Béziers).
const closedCurve = (points: ReadonlyArray<{ x: number; y: number }>) => {
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  let d = `M ${at(0).x} ${at(0).y}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x} ${p2.y}`;
  }
  return `${d} Z`;
};
const ROUTE = closedCurve(LOOP);
// The picture is cropped to the loop, so the map reads large.
const VIEW = { x: 70, y: 30, w: 830, h: 590 };

/**
 * The 404's picture: the network map with one parcel going round and round
 * it, a question mark over its head, while the route's dashes run on.
 * Under reduced motion the parcel waits, lost, by India.
 */
export default function LostInTransit() {
  const routeRef = useRef<SVGPathElement>(null);
  const parcelRef = useRef<SVGGElement>(null);
  const markRef = useRef<SVGGElement>(null);

  useIsomorphicLayoutEffect(() => {
    const route = routeRef.current;
    const parcel = parcelRef.current;
    const mark = markRef.current;
    if (!route || !parcel || !mark) return;
    const length = route.getTotalLength();
    const place = (t: number) => {
      const p = route.getPointAtLength(length * t);
      gsap.set(parcel, { x: p.x, y: p.y });
    };

    const mm = gsap.matchMedia();
    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
      (context) => {
        if ((context.conditions as { reduce: boolean }).reduce) {
          place(0.9);
          return;
        }
        const ride = { t: 0 };
        place(0);
        gsap.to(ride, { t: 1, duration: 16, ease: "none", repeat: -1, onUpdate: () => place(ride.t) });
        gsap.to(route, { strokeDashoffset: -120, duration: 4, ease: "none", repeat: -1 });
        // The question mark bobs as it goes.
        gsap.to(mark, { y: -6, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
      }
    );
    return () => mm.revert();
  }, []);

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
      <svg
        viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="lost-route" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-gold)" />
            <stop offset="100%" stopColor="var(--color-emerald)" />
          </linearGradient>
        </defs>
        <image href="/images/network-map.svg" x={0} y={0} width={W} height={H} />
        <path
          ref={routeRef}
          d={ROUTE}
          fill="none"
          stroke="url(#lost-route)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="10 14"
        />
        {LOOP.map((p) => (
          <circle key={p.name} cx={p.x} cy={p.y} r={6} fill="var(--color-cream)" stroke="var(--color-emerald)" strokeWidth={2.5} />
        ))}
        <g ref={parcelRef}>
          <circle r={20} fill="var(--color-gold)" fillOpacity={0.25} />
          <rect x={-9} y={-9} width={18} height={18} rx={2.5} fill="var(--color-gold)" stroke="var(--color-ink)" strokeWidth={2} />
          <path d="M-9 -2 H9 M0 -9 V-2" stroke="var(--color-ink)" strokeWidth={1.5} />
          <g transform="translate(0 -34)">
            <g ref={markRef}>
              <circle r={13} fill="var(--color-ink)" />
              <text y={6} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--color-gold)" className="font-body">
                ?
              </text>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
