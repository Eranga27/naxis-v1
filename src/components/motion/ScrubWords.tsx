"use client";

import { useRef, type ElementType } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  text: string;
  /** Words (exact, punctuation included) that carry the brand gradient. */
  accent?: string[];
  as?: ElementType;
  className?: string;
  /** "light" for cream grounds (ink text, deep gradient), "dark" for ink. */
  ground?: "light" | "dark";
};

/**
 * A statement that lights up word by word as it scrolls through the
 * screen, each word at its own slice of the scroll — the homepage Mission
 * sentence, for any page. Scrubbed, so it un-reads on the way back up.
 * Under reduced motion every word is simply at full strength.
 */
export default function ScrubWords({
  text,
  accent = [],
  as: Tag = "p",
  className = "",
  ground = "light",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(" ");
  const accentSet = new Set(accent);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
    if (prefersReducedMotion()) {
      gsap.set(spans, { opacity: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.to(spans, {
        opacity: 1,
        ease: "none",
        stagger: 0.35,
        duration: 0.35,
        scrollTrigger: {
          trigger: el,
          start: "top 72%",
          end: "bottom 30%",
          scrub: true,
        },
      });
    }, el);
    return () => ctx.revert();
  }, [text]);

  const plain = ground === "light" ? "text-ink" : "text-cream";
  const gradient =
    ground === "light" ? "text-gradient-brand-deep" : "text-gradient-brand";

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          data-word
          className={accentSet.has(word) ? gradient : plain}
          style={{ opacity: 0.12 }}
        >
          {word}{" "}
        </span>
      ))}
    </Tag>
  );
}
