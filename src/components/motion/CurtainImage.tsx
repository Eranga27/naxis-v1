"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  src: string;
  alt: string;
  sizes: string;
  /** Classes for the frame — give it a size or aspect ratio. */
  className?: string;
  /** How far the photo drifts inside the frame, in % of its height. */
  drift?: number;
};

/**
 * A photo that lifts into view like a curtain (a clip-path reveal from the
 * bottom) the first time it enters, then drifts slightly inside its frame
 * as the page scrolls — the reveal used across the homepage. Under reduced
 * motion it's simply there.
 */
export default function CurtainImage({
  src,
  alt,
  sizes,
  className = "",
  drift = 8,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;
    if (prefersReducedMotion()) {
      gsap.set(frame, { clipPath: "inset(0% 0 0 0)" });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        frame,
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: frame, start: "top 85%", once: true },
        }
      );
      gsap.fromTo(
        inner,
        { yPercent: -drift },
        {
          yPercent: drift,
          ease: "none",
          scrollTrigger: {
            trigger: frame,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, frame);
    return () => ctx.revert();
  }, [drift]);

  return (
    <div
      ref={frameRef}
      className={`relative overflow-hidden ${className}`}
      style={{ clipPath: "inset(100% 0 0 0)" }}
    >
      <div ref={innerRef} className="absolute inset-[-12%]">
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </div>
    </div>
  );
}
