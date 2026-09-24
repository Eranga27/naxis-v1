"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

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
// The destination is a lockup rather than one typed line: "Welcome to" is
// typed like the greetings, then steps up to make room for the name set
// large in the hero's own face, with the place underneath.
const WELCOME = "Welcome to";
const BRAND = "NAXIS";
const PLACE = "Australia";
// The letter the exit zooms through — its two strokes cross in a solid
// patch at the glyph's centre, so scaling about that point fills the
// screen with the letter itself.
const ZOOM_LETTER = BRAND.indexOf("X");
// Longest wait for the greeting webfonts before the sequence starts
// anyway — see preloadFonts below.
const FONT_WAIT_MS = 1500;

// Greeting text is ink or cream depending on what sits behind it, with a
// soft halo in the opposite tone to lift it off the busier parts of a flag.
const TONES = {
  ink: { color: "#100d09", shadow: "0 1px 14px rgba(255,255,255,0.4)" },
  cream: { color: "#FBF4E4", shadow: "0 2px 12px rgba(0,0,0,0.4)" },
} as const;
type Tone = keyof typeof TONES;

// One backdrop per greeting above, same order — a loose mood cue built from
// each country's flag palette, not a literal reproduction of the flag's
// geometry. Bangladesh/Vietnam/China lean on their flags' actual two-tone
// field+emblem colors; Sri Lanka/India/Italy get a third stop for their
// tricolore-style flags.
//
// The tone is picked for the gradient's middle band, where the greeting
// sits. One cream for every flag used to vanish on India's and Italy's
// white centres (~1:1 contrast); per flag, every greeting clears 5.5:1
// across the band it spans on a phone.
const COUNTRY_BACKDROPS: Array<{ gradient: string; tone: Tone }> = [
  { gradient: "linear-gradient(135deg, #8D153A 0%, #FFB612 50%, #007847 100%)", tone: "ink" }, // Sri Lanka
  { gradient: "linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)", tone: "ink" }, // India
  { gradient: "linear-gradient(135deg, #006A4E 0%, #F42A41 100%)", tone: "cream" }, // Bangladesh
  { gradient: "linear-gradient(135deg, #DA251D 0%, #FFCD00 100%)", tone: "ink" }, // Vietnam
  { gradient: "linear-gradient(135deg, #DE2910 0%, #FFDE00 100%)", tone: "ink" }, // China
  { gradient: "linear-gradient(135deg, #008C45 0%, #F4F5F0 50%, #CD212A 100%)", tone: "ink" }, // Italy
];

// Rather than cut straight from the last flag gradient to flat white, the
// destination gets one more crossfade — into a soft, low-saturation warm
// wash (not another flag; this one's the brand, not a country) — so the
// sequence still reads as one continuous fade rather than an abrupt stop.
const WELCOME_GRADIENT =
  "linear-gradient(135deg, #FDF8ED 0%, #F4EFE4 55%, #FBEFD8 100%)";

const CHAR_MS = 45; // per-character type / delete speed
const WORD_HOLD_MS = 620; // pause once a greeting is fully typed
const LOCKUP_HOLD_MS = 1300; // time to read the finished lockup
const TEXT_FADE_MS = 400;
const BG_FADE_MS = 650; // flag-gradient crossfade duration

// The exit, in seconds from the moment the hero is revealed: the name's
// letters fill with the hero footage, hold a beat, then the camera pushes
// through the X into the hero.
const FILL_BEAT = 0.3;
const ZOOM_DURATION = 1.25;
// Exported so Hero can time its headline to land as the zoom does.
export const VEIL_EXIT_MS = (FILL_BEAT + ZOOM_DURATION) * 1000;

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

/**
 * Where the capitals actually sit inside a line-height:1 text box. The
 * box's own rect includes the font's ascent/descent padding, which would
 * space the lockup off the empty band above and below the letters rather
 * than off the letters themselves.
 */
function capBand(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const size = parseFloat(style.fontSize);
  // Fallback for engines without font metrics on canvas: caps roughly
  // fill the middle 70% of the em box.
  let top = rect.top + size * 0.15;
  let bottom = rect.top + size * 0.85;
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
    const m = ctx.measureText(el.textContent || "X");
    if (m.fontBoundingBoxAscent !== undefined) {
      const halfLeading =
        (size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      const baseline = rect.top + halfLeading + m.fontBoundingBoxAscent;
      top = baseline - m.actualBoundingBoxAscent;
      bottom = baseline + m.actualBoundingBoxDescent;
    }
  }
  return { top, bottom, size };
}

type Props = {
  /** Fired the moment the hero starts showing through the veil. */
  onReveal?: () => void;
  /** Resolves when the hero video is buffered; the veil waits on it. */
  waitForMedia?: () => Promise<void>;
};

export default function Preloader({ onReveal, waitForMedia }: Props) {
  const [done, setDone] = useState(false);
  const veilRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const bgLayerARef = useRef<HTMLDivElement>(null);
  const bgLayerBRef = useRef<HTMLDivElement>(null);
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
    const text = textRef.current;
    const caret = caretRef.current;
    const measure = measureRef.current;
    const bgLayerA = bgLayerARef.current;
    const bgLayerB = bgLayerBRef.current;
    const lockup = lockupRef.current;
    const mark = markRef.current;
    const place = placeRef.current;
    const placeText = placeTextRef.current;
    const masks = maskRefs.current.filter(
      (el): el is HTMLSpanElement => el !== null
    );
    const letters = letterRefs.current.filter(
      (el): el is HTMLSpanElement => el !== null
    );
    const rules = ruleRefs.current.filter(
      (el): el is HTMLSpanElement => el !== null
    );
    if (
      !veil ||
      !box ||
      !text ||
      !caret ||
      !measure ||
      !bgLayerA ||
      !bgLayerB ||
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

    const write = (value: string) => {
      if (!cancelled.current) text.textContent = value;
    };

    // A centered line that grows one character at a time re-centers on
    // every keystroke, so the whole word visibly shuffles left as it types.
    // Instead the box is locked to the full word's width up front and the
    // text types left-to-right inside it. Words too wide for the screen get
    // their font size scaled down to fit on one line, rather than wrapping
    // mid-type.
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
    // then visibly swap mid-word. Load every one (and the name's headline
    // face) before starting instead, capped so a slow network can't hold
    // the intro on a blank screen.
    const preloadFonts = async () => {
      if (!document.fonts?.load) return;
      const family = getComputedStyle(text).fontFamily;
      const markFamily = getComputedStyle(mark).fontFamily;
      const loads = [...GREETINGS, WELCOME, PLACE]
        .map((word) =>
          document.fonts.load(`300 48px ${family}`, word).catch(() => [])
        )
        .concat(
          document.fonts.load(`400 48px ${markFamily}`, BRAND).catch(() => [])
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
    // The box transitions color and text-shadow over BG_FADE_MS, so the
    // text shifts tone in step with the backdrop crossfade above rather
    // than snapping.
    const setTone = (tone: Tone) => {
      box.style.color = TONES[tone].color;
      box.style.textShadow = TONES[tone].shadow;
    };
    const showBackdrop = (i: number) => {
      crossfadeBg(COUNTRY_BACKDROPS[i].gradient);
      setTone(COUNTRY_BACKDROPS[i].tone);
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

    // Positions the lockup around the name, which sits dead centre:
    // "Welcome to" (the typed box) above it, the place below it, both
    // spaced off the capitals themselves. Returns how far the box has to
    // travel up from the centre, where it was typed.
    const layoutLockup = () => {
      const caps = capBand(mark);
      const gap = Math.max(12, (caps.bottom - caps.top) * 0.14);
      const boxRect = box.getBoundingClientRect();
      // The box is 1.5em tall with the text centred in it; its baseline
      // sits about 0.36em above the box's bottom edge.
      const baseline =
        boxRect.bottom - parseFloat(getComputedStyle(box).fontSize) * 0.36;
      place.style.top = `${Math.round(caps.bottom + gap)}px`;
      lockup.style.visibility = "visible";
      place.style.visibility = "visible";
      return caps.top - gap - baseline;
    };

    // The zoom's origin and scale: the X's centre, and enough scale for
    // the solid patch where its strokes cross (conservatively 3% of the
    // font size across) to cover the farthest corner of the screen.
    const zoomTarget = () => {
      const caps = capBand(mark);
      const markRect = mark.getBoundingClientRect();
      const xRect = masks[ZOOM_LETTER].getBoundingClientRect();
      const cx = xRect.left + xRect.width / 2;
      const cy = (caps.top + caps.bottom) / 2;
      const reach = Math.hypot(
        Math.max(cx, window.innerWidth - cx),
        Math.max(cy, window.innerHeight - cy)
      );
      return {
        origin: `${cx - markRect.left}px ${cy - markRect.top}px`,
        scale: reach / (caps.size * 0.03),
      };
    };

    const holdForMedia = async (minMs: number) => {
      await Promise.all([
        sleep(minMs),
        waitForMedia ? waitForMedia().catch(() => {}) : Promise.resolve(),
      ]);
    };

    const release = () => {
      document.body.style.overflow = prevOverflow;
      releaseInert();
      setDone(true);
    };

    const runReduced = async () => {
      // No cycling, no typewriter, no zoom — the finished lockup, briefly,
      // then a plain fade. The name's face still has to be loaded before
      // the lockup is measured around it.
      await preloadFonts();
      if (cancelled.current) return;
      lockWidth(WELCOME);
      write(WELCOME);
      caret.style.display = "none";
      crossfadeBg(WELCOME_GRADIENT);
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

      // First greeting fades in rather than typing, its flag gradient
      // fading in alongside it.
      showBackdrop(0);
      lockWidth(GREETINGS[0]);
      write(GREETINGS[0]);
      box.style.opacity = "1";
      await sleep(TEXT_FADE_MS + WORD_HOLD_MS);

      for (let i = 1; i < GREETINGS.length; i++) {
        if (cancelled.current) return;
        showBackdrop(i);
        await deleteOut(GREETINGS[i - 1]);
        await typeIn(GREETINGS[i]);
        await sleep(WORD_HOLD_MS);
      }

      if (cancelled.current) return;
      await deleteOut(GREETINGS[GREETINGS.length - 1]);

      // One last crossfade into a soft brand wash rather than a hard cut
      // to flat white — the destination, not another country.
      crossfadeBg(WELCOME_GRADIENT);
      setTone("ink");
      await typeIn(WELCOME);
      if (cancelled.current) return;

      // The lockup: "Welcome to" steps up as the name rises letter by
      // letter beneath it, then the place and its gold -> emerald rules
      // open out underneath. From here on GSAP owns the box, so its CSS
      // transitions are dropped rather than left to fight the tweens.
      box.style.transition = "none";
      caret.style.animation = "none";
      const lift = layoutLockup();
      await new Promise<void>((resolve) => {
        tweens.add(() => {
          gsap
            .timeline({ onComplete: resolve })
            .to(caret, { opacity: 0, duration: 0.25 }, 0)
            .to(box, { y: lift, duration: 1, ease: "expo.inOut" }, 0.1)
            .fromTo(
              letters,
              { yPercent: 110 },
              { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.07 },
              0.35
            )
            .fromTo(
              rules,
              { scaleX: 0 },
              { scaleX: 1, duration: 1, ease: "expo.inOut" },
              0.75
            )
            .fromTo(
              placeText,
              { opacity: 0, letterSpacing: "1.1em", marginRight: "-1.1em" },
              {
                opacity: 1,
                letterSpacing: "0.55em",
                marginRight: "-0.55em",
                duration: 1.2,
                ease: "expo.out",
              },
              0.8
            );
        });
      });
      if (cancelled.current) return;

      // Hold on the lockup until the hero media is actually ready, so the
      // exit never lands on an unloaded video.
      await holdForMedia(LOCKUP_HOLD_MS);
      if (cancelled.current) return;

      // The exit. The words around the name step aside and the name turns
      // pure black; the veil then switches to a lighten blend, which keeps
      // whichever is lighter per channel — the pale wash beats the dark,
      // graded hero, while black letters give way to it entirely. (Screen
      // would do the same for black, but lets the hero ghost through a
      // wash that isn't pure white.) So the letters become windows onto
      // the hero, which starts its entrance right then and fills them
      // with footage. Finally the name
      // scales up about the centre of its X until the crossing strokes
      // fill the screen: the camera pushes through the letter into the
      // hero. expo.in on the scale reads as a steady push, since perceived
      // zoom follows the log of the scale. The last few frames also fade
      // the veil, in case an engine can't blend it over the video.
      gsap.set(masks, { clipPath: "none" });
      const zoom = zoomTarget();
      gsap.set(mark, { transformOrigin: zoom.origin });
      await new Promise<void>((resolve) => {
        tweens.add(() => {
          gsap
            .timeline({ onComplete: resolve })
            .to([box, place], { opacity: 0, duration: 0.35, ease: "power2.in" }, 0)
            .to(mark, { color: "#000", duration: 0.35 }, 0)
            .add(() => {
              veil.style.mixBlendMode = "lighten";
              fireReveal();
            }, 0.35)
            .to(
              mark,
              { scale: zoom.scale, duration: ZOOM_DURATION, ease: "expo.in" },
              0.35 + FILL_BEAT
            )
            .to(
              veil,
              { opacity: 0, duration: 0.2, ease: "none" },
              0.35 + FILL_BEAT + ZOOM_DURATION - 0.2
            );
        });
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
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white"
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

      {/* The name, dead centre, set in the hero's headline face. Each
          letter rises out of its own mask; the masks clip only below the
          baseline, so nothing above the capitals is ever cut. Hidden until
          the lockup is laid out. */}
      <div
        ref={lockupRef}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ visibility: "hidden" }}
      >
        <div
          ref={markRef}
          className="flex font-headline text-[clamp(6rem,30vw,19rem)] font-normal leading-none text-ink"
        >
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

      {/* Fixed height and line-height so switching between scripts with
          different vertical metrics never nudges the line up or down; the
          width is locked per word in lockWidth above. */}
      <span
        ref={boxRef}
        className="relative z-20 inline-flex h-[1.5em] items-center justify-start whitespace-nowrap font-greeting text-[clamp(2rem,5.5vw,4.25rem)] font-light leading-[1.5] tracking-[-0.02em] text-black"
        style={{
          opacity: 0,
          transition: `opacity ${TEXT_FADE_MS}ms ease-out, color ${BG_FADE_MS}ms ease, text-shadow ${BG_FADE_MS}ms ease`,
        }}
      >
        <span ref={textRef} />
        <span
          ref={caretRef}
          className="preloader-caret ml-[0.08em] inline-block h-[0.9em] w-[2px] shrink-0 bg-current motion-reduce:hidden"
        />
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
