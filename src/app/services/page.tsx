import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import NextChapter from "@/components/NextChapter";
import ServiceIndex from "@/components/services/ServiceIndex";
import ScrubWords from "@/components/motion/ScrubWords";
import ThreadLine from "@/components/motion/ThreadLine";
import { ABOUT } from "@/content/about";
import { PROCESS_CHAPTER } from "@/content/process";

export const metadata: Metadata = {
  title: "Services",
  description: ABOUT.paragraphs[1],
};

export default function ServicesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="What we do"
        title="The complete journey, managed."
        summary="We don't simply source products — we take responsibility for the entire journey, from factory floor to your door."
        image={{ src: "/images/services/manufacturing.jpg", alt: "Garment production floor with sewing lines" }}
        morphName="hero-services"
      />

      <section className="bg-cream px-6 pb-10 pt-24 sm:px-10 md:px-16 md:pt-32 lg:px-20">
        <ScrubWords
          text={ABOUT.paragraphs[1]}
          accent={["complete", "journey"]}
          className="mx-auto max-w-6xl text-center font-body text-[clamp(1.6rem,4vw,3.4rem)] font-bold leading-[1.15] tracking-tight"
        />
        <ThreadLine className="mx-auto mt-16 h-32 md:h-40" />
      </section>

      <section className="bg-ink px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20">
        <p className="mb-10 w-fit font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand md:mb-14 md:text-sm">
          Four chapters, one journey
        </p>
        <ServiceIndex />
      </section>

      <NextChapter {...PROCESS_CHAPTER} />
    </PageShell>
  );
}
