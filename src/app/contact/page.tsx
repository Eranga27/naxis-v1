import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import BriefForm from "@/components/BriefForm";
import SignOff from "@/components/SignOff";
import SplitReveal from "@/components/motion/SplitReveal";
import ScrubWords from "@/components/motion/ScrubWords";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ContactIcons";
import { CONTACT } from "@/lib/contact";
import { MOQ } from "@/content/moq";

export const metadata: Metadata = {
  title: "Start a Project",
  description: MOQ.body[0],
};

// Direct lines first — the client prefers direct contact to long forms —
// with the brief below for anyone who'd rather write it down.
const CHANNELS = [
  { label: "Call", value: CONTACT.phone, href: `tel:${CONTACT.phone}`, Icon: PhoneIcon },
  {
    label: "WhatsApp",
    value: CONTACT.whatsapp,
    href: `https://wa.me/${CONTACT.whatsapp}`,
    Icon: WhatsAppIcon,
    external: true,
  },
  { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}`, Icon: MailIcon },
];

export default function ContactPage() {
  return (
    <PageShell>
      {/* The client's MOQ artboard, as the page's opening: serif on ivory
          with the gold rule. No dark hero, so the header is solid here. */}
      <section className="relative overflow-hidden bg-cream px-6 pb-16 pt-36 sm:px-10 md:px-16 md:pb-24 md:pt-44 lg:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 50% 60% at 0% 0%, rgba(255,201,74,0.16), transparent 70%), radial-gradient(ellipse 40% 50% at 100% 100%, rgba(31,111,74,0.1), transparent 70%)",
          }}
        />
        <div className="relative grid gap-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <p className="mb-6 w-fit font-body text-xs font-bold uppercase tracking-[0.35em] text-brown md:text-sm">
              Start a project
            </p>
            <SplitReveal
              as="h1"
              when="load"
              by="words"
              delay={0.15}
              className="font-serif text-[clamp(3.25rem,10vw,9rem)] font-bold leading-[0.98] tracking-[-0.03em] text-brown"
            >
              {MOQ.headline}
            </SplitReveal>
            <span aria-hidden="true" className="rule-grow mt-6 block h-[3px] w-full max-w-3xl origin-left bg-gradient-brand-deep" />
            <p className="mt-8 max-w-2xl font-serif text-lg italic text-ink/70 md:text-2xl">
              {MOQ.subline}
            </p>
            <p className="mt-3 max-w-3xl font-serif text-[clamp(1.6rem,3.4vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.02em] text-brown">
              {MOQ.statement}
            </p>
          </div>

          <aside className="rounded-3xl bg-ink p-6 text-cream shadow-[0_30px_60px_-30px_rgba(16,13,9,0.6)] md:p-8">
            <h2 className="mb-6 font-headline text-3xl uppercase tracking-[-0.01em] md:text-4xl">
              Talk to us directly
            </h2>
            <ul className="flex flex-col">
              {CHANNELS.map(({ label, value, href, Icon, external }) => (
                <li key={label} className="border-t border-cream/10 first:border-t-0">
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-center gap-4 py-4"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cream/20 text-gold transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                      <Icon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-body text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-cream/50">
                        {label}
                      </span>
                      <span className="block truncate font-body text-sm text-cream/85 md:text-base">
                        {value}
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-gold transition-[translate] duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#brief"
              className="mt-6 flex items-center justify-between rounded-2xl border border-cream/15 px-5 py-4 font-body text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:border-gold"
            >
              Or send us a brief
              <span aria-hidden="true" className="text-gold">↓</span>
            </a>
          </aside>
        </div>
      </section>

      <section
        id="brief"
        className="scroll-mt-20 bg-ink px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20"
      >
        <p className="mb-5 w-fit font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand md:text-sm">
          Send a brief
        </p>
        <SplitReveal
          as="h2"
          className="max-w-4xl font-headline text-[clamp(2.5rem,6.5vw,5.5rem)] uppercase leading-[0.98] tracking-[-0.01em] text-cream"
        >
          Tell us what you want to create.
        </SplitReveal>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-cream/70 md:text-xl">
          {MOQ.body[0]}
        </p>
        <div className="mt-14 md:mt-20">
          <BriefForm />
        </div>
      </section>

      <section className="bg-cream px-6 py-24 text-center sm:px-10 md:px-16 md:py-32 lg:px-20">
        <ScrubWords
          text={MOQ.body[2]}
          accent={["talk", "first."]}
          className="mx-auto max-w-5xl font-body text-[clamp(1.6rem,4vw,3.5rem)] font-bold leading-[1.15] tracking-tight"
        />
        <SignOff className="mt-16 md:mt-20" />
      </section>
    </PageShell>
  );
}
