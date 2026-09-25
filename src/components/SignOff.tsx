type Props = {
  /** "light" for cream grounds, "dark" for ink. */
  ground?: "light" | "dark";
  className?: string;
};

/**
 * The client's sign-off lockup, as it closes their About and MOQ artboards:
 * NAXIS AUSTRALIA between gold rules, "Delivering excellence through
 * experience." beneath — a sign-off, not a headline.
 */
export default function SignOff({ ground = "light", className = "" }: Props) {
  const rule =
    ground === "light" ? "bg-gradient-brand-deep" : "bg-gradient-brand";
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="flex w-full items-center justify-center gap-4 md:gap-6">
        <span aria-hidden="true" className={`h-px w-12 opacity-70 md:w-24 ${rule}`} />
        <span
          className={`font-body text-sm font-semibold uppercase tracking-[0.35em] md:text-base ${
            ground === "light" ? "text-gradient-brand-deep" : "text-gradient-brand"
          }`}
        >
          NAXIS Australia
        </span>
        <span aria-hidden="true" className={`h-px w-12 opacity-70 md:w-24 ${rule}`} />
      </div>
      <p
        className={`mt-2 font-body text-[0.65rem] uppercase tracking-[0.3em] md:text-xs ${
          ground === "light" ? "text-ink/60" : "text-cream/50"
        }`}
      >
        Delivering excellence through experience.
      </p>
    </div>
  );
}
