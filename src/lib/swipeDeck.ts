import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { createTickPainter } from "@/lib/pinnedGallery";

gsap.registerPlugin(ScrollTrigger);

type SwipeDeckOptions = {
  /** The native horizontal strip (overflow-x auto + scroll-snap). Must be
      positioned, so it is the offsetParent its cards are measured in. */
  track: HTMLElement;
  /** One element per card — the one that takes the depth transform. */
  cards: HTMLElement[];
  /** One tick per card, from TickRail. */
  ticks?: HTMLElement[];
  tickIdle?: string;
  tickDone?: string;
  /** Fired when the centred card changes. */
  onChange?: (activeIndex: number) => void;
  /** False under reduced motion: wayfinding only, no depth or nudge. */
  motion?: boolean;
};

// How far a card one slot off-centre turns, shrinks and fades.
const TURN_DEG = 14;
const SHRINK = 0.08;
const FADE = 0.35;

/**
 * Phone counterpart to createPinnedGallery. It keeps the native swipe —
 * no scroll-jacking of a horizontal gesture — but turns the strip into a
 * carousel with depth: the card at the centre sits flat and full, and its
 * neighbours turn away, shrink and dim in proportion to how far off-centre
 * they are, so the row reads as a reel turning under the thumb rather
 * than a flat list. The strip is padded so the first and last cards can
 * reach the centre too.
 *
 * It drives the same tick rail as the desktop gallery, and nudges the
 * strip once when it first comes into view, to show that it moves.
 *
 * Call inside a gsap.context / matchMedia branch; returns a cleanup.
 */
export function createSwipeDeck({
  track,
  cards,
  ticks = [],
  tickIdle = "",
  tickDone = "",
  onChange,
  motion = true,
}: SwipeDeckOptions): () => void {
  const paintTicks = createTickPainter(ticks, tickIdle, tickDone);
  let lastActive = -1;

  // Side padding of half the leftover width, so any card can centre.
  const prevPadding = track.style.paddingInline;
  const pad = () => {
    const card = cards[0];
    if (!card) return;
    const side = Math.max(0, (track.clientWidth - card.offsetWidth) / 2);
    track.style.paddingInline = `${side}px`;
  };

  let frame = 0;
  const update = () => {
    frame = 0;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let active = 0;
    let nearest = Infinity;
    cards.forEach((card, i) => {
      // Layout offsets, so the transforms applied here never feed back
      // into the measurement.
      const offset =
        (card.offsetLeft + card.offsetWidth / 2 - mid) / card.offsetWidth;
      const distance = Math.abs(offset);
      if (distance < nearest) {
        nearest = distance;
        active = i;
      }
      if (!motion) return;
      const t = Math.min(distance, 1.5);
      gsap.set(card, {
        transformPerspective: 900,
        rotationY: gsap.utils.clamp(-24, 24, offset * TURN_DEG),
        scale: 1 - SHRINK * t,
        opacity: 1 - FADE * Math.min(distance, 1),
      });
    });
    paintTicks(active);
    if (active !== lastActive) {
      lastActive = active;
      onChange?.(active);
    }
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const onResize = () => {
    pad();
    onScroll();
  };

  pad();
  update();
  track.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  // The nudge: drift the strip a third of a card and back, once, the
  // first time it comes into view. Snap is lifted while it plays (the
  // browser would otherwise snap back after every step), and any touch
  // hands control straight back to the visitor.
  let nudge: gsap.core.Timeline | null = null;
  const snapType = track.style.scrollSnapType;
  const endNudge = () => {
    nudge?.kill();
    nudge = null;
    track.style.scrollSnapType = snapType;
  };
  const trigger = motion
    ? ScrollTrigger.create({
        trigger: track,
        start: "top 70%",
        once: true,
        onEnter: () => {
          if (track.scrollLeft > 4 || !cards[0]) return;
          const probe = { x: 0 };
          const reach = cards[0].offsetWidth * 0.35;
          const scrollTo = () => {
            track.scrollLeft = probe.x;
          };
          track.style.scrollSnapType = "none";
          nudge = gsap
            .timeline({ delay: 0.4, onComplete: endNudge })
            .to(probe, { x: reach, duration: 0.75, ease: "power2.inOut", onUpdate: scrollTo })
            .to(probe, { x: 0, duration: 0.85, ease: "power3.inOut", onUpdate: scrollTo });
        },
      })
    : null;
  track.addEventListener("pointerdown", endNudge);
  track.addEventListener("touchstart", endNudge, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    endNudge();
    trigger?.kill();
    track.removeEventListener("scroll", onScroll);
    track.removeEventListener("pointerdown", endNudge);
    track.removeEventListener("touchstart", endNudge);
    window.removeEventListener("resize", onResize);
    track.style.paddingInline = prevPadding;
    gsap.set(cards, { clearProps: "transform,opacity" });
  };
}
