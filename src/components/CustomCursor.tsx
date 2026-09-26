"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select";
// Elements that pull gently toward the pointer while hovered.
const MAGNETIC = "[data-magnetic]";
// Regions that swap the ring for a labelled disc, e.g. data-cursor="Scroll".
const LABELLED = "[data-cursor]";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

// Read the pointer type through useSyncExternalStore rather than setting
// state in an effect: false on the server and during hydration, then the
// real value, with no cascading re-render.
const subscribePointer = (onChange: () => void) => {
  const mq = window.matchMedia(FINE_POINTER);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const useFinePointer = () =>
  useSyncExternalStore(
    subscribePointer,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false
  );

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const labelTextRef = useRef<HTMLSpanElement>(null);
  const ready = useFinePointer();

  useEffect(() => {
    if (!ready) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    const labelText = labelTextRef.current;
    if (!ring || !dot || !label || !labelText) return;

    document.documentElement.classList.add("custom-cursor-active");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Centre on the pointer via GSAP's own percentage offset — GSAP nulls out
    // the CSS `translate` property when it takes over transforms, so Tailwind
    // translate utilities can't be used for this. Start hidden so nothing
    // sits in the top-left corner before the first movement.
    gsap.set([ring, dot, label], { xPercent: -50, yPercent: -50 });
    gsap.set([ring, dot], { autoAlpha: 0 });
    gsap.set(label, { autoAlpha: 0, scale: 0.3 });

    const pointer = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 }; // the ring's eased position
    // Tweened by GSAP, but applied to the ring in the ticker below together
    // with the velocity stretch, so the two never fight over `scale`.
    const look = { scale: 1 };
    let seenPointer = false;
    let hovering = false;
    let pressed = false;
    let labelled = false;
    let magnet: HTMLElement | null = null;

    // The ring trails the pointer and stretches along its direction of
    // travel in proportion to speed — the lag and squash are what give the
    // cursor its weight. Under reduced motion it simply snaps.
    const tick = (_time: number, deltaMs: number) => {
      if (!seenPointer) return;
      const follow = reduceMotion
        ? 1
        : 1 - Math.pow(1 - 0.2, (deltaMs * 60) / 1000);
      const dx = pointer.x - pos.x;
      const dy = pointer.y - pos.y;
      pos.x += dx * follow;
      pos.y += dy * follow;

      const speed = Math.hypot(dx, dy);
      const stretch = reduceMotion || labelled ? 0 : Math.min(speed / 140, 0.45);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      gsap.set(ring, {
        x: pos.x,
        y: pos.y,
        rotation: stretch > 0.01 ? angle : 0,
        scaleX: look.scale * (1 + stretch),
        scaleY: look.scale * (1 - stretch * 0.45),
      });
      gsap.set(label, { x: pos.x, y: pos.y });
    };
    gsap.ticker.add(tick);

    const applyState = () => {
      gsap.to(look, {
        scale: labelled ? 0 : hovering ? 1.9 : pressed ? 0.75 : 1,
        duration: 0.35,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to(ring, {
        borderWidth: hovering ? 1 : 1.5,
        duration: 0.3,
        overwrite: "auto",
      });
      gsap.to(dot, {
        scale: hovering || labelled ? 0 : pressed ? 0.6 : 1,
        duration: 0.25,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to(label, {
        autoAlpha: labelled ? 1 : 0,
        scale: labelled ? (pressed ? 0.9 : 1) : 0.3,
        duration: 0.4,
        ease: labelled ? "back.out(1.6)" : "power3.in",
        overwrite: "auto",
      });
    };

    const releaseMagnet = () => {
      if (!magnet) return;
      gsap.to(magnet, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.45)",
        overwrite: "auto",
      });
      magnet = null;
    };

    const onMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!seenPointer) {
        // Jump to the pointer on first sight rather than easing in from 0,0.
        seenPointer = true;
        pos.x = e.clientX;
        pos.y = e.clientY;
        gsap.to([ring, dot], { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
      }
      gsap.set(dot, { x: e.clientX, y: e.clientY });

      if (reduceMotion) return;
      const target =
        e.target instanceof Element
          ? e.target.closest<HTMLElement>(MAGNETIC)
          : null;
      if (target !== magnet) releaseMagnet();
      if (target) {
        magnet = target;
        const r = target.getBoundingClientRect();
        gsap.to(target, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.3,
          y: (e.clientY - (r.top + r.height / 2)) * 0.3,
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    };

    const onOver = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const labelHost = e.target.closest<HTMLElement>(LABELLED);
      const nextLabelled = !!labelHost;
      if (labelHost) labelText.textContent = labelHost.dataset.cursor ?? "";
      const nextHovering = !!e.target.closest(INTERACTIVE);
      if (nextLabelled === labelled && nextHovering === hovering) return;
      labelled = nextLabelled;
      hovering = nextHovering;
      applyState();
    };
    const onDown = () => {
      pressed = true;
      applyState();
    };
    const onUp = () => {
      pressed = false;
      applyState();
    };

    // Fade out when the pointer leaves the window entirely.
    const setVisible = (visible: boolean) =>
      gsap.to([ring, dot], {
        autoAlpha: visible ? 1 : 0,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    const onLeave = () => {
      setVisible(false);
      releaseMagnet();
      if (labelled) {
        labelled = false;
        applyState();
      }
    };
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      gsap.ticker.remove(tick);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      releaseMagnet();
      gsap.killTweensOf([ring, dot, label, look]);
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      {/* Ring and dot are white with mix-blend-difference, so they invert
          whatever is beneath them — light over the ink sections, dark over
          the cream ones — instead of vanishing on one or the other. */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-9 w-9 rounded-full border-[1.5px] border-white mix-blend-difference will-change-transform"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-1.5 w-1.5 rounded-full bg-white mix-blend-difference will-change-transform"
      />
      {/* The labelled disc ("Scroll", "Inspect"…) in black and white, like
          the ring and dot (the client's call: the brand gradient read as
          one more colour over the photos). A hairline of white holds its
          edge over dark photos. */}
      <div
        ref={labelRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[10000] flex h-20 w-20 items-center justify-center rounded-full border border-white/70 bg-black shadow-[0_8px_30px_rgba(16,13,9,0.35)] will-change-transform"
      >
        <span
          ref={labelTextRef}
          className="font-body text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white"
        />
      </div>
    </>
  );
}
