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
// "NAXIS" gets a gold -> emerald accent once the phrase finishes typing —
// see the reveal after typeIn(FINAL) below. The deep variant of the brand
// gradient, since plain gold is too faint on the light welcome wash.
const FINAL_ACCENT = "NAXIS";
const FINAL_ACCENT_GRADIENT =
  "linear-gradient(100deg, #b8860b 0%, #1f6f4a 70%, #0d4230 100%)";
// Longest wait for the greeting webfonts before the sequence starts
// anyway — see preloadFonts below.
const FONT_WAIT_MS = 1500;

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
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const bgLayerARef = useRef<HTMLDivElement>(null);
  const bgLayerBRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);
  const revealed = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    const veil = veilRef.current;
    const box = boxRef.current;
    const text = textRef.current;
    const measure = measureRef.current;
    const bgLayerA = bgLayerARef.current;
    const bgLayerB = bgLayerBRef.current;
    if (!veil || !box || !text || !measure || !bgLayerA || !bgLayerB) return;

    const write = (value: string) => {
      if (!cancelled.current) text.textContent = value;
    };

    // A centered line that grows one character at a time re-centers on
    // every keystroke, so the whole word visibly shuffles left as it types.
    // Instead the box is locked to the full word's width up front and the
    // text types left-to-right inside it. Words too wide for the screen
    // (the final phrase on phones) get their font size scaled down to fit
    // on one line, rather than wrapping mid-type.
    const lockWidth = (word: string) => {
      box.style.fontSize = "";
      measure.style.fontSize = "";
      measure.textContent = word;
      let width = measure.getBoundingClientRect().width;
      const maxWidth = window.innerWidth * 0.9;
      if (width > maxWidth) {
        const base = parseFloat(getComputedStyle(measure).fontSize);
        const fitted = `${Math.floor(base * (maxWidth / width))}px`;
        box.style.fontSize = fitted;
        measure.style.fontSize = fitted;
        width = measure.getBoundingClientRect().width;
      }
      box.style.width = `${Math.ceil(width)}px`;
    };

    // The greeting fonts are unicode-range subsets, which the browser only
    // fetches once a glyph from that script is first on screen — so each
    // greeting used to type its first characters in a fallback face and
    // then visibly swap mid-word. Load every one before starting instead,
    // capped so a slow network can't hold the intro on a blank screen.
    const preloadFonts = async () => {
      if (!document.fonts?.load) return;
      const family = getComputedStyle(text).fontFamily;
      const loads = [...GREETINGS, FINAL].map((word) =>
        document.fonts.load(`300 48px ${family}`, word).catch(() => [])
      );
      await Promise.race([Promise.all(loads), sleep(FONT_WAIT_MS)]);
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

    // The veil only covers the page visually. Without this, Tab lands on
    // the Nav links underneath it while the intro is still playing. Every
    // other top-level body child is made inert until the veil is gone.
    const inerted = Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el !== veil && !el.inert
    );
    inerted.forEach((el) => {
      el.inert = true;
    });
    const releaseInert = () => {
      inerted.forEach((el) => {
        el.inert = false;
      });
    };

    const typeIn = async (word: string) => {
      lockWidth(word);
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

      box.style.opacity = "0";
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
      releaseInert();
      setDone(true);
    };

    const run = async () => {
      if (reduceMotion) {
        // No cycling, no typewriter — just the destination word, briefly.
        lockWidth(FINAL);
        write(FINAL);
        box.style.opacity = "1";
        await sleep(700);
        if (cancelled.current) return;
        await finish();
        return;
      }

      await preloadFonts();
      if (cancelled.current) return;

      // First greeting fades in rather than typing, its flag gradient
      // fading in alongside it.
      box.style.color = GREETING_TEXT_COLOR;
      box.style.textShadow = GREETING_TEXT_SHADOW;
      crossfadeBg(COUNTRY_GRADIENTS[0]);
      lockWidth(GREETINGS[0]);
      write(GREETINGS[0]);
      box.style.opacity = "1";
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
      box.style.color = "#100d09"; // --color-ink
      box.style.textShadow = "none";
      await typeIn(FINAL);
      if (cancelled.current) return;

      // "NAXIS" gets its gold accent a beat after the phrase finishes
      // typing, not mid-type — a quiet flourish on the brand name rather
      // than a distraction while it's still being read.
      const accentStart = FINAL.indexOf(FINAL_ACCENT);
      if (accentStart !== -1) {
        // The gradient is clipped to the glyphs from the start, hidden under
        // a solid ink fill; fading that fill to transparent reveals it.
        text.innerHTML =
          FINAL.slice(0, accentStart) +
          `<span style="color:#100d09;background-image:${FINAL_ACCENT_GRADIENT};-webkit-background-clip:text;background-clip:text;transition:color ${BG_FADE_MS}ms ease">${FINAL_ACCENT}</span>` +
          FINAL.slice(accentStart + FINAL_ACCENT.length);
        await sleep(150);
        if (cancelled.current) return;
        const accentEl = text.querySelector("span");
        if (accentEl) accentEl.style.color = "transparent";
      }

      await sleep(FINAL_HOLD_MS);
      if (cancelled.current) return;

      await finish();
    };

    void run();

    return () => {
      cancelled.current = true;
      document.body.style.overflow = prevOverflow;
      releaseInert();
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

      {/* Fixed height and line-height so switching between scripts with
          different vertical metrics never nudges the line up or down; the
          width is locked per word in lockWidth above. */}
      <span
        ref={boxRef}
        className="relative z-10 inline-flex h-[1.5em] items-center justify-start whitespace-nowrap font-greeting text-[clamp(2rem,5.5vw,4.25rem)] font-light leading-[1.5] tracking-[-0.02em] text-black"
        style={{
          opacity: 0,
          transition: `opacity ${TEXT_FADE_MS}ms ease-out, color ${BG_FADE_MS}ms ease, text-shadow ${BG_FADE_MS}ms ease`,
        }}
      >
        <span ref={textRef} />
        <span className="preloader-caret ml-[0.08em] inline-block h-[0.9em] w-[2px] shrink-0 bg-current motion-reduce:hidden" />
      </span>
      {/* Off-screen twin of the box's type styles, used only to measure a
          word's full width before it's typed. */}
      <span
        ref={measureRef}
        className="pointer-events-none invisible absolute whitespace-nowrap font-greeting text-[clamp(2rem,5.5vw,4.25rem)] font-light tracking-[-0.02em]"
      />
    </div>
  );
}
