import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import NextChapter from "@/components/NextChapter";
import SignOff from "@/components/SignOff";
import CountryMarquee from "@/components/CountryMarquee";
import ChapterScroller from "@/components/about/ChapterScroller";
import BeliefWords from "@/components/about/BeliefWords";
import ScrubWords from "@/components/motion/ScrubWords";
import SplitReveal from "@/components/motion/SplitReveal";
import ThreadLine from "@/components/motion/ThreadLine";
import { ABOUT } from "@/content/about";

export const metadata: Metadata = {
  title: "About",
  description: ABOUT.paragraphs[0],
};

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Who we are"
        title={ABOUT.heading}
        summary={ABOUT.tagline}
        image={{ src: "/images/about-hero.jpg", alt: "Designer at work in the NAXIS studio" }}
        morphName="hero-about"
      />

      {/* Who NAXIS is, in the client's first paragraph */}
      <section className="bg-cream px-6 pb-10 pt-24 sm:px-10 md:px-16 md:pt-32 lg:px-20">
        <ScrubWords
          text={ABOUT.paragraphs[0]}
          accent={["Australian-based", "own", "global"]}
          className="mx-auto max-w-6xl text-center font-body text-[clamp(1.6rem,4.2vw,3.6rem)] font-bold leading-[1.15] tracking-tight"
        />
        <ThreadLine className="mx-auto mt-16 h-32 md:h-40" />
      </section>

      <ChapterScroller />

      <BeliefWords />

      {/* Where: the six countries, running past */}
      <section className="bg-ink pb-24 md:pb-32">
        <CountryMarquee className="border-y border-cream/10 py-8 md:py-10" />
        <div className="mt-12 flex flex-col gap-6 px-6 sm:px-10 md:mt-16 md:flex-row md:items-end md:justify-between md:px-16 lg:px-20">
          <SplitReveal
            as="p"
            className="max-w-2xl font-serif text-xl leading-snug text-cream/80 md:text-3xl"
          >
            Our own manufacturing facilities and a trusted global network of specialised partner factories.
          </SplitReveal>
          <Link
            href="/#global-network"
            className="group inline-flex w-fit items-center gap-3 rounded-full border border-cream/25 px-6 py-3 font-body text-xs font-semibold uppercase tracking-[0.15em] text-cream transition-colors hover:border-gold hover:text-gold md:text-sm"
          >
            See the network
            <span aria-hidden="true" className="transition-[translate] duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* The artboard's closing lockup */}
      <section className="bg-cream px-6 py-24 text-center sm:px-10 md:px-16 md:py-32 lg:px-20">
        <div className="mx-auto flex max-w-5xl items-center gap-4 md:gap-8">
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-gold" />
          <SplitReveal
            as="p"
            by="words"
            className="font-serif text-[clamp(1.75rem,4.4vw,3.5rem)] font-bold leading-tight tracking-[-0.02em] text-brown"
          >
            {ABOUT.tagline}
          </SplitReveal>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-gold" />
        </div>
        <SignOff className="mt-10" />
      </section>

      <NextChapter
        href="/services"
        label="Next · What we do"
        title="The complete journey, managed."
        summary="Four services, from the first sketch to your door."
        image={{ src: "/images/services/manufacturing.jpg", alt: "Garment production floor with sewing lines" }}
        morphName="hero-services"
      />
    </PageShell>
  );
}
