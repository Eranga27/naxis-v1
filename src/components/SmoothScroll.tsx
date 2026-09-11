"use client";

import { useEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    const lenis = new Lenis({
      autoRaf: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    // ScrollTrigger pins insert spacer elements that change document height
    // after Lenis has already measured it. Without re-measuring, Lenis clamps
    // scrolling to the old, shorter limit and later sections become
    // unreachable.
    const handleRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", handleRefresh);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      ScrollTrigger.removeEventListener("refresh", handleRefresh);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return null;
}
