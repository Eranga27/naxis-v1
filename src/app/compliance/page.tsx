import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import NextChapter from "@/components/NextChapter";
import SignOff from "@/components/SignOff";
import SwingTags from "@/components/compliance/SwingTags";
import ScrubWords from "@/components/motion/ScrubWords";
import SplitReveal from "@/components/motion/SplitReveal";
import ThreadLine from "@/components/motion/ThreadLine";
import { COMPLIANCE } from "@/content/compliance";
import { MOQ } from "@/content/moq";

export const metadata: Metadata = {
  title: "Compliance",
  description: `${COMPLIANCE.commitment[0]} ${COMPLIANCE.audits}`,
};

export default function CompliancePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Compliance"
        title="Independently audited. Responsibly made."
        summary="Our manufacturing facilities are committed to the highest degree of integrity."
        image={{ src: "/images/moq-bg.jpg", alt: "Factory team in protective caps folding finished garments" }}
        morphName="hero-compliance"
        titleClassName="text-[clamp(2.75rem,8vw,7.5rem)]"
      />

      {/* The client's commitment, in their words */}
      <section className="bg-cream px-6 pb-10 pt-24 sm:px-10 md:px-16 md:pt-32 lg:px-20">
        <ScrubWords
          text={COMPLIANCE.commitment[0]}
          accent={["track", "record", "social", "compliance."]}
          className="mx-auto max-w-6xl text-center font-body text-[clamp(1.6rem,4vw,3.4rem)] font-bold leading-[1.15] tracking-tight"
        />
        <div className="mx-auto mt-20 grid max-w-6xl gap-4 md:mt-28 md:grid-cols-[minmax(0,0.5fr)_minmax(0,1.5fr)] md:gap-12">
          <p className="font-body text-xs font-bold uppercase tracking-[0.35em] text-brown md:pt-2 md:text-sm">
            Our commitment
          </p>
          <SplitReveal
            as="p"
            className="font-serif text-[clamp(1.4rem,2.6vw,2.25rem)] leading-snug tracking-[-0.01em] text-ink/85"
          >
            {COMPLIANCE.commitment[1]}
          </SplitReveal>
        </div>
        <ThreadLine className="mx-auto mt-20 h-32 md:h-40" />
      </section>

      {/* The certifications, hung as swing tags */}
      <section className="overflow-hidden bg-ink px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20">
        <div className="mb-16 grid gap-8 md:mb-24 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <p className="mb-5 w-fit font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand md:text-sm">
              The audits
            </p>
            <SplitReveal
              as="h2"
              className="font-headline text-[clamp(2.5rem,6vw,5.5rem)] uppercase leading-[0.95] tracking-[-0.01em] text-cream"
            >
              Five standards. Independent audits.
            </SplitReveal>
          </div>
          <p className="max-w-xl font-body text-base leading-relaxed text-cream/70 md:text-lg">
            {COMPLIANCE.audits}
          </p>
        </div>
        <SwingTags />
      </section>

      {/* The line from the tag in the client's own photograph */}
      <section className="bg-cream px-6 py-24 text-center sm:px-10 md:px-16 md:py-32 lg:px-20">
        <div className="mx-auto flex max-w-5xl items-center gap-4 md:gap-8">
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-gold" />
          <SplitReveal
            as="p"
            by="words"
            className="font-serif text-[clamp(1.75rem,4.4vw,3.5rem)] font-bold leading-tight tracking-[-0.02em] text-brown"
          >
            {COMPLIANCE.tagLine}
          </SplitReveal>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-gold" />
        </div>
        <SignOff className="mt-10" />
        <Link
          href="/services/quality"
          className="group mt-14 inline-flex items-center gap-3 rounded-full border border-ink/20 px-6 py-3 font-body text-xs font-semibold uppercase tracking-[0.15em] text-ink transition-colors hover:border-emerald hover:text-emerald md:text-sm"
        >
          How we manage quality
          <span aria-hidden="true" className="transition-[translate] duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </section>

      <NextChapter
        href="/contact"
        label="Next · Start a project"
        title={MOQ.headline}
        summary={MOQ.statement}
        image={{ src: "/images/about-design.jpg", alt: "Designer sketching garment ideas" }}
      />
    </PageShell>
  );
}
