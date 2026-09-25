"use client";

import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { getService } from "@/content/services";
import { useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const MANUFACTURING = getService("manufacturing")!;
// Each station: one of the client's three statements, headed by its
// highlight.
const STATIONS = MANUFACTURING.highlights.map((title, i) => ({
  title,
  text: MANUFACTURING.body[i],
}));

// A small garment silhouette — the flat from Product Development.
const TEE =
  "M160 60 Q200 92 240 60 L300 78 L355 130 L330 158 L292 128 L292 340 L108 340 L108 128 L70 158 L45 130 L100 78 Z";

const dashes = (direction: "right" | "bottom") =>
  `repeating-linear-gradient(to ${direction}, var(--color-gold) 0 10px, transparent 10px 20px)`;

/**
 * Manufacturing's signature: the production line. The client's three
 * statements are stations on a running line — a dashed gold thread whose
 * dashes flow as it runs — and a garment travels along it with the scroll,
 * lighting each station as it arrives. Desktop pins and runs the line
 * across the screen; phones run it down the side as the section scrolls
 * past. Under reduced motion every station is lit and nothing travels.
 */
export default function TheLine() {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const teeRef = useRef<HTMLDivElement>(null);
  const acrossRef = useRef<HTMLSpanElement>(null);
  const downRef = useRef<HTMLSpanElement>(null);
  const stationRefs = useRef<Array<HTMLLIElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const rail = railRef.current;
    const tee = teeRef.current;
    const across = acrossRef.current;
    const down = downRef.current;
    const stations = stationRefs.current.filter((el): el is HTMLLIElement => el !== null);
    if (!section || !rail || !tee || !across || !down) return;

    const light = (reached: number) =>
      stations.forEach((station, i) => {
        station.dataset.state = i <= reached ? "on" : "off";
      });

    const mm = gsap.matchMedia();
    mm.add(
      {
        wide: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        narrow: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { wide, reduce } = context.conditions as { wide: boolean; reduce: boolean };
        if (reduce) {
          light(stations.length);
          gsap.set(tee, { autoAlpha: 0 });
          return;
        }
        light(-1);

        // Where each station's marker sits along the line, as a share of
        // the run — read live so a resize re-derives it.
        const stops = () =>
          stations.map((station) =>
            wide
              ? station.offsetLeft / Math.max(1, rail.clientWidth - tee.offsetWidth)
              : station.offsetTop / Math.max(1, rail.clientHeight - tee.offsetHeight)
          );

        let reached = -1;
        const tl = gsap.timeline({
          scrollTrigger: wide
            ? {
                trigger: section,
                start: "top top",
                end: () => "+=" + window.innerHeight * 1.5,
                pin: true,
                scrub: 0.6,
                invalidateOnRefresh: true,
              }
            : {
                trigger: rail,
                start: "top 65%",
                end: "bottom 55%",
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
          onUpdate: () => {
            const progress = tl.progress();
            const next = stops().reduce((last, stop, i) => (progress >= stop - 0.02 ? i : last), -1);
            if (next !== reached) {
              reached = next;
              light(next);
            }
          },
        });

        if (wide) {
          tl.fromTo(tee, { x: 0 }, { x: () => rail.clientWidth - tee.offsetWidth, ease: "none", duration: 1 }, 0)
            .fromTo(across, { backgroundPositionX: "0px" }, { backgroundPositionX: "-400px", ease: "none", duration: 1 }, 0);
        } else {
          tl.fromTo(tee, { y: 0 }, { y: () => rail.clientHeight - tee.offsetHeight, ease: "none", duration: 1 }, 0)
            .fromTo(down, { backgroundPositionY: "0px" }, { backgroundPositionY: "-400px", ease: "none", duration: 1 }, 0);
        }
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="The production line"
      className="relative overflow-hidden bg-ink px-6 py-20 sm:px-10 md:flex md:h-svh md:min-h-[640px] md:flex-col md:justify-center md:px-16 md:py-16 lg:px-20"
    >
      <p className="mb-4 w-fit font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand md:text-sm">
        On the line
      </p>
      <h2 className="max-w-3xl font-headline text-[clamp(2.25rem,5vw,4.5rem)] uppercase leading-[0.98] tracking-[-0.01em] text-cream">
        Streamlined, from the first cut to the last.
      </h2>

      <div ref={railRef} className="relative mt-12 md:mt-16">
        {/* The line: down the side on phones, across on desktop */}
        <span
          ref={downRef}
          aria-hidden="true"
          className="absolute bottom-0 left-[17px] top-0 w-[2px] md:hidden"
          style={{ backgroundImage: dashes("bottom") }}
        />
        <span
          ref={acrossRef}
          aria-hidden="true"
          className="absolute left-0 right-0 top-[17px] hidden h-[2px] md:block"
          style={{ backgroundImage: dashes("right") }}
        />

        {/* The garment travelling the line */}
        <div
          ref={teeRef}
          aria-hidden="true"
          className="absolute left-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gold shadow-[0_0_24px_rgba(255,201,74,0.45)]"
        >
          <svg viewBox="30 40 340 320" className="h-5 w-5">
            <path d={TEE} fill="var(--color-ink)" />
          </svg>
        </div>

        <ol className="relative grid gap-12 md:grid-cols-3 md:gap-10">
          {STATIONS.map((station, i) => (
            <li
              key={station.title}
              ref={(el) => {
                stationRefs.current[i] = el;
              }}
              data-state="on"
              className="group relative pl-14 md:pl-0 md:pt-16"
            >
              <span
                aria-hidden="true"
                className="absolute left-[9px] top-[9px] h-[18px] w-[18px] rounded-full border-2 border-cream/30 bg-ink transition-colors duration-300 group-data-[state=on]:border-gold group-data-[state=on]:bg-gold md:left-0"
              />
              <div className="transition-opacity duration-500 group-data-[state=off]:opacity-35">
                <span className="text-gradient-brand mb-3 block w-fit font-body text-xs font-bold tabular-nums tracking-[0.3em]">
                  STATION {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mb-3 font-headline text-2xl uppercase leading-tight tracking-[-0.01em] text-cream md:text-3xl">
                  {station.title}
                </h3>
                <p className="font-body text-sm leading-relaxed text-cream/70 md:text-[0.95rem]">
                  {station.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
