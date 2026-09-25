"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import CurtainImage from "@/components/motion/CurtainImage";
import SplitReveal from "@/components/motion/SplitReveal";
import Reveal from "@/components/Reveal";
import { PROCESS_INTRO, PROCESS_STEPS, SUCCESS_STEP } from "@/content/process";
import { getService } from "@/content/services";
import { useIsomorphicLayoutEffect } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

// Where on screen the thread is drawn to, as a share of the viewport
// height: each stage's node lights as it crosses this line.
const DRAW_LINE = 0.6;

const dashes = "repeating-linear-gradient(to bottom, var(--color-gold) 0 8px, transparent 8px 16px)";

/**
 * How We Work's spine: the client's process diagram as one thread. The
 * eight stages hang off a dashed gold line (the diagram's own arrows) that
 * draws itself down the page with the scroll, a bead of light at its tip,
 * and each stage's node lights as the thread reaches it, ending on the
 * diagram's flag, "Your Success". Desktop alternates the stages either
 * side of a centre line; phones run the line down the left. Under reduced
 * motion the thread is drawn and every node is lit.
 */
export default function StageThread() {
  const rootRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLSpanElement>(null);
  const beadRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const thread = threadRef.current;
    const bead = beadRef.current;
    if (!root || !thread || !bead) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-node]"));
    if (nodes.length < 2) return;

    // The thread runs from the first node's centre to the last's, measured
    // from layout offsets (which transforms don't affect) before every
    // refresh, so a resize or a late reflow re-derives it.
    let top = 0;
    let length = 0;
    const centreOf = (el: HTMLElement) => {
      let y = el.offsetHeight / 2;
      let node: HTMLElement | null = el;
      while (node && node !== root) {
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return y;
    };
    const measure = () => {
      top = centreOf(nodes[0]);
      length = centreOf(nodes[nodes.length - 1]) - top;
      gsap.set(thread, { top, height: length });
      gsap.set(bead, { top });
    };
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);

    const light = (node: HTMLElement, on: boolean) => {
      node.dataset.state = on ? "on" : "off";
    };

    const mm = gsap.matchMedia();
    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
      (context) => {
        if ((context.conditions as { reduce: boolean }).reduce) {
          nodes.forEach((node) => light(node, true));
          gsap.set(bead, { autoAlpha: 0 });
          return;
        }

        nodes.forEach((node) => light(node, false));
        const at = `${DRAW_LINE * 100}%`;
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root,
              start: () => `top+=${top} ${at}`,
              end: () => `top+=${top + length} ${at}`,
              scrub: 0.3,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(thread, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", ease: "none" }, 0)
          .fromTo(bead, { y: 0 }, { y: () => length, ease: "none" }, 0);

        nodes.forEach((node) =>
          ScrollTrigger.create({
            trigger: node,
            start: `center ${at}`,
            onEnter: () => light(node, true),
            onLeaveBack: () => light(node, false),
          })
        );
      }
    );

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      mm.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {/* The thread and the bead of light at its tip. Placed with margins,
          not translate: GSAP's y would replace a translate. */}
      <span
        ref={threadRef}
        aria-hidden="true"
        className="absolute left-[27px] w-[2px] lg:left-[calc(50%-1px)]"
        style={{ backgroundImage: dashes }}
      />
      <span
        ref={beadRef}
        aria-hidden="true"
        className="absolute left-[28px] z-[5] -ml-2 -mt-2 h-4 w-4 rounded-full bg-gold shadow-[0_0_18px_4px_rgba(255,201,74,0.55)] lg:left-1/2"
      />

      <ol className="relative flex flex-col">
        {PROCESS_STEPS.map((step, i) => {
          const service = step.service ? getService(step.service) : undefined;
          // Desktop alternates: text left and photo right, then swapped.
          const textLeft = i % 2 === 0;
          return (
            <li
              key={step.label}
              className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-5 pb-20 sm:gap-x-8 md:pb-28 lg:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)] lg:gap-x-0 lg:pb-36"
            >
              <Node className="col-start-1 row-start-1 lg:col-start-2">{step.number}</Node>

              <div
                className={`col-start-2 row-start-1 ${
                  textLeft ? "lg:col-start-1 lg:pr-14 lg:text-right" : "lg:col-start-3 lg:pl-14"
                }`}
              >
                <p
                  className={`mb-3 w-fit font-body text-xs font-bold uppercase tracking-[0.3em] text-gradient-brand md:text-sm ${
                    textLeft ? "lg:ml-auto" : ""
                  }`}
                >
                  Stage {step.number}
                </p>
                <SplitReveal
                  as="h3"
                  className="font-headline text-[clamp(2.5rem,6vw,5.25rem)] uppercase leading-[0.95] tracking-[-0.01em] text-cream"
                >
                  {step.label}
                </SplitReveal>
                <Reveal className={`mt-5 max-w-md ${textLeft ? "lg:ml-auto" : ""}`}>
                  <p className="font-body text-base leading-relaxed text-cream/70 md:text-lg">{step.description}</p>
                  {service && (
                    <Link
                      href={`/services/${service.slug}`}
                      className="group mt-6 inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-gold transition-colors hover:text-cream md:text-sm"
                    >
                      {service.title}
                      <span aria-hidden="true" className="transition-[translate] duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  )}
                </Reveal>
              </div>

              <div
                className={`col-start-2 mt-10 lg:row-start-1 lg:mt-0 ${
                  textLeft ? "lg:col-start-3 lg:pl-14" : "lg:col-start-1 lg:pr-14"
                }`}
              >
                <CurtainImage
                  src={step.image}
                  alt={step.imageAlt}
                  sizes="(min-width: 1024px) 40vw, 85vw"
                  className="aspect-[4/3] w-full rounded-3xl"
                />
              </div>
            </li>
          );
        })}

        {/* The diagram's last stage: a flag */}
        <li className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-5 sm:gap-x-8 lg:grid-cols-1 lg:justify-items-center lg:text-center">
          <Node className="col-start-1 row-start-1" label={SUCCESS_STEP.label}>
            <FlagIcon />
          </Node>
          <div className="col-start-2 row-start-1 lg:col-start-1 lg:row-start-2 lg:mt-10">
            <p className="mb-3 w-fit font-body text-xs font-bold uppercase tracking-[0.3em] text-gradient-brand md:text-sm lg:mx-auto">
              Stage {SUCCESS_STEP.number}
            </p>
            <SplitReveal
              as="h3"
              className="font-headline text-[clamp(3rem,9vw,8rem)] uppercase leading-[0.92] tracking-[-0.01em] text-cream"
            >
              {`${SUCCESS_STEP.label}.`}
            </SplitReveal>
            <Reveal className="mt-5">
              <p className="max-w-xl font-serif text-xl italic leading-snug text-cream/75 md:text-2xl lg:mx-auto">
                {PROCESS_INTRO.focus}
              </p>
            </Reveal>
          </div>
        </li>
      </ol>
    </div>
  );
}

/** A stage's node on the thread, lit once the thread reaches it — the
    diagram's ringed circle with its dot beneath. */
function Node({ children, className = "", label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <span
      data-node
      data-state="on"
      aria-label={label}
      role={label ? "img" : undefined}
      className={`relative z-10 flex h-14 w-14 items-center justify-center self-start justify-self-center rounded-full border-2 border-cream/25 bg-ink font-headline text-2xl text-cream/60 transition-[background-color,border-color,color,scale] duration-500 data-[state=on]:scale-110 data-[state=on]:border-gold data-[state=on]:bg-gold data-[state=on]:text-ink lg:h-20 lg:w-20 lg:text-3xl ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute -bottom-3.5 left-1/2 -ml-[3px] h-1.5 w-1.5 rounded-full bg-emerald-bright"
      />
    </span>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 lg:h-8 lg:w-8" aria-hidden="true">
      <path d="M6 21V4" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M6 4.5c3-1.6 5.2 1.4 8.2 0 1.4-.6 2.6-.7 3.8-.4v8.6c-1.2-.3-2.4-.2-3.8.4-3 1.4-5.2-1.6-8.2 0z" fill="currentColor" />
    </svg>
  );
}
