"use client";

import { useEffect, useLayoutEffect, useRef, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { SERVICES } from "@/content/services";
import { preloadHero } from "@/lib/preloadHero";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Each card sticks a little lower than the one before it, so the stack
// shows a sliver of every card already passed.
const STICK_TOP = 96;
const STICK_STEP = 22;

export default function ServicesStack() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const shadeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imgRefs = useRef<Array<HTMLDivElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const compact = <T,>(list: Array<T | null>) =>
      list.filter((el): el is T => el !== null);
    const reveals = compact(revealRefs.current);
    const cards = compact(cardRefs.current);
    const shades = compact(shadeRefs.current);
    const imgs = compact(imgRefs.current);

    let mm: gsap.MatchMedia | null = null;
    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        gsap.set(reveals, { opacity: 1, y: 0 });
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

      mm = gsap.matchMedia();

      // Desktop: CSS sticky does the stacking; GSAP only adds depth — as
      // the next card slides up over a stuck one, the stuck card eases
      // back and dims, like pages settling into a pile.
      mm.add("(min-width: 768px)", () => {
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card, {
            scale: 0.93,
            ease: "none",
            scrollTrigger: {
              trigger: next,
              start: "top bottom",
              end: `top ${STICK_TOP + (i + 1) * STICK_STEP}px`,
              scrub: true,
            },
          });
          gsap.to(shades[i], {
            opacity: 0.55,
            ease: "none",
            scrollTrigger: {
              trigger: next,
              start: "top bottom",
              end: `top ${STICK_TOP + (i + 1) * STICK_STEP}px`,
              scrub: true,
            },
          });
        });
      });

      // Phones: no sticky stack — a card taller than the screen would
      // stick with its bottom (and its Learn more link) never shown.
      // Instead each card is dealt onto the page as it scrolls in: tipped
      // back from its bottom edge, low and dim, and settling flat, full
      // size and full strength by the time its top is a little above the
      // middle of the screen. Scrubbed, so it reverses on the way back up.
      mm.add("(max-width: 767px)", () => {
        cards.forEach((card) => {
          gsap.fromTo(
            card,
            {
              transformPerspective: 1100,
              transformOrigin: "50% 100%",
              rotationX: 16,
              y: 70,
              scale: 0.94,
              opacity: 0.4,
            },
            {
              rotationX: 0,
              y: 0,
              scale: 1,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "top 55%",
                scrub: 0.6,
              },
            }
          );
        });
      });

      // Every size: each card's photo drifts slightly inside its frame.
      imgs.forEach((img) => {
        gsap.fromTo(
          img,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: img,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
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
      id="services"
      className="relative w-full bg-ink px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20"
    >
      <div className="mb-12 max-w-3xl md:mb-16">
        <p
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="mb-5 w-fit font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand opacity-0 md:text-sm"
        >
          What We Do
        </p>
        <h2
          ref={(el) => {
            revealRefs.current[1] = el;
          }}
          className="mb-6 font-headline uppercase leading-[1.02] tracking-[-0.01em] text-[clamp(2.25rem,6vw,5rem)] text-cream opacity-0"
        >
          The complete journey, managed.
        </h2>
        <p
          ref={(el) => {
            revealRefs.current[2] = el;
          }}
          className="max-w-xl font-body text-sm leading-relaxed text-cream/65 opacity-0 md:text-base"
        >
          We don&apos;t simply source products — we take responsibility for
          the entire journey, from factory floor to your door.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:gap-10">
        {SERVICES.map((service, i) => (
          <article
            key={service.slug}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="relative origin-top overflow-hidden rounded-3xl border border-cream/10 bg-[#1a1510] shadow-[0_-20px_50px_rgba(0,0,0,0.35)] md:sticky"
            style={{ top: STICK_TOP + i * STICK_STEP }}
          >
            <div className="grid md:min-h-[min(68vh,560px)] md:grid-cols-[1.05fr_1fr]">
              {/* Text */}
              <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 md:p-10 lg:p-12">
                <div>
                  <div className="mb-6 flex items-center gap-4">
                    <span className="text-gradient-brand font-headline text-4xl leading-none md:text-5xl">
                      {service.number}
                    </span>
                    <span className="bg-gradient-brand h-px flex-1 opacity-40" />
                  </div>
                  <h3 className="mb-4 font-headline text-[clamp(1.75rem,3.6vw,3rem)] uppercase leading-[1.02] tracking-[-0.01em] text-cream">
                    {service.title}
                  </h3>
                  <p className="mb-6 max-w-md font-serif text-lg italic leading-snug text-cream/85 md:text-xl">
                    {service.summary}
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {service.highlights.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-3 font-body text-sm text-cream/70 md:text-[0.95rem]"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-bright"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/services/${service.slug}`}
                  onPointerEnter={() => preloadHero(service.image)}
                  onFocus={() => preloadHero(service.image)}
                  onTouchStart={() => preloadHero(service.image)}
                  className="group inline-flex w-fit items-center gap-3 rounded-full border border-cream/25 px-6 py-3 font-body text-xs font-semibold uppercase tracking-[0.15em] text-cream transition-colors hover:border-gold hover:bg-gold hover:text-ink md:text-sm"
                >
                  Learn more
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                  <span className="sr-only"> — {service.title}</span>
                </Link>
              </div>

              {/* Photo. Named so it carries across the page transition and
                  becomes the service page's hero. */}
              <ViewTransition name={`hero-service-${service.slug}`} share="morph" default="none">
              <div className="relative order-first aspect-[16/10] overflow-hidden md:order-none md:aspect-auto">
                <div
                  ref={(el) => {
                    imgRefs.current[i] = el;
                  }}
                  className="absolute inset-[-10%]"
                >
                  <Image
                    src={service.image}
                    alt={service.imageAlt}
                    fill
                    sizes="(min-width: 768px) 48vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1510]/60 via-transparent to-transparent md:bg-gradient-to-r md:from-[#1a1510] md:via-[#1a1510]/10" />
              </div>
              </ViewTransition>
            </div>

            {/* Dimming layer, faded in as the next card covers this one */}
            <div
              ref={(el) => {
                shadeRefs.current[i] = el;
              }}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-ink opacity-0"
            />
          </article>
        ))}
      </div>

      <div className="mt-12 flex justify-center md:mt-16">
        <Link
          href="/services"
          className="group inline-flex items-center gap-3 font-body text-xs font-semibold uppercase tracking-[0.2em] text-gold transition-colors hover:text-cream md:text-sm"
        >
          All four services, in depth
          <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
