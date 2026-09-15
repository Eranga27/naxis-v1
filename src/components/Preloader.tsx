"use client";

import { useEffect, useRef, useState } from "react";

// Each greeting in its own script. Vietnamese and Italian are natively
// Latin, so they stay as written.
const GREETINGS = [
  "ආයුබෝවන්", // Sinhala — Sri Lanka
  "नमस्ते", // Devanagari — India
  "স্বাগতম", // Bengali — Bangladesh
  "Xin chào", // Vietnamese
  "你好", // Simplified Chinese
  "Ciao", // Italian
];
const FINAL = "Welcome to NAXIS Australia";
// "NAXIS" gets a brand-gold accent once the phrase finishes typing — see
// the reveal after typeIn(FINAL) below.
const FINAL_ACCENT = "NAXIS";
const FINAL_ACCENT_COLOR = "#FFC94A"; // --color-gold

// One gradient per greeting above, same order — a loose mood cue built from
// each country's flag palette, not a literal reproduction of the flag's
// geometry. Bangladesh/Vietnam/China lean on their flags' actual two-tone
// field+emblem colors; Sri Lanka/India/Italy get a third stop for their
// tricolore-style flags.
const COUNTRY_GRADIENTS = [
  "linear-gradient(135deg, #8D153A 0%, #FFB612 50%, #007847 100%)", // Sri Lanka
  "linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)", // India
  "linear-gradient(135deg, #006A4E 0%, #F42A41 100%)", // Bangladesh
  "linear-gradient(135deg, #DA251D 0%, #FFCD00 100%)", // Vietnam
  "linear-gradient(135deg, #DE2910 0%, #FFDE00 100%)", // China
  "linear-gradient(135deg, #008C45 0%, #F4F5F0 50%, #CD212A 100%)", // Italy
];

// Cream text + a soft dark shadow keeps the greeting legible over every
// gradient above, light bands included, without needing a bespoke text
// color per country. Dropped back to plain black once "Welcome" settles
// the background to white.
const GREETING_TEXT_COLOR = "#FBF4E4";
const GREETING_TEXT_SHADOW = "0 2px 10px rgba(0,0,0,0.35)";

// Rather than cut straight from the last flag gradient to flat white, the
// destination phrase gets one more crossfade — into a soft, low-saturation
// warm wash (not another flag; this one's the brand, not a country) — so
// the sequence still reads as one continuous fade rather than an abrupt
// stop, right before the veil itself clears.
const WELCOME_GRADIENT =
  "linear-gradient(135deg, #FDF8ED 0%, #F4EFE4 55%, #FBEFD8 100%)";

const CHAR_MS = 45; // per-character type / delete speed
const WORD_HOLD_MS = 620; // pause once a greeting is fully typed
const FINAL_HOLD_MS = 1800; // a beat longer — there's more to read now
const TEXT_FADE_MS = 400;
const BG_FADE_MS = 650; // flag-gradient crossfade duration

// The same smooth-decelerate curve behind most premium site-load reveals
// (an expo-out shape) — used for the exit below instead of a flat linear
// fade, so the reveal feels like it's settling into place rather than
// just dissolving.
const PREMIUM_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
// Exported so Hero can delay its headline entrance until this iris has
// actually finished closing — see the note above VEIL_EXIT_MS's usage
// below for why that matters.
export const VEIL_EXIT_MS = 950;

export const INTRO_SESSION_KEY = "naxis:intro-seen";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Split into grapheme clusters, not code points. Indic scripts build a single
 * visible character from a consonant plus dependent vowel signs and viramas —
 * splitting by code point would type and delete orphaned marks mid-cluster.
 */
const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

const chars = (word: string): string[] =>
  segmenter
    ? Array.from(segmenter.segment(word), (s) => s.segment)
    : Array.from(word);

type Props = {
  /** Fired the moment the white veil starts clearing. */
  onReveal?: () => void;
  /** Resolves when the hero video is buffered; the veil waits on it. */
  waitForMedia?: () => Promise<void>;
};

export default function Preloader({ onReveal, waitForMedia }: Props) {
  const [done, setDone] = useState(false);
  const veilRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const bgLayerARef = useRef<HTMLDivElement>(null);
  const bgLayerBRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);
  const revealed = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    const veil = veilRef.current;
    const text = textRef.current;
    const bgLayerA = bgLayerARef.current;
    const bgLayerB = bgLayerBRef.current;
    if (!veil || !text || !bgLayerA || !bgLayerB) return;

    const write = (value: string) => {
      if (!cancelled.current) text.textContent = value;
    };

    // Two stacked full-bleed layers, crossfaded between each other — the
    // standard trick for animating a gradient smoothly, since browsers
    // can't interpolate between two multi-stop gradients directly.
    let activeLayer: 0 | 1 = 0;
    const crossfadeBg = (gradient: string) => {
      const layers = [bgLayerA, bgLayerB];
      const showing = layers[activeLayer];
      const hidden = layers[1 - activeLayer];
      hidden.style.backgroundImage = gradient;
      hidden.style.opacity = "1";
      showing.style.opacity = "0";
      activeLayer = (1 - activeLayer) as 0 | 1;
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

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Already played this session: never show the veil at all.
    if (seen) {
      fireReveal();
      setDone(true);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const typeIn = async (word: string) => {
      const list = chars(word);
      for (let i = 1; i <= list.length; i++) {
        if (cancelled.current) return;
        write(list.slice(0, i).join(""));
        await sleep(CHAR_MS);
      }
    };

    const deleteOut = async (word: string) => {
      const list = chars(word);
      for (let i = list.length - 1; i >= 0; i--) {
        if (cancelled.current) return;
        write(list.slice(0, i).join(""));
        await sleep(CHAR_MS);
      }
    };

    const finish = async () => {
      // Hold on "Welcome" until the hero media is actually ready, so the
      // reveal never lands on an unloaded video.
      if (waitForMedia) {
        try {
          await waitForMedia();
        } catch {
          // fall through and reveal anyway
        }
      }
      if (cancelled.current) return;

      text.style.opacity = "0";
      await sleep(TEXT_FADE_MS);
      if (cancelled.current) return;

      // Close like an iris — the veil shrinks to a point at screen-center
      // (with a whisper of scale for a touch of "pop") instead of fading
      // uniformly. Reads as far more deliberate than a plain dissolve.
      //
      // clip-path: circle() defines the region that STAYS visible, so as
      // it shrinks, the screen uncovers from the outer edges inward, with
      // dead-center — where the headline sits — revealed LAST. That's
      // deliberate, not a bug: the video (which starts fading/scaling in
      // immediately on reveal) is what shows through the shrinking ring
      // first, and Hero's headline entrance is timed to only start once
      // this iris has fully closed (see VEIL_EXIT_MS in Hero.tsx), so the
      // text animates into view on an already-visible backdrop instead of
      // playing out hidden behind the still-opaque center and only
      // appearing once already fully resolved.
      veil.style.clipPath = "circle(0% at 50% 50%)";
      veil.style.transform = "scale(1.04)";
      fireReveal();
      await sleep(VEIL_EXIT_MS);
      if (cancelled.current) return;

      document.body.style.overflow = prevOverflow;
      setDone(true);
    };

    const run = async () => {
      if (reduceMotion) {
        // No cycling, no typewriter — just the destination word, briefly.
        write(FINAL);
        text.style.opacity = "1";
        await sleep(700);
        if (cancelled.current) return;
        await finish();
        return;
      }

      // First greeting fades in rather than typing, its flag gradient
      // fading in alongside it.
      text.style.color = GREETING_TEXT_COLOR;
      text.style.textShadow = GREETING_TEXT_SHADOW;
      crossfadeBg(COUNTRY_GRADIENTS[0]);
      write(GREETINGS[0]);
      text.style.opacity = "1";
      await sleep(TEXT_FADE_MS + WORD_HOLD_MS);

      for (let i = 1; i < GREETINGS.length; i++) {
        if (cancelled.current) return;
        crossfadeBg(COUNTRY_GRADIENTS[i]);
        await deleteOut(GREETINGS[i - 1]);
        await typeIn(GREETINGS[i]);
        await sleep(WORD_HOLD_MS);
      }

      if (cancelled.current) return;
      await deleteOut(GREETINGS[GREETINGS.length - 1]);

      // One last crossfade into a soft brand wash rather than a hard cut
      // to flat white — the destination phrase, not another country.
      crossfadeBg(WELCOME_GRADIENT);
      text.style.color = "#100d09"; // --color-ink
      text.style.textShadow = "none";
      await typeIn(FINAL);
      if (cancelled.current) return;

      // "NAXIS" gets its gold accent a beat after the phrase finishes
      // typing, not mid-type — a quiet flourish on the brand name rather
      // than a distraction while it's still being read.
      const accentStart = FINAL.indexOf(FINAL_ACCENT);
      if (accentStart !== -1) {
        text.innerHTML =
          FINAL.slice(0, accentStart) +
          `<span style="color:inherit;transition:color ${BG_FADE_MS}ms ease">${FINAL_ACCENT}</span>` +
          FINAL.slice(accentStart + FINAL_ACCENT.length);
        await sleep(150);
        if (cancelled.current) return;
        const accentEl = text.querySelector("span");
        if (accentEl) accentEl.style.color = FINAL_ACCENT_COLOR;
      }

      await sleep(FINAL_HOLD_MS);
      if (cancelled.current) return;

      await finish();
    };

    void run();

    return () => {
      cancelled.current = true;
      document.body.style.overflow = prevOverflow;
    };
  }, [onReveal, waitForMedia]);

  if (done) return null;

  return (
    <div
      ref={veilRef}
      data-preloader
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
      style={{
        clipPath: "circle(150% at 50% 50%)",
        transform: "scale(1)",
        transition: `clip-path ${VEIL_EXIT_MS}ms ${PREMIUM_EASE}, transform ${VEIL_EXIT_MS}ms ${PREMIUM_EASE}`,
      }}
    >
      {/* Two stacked layers crossfaded between each other to animate the
          flag-gradient backdrop — see crossfadeBg above. */}
      <div
        ref={bgLayerARef}
        className="absolute inset-0 z-0"
        style={{ opacity: 0, transition: `opacity ${BG_FADE_MS}ms ease` }}
      />
      <div
        ref={bgLayerBRef}
        className="absolute inset-0 z-0"
        style={{ opacity: 0, transition: `opacity ${BG_FADE_MS}ms ease` }}
      />

      <span
        ref={textRef}
        className="relative z-10 inline-block min-h-[1.3em] max-w-[90vw] text-center font-greeting text-[clamp(2rem,5.5vw,4.25rem)] font-light leading-[1.3] tracking-[-0.02em] text-black"
        style={{
          opacity: 0,
          transition: `opacity ${TEXT_FADE_MS}ms ease-out, color ${BG_FADE_MS}ms ease, text-shadow ${BG_FADE_MS}ms ease`,
        }}
      />
    </div>
  );
}
