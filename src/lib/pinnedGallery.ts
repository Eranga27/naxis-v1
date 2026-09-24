import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { GOLD } from "@/lib/brand";

gsap.registerPlugin(ScrollTrigger);

type PinnedGalleryOptions = {
  /** Element that pins while the strip scrolls (the strip's own wrapper,
      or the whole section when its header should stay framed too). */
  pin: HTMLElement;
  /** The visible window the track scrolls within. */
  viewport: HTMLElement;
  /** The horizontal strip that gets translated. */
  track: HTMLElement;
  /** One tick per card, from TickRail. */
  ticks: HTMLElement[];
  /** Tick color for cards not reached yet. */
  tickIdle: string;
  /** Tick color for cards already passed. */
  tickDone: string;
  /** Extra pinned scroll after the last card, so it can be read before
      the section releases. */
  dwell?: () => number;
  /** Card photos that drift against the direction of travel. */
  parallax?: HTMLElement[];
  parallaxRange?: number;
  /** Fired as the scroll moves; trackProgress is 0-1 across the strip. */
  onUpdate?: (activeIndex: number, trackProgress: number) => void;
};

/**
 * Colors a TickRail for the card now in view: passed cards read
 * tickDone, the current one gold (and taller), the rest tickIdle. Shared
 * by the desktop pinned gallery and the phone swipe deck. Returns a
 * painter that skips repaints when the active card hasn't changed.
 */
export function createTickPainter(
  ticks: HTMLElement[],
  tickIdle: string,
  tickDone: string
): (active: number) => void {
  let lastIndex = -1;
  return (active: number) => {
    if (active === lastIndex) return;
    lastIndex = active;
    ticks.forEach((tick, i) => {
      gsap.set(tick, {
        backgroundColor:
          i === active ? GOLD : i < active ? tickDone : tickIdle,
        scaleY: i === active ? 1.8 : 1,
      });
    });
  };
}

/**
 * Scroll-jacked horizontal gallery: the pin element holds in place while
 * vertical scroll drives the track sideways, with a sprocket-tick rail as
 * wayfinding. Shared by Capabilities and ProcessTimeline.
 *
 * Every distance is a function read on each refresh (never a number
 * captured once), so resizing the window re-derives the pin length and
 * travel instead of keeping the load-time values.
 *
 * Call inside a gsap.context / matchMedia branch; returns a cleanup.
 */
export function createPinnedGallery({
  pin,
  viewport,
  track,
  ticks,
  tickIdle,
  tickDone,
  dwell,
  parallax = [],
  parallaxRange = 8,
  onUpdate,
}: PinnedGalleryOptions): () => void {
  gsap.set([viewport, track], { overflow: "visible" });

  const getMaxScroll = () =>
    Math.max(0, track.scrollWidth - viewport.clientWidth);
  const getDwell = () => (dwell ? dwell() : 0);

  const paintTicks = createTickPainter(ticks, tickIdle, tickDone);
  // Rest state — the first tick reads as active before the pin engages.
  paintTicks(0);

  // The pin covers the travel plus the dwell; the track's own trigger
  // covers only the travel, so the strip stops and holds for the dwell.
  const pinTrigger = ScrollTrigger.create({
    trigger: pin,
    start: "top top",
    end: () => "+=" + (getMaxScroll() + getDwell()),
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  });

  const trackTween = gsap.to(track, {
    x: () => -getMaxScroll(),
    ease: "none",
    scrollTrigger: {
      trigger: pin,
      start: "top top",
      end: () => "+=" + getMaxScroll(),
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const active = Math.round(self.progress * (ticks.length - 1));
        paintTicks(active);
        onUpdate?.(active, self.progress);
      },
    },
  });

  const parallaxTweens = parallax.map((inner) =>
    gsap.fromTo(
      inner,
      { xPercent: -parallaxRange },
      {
        xPercent: parallaxRange,
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => "+=" + getMaxScroll(),
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    )
  );

  return () => {
    pinTrigger.kill();
    [trackTween, ...parallaxTweens].forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
  };
}
