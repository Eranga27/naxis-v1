"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { GOLD, EMERALD } from "@/lib/brand";
import { ABOUT_CHAPTERS } from "@/content/about";
import { useIsomorphicLayoutEffect, useReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * "From Concept to Creation. Factory to You." — the client's tagline as the
 * About page's spine. The section pins; as it scrolls, the big word rolls
 * over to the next (Concept -> Creation -> Factory -> You) while the photo
 * above lifts in and the client's line for that chapter takes over, with a
 * tick rail marking the four. Same sequence on phones, stacked.
 *
 * Under reduced motion there's no pin: the four chapters are simply listed.
 */
export default function ChapterScroller() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const tickRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const countRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;
    const compact = <T,>(list: Array<T | null>) => list.filter((el): el is T => el !== null);
    const words = compact(wordRefs.current);
    const texts = compact(textRefs.current);
    const images = compact(imageRefs.current);
    const ticks = compact(tickRefs.current);
    const last = ABOUT_CHAPTERS.length - 1;

    const ctx = gsap.context(() => {
      // Rest: the first chapter showing, the rest waiting below.
      gsap.set(words.slice(1), { yPercent: 110 });
      gsap.set(texts.slice(1), { opacity: 0, y: 24 });
      gsap.set(images.slice(1), { clipPath: "inset(100% 0 0 0)" });

      let shown = -1;
      const mark = (active: number) => {
        if (active === shown) return;
        shown = active;
        ticks.forEach((tick, i) =>
          gsap.to(tick, {
            backgroundColor: i === active ? GOLD : i < active ? EMERALD : "rgba(16,13,9,0.18)",
            scaleY: i === active ? 1.8 : 1,
            duration: 0.3,
          })
        );
        if (countRef.current) countRef.current.textContent = String(active + 1).padStart(2, "0");
      };
      mark(0);

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // One screen of scroll per chapter change.
          end: () => "+=" + window.innerHeight * last,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => mark(Math.min(last, Math.round(self.progress * last))),
        },
      });
      for (let i = 1; i <= last; i++) {
        const at = i - 0.6;
        tl.to(words[i - 1], { yPercent: -110, duration: 0.5 }, at)
          .to(words[i], { yPercent: 0, duration: 0.5 }, at)
          .to(texts[i - 1], { opacity: 0, y: -24, duration: 0.3 }, at)
          .to(texts[i], { opacity: 1, y: 0, duration: 0.4 }, at + 0.15)
          .to(images[i], { clipPath: "inset(0% 0 0 0)", duration: 0.55 }, at);
      }
      // A beat of stillness on the last chapter before the pin releases.
      tl.to({}, { duration: 0.3 });
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  if (reduced) {
    return (
      <section className="bg-cream px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20">
        <ol className="flex flex-col gap-16">
          {ABOUT_CHAPTERS.map((chapter, i) => (
            <li key={chapter.word} className="grid gap-6 md:grid-cols-2 md:items-center md:gap-12">
              <div>
                <span className="font-body text-xs font-bold tabular-nums tracking-[0.3em] text-brown">
                  {String(i + 1).padStart(2, "0")} / {String(ABOUT_CHAPTERS.length).padStart(2, "0")}
                </span>
                <h3 className="text-gradient-brand-deep w-fit font-headline text-[clamp(3.5rem,12vw,9rem)] uppercase leading-none">
                  {chapter.word}
                </h3>
                <p className="mt-4 max-w-xl font-serif text-lg leading-relaxed text-ink/80 md:text-xl">
                  {chapter.text}
                </p>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                <Image src={chapter.image} alt={chapter.alt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label={`${ABOUT_CHAPTERS.map((c) => c.word).join(", ")}`}
      className="relative flex h-svh min-h-[600px] w-full flex-col justify-center overflow-hidden bg-cream px-6 pb-8 pt-24 sm:px-10 md:px-16 md:py-20 lg:px-20"
    >
      <div className="grid h-full max-h-[860px] w-full gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        {/* Photos: each lifts in over the last. First on phones. */}
        <div className="relative order-first min-h-0 flex-1 overflow-hidden rounded-3xl max-lg:h-[34svh] lg:order-last lg:aspect-[4/5] lg:max-h-[74svh]">
          {ABOUT_CHAPTERS.map((chapter, i) => (
            <div
              key={chapter.word}
              ref={(el) => {
                imageRefs.current[i] = el;
              }}
              className="absolute inset-0"
            >
              <Image src={chapter.image} alt={chapter.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          <div className="mb-3 flex items-center gap-4">
            <span className="font-body text-xs font-bold tabular-nums tracking-[0.3em] text-brown">
              <span ref={countRef}>01</span> / {String(ABOUT_CHAPTERS.length).padStart(2, "0")}
            </span>
            <span aria-hidden="true" className="flex items-center gap-2.5">
              {ABOUT_CHAPTERS.map((chapter, i) => (
                <span
                  key={chapter.word}
                  ref={(el) => {
                    tickRefs.current[i] = el;
                  }}
                  className="block h-3 w-[3px] rounded-full bg-ink/20"
                />
              ))}
            </span>
          </div>

          {/* The words, stacked in one mask; each rolls up out of view as
              the next rolls in. */}
          <div className="relative overflow-hidden">
            <span aria-hidden="true" className="invisible block font-headline text-[clamp(4.25rem,15vw,12rem)] uppercase leading-[0.9]">
              Creation
            </span>
            {ABOUT_CHAPTERS.map((chapter, i) => (
              <span
                key={chapter.word}
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
                className="text-gradient-brand-deep absolute left-0 top-0 block font-headline text-[clamp(4.25rem,15vw,12rem)] uppercase leading-[0.9] pr-[0.04em]"
              >
                {chapter.word}
              </span>
            ))}
          </div>

          {/* The client's line for each chapter, crossfading in place */}
          <div className="relative mt-6 min-h-[9rem] md:mt-8 md:min-h-[10rem]">
            {ABOUT_CHAPTERS.map((chapter, i) => (
              <div
                key={chapter.word}
                ref={(el) => {
                  textRefs.current[i] = el;
                }}
                className="absolute inset-x-0 top-0"
              >
                <p className="max-w-xl font-serif text-base leading-relaxed text-ink/80 md:text-xl lg:text-[1.35rem]">
                  {chapter.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
