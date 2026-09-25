import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import NextChapter from "@/components/NextChapter";
import Reveal from "@/components/Reveal";
import CurtainImage from "@/components/motion/CurtainImage";
import ScrubWords from "@/components/motion/ScrubWords";
import SplitReveal from "@/components/motion/SplitReveal";
import SketchToSample from "@/components/services/SketchToSample";
import TheLine from "@/components/services/TheLine";
import { SERVICES, getService } from "@/content/services";
import { CONTACT_HREF } from "@/lib/navLinks";

type Props = { params: Promise<{ slug: string }> };

// Each service's signature moment, shown after the client copy. Services
// whose signature already walks through their stages skip the generic
// stage-by-stage section.
const SIGNATURES: Record<string, { Component: () => React.JSX.Element; coversStages?: boolean }> = {
  "product-development": { Component: SketchToSample },
  manufacturing: { Component: TheLine },
};

// Only the four known services exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: `${service.summary} ${service.body[0]}`.slice(0, 300),
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const index = SERVICES.indexOf(service);
  const signature = SIGNATURES[service.slug];
  const next = SERVICES[(index + 1) % SERVICES.length];
  const [lead, ...rest] = service.body;

  // Keyed by slug: moving from one service to the next is the same route,
  // and without a new key React would reuse this page — no page
  // transition, and the hero's animations and pin left set up for the
  // previous service.
  return (
    <PageShell key={service.slug}>
      {/* The photo carries in from the card that was clicked (homepage
          stack, Services hub, or the previous page's next chapter). */}
      <PageHero
        eyebrow={
          <>
            <Link href="/services" className="transition-colors hover:text-gold">
              Services
            </Link>
            <span className="mx-3 text-cream/30">/</span>
            <span className="text-gradient-brand">{service.number}</span>
          </>
        }
        title={service.title}
        summary={service.summary}
        image={{ src: service.image, alt: service.imageAlt }}
        morphName={`hero-service-${service.slug}`}
        titleClassName="text-[clamp(2.75rem,8vw,7.5rem)]"
      />

      {/* Client copy */}
      <section className="bg-cream px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <p className="mb-5 font-body text-xs font-bold uppercase tracking-[0.3em] text-brown">
              At a glance
            </p>
            <ul className="flex flex-col gap-3 border-l border-ink/15 pl-5">
              {service.highlights.map((point) => (
                <li key={point} className="font-body text-sm font-semibold text-ink md:text-base">
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
          <div>
            <SplitReveal
              as="p"
              className="mb-10 font-serif text-2xl font-semibold leading-snug text-brown md:text-3xl"
            >
              {lead}
            </SplitReveal>
            <div className="flex flex-col gap-6">
              {rest.map((paragraph) => (
                <Reveal key={paragraph.slice(0, 24)}>
                  <p className="font-serif text-lg leading-relaxed text-ink/80">{paragraph}</p>
                </Reveal>
              ))}
            </div>
            <CurtainImage
              src={service.image}
              alt=""
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="mt-14 aspect-[16/9] rounded-3xl"
            />
          </div>
        </div>
      </section>

      {signature && <signature.Component />}

      {/* Stages */}
      {service.stages && !signature?.coversStages && (
        <section className="bg-ink px-6 py-20 sm:px-10 md:px-16 md:py-24 lg:px-20">
          <SplitReveal
            as="h2"
            className="mb-12 max-w-3xl font-headline text-[clamp(2.25rem,5vw,4.25rem)] uppercase leading-[0.98] tracking-[-0.01em] text-cream md:mb-16"
          >
            Stage by stage
          </SplitReveal>
          <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
            <span
              aria-hidden="true"
              className="bg-gradient-brand absolute left-[11px] top-3 bottom-3 w-px opacity-50 md:left-0 md:right-0 md:top-[11px] md:bottom-auto md:h-px md:w-auto"
            />
            {service.stages.map((stage, i) => (
              <li key={stage.label} className="relative pl-10 md:pl-0 md:pt-12">
                {/* Marker sits outside Reveal: its transform would
                    otherwise become the marker's positioning context. */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-bright bg-ink"
                >
                  <span className="h-2 w-2 rounded-full bg-gold" />
                </span>
                <Reveal delay={i * 0.1}>
                  <span className="mb-2 block font-body text-xs font-bold tabular-nums text-cream/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mb-2 font-headline text-2xl uppercase tracking-[-0.01em] text-cream md:text-[1.7rem]">
                    {stage.label}
                  </h3>
                  <p className="font-body text-sm leading-relaxed text-cream/65">{stage.detail}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Pull quote, lit word by word */}
      {service.pullQuote && (
        <section className="bg-cream px-6 py-24 text-center sm:px-10 md:px-16 md:py-32 lg:px-20">
          <ScrubWords
            text={`“${service.pullQuote}”`}
            className="mx-auto max-w-5xl font-serif text-[clamp(1.75rem,4vw,3.25rem)] font-semibold leading-tight tracking-[-0.02em]"
          />
        </section>
      )}

      {/* The client's MOQ invitation */}
      <section className="bg-bark px-6 py-20 sm:px-10 md:px-16 md:py-24 lg:px-20">
        <Reveal>
          <p className="mb-4 w-fit font-body text-xs font-bold uppercase tracking-[0.3em] text-gradient-brand">
            Your idea, our process
          </p>
          <h2 className="mb-8 font-serif text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-cream">
            MOQ? <span className="text-gradient-brand">Let&apos;s talk.</span>
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href={CONTACT_HREF}
              className="inline-flex items-center gap-3 rounded-full bg-gold px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-gold-light"
            >
              Start the conversation →
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-3 rounded-full border border-cream/25 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:border-cream/60"
            >
              All services
            </Link>
          </div>
        </Reveal>
      </section>

      <NextChapter
        href={`/services/${next.slug}`}
        label={`Next service · ${next.number}`}
        title={next.title}
        summary={next.summary}
        image={{ src: next.image, alt: next.imageAlt }}
        morphName={`hero-service-${next.slug}`}
      />
    </PageShell>
  );
}
