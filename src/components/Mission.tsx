"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The approved Mission statement — revealed word by word as the user
// scrolls through it (see the scrub ScrollTrigger below), not on a timer.
const SENTENCE =
  "An offshore garment manufacturing service provider, operating through certified partner factories across six countries.";
const WORDS = SENTENCE.split(" ");

export default function Mission() {
  const sectionRef = useRef<HTMLElement>(null);
  const sentenceWrapRef = useRef<HTMLParagraphElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);

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

      if (reduceMotion) {
        // Static: the sentence reads fully solid with no scroll-linked reveal.
        gsap.set(words, { opacity: 1 });
        return;
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
      className="relative z-20 w-full rounded-t-[24px] bg-cream px-6 py-28 shadow-[0_-25px_60px_rgba(16,13,9,0.55)] sm:rounded-t-[32px] sm:px-10 md:rounded-t-[44px] md:px-16 md:py-36 lg:px-20 lg:py-44"
    >
      {/* Centered independently of the label/list column above and below,
          and deliberately wide with no flanking copy — a large, bold,
          headline-weight statement rather than a narrow body paragraph. */}
      {/* The statement itself is a paragraph; this gives heading
          navigation a landmark for the section. */}
      <h2 className="sr-only">Our mission</h2>
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
            className="text-ink"
            style={{ opacity: 0.1 }}
          >
            {word}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
