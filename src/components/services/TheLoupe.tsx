"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { getService } from "@/content/services";
import {
  prefersReducedMotion,
  useFinePointer,
  useIsomorphicLayoutEffect,
} from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, Draggable, DrawSVGPlugin);

const QUALITY = getService("quality")!;
// A garment close-up — seams, panels and a zip — so there's detail to
// inspect under the lens. Stock stand-in, like every photo on the site.
const PHOTO = { src: "/images/apparel6.jpg", alt: "Close-up of a jacket's seams, panels and zip" };
const ZOOM = 2.4;

/**
 * Quality's signature: the loupe. A close-up inspection photo with a
 * magnifying lens over it — it follows the cursor with a mouse, and is
 * dragged with a thumb on touch screens — under the client's own line, "a
 * defect is the result of an effect". Beside it, the client's four
 * inspection stages tick off as they scroll into view. Under reduced
 * motion the lens still moves (it's the visitor moving it) but without
 * easing, and the stages are ticked.
 */
export default function TheLoupe() {
  const fine = useFinePointer();
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);

  // The lens: its magnified photo is the same image, ZOOM times the size,
  // offset so the spot under the lens's centre sits in its middle.
  useIsomorphicLayoutEffect(() => {
    const frame = frameRef.current;
    const lens = lensRef.current;
    const inner = innerRef.current;
    if (!frame || !lens || !inner) return;
    const reduce = prefersReducedMotion();

    const sync = () => {
      const r = lens.offsetWidth / 2;
      const cx = (gsap.getProperty(lens, "x") as number) + r;
      const cy = (gsap.getProperty(lens, "y") as number) + r;
      gsap.set(inner, {
        width: frame.clientWidth * ZOOM,
        height: frame.clientHeight * ZOOM,
        x: -(cx * ZOOM - r),
        y: -(cy * ZOOM - r),
      });
    };
    const centre = () => ({
      x: (frame.clientWidth - lens.offsetWidth) / 2,
      y: (frame.clientHeight - lens.offsetHeight) / 2,
    });
    gsap.set(lens, centre());
    sync();

    const cleanups: Array<() => void> = [];
    if (fine) {
      const toX = gsap.quickTo(lens, "x", { duration: reduce ? 0 : 0.35, ease: "power3.out", onUpdate: sync });
      const toY = gsap.quickTo(lens, "y", { duration: reduce ? 0 : 0.35, ease: "power3.out", onUpdate: sync });
      const onMove = (event: PointerEvent) => {
        const rect = frame.getBoundingClientRect();
        const size = lens.offsetWidth;
        toX(gsap.utils.clamp(0, rect.width - size, event.clientX - rect.left - size / 2));
        toY(gsap.utils.clamp(0, rect.height - size, event.clientY - rect.top - size / 2));
      };
      const onLeave = () => {
        const home = centre();
        toX(home.x);
        toY(home.y);
      };
      frame.addEventListener("pointermove", onMove);
      frame.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        frame.removeEventListener("pointermove", onMove);
        frame.removeEventListener("pointerleave", onLeave);
      });
    } else {
      const [drag] = Draggable.create(lens, {
        type: "x,y",
        bounds: frame,
        onPress: () => gsap.to(hintRef.current, { autoAlpha: 0, duration: 0.3 }),
        onDrag: sync,
      });
      cleanups.push(() => drag.kill());
    }

    const onResize = () => {
      gsap.set(lens, centre());
      sync();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cleanups.forEach((fn) => fn());
      window.removeEventListener("resize", onResize);
    };
  }, [fine]);

  // The stages tick off as they come into view.
  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ticks = section.querySelectorAll<SVGPathElement>("[data-tick]");
    if (prefersReducedMotion()) {
      gsap.set(ticks, { drawSVG: "100%" });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.set(ticks, { drawSVG: "0%" });
      section.querySelectorAll<HTMLElement>("[data-stage]").forEach((stage) => {
        const tick = stage.querySelector("[data-tick]");
        gsap
          .timeline({ scrollTrigger: { trigger: stage, start: "top 78%", end: "top 58%", scrub: 0.5 } })
          .to(tick, { drawSVG: "100%", ease: "none" })
          .fromTo(stage, { opacity: 0.35 }, { opacity: 1, ease: "none" }, 0);
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Under the loupe"
      className="bg-cream px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20"
    >
      <p className="mb-4 font-body text-xs font-bold uppercase tracking-[0.35em] text-brown md:text-sm">
        Under the loupe
      </p>
      <h2 className="max-w-4xl font-serif text-[clamp(2rem,4.6vw,3.9rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-brown">
        A defect is the result of an effect.{" "}
        <span className="text-gradient-brand-deep">There is always an underlying cause.</span>
      </h2>

      <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
        {/* The photo and its lens */}
        <div
          ref={frameRef}
          className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-3xl sm:aspect-[5/4] lg:aspect-[4/5]"
          data-cursor={fine ? "Inspect" : undefined}
        >
          <Image src={PHOTO.src} alt={PHOTO.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-ink/15" />
          <div
            ref={lensRef}
            aria-hidden="true"
            className="absolute left-0 top-0 h-32 w-32 cursor-grab touch-none overflow-hidden rounded-full border-2 border-gold shadow-[0_18px_40px_rgba(16,13,9,0.45),inset_0_0_0_6px_rgba(255,201,74,0.15)] active:cursor-grabbing md:h-44 md:w-44"
          >
            <div ref={innerRef} className="absolute left-0 top-0">
              <Image src={PHOTO.src} alt="" fill sizes="(min-width: 1024px) 120vw, 240vw" className="object-cover" />
            </div>
            <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-gold/80" />
            <span className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-gold/80" />
          </div>
          {!fine && (
            <span
              ref={hintRef}
              className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink/80 px-4 py-2 font-body text-xs font-semibold uppercase tracking-[0.2em] text-cream backdrop-blur-sm"
            >
              Drag the loupe
            </span>
          )}
        </div>

        {/* The client's inspection stages */}
        <div>
          <p className="mb-8 max-w-md font-serif text-lg leading-relaxed text-ink/75 md:text-xl">
            From raw materials to finished garments, quality is carefully monitored through:
          </p>
          <ol className="flex flex-col">
            {QUALITY.stages!.map((stage, i) => (
              <li
                key={stage.label}
                data-stage
                className="flex items-start gap-5 border-t border-ink/10 py-6 last:border-b"
              >
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-emerald">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path data-tick d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="var(--color-emerald)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block font-body text-xs font-bold tabular-nums tracking-[0.3em] text-brown">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="block font-headline text-2xl uppercase leading-tight tracking-[-0.01em] text-ink md:text-3xl">
                    {stage.label}
                  </span>
                  <span className="block font-body text-sm text-ink/65 md:text-base">{stage.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 font-serif text-lg italic text-brown md:text-xl">
            For us, quality is everyone&apos;s responsibility.
          </p>
        </div>
      </div>
    </section>
  );
}
