import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/navLinks";
import { CONTACT } from "@/lib/contact";
import { SERVICES } from "@/content/services";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-ink px-6 py-14 sm:px-10 md:px-16 lg:px-20">
      <span
        aria-hidden="true"
        className="bg-gradient-brand absolute inset-x-0 top-0 h-px opacity-40"
      />
      {/* Phones: the two link lists side by side rather than one long
          column, with taller tap targets. */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-2 md:gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <span className="relative block h-10 w-32">
            <Image
              src="/logos/naxis-wordmark.png"
              alt="NAXIS"
              fill
              sizes="150px"
              className="object-contain object-left"
            />
          </span>
          <p className="max-w-xs font-body text-sm leading-relaxed text-cream/60">
            Australian-based private label apparel development, manufacturing
            and complete supply chain solutions.
          </p>
          {/* The client's sign-off lockup */}
          <div className="mt-2">
            <p className="text-gradient-brand w-fit font-body text-sm font-semibold uppercase tracking-[0.3em]">
              NAXIS Australia
            </p>
            <p className="mt-1 font-body text-[0.65rem] uppercase tracking-[0.25em] text-cream/45">
              Delivering excellence through experience.
            </p>
          </div>
        </div>

        <nav aria-label="Site">
          <p className="mb-4 font-body text-xs font-bold uppercase tracking-[0.25em] text-cream/40">
            Explore
          </p>
          <ul className="flex flex-col md:gap-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block py-1.5 font-body text-sm text-cream/70 transition-colors hover:text-cream md:py-0"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Services">
          <p className="mb-4 font-body text-xs font-bold uppercase tracking-[0.25em] text-cream/40">
            Services
          </p>
          <ul className="flex flex-col md:gap-2.5">
            {SERVICES.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="inline-block py-1.5 font-body text-sm text-cream/70 transition-colors hover:text-cream md:py-0"
                >
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-2 md:col-span-1">
          <p className="mb-4 font-body text-xs font-bold uppercase tracking-[0.25em] text-cream/40">
            Contact
          </p>
          <div className="flex flex-col gap-2.5 font-body text-sm text-cream/70">
            <a href={`mailto:${CONTACT.email}`} className="break-words transition-colors hover:text-cream">
              {CONTACT.email}
            </a>
            <a href={`tel:${CONTACT.phone}`} className="transition-colors hover:text-cream">
              {CONTACT.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-cream/10 pt-6 font-body text-xs text-cream/40">
        © {year} NAXIS Australia. All rights reserved.
      </div>
    </footer>
  );
}
