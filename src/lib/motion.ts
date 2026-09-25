import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

// Layout effects don't run during SSR; fall back to useEffect there to avoid
// the React warning, while still getting pre-paint timing in the browser.
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Where a full-bleed hero frame ends up once scrolled: a rounded card on
// the cream of the section that follows (the homepage hero's handoff,
// shared by the inner pages' heroes). Phones keep more of the width.
export const FULL_CLIP = "inset(0% 0% 0% 0% round 0px)";
export const CARD_CLIP_PHONE = "inset(15% 4% 15% 4% round 22px)";
export const CARD_CLIP_WIDE = "inset(11% 5.5% 11% 5.5% round 36px)";

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * For components whose markup differs under reduced motion (a pinned
 * sequence vs a plain list). false on the server and during hydration,
 * then the real value, with no cascading re-render.
 */
export const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false
  );

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const subscribePointer = (onChange: () => void) => {
  const mq = window.matchMedia(FINE_POINTER);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** True with a mouse or trackpad (hover interactions), false on touch. */
export const useFinePointer = () =>
  useSyncExternalStore(
    subscribePointer,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false
  );
