"use client";

import { useRef, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitReveal from "@/components/motion/SplitReveal";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  href: string;
  /** Small label above the title, e.g. "Next · 02". */
  label: string;
  title: string;
  summary?: string;
  image: { src: string; alt: string };
  /** The next page's hero morphName, so this photo grows into it. */
  morphName?: string;
};

/**
 * The end of a page, leading into the next one: a large title and a wide
 * photo card that opens out to full width as it scrolls into view. The
 * whole block is the link. With a morphName matching the next page's
 * hero, the photo carries across the page transition and becomes that
 * hero, so moving on reads as one continuous shot.
 */
export default function NextChapter({ href, label, title, summary, image, morphName }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        card,
        { scale: 0.84 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: card, start: "top bottom", end: "center 55%", scrub: true },
        }
      );
    }, card);
    return () => ctx.revert();
  }, []);

  const photo = (
    <div className="absolute inset-0">
      <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" />
    </div>
  );

  return (
    <section className="relative overflow-hidden bg-ink px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20">
      <Link href={href} className="group block">
        <p className="mb-5 w-fit font-body text-xs font-bold uppercase tracking-[0.3em] text-gradient-brand md:text-sm">
          {label}
        </p>
        <div className="flex items-end justify-between gap-6">
          <SplitReveal
            as="h2"
            className="max-w-5xl font-headline text-[clamp(2.75rem,8vw,7.5rem)] uppercase leading-[0.95] tracking-[-0.01em] text-cream transition-colors duration-300 group-hover:text-gold"
          >
            {title}
          </SplitReveal>
          <span
            aria-hidden="true"
            className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-cream/25 text-2xl text-gold transition-[translate,background-color,border-color] duration-300 group-hover:translate-x-2 group-hover:border-gold group-hover:bg-gold group-hover:text-ink md:h-20 md:w-20"
          >
            →
          </span>
        </div>
        {summary && (
          <p className="mt-6 max-w-xl font-serif text-lg italic leading-snug text-cream/70 md:text-xl">
            {summary}
          </p>
        )}
        <div
          ref={cardRef}
          className="relative mt-10 aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-[16/8] md:mt-14"
        >
          {morphName ? (
            <ViewTransition name={morphName} share="morph" default="none">
              {photo}
            </ViewTransition>
          ) : (
            photo
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent transition-opacity duration-500 group-hover:opacity-60" />
        </div>
      </Link>
    </section>
  );
}
