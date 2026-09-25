"use client";

import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { COUNTRIES } from "@/content/countries";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * The six countries running past in huge outlined type. It drifts on its
 * own, speeds up with the scroll and follows its direction, then eases
 * back. Under reduced motion it's a still, wrapped list.
 */
export default function CountryMarquee({ className = "" }: { className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // The strip holds the list twice, so sliding it half its width loops
      // seamlessly.
      const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
      let settle: gsap.core.Tween | null = null;
      ScrollTrigger.create({
        trigger: track,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          const boost = gsap.utils.clamp(-6, 6, velocity / 250);
          settle?.kill();
          loop.timeScale(boost === 0 ? 1 : boost > 0 ? 1 + boost : -1 + boost);
          settle = gsap.to(loop, {
            timeScale: self.direction >= 0 ? 1 : -1,
            duration: 1.2,
            ease: "power2.out",
          });
        },
      });
    }, track);
    return () => ctx.revert();
  }, []);

  const row = (hidden: boolean) =>
    COUNTRIES.map((country) => (
      <span key={`${country}-${hidden}`} aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
        <span className="px-[0.35em] font-headline text-[clamp(4rem,11vw,10rem)] uppercase leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(244,239,228,0.45)]">
          {country}
        </span>
        <span aria-hidden="true" className="text-gradient-brand font-headline text-[clamp(2rem,5vw,4.5rem)] leading-none">
          ✦
        </span>
      </span>
    ));

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="motion-reduce:hidden">
        <div ref={trackRef} className="flex w-max">
          {row(false)}
          {row(true)}
        </div>
      </div>
      <p className="hidden flex-wrap gap-x-6 gap-y-2 font-headline text-5xl uppercase text-cream/70 motion-reduce:flex">
        {COUNTRIES.join(" · ")}
      </p>
    </div>
  );
}
