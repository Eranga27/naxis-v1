"use client";

import Preloader from "@/components/Preloader";
import { markRevealed, waitForHeroWheel } from "@/lib/intro";

/**
 * Wires the generic preloader to this page's hero: holds the veil until the
 * wheel is ready, then signals the hero to play its entrance.
 */
export default function HomeIntro() {
  return <Preloader onReveal={markRevealed} waitForMedia={waitForHeroWheel} />;
}
