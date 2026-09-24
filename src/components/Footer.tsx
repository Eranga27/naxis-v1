import Image from "next/image";
import { NAV_LINKS } from "@/lib/navLinks";
import { CONTACT } from "@/lib/contact";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-cream/10 bg-ink px-6 py-14 sm:px-10 md:px-16 lg:px-20">
      <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-4">
          <span className="relative block h-10 w-32">
            <Image
              src="/logos/naxis-wordmark.png"
              alt="NAXIS"
              fill
              sizes="150px"
              className="object-contain object-left"
            />
          </span>
          <p className="max-w-xs font-body text-sm text-cream/50">
            Offshore garment manufacturing across six countries.
          </p>
        </div>

        <nav>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-body text-sm text-cream/70 transition-colors hover:text-cream"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-2 font-body text-sm text-cream/70">
          <a href={`mailto:${CONTACT.email}`} className="transition-colors hover:text-cream">
            {CONTACT.email}
          </a>
          <a href={`tel:${CONTACT.phone}`} className="transition-colors hover:text-cream">
            {CONTACT.phone}
          </a>
        </div>
      </div>

      <div className="mt-12 border-t border-cream/10 pt-6 font-body text-xs text-cream/40">
        © {year} NAXIS. All rights reserved.
      </div>
    </footer>
  );
}
