"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { CONTACT_HREF, NAV_LINKS } from "@/lib/navLinks";
import { SERVICES } from "@/content/services";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  // Tucked away while the visitor scrolls down, so the bar never sits over
  // what they're reading; back as soon as they scroll up (or reach the
  // top), which is when they're looking for it.
  const [tucked, setTucked] = useState(false);
  // Hover target for the menu's photo preview (desktop).
  const [preview, setPreview] = useState(0);
  // The previews are only mounted once the menu has been opened, so nine
  // photos aren't fetched on every page load for a menu most visitors
  // never open.
  const [menuUsed, setMenuUsed] = useState(false);
  // The header lives in the root layout and outlasts every page, so the
  // bar's state is re-derived from each page as it arrives.
  const pathname = usePathname();

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const metaRefs = useRef<Array<HTMLElement | null>>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Clear over the hero, where the header sits on the video; a blurred
  // ink bar from Mission onward, so section headings scrolling underneath
  // stop colliding with the logo and buttons. Keyed off Mission's top
  // edge rather than a scroll offset, since the hero's pin changes how
  // far down Mission actually starts. The hero also reports when its
  // frame has closed in to a card on cream ("hero:framed"), where the
  // logo would otherwise sit on cream with nothing behind it.
  //
  // Inner pages mark a dark hero with data-dark-hero: clear over it, solid
  // once it has scrolled up past the bar. Pages that open on a light
  // ground have no such hero and get the solid bar from the top, where a
  // clear one would leave the logo on bare cream.
  useEffect(() => {
    const mission = document.getElementById("mission");
    const darkHero = document.querySelector<HTMLElement>("[data-dark-hero]");
    let heroFramed = false;
    let frame = 0;
    // A new page starts at the top, where the first update shows the bar.
    let lastY = window.scrollY;
    const update = () => {
      frame = 0;
      // Down by more than a nudge tucks it; up by a little brings it
      // back. Near the top it always shows — except on the homepage, where
      // the hero has the screen to itself (the client's call): nothing
      // shows until Mission reaches the bar, and from there it comes back
      // on the way up. Keyboard focus still brings it out (onFocus below).
      const y = window.scrollY;
      const dy = y - lastY;
      const overHero = !!mission && mission.getBoundingClientRect().top > 80;
      if (overHero) setTucked(true);
      else if (y < 120) setTucked(false);
      else if (dy > 6) setTucked(true);
      else if (dy < -6) setTucked(false);
      if (Math.abs(dy) > 6 || y < 120) lastY = y;
      setSolid(
        mission
          ? heroFramed || mission.getBoundingClientRect().top <= 80
          : darkHero
            ? heroFramed || darkHero.getBoundingClientRect().bottom <= 80
            : true
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onHeroFramed = (event: Event) => {
      heroFramed = (event as CustomEvent<boolean>).detail;
      onScroll();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hero:framed", onHeroFramed);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hero:framed", onHeroFramed);
    };
  }, [pathname]);

  // The menu opens as a circle growing out of the menu button, the page
  // names rising into place one after another; it closes by reversing,
  // faster. Reduced motion gets a plain fade.
  const animateMenu = useCallback((opening: boolean) => {
    const overlay = overlayRef.current;
    const button = menuButtonRef.current;
    if (!overlay) return;
    timelineRef.current?.kill();

    const items = itemRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    const meta = metaRefs.current.filter((el): el is HTMLElement => el !== null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let origin = "calc(100% - 3rem) 3rem";
    if (button) {
      const r = button.getBoundingClientRect();
      origin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
    }
    const closed = `circle(0% at ${origin})`;
    const full = `circle(150% at ${origin})`;

    if (reduce) {
      timelineRef.current = gsap
        .timeline()
        .set(overlay, { clipPath: "none", visibility: "visible" })
        .set(items, { yPercent: 0 })
        .set(meta, { opacity: 1, y: 0 })
        .fromTo(
          overlay,
          { opacity: opening ? 0 : 1 },
          { opacity: opening ? 1 : 0, duration: 0.25 }
        )
        .set(overlay, { visibility: opening ? "visible" : "hidden" });
      return;
    }

    const tl = gsap.timeline();
    if (opening) {
      tl.set(overlay, { visibility: "visible", opacity: 1 })
        .fromTo(overlay, { clipPath: closed }, { clipPath: full, duration: 0.85, ease: "expo.inOut" })
        .fromTo(
          items,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.045 },
          0.3
        )
        .fromTo(
          meta,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.05 },
          0.5
        );
    } else {
      tl.to(meta, { opacity: 0, duration: 0.2 }, 0)
        .to(items, { yPercent: -110, duration: 0.35, ease: "power3.in", stagger: 0.02 }, 0)
        .to(overlay, { clipPath: closed, duration: 0.6, ease: "expo.inOut" }, 0.15)
        .set(overlay, { visibility: "hidden" });
    }
    timelineRef.current = tl;
  }, []);

  const openMenu = () => {
    setMenuUsed(true);
    setOpen(true);
  };
  const closeMenu = useCallback(() => setOpen(false), []);

  // Plays the menu animation and, while it's open, holds focus inside it:
  // the rest of the page (header included — the menu has its own close
  // button) is made inert, Escape closes it, and focus goes back to the
  // menu button afterwards.
  const firstRun = useRef(true);
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    if (firstRun.current) {
      firstRun.current = false;
      if (!open) return;
    }
    animateMenu(open);
    if (!open) return;

    const inerted = Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el !== overlay && !el.inert
    );
    inerted.forEach((el) => (el.inert = true));
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const button = menuButtonRef.current;
    return () => {
      inerted.forEach((el) => (el.inert = false));
      document.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open, animateMenu]);

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href);

  return (
    <>
      <header
        // Held still during page transitions (see ::view-transition-group
        // (site-header) in globals.css) — the one fixed reference while
        // the content beneath it changes.
        style={{ viewTransitionName: "site-header" }}
        // Shown again whenever something in it takes keyboard focus.
        onFocus={() => setTucked(false)}
        // No backdrop blur: it was re-run on every frame of the pinned
        // scroll sequences beneath it. A near-opaque ink does the same job.
        className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 transition-[translate,background-color,padding,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:px-12 ${
          solid
            ? "bg-ink/90 py-3 shadow-[0_10px_30px_rgba(16,13,9,0.25)] md:py-3.5"
            : "bg-transparent py-6 md:py-7"
        } ${tucked && !open ? "-translate-y-[110%]" : "translate-y-0"}`}
      >
        {/* Gold -> emerald hairline along the solid bar's bottom edge */}
        <span
          aria-hidden="true"
          className={`bg-gradient-brand pointer-events-none absolute inset-x-0 bottom-0 h-px transition-opacity duration-500 ${
            solid ? "opacity-60" : "opacity-0"
          }`}
        />
        <Link
          href="/#top"
          aria-label="NAXIS Australia — home"
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
        </Link>

        <div className="flex items-center gap-3 md:gap-5">
          <Link
            href={CONTACT_HREF}
            data-magnetic
            className="flex items-center rounded-full bg-gold px-5 py-2.5 font-body text-sm font-medium text-ink transition-colors hover:bg-gold-light md:px-6 md:py-3"
          >
            Inquire
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="site-menu"
            data-magnetic
            onClick={openMenu}
            // A dark pill behind the cream bars, not a faint cream tint —
            // the header floats over both ink and cream sections, and a
            // cream-on-cream button vanished entirely over the latter.
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full bg-ink/80 transition-colors hover:bg-ink"
          >
            <span className="block h-px w-4 bg-cream" />
            <span className="block h-px w-4 bg-cream" />
          </button>
        </div>
      </header>

      {/* Full-screen menu. data-lenis-prevent keeps the smooth scroller
          from scrolling the page behind it; the menu scrolls natively on
          short screens. */}
      <div
        ref={overlayRef}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
        data-lenis-prevent
        className="fixed inset-0 z-[110] overflow-y-auto bg-ink"
        style={{ visibility: "hidden" }}
      >
        {/* Brand light, as in the hero grade */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 55% 50% at 0% 100%, rgba(255,201,74,0.12), transparent 70%), radial-gradient(ellipse 40% 55% at 100% 0%, rgba(47,208,138,0.1), transparent 70%)",
          }}
        />

        <div className="relative flex min-h-full flex-col px-8 pb-10 pt-6 md:px-12 md:pt-7">
          <div className="flex items-center justify-between">
            <span
              ref={(el) => {
                metaRefs.current[0] = el;
              }}
              className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-cream/50"
            >
              Menu
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close menu"
              onClick={closeMenu}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/25 transition-colors hover:border-gold"
            >
              <span className="relative block h-4 w-4">
                <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 rotate-45 bg-cream" />
                <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 -rotate-45 bg-cream" />
              </span>
            </button>
          </div>

          <div className="mt-8 grid flex-1 gap-10 md:mt-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
            <nav aria-label="Pages">
              <ol className="flex flex-col">
                {NAV_LINKS.map((link, i) => {
                  const current = isCurrent(link.href);
                  return (
                    <li key={link.href} className="border-b border-cream/10">
                      <Link
                        href={link.href}
                        onClick={closeMenu}
                        onMouseEnter={() => setPreview(i)}
                        onFocus={() => setPreview(i)}
                        aria-current={current ? "page" : undefined}
                        className="group flex items-baseline gap-4 py-1.5 md:gap-6 md:py-2"
                      >
                        <span className="w-6 shrink-0 font-body text-[0.7rem] font-semibold tabular-nums text-cream/35">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {/* Each name rises out of its own line mask. The
                            hover nudge is on the mask, not the name: GSAP's
                            yPercent on the name would clear a CSS translate
                            set on the same element. */}
                        <span className="block overflow-hidden transition-[translate] duration-300 group-hover:translate-x-3">
                          <span
                            ref={(el) => {
                              itemRefs.current[i] = el;
                            }}
                            className={`block font-headline text-[clamp(2rem,4.1vw,3.6rem)] uppercase leading-[1.02] tracking-[-0.005em] transition-colors duration-300 ${
                              current ? "text-gold" : "text-cream group-hover:text-gold"
                            }`}
                          >
                            {link.label}
                          </span>
                        </span>
                        {current && (
                          <span
                            aria-hidden="true"
                            className="ml-auto h-2 w-2 shrink-0 self-center rounded-full bg-emerald-bright"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <div className="flex flex-col gap-8 lg:justify-between">
              {/* Photo preview of the hovered page — desktop only */}
              <div
                aria-hidden="true"
                className="relative hidden aspect-[4/5] max-h-[52vh] w-full overflow-hidden rounded-3xl lg:block"
              >
                {menuUsed &&
                  NAV_LINKS.map((link, i) => (
                    <div
                      key={link.href}
                      className={`absolute inset-0 transition-[opacity,scale] duration-700 ease-out ${
                        preview === i ? "scale-100 opacity-100" : "scale-105 opacity-0"
                      }`}
                    >
                      <Image src={link.image} alt="" fill sizes="40vw" className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                    </div>
                  ))}
              </div>

              <div
                ref={(el) => {
                  metaRefs.current[1] = el;
                }}
              >
                <p className="mb-3 font-body text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-cream/40">
                  Services
                </p>
                <ul className="flex flex-col gap-2">
                  {SERVICES.map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={`/services/${service.slug}`}
                        onClick={closeMenu}
                        className="font-body text-sm text-cream/75 transition-colors hover:text-gold md:text-base"
                      >
                        <span className="text-gradient-brand mr-3 font-semibold">{service.number}</span>
                        {service.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                ref={(el) => {
                  metaRefs.current[2] = el;
                }}
                className="flex flex-col gap-4 border-t border-cream/10 pt-6"
              >
                <Link
                  href={CONTACT_HREF}
                  onClick={closeMenu}
                  className="w-full rounded-full bg-gold px-6 py-3.5 text-center font-body text-sm font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-gold-light sm:w-fit"
                >
                  Start a project →
                </Link>
                <p className="font-body text-[0.65rem] uppercase tracking-[0.3em] text-cream/40">
                  <span className="text-gradient-brand font-semibold">NAXIS Australia</span>
                  <span className="mx-2 text-cream/25">·</span>
                  Delivering excellence through experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
