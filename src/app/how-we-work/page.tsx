import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import NextChapter from "@/components/NextChapter";
import SignOff from "@/components/SignOff";
import StageThread from "@/components/process/StageThread";
import ScrubWords from "@/components/motion/ScrubWords";
import SplitReveal from "@/components/motion/SplitReveal";
import ThreadLine from "@/components/motion/ThreadLine";
import Reveal from "@/components/Reveal";
import { ABOUT_CHAPTERS } from "@/content/about";
import { MOQ } from "@/content/moq";
import { PROCESS_INTRO } from "@/content/process";
import { CONTACT_HREF } from "@/lib/navLinks";

export const metadata: Metadata = {
  title: "How We Work",
  description: `${PROCESS_INTRO.oneOnOne} ${PROCESS_INTRO.focus}`,
};

// The client's own line for the whole journey (About artboard).
const JOURNEY = ABOUT_CHAPTERS[ABOUT_CHAPTERS.length - 1].text;

export default function HowWeWorkPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="How we work"
        title="Every detail matters."
        summary={PROCESS_INTRO.focus}
        image={{ src: "/images/process-sewing.jpg", alt: "Kraft paper garment patterns hanging on a rail" }}
        morphName="hero-how-we-work"
      />

      {/* The client's one-on-one promise */}
      <section className="bg-cream px-6 pb-10 pt-24 sm:px-10 md:px-16 md:pt-32 lg:px-20">
        <ScrubWords
          text={PROCESS_INTRO.oneOnOne}
          accent={["one", "on", "own", "private", "label"]}
          className="mx-auto max-w-6xl text-center font-body text-[clamp(1.6rem,4.2vw,3.6rem)] font-bold leading-[1.15] tracking-tight"
        />
        <ThreadLine className="mx-auto mt-16 h-32 md:h-40" />
      </section>

      {/* The eight stages, on one thread */}
      <section className="bg-ink px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20">
        <div className="mb-20 max-w-4xl md:mb-28">
          <p className="mb-5 w-fit font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand md:text-sm">
            Thread to doorstep
          </p>
          <SplitReveal
            as="h2"
            className="font-headline text-[clamp(2.5rem,6vw,5.5rem)] uppercase leading-[0.95] tracking-[-0.01em] text-cream"
          >
            Eight stages. One thread.
          </SplitReveal>
          <Reveal className="mt-6">
            <p className="max-w-2xl font-serif text-lg italic leading-snug text-cream/70 md:text-2xl">{JOURNEY}</p>
          </Reveal>
        </div>
        <StageThread />
      </section>

      {/* The client's MOQ invitation, to close */}
      <section className="bg-cream px-6 py-24 sm:px-10 md:px-16 md:py-32 lg:px-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-6 font-body text-xs font-bold uppercase tracking-[0.35em] text-brown md:text-sm">
            {MOQ.headline}
          </p>
          <SplitReveal
            as="h2"
            by="words"
            className="font-serif text-[clamp(2.25rem,5.5vw,4.75rem)] font-bold leading-[1.02] tracking-[-0.02em] text-brown"
          >
            {MOQ.statement}
          </SplitReveal>
          <Reveal className="mt-8">
            <p className="mx-auto max-w-2xl font-body text-base leading-relaxed text-ink/70 md:text-lg">{MOQ.body[0]}</p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href={CONTACT_HREF}
                className="inline-flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:bg-emerald"
              >
                Start a project →
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-3 rounded-full border border-ink/20 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink/50"
              >
                Our services
              </Link>
            </div>
          </Reveal>
          <SignOff className="mt-20" />
        </div>
      </section>

      <NextChapter
        href="/compliance"
        label="Next · Compliance"
        title="Independently audited. Responsibly made."
        summary="Five standards, and the audits behind them."
        image={{ src: "/images/moq-bg.jpg", alt: "Factory team in protective caps folding finished garments" }}
        morphName="hero-compliance"
      />
    </PageShell>
  );
}
