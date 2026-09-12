"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select";

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Enable only for real pointers. This has to settle before the second
  // effect runs, since the cursor elements aren't mounted until `ready`.
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setReady(true);
    document.documentElement.classList.add("custom-cursor-active");
    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Centre on the pointer via GSAP's own percentage offset — GSAP nulls out
    // the CSS `translate` property when it takes over transforms, so Tailwind
    // translate utilities can't be used for this. Start hidden so neither
    // element sits in the top-left corner before the first movement.
    gsap.set([ring, dot], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    let seenPointer = false;

    // The dot tracks the pointer exactly; the ring eases in behind it, which
    // is what gives the cursor its weight. Under reduced motion both snap.
    const follow = reduceMotion ? 0 : 0.55;
    const ringX = gsap.quickTo(ring, "x", { duration: follow, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: follow, ease: "power3" });
    // The dot is written directly rather than via a zero-duration quickTo,
    // whose repeated restarts clobbered the dot's scale tween on hover.
    const moveDot = (x: number, y: number) => gsap.set(dot, { x, y });

    let hovering = false;
    let pressed = false;

    const applyState = () => {
      gsap.to(ring, {
        scale: hovering ? 1.9 : pressed ? 0.8 : 1,
        borderColor: hovering
          ? "var(--color-gold-light)"
          : "var(--color-gold)",
        backgroundColor: hovering
          ? "rgba(184, 145, 47, 0.12)"
          : "rgba(184, 145, 47, 0)",
        duration: 0.3,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to(dot, {
        scale: hovering ? 0 : pressed ? 0.6 : 1,
        duration: 0.25,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const onMove = (e: MouseEvent) => {
      if (!seenPointer) {
        // Jump to the pointer on first sight rather than easing in from 0,0.
        seenPointer = true;
        gsap.set([ring, dot], { x: e.clientX, y: e.clientY });
        gsap.to([ring, dot], { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
      }
      ringX(e.clientX);
      ringY(e.clientY);
      moveDot(e.clientX, e.clientY);
    };

    const isInteractive = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest(INTERACTIVE);

    const onOver = (e: MouseEvent) => {
      if (!isInteractive(e.target) || hovering) return;
      hovering = true;
      applyState();
    };
    const onOut = (e: MouseEvent) => {
      if (!isInteractive(e.target) || !hovering) return;
      hovering = false;
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
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onOut);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      gsap.killTweensOf([ring, dot]);
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[200] h-9 w-9 rounded-full border border-gold will-change-transform"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[200] h-1.5 w-1.5 rounded-full bg-gold will-change-transform"
      />
    </>
  );
}
