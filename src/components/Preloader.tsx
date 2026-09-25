"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { INTRO_SESSION_KEY } from "@/lib/intro";

// The intro is a lockup: "Welcome to" rises in, then steps up to make
// room for the name set large in the headline face, with the place
// underneath. (V1 opened with a greeting from each country first; the
// client asked for it to start here.)
const WELCOME = "Welcome to";
const BRAND = "NAXIS";
const PLACE = "Australia";
// The letter the exit zooms through — its two strokes cross in a solid
// patch at the glyph's centre, so scaling about that point fills the
// screen with the letter itself.
const ZOOM_LETTER = BRAND.indexOf("X");
// Longest wait for the webfonts before the sequence starts anyway — see
// preloadFonts below.
const FONT_WAIT_MS = 1500;

// A soft, low-saturation warm wash behind the lockup.
const WELCOME_GRADIENT =
  "linear-gradient(135deg, #FDF8ED 0%, #F4EFE4 55%, #FBEFD8 100%)";

const LOCKUP_HOLD_MS = 1300; // time to read the finished lockup
const TEXT_FADE_MS = 400;

// The exit, in seconds from the moment the hero is revealed: the name's
// letters become windows onto the hero, hold a beat, then the camera
// pushes through the X into it.
const FILL_BEAT = 0.3;
const ZOOM_DURATION = 1.25;
// Exported so the hero can time its entrance to the zoom.
export const VEIL_EXIT_MS = (FILL_BEAT + ZOOM_DURATION) * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fills an element with one inline-block span per letter, to animate. */
function letterSpans(el: HTMLElement, text: string) {
  el.textContent = "";
  return Array.from(text).map((ch) => {
    const span = document.createElement("span");
    span.className = "inline-block";
    // A plain space would collapse inside an inline-block span.
    span.textContent = ch === " " ? "\u00a0" : ch;
    el.appendChild(span);
    return span;
  });
}

/**
 * Where the capitals actually sit inside a text box, and where its
 * baseline is. The box's own rect includes the font's ascent/descent
 * padding (and any extra line-height), which would space the lockup off
 * the empty band above and below the letters rather than off the letters.
 */
function textBand(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const size = parseFloat(style.fontSize);
  const lineHeight = parseFloat(style.lineHeight) || size;
  // Fallback for engines without font metrics on canvas: caps roughly
  // fill the middle 70% of the em box.
  let baseline = rect.top + (lineHeight - size) / 2 + size * 0.85;
  let top = baseline - size * 0.7;
  let bottom = baseline;
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${size}px ${style.fontFamily}`;
    const m = ctx.measureText(el.textContent || "X");
    if (m.fontBoundingBoxAscent !== undefined) {
      const halfLeading = (lineHeight - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      baseline = rect.top + halfLeading + m.fontBoundingBoxAscent;
      top = baseline - m.actualBoundingBoxAscent;
      bottom = baseline + m.actualBoundingBoxDescent;
    }
  }
  return { top, bottom, baseline, size };
}

type Props = {
  /** Fired the moment the hero starts showing through the veil. */
  onReveal?: () => void;
  /** Resolves when the hero is ready to be seen; the veil waits on it. */
  waitForMedia?: () => Promise<void>;
};

export default function Preloader({ onReveal, waitForMedia }: Props) {
  const [done, setDone] = useState(false);
  const veilRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLSpanElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const maskRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const placeRef = useRef<HTMLDivElement>(null);
  const placeTextRef = useRef<HTMLSpanElement>(null);
  const ruleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const cancelled = useRef(false);
  const revealed = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    const veil = veilRef.current;
    const box = boxRef.current;
    const lockup = lockupRef.current;
    const mark = markRef.current;
    const place = placeRef.current;
    const placeText = placeTextRef.current;
    const masks = maskRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    const letters = letterRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    const rules = ruleRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    if (
      !veil ||
      !box ||
      !lockup ||
      !mark ||
      !place ||
      !placeText ||
      masks.length !== BRAND.length ||
      letters.length !== BRAND.length
    ) {
      return;
    }

    // Every tween this intro starts, so an unmount mid-sequence kills them.
    // The lockup's hidden start states are set here rather than inline, so
    // GSAP owns those transforms from the outset (an inline percentage
    // translate would be read back as a pixel offset and stick).
    const tweens = gsap.context(() => {
      gsap.set(letters, { yPercent: 110 });
      gsap.set(rules, { scaleX: 0 });
    });
    // Runs a timeline inside the context and resolves when it ends.
    const play = (build: (tl: gsap.core.Timeline) => void) =>
      new Promise<void>((resolve) => {
        tweens.add(() => {
          const tl = gsap.timeline({ onComplete: resolve });
          build(tl);
        });
      });

    // "Welcome to" would otherwise first appear in a fallback face and
    // then visibly swap, and the lockup is measured around the name's
    // face. Load them before starting, capped so a slow network can't
    // hold the intro on a blank screen.
    const preloadFonts = async () => {
      if (!document.fonts?.load) return;
      const face = (el: HTMLElement) => {
        const style = getComputedStyle(el);
        return `${style.fontStyle} ${style.fontWeight} 48px ${style.fontFamily}`;
      };
      const loads = [
        document.fonts.load(face(box), WELCOME),
        document.fonts.load(face(placeText), PLACE),
        document.fonts.load(face(mark), BRAND),
      ].map((p) => p.catch(() => []));
      await Promise.race([Promise.all(loads), sleep(FONT_WAIT_MS)]);
    };

    const fireReveal = () => {
      if (revealed.current) return;
      revealed.current = true;
      // Marked only once the intro has actually reached the reveal, so an
      // interrupted run still replays — and so React's dev double-mount
      // can't make the second mount skip the sequence the first started.
      try {
        sessionStorage.setItem(INTRO_SESSION_KEY, "done");
      } catch {
        // private mode / storage disabled
      }
      onReveal?.();
    };

    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_SESSION_KEY) === "done";
    } catch {
      // private mode / storage disabled — treat as unseen
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Already played this session: never show the veil at all.
    if (seen) {
      fireReveal();
      setDone(true);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // The veil only covers the page visually. Without this, Tab lands on
    // the Nav links underneath it while the intro is still playing. Every
    // other top-level body child is made inert until the veil is gone.
    const inerted = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== veil && !el.inert
    );
    inerted.forEach((el) => {
      el.inert = true;
    });
    const releaseInert = () => {
      inerted.forEach((el) => {
        el.inert = false;
      });
    };

    // Positions the lockup around the name, which sits dead centre:
    // "Welcome to" above it, the place below it, both spaced off the
    // capitals themselves. Returns how far "Welcome to" has to travel up
    // from the centre, where it appeared.
    const layoutLockup = () => {
      const caps = textBand(mark);
      const gap = Math.max(12, (caps.bottom - caps.top) * 0.14);
      const welcome = textBand(box);
      place.style.top = `${Math.round(caps.bottom + gap)}px`;
      lockup.style.visibility = "visible";
      place.style.visibility = "visible";
      return caps.top - gap - welcome.baseline;
    };

    // The zoom's origin and scale: the X's centre, and enough scale for
    // the solid patch where its strokes cross (conservatively 3% of the
    // font size across) to cover the farthest corner of the screen.
    const zoomTarget = () => {
      const caps = textBand(mark);
      const markRect = mark.getBoundingClientRect();
      const xRect = masks[ZOOM_LETTER].getBoundingClientRect();
      const cx = xRect.left + xRect.width / 2;
      const cy = (caps.top + caps.bottom) / 2;
      const reach = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
      return {
        origin: `${cx - markRect.left}px ${cy - markRect.top}px`,
        scale: reach / (caps.size * 0.03),
      };
    };

    const holdForMedia = async (minMs: number) => {
      await Promise.all([sleep(minMs), waitForMedia ? waitForMedia().catch(() => {}) : Promise.resolve()]);
    };

    const release = () => {
      document.body.style.overflow = prevOverflow;
      releaseInert();
      // Hides the veil markup on later client-side visits to the homepage
      // before it can paint for a frame (see html.intro-seen in globals).
      // Only now the veil is finished: set at the reveal, it hid the veil
      // on the spot and cut off the zoom through the X.
      document.documentElement.classList.add("intro-seen");
      setDone(true);
    };

    const runReduced = async () => {
      // No zoom — the finished lockup, briefly, then a plain fade. The
      // name's face still has to be loaded before the lockup is measured
      // around it.
      await preloadFonts();
      if (cancelled.current) return;
      box.textContent = WELCOME;
      const lift = layoutLockup();
      gsap.set(box, { y: lift, opacity: 1 });
      gsap.set(letters, { yPercent: 0 });
      gsap.set(rules, { scaleX: 1 });
      gsap.set(placeText, { opacity: 1 });
      await holdForMedia(900);
      if (cancelled.current) return;
      fireReveal();
      veil.style.transition = `opacity ${TEXT_FADE_MS}ms ease`;
      veil.style.opacity = "0";
      await sleep(TEXT_FADE_MS);
      if (cancelled.current) return;
      release();
    };

    const run = async () => {
      if (reduceMotion) {
        await runReduced();
        return;
      }

      await preloadFonts();
      if (cancelled.current) return;

      // "Welcome to" rises out of a blur, letter by letter.
      const welcome = letterSpans(box, WELCOME);
      gsap.set(box, { opacity: 1 });
      await play((tl) => {
        tl.fromTo(
          welcome,
          { yPercent: 70, opacity: 0, filter: "blur(10px)" },
          { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "expo.out", stagger: 0.04 }
        );
      });
      if (cancelled.current) return;

      // The lockup: "Welcome to" steps up as the name rises letter by
      // letter beneath it, then the place and its gold -> emerald rules
      // open out underneath.
      const lift = layoutLockup();
      await play((tl) => {
        tl.to(box, { y: lift, duration: 1, ease: "expo.inOut" }, 0.1)
          .fromTo(letters, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.07 }, 0.35)
          .fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "expo.inOut" }, 0.75)
          .fromTo(
            placeText,
            { opacity: 0, letterSpacing: "1.1em", marginRight: "-1.1em" },
            { opacity: 1, letterSpacing: "0.55em", marginRight: "-0.55em", duration: 1.2, ease: "expo.out" },
            0.8
          );
      });
      if (cancelled.current) return;

      // Hold on the lockup until the hero is actually ready, so the exit
      // never lands on an unloaded wheel.
      await holdForMedia(LOCKUP_HOLD_MS);
      if (cancelled.current) return;

      // The exit. The words around the name step aside and the name turns
      // pure black; the veil then switches to a lighten blend, which keeps
      // whichever is lighter per channel — the pale wash beats the dark
      // hero, while black letters give way to it entirely. So the letters
      // become windows onto the hero, which starts its entrance right
      // then. Finally the name scales up about the centre of its X until
      // the crossing strokes fill the screen: the camera pushes through
      // the letter into the hero. expo.in on the scale reads as a steady
      // push, since perceived zoom follows the log of the scale. The last
      // few frames also fade the veil, in case an engine can't blend it.
      gsap.set(masks, { clipPath: "none" });
      const zoom = zoomTarget();
      gsap.set(mark, { transformOrigin: zoom.origin });
      await play((tl) => {
        tl.to([box, place], { opacity: 0, duration: 0.35, ease: "power2.in" }, 0)
          .to(mark, { color: "#000", duration: 0.35 }, 0)
          .add(() => {
            veil.style.mixBlendMode = "lighten";
            fireReveal();
          }, 0.35)
          .to(mark, { scale: zoom.scale, duration: ZOOM_DURATION, ease: "expo.in" }, 0.35 + FILL_BEAT)
          .to(veil, { opacity: 0, duration: 0.2, ease: "none" }, 0.35 + FILL_BEAT + ZOOM_DURATION - 0.2);
      });
      if (cancelled.current) return;

      release();
    };

    void run();

    return () => {
      cancelled.current = true;
      tweens.revert();
      document.body.style.overflow = prevOverflow;
      releaseInert();
    };
  }, [onReveal, waitForMedia]);

  if (done) return null;

  return (
    <div
      ref={veilRef}
      data-preloader
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ backgroundImage: WELCOME_GRADIENT }}
    >
      {/* The name, dead centre, set in the headline face. Each letter
          rises out of its own mask; the masks clip only below the
          baseline, so nothing above the capitals is ever cut. Hidden until
          the lockup is laid out. */}
      <div
        ref={lockupRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ visibility: "hidden" }}
      >
        <div ref={markRef} className="flex font-headline text-[clamp(6rem,30vw,19rem)] font-normal leading-none text-ink">
          {BRAND.split("").map((letter, i) => (
            <span
              key={i}
              ref={(el) => {
                maskRefs.current[i] = el;
              }}
              className="inline-block"
              style={{ clipPath: "inset(-50% -20% 0 -20%)" }}
            >
              <span
                ref={(el) => {
                  letterRefs.current[i] = el;
                }}
                className="inline-block"
              >
                {letter}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* The place, under the name — its top is set in layoutLockup. */}
      <div
        ref={placeRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-4 sm:gap-7"
        style={{ visibility: "hidden" }}
      >
        <span
          ref={(el) => {
            ruleRefs.current[0] = el;
          }}
          className="bg-gradient-brand-deep h-px w-10 origin-right sm:w-28"
        />
        <span
          ref={placeTextRef}
          className="text-gradient-brand-deep font-body text-[clamp(0.75rem,1.5vw,1.3rem)] font-semibold uppercase"
          style={{ opacity: 0, letterSpacing: "0.55em", marginRight: "-0.55em" }}
        >
          {PLACE}
        </span>
        <span
          ref={(el) => {
            ruleRefs.current[1] = el;
          }}
          className="bg-gradient-brand-deep h-px w-10 origin-left sm:w-28"
        />
      </div>

      {/* "Welcome to": laid over the centre and lifted above the name once
          the lockup forms. */}
      <span
        ref={boxRef}
        aria-hidden="true"
        className="absolute z-20 whitespace-nowrap font-greeting text-[clamp(2.25rem,5.5vw,4.5rem)] italic leading-[1.2] text-ink"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
