"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Only categories confirmed by the client belong here. The placeholder is
// deliberate — replace it once the remaining categories are supplied.
const CATEGORIES = ["Sports fits", "Belts", "[CONFIRM WITH CLIENT]"];

// The approved Mission statement — revealed word by word as the user
// scrolls through it (see the scrub ScrollTrigger below), not on a timer.
const SENTENCE =
  "An offshore garment manufacturing service provider, operating through certified partner factories across six countries.";
const WORDS = SENTENCE.split(" ");

export default function Mission() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const sentenceWrapRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const list = listRef.current;
    const sentenceWrap = sentenceWrapRef.current;
    if (!section || !list || !sentenceWrap) return;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const reveals = revealRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      const items = itemRefs.current.filter(
        (el): el is HTMLSpanElement => el !== null
      );
      const words = wordRefs.current.filter(
        (el): el is HTMLSpanElement => el !== null
      );

      if (reduceMotion) {
        // Static: every category stays listed, nothing auto-rotates, and
        // the sentence reads fully solid with no scroll-linked reveal.
        gsap.set(reveals, { opacity: 1, y: 0 });
        gsap.set(words, { opacity: 1 });
        return;
      }

      gsap.fromTo(
        reveals,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: section, start: "top 72%", once: true },
        }
      );

      // The sentence: each word starts at low opacity (the faint, "not yet
      // read" tint) and lights up to full contrast in reading order as the
      // section scrolls through view. Scrubbed directly to scroll position
      // — not a timed fade-in — so it un-reveals smoothly in reverse when
      // scrolling back up.
      //
      // start fires almost as soon as the wrapper's top peeks into the
      // viewport ("top 90%") so the first word is already lighting up
      // while Mission is still arriving — no lag after the Hero handoff.
      // From there it unfolds slowly across the rest of the scroll, word
      // by word, only reaching full brightness once the wrapper's bottom
      // is nearly at the top of the screen ("bottom 20%"), so the reveal
      // spans almost the section's entire scroll distance before normal
      // scrolling carries on into whatever follows.
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
          start: "top 90%",
          end: "bottom 20%",
          scrub: true,
        },
      }).to(words, {
        opacity: 1,
        ease: "none",
        stagger: 0.4,
        duration: 0.4,
      });

      if (items.length < 2) return;

      // Collapse the statically-stacked list into a single rotating slot.
      gsap.set(list, { height: "1.2em", position: "relative" });
      gsap.set(items, { position: "absolute", top: 0, left: 0, width: "100%" });
      gsap.set(items, { yPercent: 100, opacity: 0 });
      gsap.set(items[0], { yPercent: 0, opacity: 1 });

      const rotate = gsap.timeline({ repeat: -1 });
      items.forEach((item, i) => {
        const next = items[(i + 1) % items.length];
        rotate
          .to({}, { duration: 2.4 })
          .to(item, {
            yPercent: -100,
            opacity: 0,
            duration: 0.55,
            ease: "power2.inOut",
          })
          .fromTo(
            next,
            { yPercent: 100, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.55, ease: "power2.inOut" },
            "<"
          );
      });
    }, section);

    // Hero's own pin-spacer isn't inserted until its entrance animation
    // finishes (timing that varies — it waits on the preloader, then plays
    // an ~2s sequence), well after this effect runs. Until that spacer
    // exists, the document is shorter by Hero's full pin distance, so the
    // word-reveal trigger above locks in boundaries offset by exactly that
    // amount. Rather than guess a fixed delay, watch for the pin-spacer to
    // actually appear and refresh the instant it does.
    let pinSpacerSeen = false;
    const pinSpacerCheck = setInterval(() => {
      if (pinSpacerSeen) return;
      if (document.querySelector(".pin-spacer")) {
        pinSpacerSeen = true;
        ScrollTrigger.refresh();
        clearInterval(pinSpacerCheck);
      }
    }, 200);

    return () => {
      clearInterval(pinSpacerCheck);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="mission"
      className="relative w-full bg-cream px-6 py-28 sm:px-10 md:px-16 md:py-36 lg:px-20 lg:py-44"
    >
      <div className="max-w-5xl">
        <p
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="mb-8 font-body text-xs font-bold uppercase tracking-[0.35em] text-brown opacity-0 md:mb-10 md:text-sm"
        >
          Who we are
        </p>
      </div>

      {/* Centered independently of the label/list column above and below,
          and deliberately wide with no flanking copy — a large, bold,
          headline-weight statement rather than a narrow body paragraph. */}
      <div
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
      </div>

      <div className="max-w-5xl">
        <div
          ref={(el) => {
            revealRefs.current[2] = el;
          }}
          className="mt-16 opacity-0 md:mt-20"
        >
          <p className="mb-4 font-body text-xs font-medium uppercase tracking-[0.3em] text-ink/60 md:text-sm">
            What we make
          </p>

          <div
            ref={listRef}
            className="overflow-hidden font-headline text-[clamp(2rem,6vw,4.5rem)] uppercase leading-[1.2] tracking-[-0.01em] text-emerald"
          >
            {CATEGORIES.map((category, i) => (
              <span
                key={category}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="block"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
