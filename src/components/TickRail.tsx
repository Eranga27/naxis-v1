import type { RefObject } from "react";

type Props = {
  count: number;
  tickRefs: RefObject<Array<HTMLSpanElement | null>>;
  /** "light" for ink backgrounds, "dark" for cream ones. */
  tone: "light" | "dark";
  className?: string;
};

// Sprocket-hole tick rail for the pinned galleries — one mark per card,
// colored by createPinnedGallery as the strip scrolls.
export default function TickRail({ count, tickRefs, tone, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            tickRefs.current[i] = el;
          }}
          className={`h-3 w-[3px] shrink-0 rounded-full transition-[background-color,transform] duration-300 ${
            tone === "light" ? "bg-cream/25" : "bg-ink/20"
          }`}
        />
      ))}
    </div>
  );
}
