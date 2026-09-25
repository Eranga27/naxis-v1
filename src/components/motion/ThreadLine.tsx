"use client";

import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  className?: string;
  /** Vertical runs down between sections; horizontal runs along a row. */
  direction?: "down" | "across";
};

/**
 * The thread: the dashed gold arrow from the client's own process diagram
 * (company profile, page 1), used as the connector between sections. It
 * draws itself along its length as it scrolls through the screen, and its
 * arrowhead lands once the line is complete. Size it with className.
 * Under reduced motion it's simply drawn.
 */
export default function ThreadLine({ className = "", direction = "down" }: Props) {
  const lineRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef<SVGSVGElement>(null);
  const down = direction === "down";

  useIsomorphicLayoutEffect(() => {
    const line = lineRef.current;
    const head = headRef.current;
    if (!line || !head) return;
    const hidden = down ? "inset(0 0 100% 0)" : "inset(0 100% 0 0)";
    if (prefersReducedMotion()) {
      gsap.set(line, { clipPath: "inset(0 0 0 0)" });
      gsap.set(head, { opacity: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: line,
            start: "top 85%",
            end: down ? "bottom 45%" : "top 45%",
            scrub: 0.6,
          },
        })
        .fromTo(line, { clipPath: hidden }, { clipPath: "inset(0 0 0 0)", ease: "none", duration: 1 })
        .fromTo(head, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.9);
    }, line);
    return () => ctx.revert();
  }, [down]);

  // The dashes are a repeating gradient rather than an SVG stroke, so they
  // keep the diagram's rhythm at any length.
  const dashes = down
    ? "repeating-linear-gradient(to bottom, var(--color-gold) 0 7px, transparent 7px 14px)"
    : "repeating-linear-gradient(to right, var(--color-gold) 0 7px, transparent 7px 14px)";

  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center ${down ? "flex-col" : "flex-row"} ${className}`}
    >
      <span
        ref={lineRef}
        className={down ? "block w-[1.5px] flex-1" : "block h-[1.5px] flex-1"}
        style={{ backgroundImage: dashes }}
      />
      <svg
        ref={headRef}
        viewBox="0 0 12 12"
        className={`h-3 w-3 shrink-0 ${down ? "rotate-90" : ""}`}
        style={{ opacity: 0 }}
      >
        <path
          d="M2 1 L 10 6 L 2 11"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
