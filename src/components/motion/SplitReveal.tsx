"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, SplitText);

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** "load" plays as soon as the page shows it (heroes); "scroll" when it
      comes into view. */
  when?: "load" | "scroll";
  delay?: number;
  /** Lines for headlines and paragraphs; words for short, punchy lines. */
  by?: "lines" | "words";
};

/**
 * Text that rises into place out of its own line (or word) masks — the
 * homepage headline's entrance, for any heading or paragraph.
 *
 * Split with GSAP SplitText, re-split automatically when the width or
 * webfonts change (the animation carries over at the same progress).
 * SplitText labels the element with its full text and hides the split
 * pieces from screen readers. The text is hidden until split so it never
 * flashes unsplit; under reduced motion it simply shows.
 */
export default function SplitReveal({
  as: Tag = "div",
  children,
  className,
  when = "scroll",
  delay = 0,
  by = "lines",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.visibility = "visible";
      return;
    }

    let split: SplitText | null = null;
    const ctx = gsap.context(() => {
      split = SplitText.create(el, {
        type: by === "lines" ? "lines" : "words",
        mask: by,
        autoSplit: true,
        onSplit(self) {
          el.style.visibility = "visible";
          return gsap.from(by === "lines" ? self.lines : self.words, {
            yPercent: 115,
            duration: 1.1,
            ease: "expo.out",
            stagger: by === "lines" ? 0.09 : 0.035,
            delay,
            scrollTrigger:
              when === "scroll"
                ? { trigger: el, start: "top 88%", once: true }
                : undefined,
          });
        },
      });
    }, el);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, [by, delay, when]);

  return (
    <Tag ref={ref} className={className} style={{ visibility: "hidden" }}>
      {children}
    </Tag>
  );
}
