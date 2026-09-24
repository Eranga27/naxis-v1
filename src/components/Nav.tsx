"use client";

import { useState } from "react";
import Image from "next/image";
import { NAV_LINKS } from "@/lib/navLinks";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-6 md:px-12 md:py-7">
        <a
          href="#top"
          className="inline-flex h-11 items-center justify-center rounded-full bg-cream/[0.07] p-3 transition-colors hover:bg-cream/15 md:h-12 md:p-3.5"
        >
          <span className="relative block h-full aspect-[1200/980]">
            <Image
              src="/logos/naxis-wordmark.png"
              alt="NAXIS"
              fill
              priority
              sizes="150px"
              className="object-contain"
            />
          </span>
        </a>

        <div className="flex items-center gap-3 md:gap-5">
          <a
            href="#contact"
            className="flex items-center rounded-full bg-gold px-5 py-2.5 font-body text-sm font-medium text-ink transition-colors hover:bg-gold-light md:px-6 md:py-3"
          >
            Inquire
          </a>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            // A dark pill behind the cream bars, not a faint cream tint —
            // the header floats over both ink and cream sections, and a
            // cream-on-cream button vanished entirely over the latter.
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full bg-ink/70 backdrop-blur-md transition-colors hover:bg-ink/90"
          >
            <span className="block h-px w-4 bg-cream" />
            <span className="block h-px w-4 bg-cream" />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[110] transition-opacity duration-500 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        <nav
          className={`absolute top-0 right-0 flex h-full w-full max-w-sm flex-col justify-between bg-ink px-8 py-8 shadow-2xl transition-transform duration-500 ease-out md:px-12 md:py-10 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div>
            <div className="mb-16 flex items-center justify-between">
              <span className="font-body text-sm uppercase tracking-[0.2em] text-cream/50">
                Menu
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 transition-colors hover:border-cream/60"
              >
                <span className="relative block h-4 w-4">
                  <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 rotate-45 bg-cream" />
                  <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 -rotate-45 bg-cream" />
                </span>
              </button>
            </div>

            <ul className="flex flex-col gap-6">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-3xl font-extrabold uppercase tracking-tight text-cream transition-colors hover:text-gold md:text-4xl"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="w-full rounded-full bg-gold px-6 py-3.5 text-center font-body text-sm font-medium text-ink transition-colors hover:bg-gold-light"
          >
            Inquire
          </a>
        </nav>
      </div>
    </>
  );
}
