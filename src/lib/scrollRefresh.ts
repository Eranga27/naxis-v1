import ScrollTrigger from "gsap/ScrollTrigger";
import { whenIntroQuiet } from "@/lib/intro";

let queued = false;

/**
 * Asks for one `ScrollTrigger.refresh()`. A refresh re-measures every pin
 * on the page, a long task on a page this long, and several sections want
 * one for the same reasons (the webfonts landing, the hero's pin
 * appearing), so the asks in a frame share one. While the intro is
 * animating it waits for the lockup to hold still: run as the fonts
 * landed, two of them stalled "Welcome to" as it rose.
 */
export function requestRefresh() {
  if (queued) return;
  queued = true;
  whenIntroQuiet(() =>
    requestAnimationFrame(() => {
      queued = false;
      ScrollTrigger.refresh();
    })
  );
}
