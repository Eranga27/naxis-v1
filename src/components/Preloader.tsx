"use client";

import { useEffect, useRef, useState } from "react";

const GREETINGS = [
  "Ayubowan",
  "Namaste",
  "Shagotom",
  "Xin chào",
  "Nǐ hǎo",
  "Ciao",
];
const FINAL = "Welcome";

const CHAR_MS = 35; // per-character type / delete speed
const WORD_HOLD_MS = 420; // pause once a greeting is fully typed
const FINAL_HOLD_MS = 1500;
const TEXT_FADE_MS = 400;
const VEIL_FADE_MS = 650;

export const INTRO_SESSION_KEY = "naxis:intro-seen";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Split into user-perceived characters so diacritics survive. */
const chars = (word: string) => Array.from(word);

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
  const cancelled = useRef(false);
  const revealed = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    const veil = veilRef.current;
    const text = textRef.current;
    if (!veil || !text) return;

    const write = (value: string) => {
      if (!cancelled.current) text.textContent = value;
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

      veil.style.opacity = "0";
      fireReveal();
      await sleep(VEIL_FADE_MS);
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

      // First greeting fades in rather than typing.
      write(GREETINGS[0]);
      text.style.opacity = "1";
      await sleep(TEXT_FADE_MS + WORD_HOLD_MS);

      for (let i = 1; i < GREETINGS.length; i++) {
        if (cancelled.current) return;
        await deleteOut(GREETINGS[i - 1]);
        await typeIn(GREETINGS[i]);
        await sleep(WORD_HOLD_MS);
      }

      if (cancelled.current) return;
      await deleteOut(GREETINGS[GREETINGS.length - 1]);
      await typeIn(FINAL);
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
      style={{ transition: `opacity ${VEIL_FADE_MS}ms ease-out` }}
    >
      <span
        ref={textRef}
        className="inline-block min-h-[1.2em] font-headline text-[clamp(1.75rem,5.5vw,4rem)] leading-[1.2] text-brown"
        style={{ opacity: 0, transition: `opacity ${TEXT_FADE_MS}ms ease-out` }}
      />
    </div>
  );
}
