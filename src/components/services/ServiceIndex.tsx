"use client";

import { useRef, useState, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { SERVICES } from "@/content/services";
import { preloadHero } from "@/lib/preloadHero";
import {
  prefersReducedMotion,
  useFinePointer,
  useIsomorphicLayoutEffect,
} from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * The Services hub's index: the four services as giant typographic rows.
 *
 * With a mouse, hovering a row lights it (the others dim) and its photo
 * appears in a card that follows the cursor; clicking carries that photo
 * across the page transition into the service's hero. On touch screens,
 * where there's no hover, the row crossing the middle of the screen lights
 * up and opens its own photo, so scrolling does what hovering does.
 */
export default function ServiceIndex() {
  const fine = useFinePointer();
  const [active, setActive] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLLIElement | null>>([]);
  const photoRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Mouse: the preview card eases after the cursor and grows in while a
  // row is hovered.
  useIsomorphicLayoutEffect(() => {
    const preview = previewRef.current;
    if (!fine || !preview) return;
    const reduce = prefersReducedMotion();
    gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.6, opacity: 0 });
    const toX = gsap.quickTo(preview, "x", { duration: reduce ? 0 : 0.6, ease: "power3.out" });
    const toY = gsap.quickTo(preview, "y", { duration: reduce ? 0 : 0.6, ease: "power3.out" });
    const onMove = (event: PointerEvent) => {
      toX(event.clientX);
      toY(event.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [fine]);

  useIsomorphicLayoutEffect(() => {
    if (active !== null) preloadHero(SERVICES[active].image);
    const preview = previewRef.current;
    if (!fine || !preview) return;
    gsap.to(preview, {
      scale: active === null ? 0.6 : 1,
      opacity: active === null ? 0 : 1,
      duration: prefersReducedMotion() ? 0 : 0.45,
      ease: "power3.out",
    });
  }, [active, fine]);

  // Touch: light the row crossing mid-screen, and lift its photo in the
  // first time it arrives.
  useIsomorphicLayoutEffect(() => {
    const list = listRef.current;
    if (fine || !list) return;
    const rows = rowRefs.current.filter((el): el is HTMLLIElement => el !== null);
    const photos = photoRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const reduce = prefersReducedMotion();
    const ctx = gsap.context(() => {
      rows.forEach((row, i) => {
        ScrollTrigger.create({
          trigger: row,
          start: "top 60%",
          end: "bottom 40%",
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
        });
      });
      if (!reduce) {
        photos.forEach((photo) =>
          gsap.fromTo(
            photo,
            { clipPath: "inset(100% 0 0 0)" },
            {
              clipPath: "inset(0% 0 0 0)",
              duration: 1.1,
              ease: "expo.out",
              scrollTrigger: { trigger: photo, start: "top 85%", once: true },
            }
          )
        );
      }
    }, list);
    return () => ctx.revert();
  }, [fine]);

  const photo = (index: number, sizes: string) => {
    const service = SERVICES[index];
    return (
      <ViewTransition name={`hero-service-${service.slug}`} share="morph" default="none">
        <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
          <Image src={service.image} alt={service.imageAlt} fill sizes={sizes} className="object-cover" />
        </div>
      </ViewTransition>
    );
  };

  return (
    <div className="relative">
      <ul
        ref={listRef}
        onMouseLeave={() => fine && setActive(null)}
        className="border-t border-cream/10"
      >
        {SERVICES.map((service, i) => {
          const lit = active === i;
          const dimmed = active !== null && !lit;
          return (
            <li
              key={service.slug}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              className="border-b border-cream/10"
            >
              <Link
                href={`/services/${service.slug}`}
                onMouseEnter={() => fine && setActive(i)}
                onFocus={() => setActive(i)}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 py-8 md:gap-8 md:py-10"
              >
                <span className="text-gradient-brand pt-2 font-body text-sm font-bold tabular-nums md:pt-4 md:text-base">
                  {service.number}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block font-headline text-[clamp(2.25rem,6.2vw,6.25rem)] uppercase leading-[0.95] tracking-[-0.01em] transition-colors duration-300 ${
                      lit ? "text-gold" : dimmed ? "text-cream/30" : "text-cream"
                    }`}
                  >
                    {service.title}
                  </span>
                  <span
                    className={`mt-3 block max-w-2xl font-serif text-base italic leading-snug transition-colors duration-300 md:text-xl ${
                      dimmed ? "text-cream/30" : "text-cream/70"
                    }`}
                  >
                    {service.summary}
                  </span>
                  {!fine && (
                    <div
                      ref={(el) => {
                        photoRefs.current[i] = el;
                      }}
                      className="relative mt-6 aspect-[16/10] overflow-hidden rounded-2xl"
                    >
                      {photo(i, "90vw")}
                    </div>
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-xl transition-colors duration-300 md:mt-3 md:h-16 md:w-16 ${
                    lit ? "border-gold bg-gold text-ink" : "border-cream/25 text-gold"
                  }`}
                >
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Cursor-following photo card (mouse only) */}
      {fine && (
        <div
          ref={previewRef}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-30 h-[22rem] w-[17rem] overflow-hidden rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
        >
          {SERVICES.map((service, i) => (
            <div
              key={service.slug}
              className={`absolute inset-0 transition-opacity duration-300 ${active === i ? "opacity-100" : "opacity-0"}`}
            >
              {photo(i, "280px")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
