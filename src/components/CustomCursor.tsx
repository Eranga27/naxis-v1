"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const posRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const supportsHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    if (!supportsHover) return;

    setReady(true);
    document.documentElement.classList.add("custom-cursor-active");

    const move = (e: MouseEvent) => {
      if (posRef.current) {
        posRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const isInteractive = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest("a, button, [role='button'], input, textarea, select");

    const onOver = (e: MouseEvent) => {
      if (isInteractive(e.target)) setHovering(true);
    };
    const onOut = (e: MouseEvent) => {
      if (isInteractive(e.target)) setHovering(false);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onOut);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, []);

  if (!ready) return null;

  return (
    <div
      ref={posRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[200]"
    >
      <div
        className={`h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold transition-transform duration-200 ease-out ${
          hovering ? "scale-150" : "scale-100"
        }`}
      />
    </div>
  );
}
