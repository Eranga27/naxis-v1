"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The client's own positioning line (company profile, page 1) — revealed
// word by word as the user scrolls through it (see the scrub
// ScrollTrigger below), not on a timer.
const SENTENCE =
  "We work one on one with clients to help them create their own private label clothing line.";
const WORDS = SENTENCE.split(" ");
// Words carrying the brand gradient once lit.
const ACCENT_WORDS = new Set(["private", "label"]);

export default function Mission() {
  const sectionRef = useRef<HTMLElement>(null);
  const sentenceWrapRef = useRef<HTMLParagraphElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const detailRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLParagraphElement>(null);
  const scriptRef = useRef<HTMLSpanElement>(null);
  const swooshRef = useRef<SVGPathElement>(null);
  const followRef = useRef<HTMLParagraphElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const sentenceWrap = sentenceWrapRef.current;
    if (!section || !sentenceWrap) return;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const words = wordRefs.current.filter(
        (el): el is HTMLSpanElement => el !== null
      );

      const detail = detailRef.current;
      const lead = leadRef.current;
      const script = scriptRef.current;
      const swoosh = swooshRef.current;
      const follow = followRef.current;
      const swooshLength = swoosh ? swoosh.getTotalLength() : 0;
      if (swoosh) {
        swoosh.style.strokeDasharray = `${swooshLength}`;
        swoosh.style.strokeDashoffset = `${swooshLength}`;
      }

      if (reduceMotion) {
        // Static: the sentence reads fully solid with no scroll-linked reveal.
        gsap.set(words, { opacity: 1 });
        gsap.set([lead, follow], { opacity: 1, y: 0 });
        gsap.set(script, { clipPath: "inset(0 0% 0 0)" });
        if (swoosh) swoosh.style.strokeDashoffset = "0";
        return;
      }

      // "every detail matters." — the script is wiped on left to right as
      // if being handwritten, then the gold underline draws beneath it.
      // Scrubbed, like the sentence above, so it writes and un-writes with
      // the scroll.
      if (detail && lead && script && follow) {
        const detailTl = gsap.timeline({
          scrollTrigger: {
            trigger: detail,
            start: "top 78%",
            end: "bottom 55%",
            scrub: 0.6,
          },
        });
        detailTl
          .fromTo(lead, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.25 })
          .fromTo(
            script,
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", ease: "none", duration: 0.6 }
          );
        if (swoosh) {
          detailTl.to(swoosh, { strokeDashoffset: 0, ease: "none", duration: 0.35 });
        }
        detailTl.fromTo(
          follow,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.25 }
        );
      }

      // The sentence: each word starts at low opacity (the faint, "not yet
      // read" tint) and lights up to full contrast in reading order as the
      // section scrolls through view. Scrubbed directly to scroll position
      // — not a timed fade-in — so it un-reveals smoothly in reverse when
      // scrolling back up.
      //
      // start waits until the wrapper's top has scrolled almost all the
      // way to the top of the screen ("top 5%") before the first word
      // lights up. end is pushed well past the wrapper itself
      // ("bottom -50%", i.e. its bottom has to keep going 50% of a
      // viewport-height further past the top of the screen) rather than
      // stopping as soon as the wrapper clears the screen — stretching the
      // reveal over a longer scroll distance so it reads as a slow,
      // deliberate unfold rather than something that finishes in a quick
      // flick of the wheel.
      //
      // Kept to a single trigger element (sentenceWrap) for both start and
      // end, rather than referencing the Mission section itself: doing the
      // latter hit a real cross-component layout-timing bug (see the
      // pin-spacer watcher below for the full story) where the percentage
      // resolved as if Hero had no height at all. Anchoring purely to
      // sentenceWrap's own position sidesteps that class of bug entirely.
      //
      // stagger === duration is deliberate: each word gets its own
      // exclusive slice of the scroll range (no overlap with its
      // neighbors), so only one word is ever mid-fade at a time — one word
      // unlocks per increment of scroll, smoothly, while the rest hold
      // still — rather than several words all fading in a blur at once.
      gsap.timeline({
        scrollTrigger: {
          trigger: sentenceWrap,
          start: "top 62%",
          end: "bottom 20%",
          scrub: true,
        },
      }).to(words, {
        opacity: 1,
        ease: "none",
        stagger: 0.35,
        duration: 0.35,
      });
    }, section);

    // Hero's own pin-spacer isn't inserted until its entrance animation
    // finishes, well after this effect runs. Until that spacer exists, the
    // document is shorter by Hero's full pin distance. We listen to Hero's
    // custom event and poll for the pin-spacer to ensure coordinates are exact.
    const handleHeroPinned = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("hero:pinned", handleHeroPinned);

    let pinSpacerSeen = false;
    const pinSpacerCheck = setInterval(() => {
      if (pinSpacerSeen) return;
      if (document.querySelector(".pin-spacer")) {
        pinSpacerSeen = true;
        ScrollTrigger.refresh();
        clearInterval(pinSpacerCheck);
      }
    }, 150);

    const safetyTimeout = setTimeout(() => {
      clearInterval(pinSpacerCheck);
      ScrollTrigger.refresh();
    }, 6000);

    return () => {
      window.removeEventListener("hero:pinned", handleHeroPinned);
      clearInterval(pinSpacerCheck);
      clearTimeout(safetyTimeout);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="mission"
      // With motion, the hero's frame closes to a card on cream before the
      // pin releases, so Mission simply continues that cream. Without
      // motion the hero stays full-bleed and dark, and Mission slides over
      // it as a rounded, shadowed sheet instead.
      className="relative z-20 w-full bg-cream px-6 py-28 sm:px-10 md:px-16 md:py-36 lg:px-20 lg:py-44 motion-reduce:rounded-t-[24px] motion-reduce:shadow-[0_-25px_60px_rgba(16,13,9,0.55)] motion-reduce:sm:rounded-t-[32px] motion-reduce:md:rounded-t-[44px]"
    >
      {/* Centered independently of the label/list column above and below,
          and deliberately wide with no flanking copy — a large, bold,
          headline-weight statement rather than a narrow body paragraph. */}
      {/* The statement itself is a paragraph; this gives heading
          navigation a landmark for the section. */}
      <h2 className="sr-only">How we work with you</h2>
      <p
        ref={sentenceWrapRef}
        className="mx-auto max-w-6xl py-10 text-center font-body text-[clamp(1.75rem,5.5vw,4.75rem)] font-bold leading-[1.15] tracking-tight md:py-14"
      >
        {WORDS.map((word, i) => (
          <span
            key={i}
            ref={(el) => {
              wordRefs.current[i] = el;
            }}
            className={
              ACCENT_WORDS.has(word) ? "text-gradient-brand-deep" : "text-ink"
            }
            style={{ opacity: 0.1 }}
          >
            {word}{" "}
          </span>
        ))}
      </p>

      {/* The client's "every detail matters." line, from their profile */}
      <div
        ref={detailRef}
        className="mx-auto mt-10 flex max-w-3xl flex-col items-center text-center md:mt-16"
      >
        <p
          ref={leadRef}
          className="font-serif text-lg text-ink/70 opacity-0 md:text-2xl"
        >
          In apparel production,
        </p>
        <div className="relative px-4">
          <span
            ref={scriptRef}
            // One line at every width — the left-to-right wipe reads as
            // handwriting only if the phrase doesn't wrap.
            className="block whitespace-nowrap px-3 pb-2 pt-1 font-script text-[clamp(2.3rem,9.6vw,7.5rem)] leading-[1.15] text-brown"
            style={{ clipPath: "inset(0 100% 0 0)" }}
          >
            every detail matters.
          </span>
          <svg
            viewBox="0 0 600 40"
            preserveAspectRatio="none"
            className="absolute -bottom-1 left-[6%] h-5 w-[88%] md:h-7"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="swoosh-gradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="var(--color-gold)" />
                <stop offset="100%" stopColor="var(--color-emerald)" />
              </linearGradient>
            </defs>
            <path
              ref={swooshRef}
              d="M6 30 C 140 12, 330 4, 594 14"
              fill="none"
              stroke="url(#swoosh-gradient)"
              strokeWidth={4}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <p
          ref={followRef}
          className="mt-8 max-w-md font-body text-base text-ink/75 opacity-0 md:text-lg"
        >
          We focus on the details so you can focus on your customers.
        </p>
      </div>
    </section>
  );
}
