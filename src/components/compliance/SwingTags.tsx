"use client";

import { useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { CERTIFICATIONS } from "@/content/compliance";
import {
  prefersReducedMotion,
  useFinePointer,
  useIsomorphicLayoutEffect,
} from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Cert = (typeof CERTIFICATIONS)[number];

// How far each tag hangs below the rail (px, scaled up from md), so the
// row reads as a hand-hung display rather than a grid.
const DROPS = [26, 62, 38, 74, 50];
// Each tag's spring: a little stiffer or looser than its neighbours, so
// they sway out of step.
const SPRINGS = [
  { k: 52, gain: 1 },
  { k: 66, gain: 0.8 },
  { k: 46, gain: 1.15 },
  { k: 60, gain: 0.9 },
  { k: 50, gain: 1.05 },
];
const DAMPING = 2.2;
// Chamfered swing-tag outline, cut at 45° for the tag's 5:8 shape.
const TAG_SHAPE = "polygon(24% 0, 76% 0, 100% 15%, 100% 100%, 0 100%, 0 15%)";

const KICK = "tag:kick";

/**
 * The certifications as swing tags on a rail — the client's own imagery
 * hangs one on a garment stack. Each tag is a small spring: scrolling
 * blows the row about by the scroll's speed, and they settle out of step
 * when it stops; a mouse brushing past nudges one. Tap or click a tag to
 * turn it over for what the standard covers. Under reduced motion the
 * tags hang still and turn over without rotating.
 */
export default function SwingTags() {
  const fine = useFinePointer();
  const listRef = useRef<HTMLUListElement>(null);

  useIsomorphicLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const swings = Array.from(list.querySelectorAll<HTMLElement>("[data-swing]"));

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", (context) => {
      const bodies = swings.map((el, i) => ({
        el,
        angle: 0,
        vel: 0,
        ...SPRINGS[i % SPRINGS.length],
        set: gsap.quickSetter(el, "rotation", "deg") as (value: number) => void,
      }));
      let wind = 0;
      let clock = 0;

      const tick = (_time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs, 50) / 1000;
        clock += dt;
        wind *= Math.exp(-7 * dt);
        bodies.forEach((body, i) => {
          // The scroll's push, plus a faint idle breeze so they never
          // quite hang dead still.
          const target =
            gsap.utils.clamp(-12, 12, wind * 0.006 * body.gain) + Math.sin(clock * 1.2 + i * 1.7) * 0.7;
          body.vel += (-body.k * (body.angle - target) - DAMPING * body.vel) * dt;
          body.angle += body.vel * dt;
          body.set(body.angle);
        });
      };

      const onKick = (event: Event) => {
        const body = bodies.find((b) => b.el === event.target);
        if (body) body.vel += (event as CustomEvent<number>).detail;
      };
      list.addEventListener(KICK, onKick);

      gsap.set(swings, { transformOrigin: "50% 0%", y: -48, autoAlpha: 0 });

      // Hung onto the rail one by one as the row comes into view, each
      // swinging from its landing. A named context method, so the tweens
      // it starts later are still reverted with the rest.
      const hang = context.add("hang", () => {
        gsap.to(swings, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", stagger: 0.09 });
        bodies.forEach((body, i) => {
          gsap.delayedCall(0.25 + i * 0.09, () => {
            body.vel += i % 2 ? -45 : 45;
          });
        });
      });

      ScrollTrigger.create({
        trigger: list,
        start: "top 82%",
        once: true,
        onEnter: () => hang(),
      });
      // The springs only run while the row is on screen.
      ScrollTrigger.create({
        trigger: list,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          wind = self.getVelocity();
        },
        onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
      });

      return () => {
        gsap.ticker.remove(tick);
        list.removeEventListener(KICK, onKick);
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div>
      <ul
        ref={listRef}
        className="flex flex-wrap justify-center gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14"
      >
        {CERTIFICATIONS.map((cert, i) => (
          <SwingTag key={cert.code} cert={cert} index={i} fine={fine} />
        ))}
      </ul>
      <p className="mt-12 text-center font-body text-xs font-semibold uppercase tracking-[0.25em] text-cream/45 md:mt-16">
        {fine ? "Click" : "Tap"} a tag to turn it over
      </p>
    </div>
  );
}

function SwingTag({ cert, index, fine }: { cert: Cert; index: number; fine: boolean }) {
  const [turned, setTurned] = useState(false);
  const swingRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  const kick = (amount: number) =>
    swingRef.current?.dispatchEvent(new CustomEvent(KICK, { bubbles: true, detail: amount }));

  useIsomorphicLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (prefersReducedMotion()) {
      gsap.set(card, { rotationY: turned ? 180 : 0 });
      return;
    }
    gsap.to(card, { rotationY: turned ? 180 : 0, duration: 0.9, ease: "power3.inOut", overwrite: true });
    kick(turned ? 45 : -45);
  }, [turned]);

  const number = String(index + 1).padStart(2, "0");

  return (
    <li
      className="relative flex w-[calc(50%-0.5rem)] justify-center before:absolute before:-inset-x-2 before:top-0 before:h-[2px] before:bg-[repeating-linear-gradient(to_right,var(--color-gold)_0_8px,transparent_8px_16px)] before:opacity-60 sm:w-[calc(33.333%-0.667rem)] md:w-[calc(33.333%-1rem)] md:before:-inset-x-3 lg:w-[calc(20%-1.2rem)]"
      style={{ "--drop": `${DROPS[index % DROPS.length]}px` } as CSSProperties}
    >
      {/* The peg on the rail */}
      <span aria-hidden="true" className="absolute left-1/2 top-[-3px] z-10 h-2 w-2 -translate-x-1/2 rounded-full bg-gold" />

      <div
        ref={swingRef}
        data-swing
        className="flex w-full max-w-[230px] flex-col items-center"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") kick(gsap.utils.clamp(-60, 60, event.movementX * 6));
        }}
      >
        {/* The string */}
        <span aria-hidden="true" className="block h-[var(--drop)] w-px bg-gold-light/70 md:h-[calc(var(--drop)*1.5)]" />

        <div className="relative w-full [perspective:1100px]">
          {/* The string's last stretch, through the eyelet */}
          <span aria-hidden="true" className="absolute left-1/2 top-0 z-10 h-[7.5%] w-px bg-gold-light/70" />

          <div ref={cardRef} className="relative aspect-[5/8] w-full [transform-style:preserve-3d]">
            {/* Front: the code, on kraft card */}
            <div className="absolute inset-0 [backface-visibility:hidden] [filter:drop-shadow(0_18px_22px_rgba(0,0,0,0.4))]">
              <div
                className="@container relative flex h-full flex-col items-center bg-gold-light px-[9%] pb-[8%] pt-[30%] text-center"
                style={{ clipPath: TAG_SHAPE }}
              >
                <Eyelet />
                <span className="font-body text-[clamp(0.55rem,6cqw,0.7rem)] font-bold tracking-[0.3em] text-brown/70">
                  No. {number}
                </span>
                <span className="mt-[6%] font-headline text-[clamp(1.9rem,24cqw,3.4rem)] leading-none tracking-[-0.01em] text-brown">
                  {cert.code}
                </span>
                <span aria-hidden="true" className="my-[8%] h-px w-2/5 bg-brown/30" />
                <span className="font-body text-[clamp(0.6rem,6.4cqw,0.8rem)] font-semibold uppercase leading-snug tracking-[0.12em] text-ink/75">
                  {cert.name}
                </span>
                <span className="mt-auto flex w-full items-center justify-center gap-1.5 border-t border-dashed border-brown/35 pt-[7%] font-body text-[clamp(0.5rem,5.4cqw,0.65rem)] font-bold uppercase tracking-[0.2em] text-brown/70">
                  <TurnIcon />
                  Turn over
                </span>
              </div>
            </div>

            {/* Back: what the standard covers */}
            <div className="absolute inset-0 [backface-visibility:hidden] [filter:drop-shadow(0_18px_22px_rgba(0,0,0,0.4))] [transform:rotateY(180deg)]">
              <div
                className="@container relative flex h-full flex-col bg-cream px-[10%] pb-[8%] pt-[26%] text-left"
                style={{ clipPath: TAG_SHAPE }}
              >
                <Eyelet />
                <span className="w-fit font-headline text-[clamp(1.2rem,13cqw,1.9rem)] leading-none text-gradient-brand-deep">
                  {cert.code}
                </span>
                <span className="mt-[5%] font-body text-[clamp(0.5rem,5.4cqw,0.65rem)] font-bold uppercase tracking-[0.2em] text-brown/70">
                  What it covers
                </span>
                <span className="mt-[5%] font-body text-[clamp(0.64rem,6.3cqw,0.84rem)] leading-snug text-ink/80">
                  {cert.covers}
                </span>
                <span className="mt-auto flex w-full items-center gap-1.5 border-t border-dashed border-brown/30 pt-[7%] font-body text-[clamp(0.5rem,5.4cqw,0.65rem)] font-bold uppercase tracking-[0.2em] text-brown/70">
                  <TurnIcon back />
                  Turn back
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-pressed={turned}
            aria-label={`Turn over the ${cert.code} tag`}
            data-cursor={fine ? (turned ? "Turn back" : "Turn over") : undefined}
            onClick={() => setTurned((value) => !value)}
            className="absolute inset-0 z-20 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          />
        </div>
      </div>
    </li>
  );
}

/** The brass eyelet the string runs through; it shows the ground behind. */
function Eyelet() {
  return (
    <span
      aria-hidden="true"
      className="absolute left-1/2 top-[6%] aspect-square w-[13%] -translate-x-1/2 rounded-full bg-ink shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)] ring-[3px] ring-gold/85"
    />
  );
}

function TurnIcon({ back = false }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-[1.3em] w-[1.3em] ${back ? "-scale-x-100" : ""}`} aria-hidden="true">
      <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v2.8h-2.8" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
