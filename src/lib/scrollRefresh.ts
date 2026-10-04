import ScrollTrigger from "gsap/ScrollTrigger";
import { whenIntroQuiet } from "@/lib/intro";

// How long the asks may keep coming before the one refresh runs.
const SETTLE_MS = 150;

let queued = false;
let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Asks for one `ScrollTrigger.refresh()`. A refresh re-measures every pin
 * on the page, a long task on a page this long, and several sections want
 * one for the same reasons (the webfonts landing, the window's load, the
 * hero's pin appearing), so asks that come within a moment of each other
 * share one. While the intro is animating it waits for the lockup to hold
 * still: run as the fonts landed, two of them stalled "Welcome to" as it
 * rose.
 */
export function requestRefresh() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (queued) return;
    queued = true;
    whenIntroQuiet(() =>
      requestAnimationFrame(() => {
        queued = false;
        ScrollTrigger.refresh();
      })
    );
  }, SETTLE_MS);
}
