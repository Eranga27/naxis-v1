"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { CONTACT } from "@/lib/contact";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ContactIcons";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ClosingCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const reveals = revealRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        gsap.set(reveals, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        reveals,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative w-full bg-ink px-6 py-24 text-center sm:px-10 md:px-16 md:py-32 lg:px-20"
    >
      <p
        ref={(el) => {
          revealRefs.current[0] = el;
        }}
        className="mx-auto mb-6 font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand w-fit opacity-0 md:mb-8 md:text-sm"
      >
        Get In Touch
      </p>

      <h2
        ref={(el) => {
          revealRefs.current[1] = el;
        }}
        className="mx-auto mb-12 max-w-3xl font-headline uppercase leading-[1.05] tracking-[-0.01em] text-[clamp(2.25rem,6.5vw,5.5rem)] text-cream opacity-0 md:mb-16"
      >
        Let&apos;s talk about your next production run.
      </h2>

      <div
        ref={(el) => {
          revealRefs.current[2] = el;
        }}
        className="flex flex-col items-center justify-center gap-4 opacity-0 sm:flex-row sm:gap-6"
      >
        {/* Direct channels first, per the client's stated preference for
            direct contact over long forms — email is the fallback. */}
        <a
          href={`tel:${CONTACT.phone}`}
          data-magnetic
          className="flex items-center gap-3 rounded-full bg-gold px-8 py-4 font-body text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-gold-light"
        >
          <PhoneIcon />
          Call
        </a>
        <a
          href={`https://wa.me/${CONTACT.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-full border border-cream/25 px-8 py-4 font-body text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:border-cream/60"
        >
          <WhatsAppIcon />
          WhatsApp
        </a>
        <a
          href={`mailto:${CONTACT.email}?subject=Production%20Enquiry`}
          className="flex items-center gap-3 rounded-full border border-cream/25 px-8 py-4 font-body text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:border-cream/60"
        >
          <MailIcon />
          Email
        </a>
      </div>
    </section>
  );
}
