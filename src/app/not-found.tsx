import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import LostInTransit from "@/components/LostInTransit";
import { CONTACT_HREF } from "@/lib/navLinks";

export const metadata: Metadata = {
  title: "Page not found",
};

const ELSEWHERE = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "How we work", href: "/how-we-work" },
  { label: "Compliance", href: "/compliance" },
];

export default function NotFound() {
  return (
    <PageShell>
      <section className="relative overflow-hidden bg-cream px-6 pb-20 pt-32 sm:px-10 md:px-16 md:pt-40 lg:flex lg:min-h-svh lg:items-center lg:px-20 lg:py-28">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-16">
          <div>
            <p className="mb-5 font-body text-xs font-bold uppercase tracking-[0.35em] text-brown md:text-sm">
              Error 404
            </p>
            <h1 className="font-headline text-[clamp(3.5rem,11vw,9rem)] uppercase leading-[0.9] tracking-[-0.01em] text-ink">
              Lost in <span className="text-gradient-brand-deep">transit.</span>
            </h1>
            <p className="mt-6 max-w-md font-serif text-lg italic leading-snug text-ink/70 md:text-2xl">
              This page has gone off the route. Let&apos;s get you back on track.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:bg-emerald"
              >
                Back to home
              </Link>
              <Link
                href={CONTACT_HREF}
                className="inline-flex items-center gap-3 rounded-full border border-ink/20 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink/50"
              >
                Start a project
              </Link>
            </div>
            <nav aria-label="Elsewhere on the site" className="mt-12">
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {ELSEWHERE.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-brown underline decoration-gold decoration-2 underline-offset-[6px] transition-colors hover:text-emerald md:text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <LostInTransit />
        </div>
      </section>
    </PageShell>
  );
}
