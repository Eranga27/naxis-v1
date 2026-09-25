"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { INTRO_SESSION_KEY } from "@/lib/intro";

gsap.registerPlugin(ScrollTrigger);

/**
 * Site-wide effects of moving between pages.
 *
 * - Landing on any page other than the homepage counts as having started
 *   the visit, so the homepage intro never plays in the middle of one. The
 *   class suppresses the intro veil before it can paint, as the head
 *   script in layout.tsx does on a full load.
 * - After each client-side navigation, ScrollTrigger re-measures once the
 *   new page has laid out (and again when webfonts settle), since the
 *   outgoing page's pins and spacers are gone and the new page's triggers
 *   were created against a layout still in flux.
 */
export default function RouteEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.pathname === "/") return;
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, "done");
    } catch {
      // private mode / storage disabled
    }
    document.documentElement.classList.add("intro-seen");
  }, []);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
