"use client";

import { useRef, ViewTransition, type ReactNode } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitReveal from "@/components/motion/SplitReveal";
import {
  CARD_CLIP_PHONE,
  CARD_CLIP_WIDE,
  FULL_CLIP,
  prefersReducedMotion,
  useIsomorphicLayoutEffect,
} from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  eyebrow: ReactNode;
  title: string;
  summary?: ReactNode;
  image: { src: string; alt: string };
  /** Shared-element name: the photo morphs to and from any element with
      the same name on the page navigated from or to (NextChapter cards,
      service cards). */
  morphName?: string;
  titleClassName?: string;
};

/**
 * The inner pages' hero: a full-screen photo with the page title rising in,
 * and on scroll the homepage hero's handoff — the section pins, the frame
 * closes in to a rounded card on cream while the photo pushes in, and the
 * page continues from that cream. Fires "hero:framed" so the header turns
 * solid over the cream. Under reduced motion it's a static full-screen
 * hero.
 */
export default function PageHero({
  eyebrow,
  title,
  summary,
  image,
  morphName,
  titleClassName = "text-[clamp(3rem,9vw,8.5rem)]",
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const settleRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const media = mediaRef.current;
    const settle = settleRef.current;
    const dim = dimRef.current;
    const content = contentRef.current;
    const meta = metaRef.current;
    if (!section || !frame || !media || !settle || !dim || !content || !meta) return;
    if (prefersReducedMotion()) return;

    let framed = false;
    const announce = (next: boolean) => {
      if (next === framed) return;
      framed = next;
      window.dispatchEvent(new CustomEvent("hero:framed", { detail: framed }));
    };

    const ctx = gsap.context(() => {
      // Entrance: the photo settles as the title rises (SplitReveal), the
      // eyebrow and summary follow. The settle is on its own wrapper so it
      // can't fight the scroll push-in below over the same scale.
      gsap.fromTo(settle, { scale: 1.12 }, { scale: 1, duration: 1.8, ease: "power3.out" });
      gsap.fromTo(
        meta.querySelectorAll("[data-hero-fade]"),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.55 }
      );

      const isPhone = () => window.innerWidth < 768;
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + window.innerHeight * (isPhone() ? 0.8 : 0.9),
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => announce(self.progress > 0.35),
        },
      });
      tl.fromTo(media, { scale: 1 }, { scale: 1.2, ease: "none", duration: 1 }, 0)
        .fromTo(
          frame,
          { clipPath: FULL_CLIP },
          { clipPath: () => (isPhone() ? CARD_CLIP_PHONE : CARD_CLIP_WIDE), duration: 0.85 },
          0.1
        )
        // The copy travels in with the card's edges so it stays inside it.
        .fromTo(
          content,
          { x: 0, y: 0 },
          {
            x: () => window.innerWidth * (isPhone() ? 0.04 : 0.055),
            y: () => -window.innerHeight * (isPhone() ? 0.15 : 0.11),
            duration: 0.85,
          },
          0.1
        )
        .to(dim, { opacity: 0.35, duration: 0.85, ease: "none" }, 0.1);
    }, section);

    return () => {
      announce(false);
      ctx.revert();
    };
  }, []);

  const photo = (
    <div className="absolute inset-0">
      <Image src={image.src} alt={image.alt} fill priority sizes="100vw" className="object-cover" />
    </div>
  );

  return (
    <section
      ref={sectionRef}
      data-dark-hero
      className="relative h-svh min-h-[520px] w-full overflow-hidden bg-cream"
    >
      <div ref={frameRef} className="absolute inset-0 flex items-end overflow-hidden bg-ink">
        {/* Its own layer, so the scroll push-in scales it on the GPU. */}
        <div ref={mediaRef} className="absolute inset-0 will-change-transform">
          <div ref={settleRef} className="absolute inset-0">
            {morphName ? (
              <ViewTransition name={morphName} share="morph" default="none">
                {photo}
              </ViewTransition>
            ) : (
              photo
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/15" />
        </div>
        <div ref={dimRef} aria-hidden="true" className="absolute inset-0 bg-ink opacity-0" />
        <div
          aria-hidden="true"
          // Screen-blended from md up; plain on phones, where blending over
          // the scaling photo cost every frame.
          className="pointer-events-none absolute inset-0 md:mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 55% at 10% 100%, rgba(255,201,74,0.14), transparent 70%), radial-gradient(ellipse 45% 60% at 100% 80%, rgba(47,208,138,0.11), transparent 70%)",
          }}
        />

        <div
          ref={contentRef}
          className="relative z-10 w-full px-6 pb-10 pt-32 sm:px-10 md:px-16 md:pb-14 lg:px-20"
        >
          <div ref={metaRef} className="flex flex-col gap-6">
            <div
              data-hero-fade
              className="font-body text-xs font-bold uppercase tracking-[0.3em] text-cream/70 md:text-sm"
            >
              {eyebrow}
            </div>
            <SplitReveal
              as="h1"
              when="load"
              delay={0.3}
              className={`max-w-6xl font-headline uppercase leading-[0.95] tracking-[-0.01em] text-cream [text-shadow:0_2px_12px_rgba(0,0,0,0.4)] ${titleClassName}`}
            >
              {title}
            </SplitReveal>
            {summary && (
              <div
                data-hero-fade
                className="max-w-2xl font-serif text-lg italic leading-snug text-cream/85 md:text-2xl"
              >
                {summary}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
