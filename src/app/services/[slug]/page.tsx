import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { SERVICES, getService } from "@/content/services";

type Props = { params: Promise<{ slug: string }> };

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
  const next = SERVICES[(index + 1) % SERVICES.length];
  const [lead, ...rest] = service.body;

  return (
    <>
      <Nav />
      <main className="flex-1">
        {/* Hero banner */}
        <section className="relative flex min-h-[72svh] items-end overflow-hidden bg-ink">
          <Image
            src={service.image}
            alt={service.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
          <div className="relative z-10 w-full px-6 pb-12 pt-32 sm:px-10 md:px-16 md:pb-16 lg:px-20">
            <Reveal>
              <p className="mb-5 font-body text-xs font-bold uppercase tracking-[0.3em] text-cream/70 md:text-sm">
                <Link href="/#services" className="transition-colors hover:text-gold">
                  Services
                </Link>
                <span className="mx-3 text-cream/30">/</span>
                <span className="text-gradient-brand">{service.number}</span>
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="max-w-5xl font-headline uppercase leading-[0.98] tracking-[-0.01em] text-[clamp(2.75rem,8vw,7.5rem)] text-cream">
                {service.title}
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-2xl font-serif text-xl italic leading-snug text-cream/85 md:text-2xl">
                {service.summary}
              </p>
            </Reveal>
          </div>
        </section>

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
              <Reveal>
                <p className="mb-8 font-serif text-2xl font-semibold leading-snug text-brown md:text-3xl">
                  {lead}
                </p>
              </Reveal>
              <div className="flex flex-col gap-6">
                {rest.map((paragraph) => (
                  <Reveal key={paragraph.slice(0, 24)}>
                    <p className="font-serif text-lg leading-relaxed text-ink/80">
                      {paragraph}
                    </p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stages */}
        {service.stages && (
          <section className="bg-ink px-6 py-20 sm:px-10 md:px-16 md:py-24 lg:px-20">
            <Reveal>
              <h2 className="mb-10 w-fit font-body text-xs font-bold uppercase tracking-[0.3em] text-gradient-brand md:mb-14 md:text-sm">
                Stage by stage
              </h2>
            </Reveal>
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
                    <p className="font-body text-sm leading-relaxed text-cream/65">
                      {stage.detail}
                    </p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Pull quote */}
        {service.pullQuote && (
          <section className="bg-cream px-6 py-20 text-center sm:px-10 md:px-16 md:py-28 lg:px-20">
            <Reveal>
              <blockquote className="mx-auto max-w-4xl font-serif text-[clamp(1.75rem,4vw,3.25rem)] font-semibold leading-tight tracking-[-0.02em] text-brown">
                <span aria-hidden="true" className="text-gradient-brand-deep">“</span>
                {service.pullQuote}
                <span aria-hidden="true" className="text-gradient-brand-deep">”</span>
              </blockquote>
            </Reveal>
          </section>
        )}

        {/* CTA + next service */}
        <section className="bg-bark px-6 py-20 sm:px-10 md:px-16 md:py-24 lg:px-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
            <Reveal>
              <p className="mb-4 w-fit font-body text-xs font-bold uppercase tracking-[0.3em] text-gradient-brand">
                Your idea, our process
              </p>
              <h2 className="mb-8 font-serif text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-cream">
                MOQ? <span className="text-gradient-brand">Let&apos;s talk.</span>
              </h2>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/#contact"
                  className="inline-flex items-center gap-3 rounded-full bg-gold px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-gold-light"
                >
                  Start the conversation →
                </Link>
                <Link
                  href="/#services"
                  className="inline-flex items-center gap-3 rounded-full border border-cream/25 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:border-cream/60"
                >
                  All services
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <Link
                href={`/services/${next.slug}`}
                className="group block rounded-3xl border border-cream/15 p-6 transition-colors hover:border-gold/60 md:p-8"
              >
                <span className="mb-3 block font-body text-xs font-bold uppercase tracking-[0.3em] text-cream/50">
                  Next service · {next.number}
                </span>
                <span className="flex items-center justify-between gap-6">
                  <span className="font-headline text-3xl uppercase leading-none tracking-[-0.01em] text-cream md:text-5xl">
                    {next.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-3xl text-gold transition-transform duration-300 group-hover:translate-x-2"
                  >
                    →
                  </span>
                </span>
              </Link>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
