"use client";

import { useRef, useState, ViewTransition } from "react";
import Link from "next/link";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { SERVICES } from "@/content/services";
import { SERVICE_FILM as FILM } from "@/content/serviceFilm";
import { preloadHero } from "@/lib/preloadHero";
import { useIsomorphicLayoutEffect, useReducedMotion } from "@/lib/motion";
import ServicesStack from "@/components/ServicesStack";

gsap.registerPlugin(ScrollTrigger);

type SetName = keyof typeof FILM.sets;
const frameUrl = (set: SetName, i: number) => `${FILM.base}/${set}/${String(i).padStart(3, "0")}.webp?v=${FILM.version}`;

// How far the page scrolls through each segment, in screen heights: a
// hold is a slow push-in, a morph the change from one service to the
// next. Shorter on phones.
const LENGTH: Record<SetName, { hold: number; morph: number }> = {
  wide: { hold: 0.6, morph: 0.9 },
  tall: { hold: 0.45, morph: 0.75 },
};
// Landscape screens get the wide frames; phones and portrait tablets the
// tall ones (a portrait crop round each shot's subject).
const TALL_BELOW = 0.85;
// Frames fetched at once while loading.
const PARALLEL = 6;
// Decoded, a frame is its full size in memory (4.7MB wide, 2MB tall), so
// only those round the playhead are kept decoded: about this many bytes'
// worth, most of them ahead of it, decoding at most this many at once.
const DECODED_BYTES = 128e6;
const DECODERS = 4;
// How long the film takes to catch up with the scroll, in seconds. Lenis
// already smooths the wheel, so this only takes the edge off touch and
// trackpad steps; more reads as lag.
const SCRUB = 0.2;

/**
 * What We Do (V2): the four services as one film (see
 * docs/SERVICES-FILM-PLAN.md). Under reduced motion, the stacked cards.
 */
export default function ServicesFilm() {
  const reduce = useReducedMotion();
  return reduce ? <ServicesStack /> : <FilmStage />;
}

/**
 * The film stage. The section's intro sits above it; the stage pins, and
 * scrolling scrubs the film — a hold per service (the camera slowly
 * pushing in) and a morph between each — frame by frame on a canvas,
 * neighbouring frames crossfaded so it runs smooth between them (and at
 * rest, a whole frame). It never comes to rest mid-morph: stopping in one
 * snaps on to whichever service is nearer. Each service's text leaves as
 * its morph begins and arrives as it lands; a rail shows where you are and
 * jumps to a service.
 *
 * The frames load a couple of screens before the section, nearest first;
 * until one is ready the stage shows the first frame as a still (the
 * poster), and a frame not yet loaded falls back to the nearest that is.
 * At rest the picture drifts very slowly, so it never looks frozen.
 */
function FilmStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  // Scrolls to a service (the rail; keyboard focus on a hidden service).
  const goToRef = useRef<(service: number) => void>(() => {});
  const [active, setActive] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const drift = driftRef.current;
    const rail = railRef.current;
    const chapters = chapterRefs.current.filter((el): el is HTMLElement => el !== null);
    const context = canvas?.getContext("2d", { alpha: false });
    if (!section || !stage || !canvas || !drift || !rail || !context || chapters.length !== SERVICES.length) return;

    const set: SetName = stage.clientWidth / stage.clientHeight < TALL_BELOW ? "tall" : "wide";
    const count = FILM.sets[set].count;
    // Each segment's frames, and where it sits along the pin (0-1).
    const lengths = LENGTH[set];
    const total = FILM.segments.reduce((sum, s) => sum + lengths[s.kind], 0);
    let at = 0;
    const segments = FILM.segments.map((s) => {
      const len = lengths[s.kind];
      const seg = { ...s, frames: s[set], start: at / total, end: (at + len) / total, len };
      at += len;
      return seg;
    });
    const holds = segments.filter((s) => s.kind === "hold");

    // The playhead, in frames; fractions crossfade to the next frame. What's
    // drawn follows it, except at rest, when it eases to the nearest whole
    // frame: a crossfade reads as motion only while it moves, and paused
    // between two frames of a moving camera it's a double exposure.
    const play = { frame: 0 };
    const display = { frame: 0 };
    const frameSize = FILM.sets[set];
    // Every frame's bytes are fetched once (the whole film is a few MB), but
    // decoded only round the playhead, to bitmaps and off the main thread,
    // ahead of it in the direction it's going. Drawing a bitmap never waits
    // on a decode, so the film doesn't stall on a frame's first showing.
    const blobs: Array<Blob | null> = new Array(count).fill(null);
    const bitmaps = new Map<number, ImageBitmap>();
    const decoding = new Set<number>();
    const keep = Math.min(48, Math.max(16, Math.floor(DECODED_BYTES / (frameSize.width * frameSize.height * 4))));
    const ahead = Math.round(keep * 0.7);
    const behind = keep - ahead;
    let head = 0;
    let heading = 1;
    let disposed = false;
    let drawn = "";
    let width = 0;
    let height = 0;
    // The rail runs down the right on wide screens, across the top on narrow.
    let vertical = true;

    const inWindow = (i: number) => (heading > 0 ? i >= head - behind && i <= head + ahead : i >= head - ahead && i <= head + behind);
    // Drops the bitmaps the playhead has left behind and decodes the
    // nearest missing ones, a few at a time.
    const decodeNear = () => {
      for (const [i, bitmap] of bitmaps) {
        if (!inWindow(i)) {
          bitmap.close();
          bitmaps.delete(i);
        }
      }
      for (let d = 0; d <= ahead && decoding.size < DECODERS; d++) {
        for (const i of d === 0 ? [head] : d <= behind ? [head + heading * d, head - heading * d] : [head + heading * d]) {
          const blob = blobs[i];
          if (!blob || bitmaps.has(i) || decoding.has(i) || decoding.size >= DECODERS) continue;
          decoding.add(i);
          createImageBitmap(blob)
            .then((bitmap) => {
              if (disposed || !inWindow(i)) {
                bitmap.close();
                return;
              }
              bitmaps.set(i, bitmap);
              draw();
            })
            .catch(() => {})
            .finally(() => {
              decoding.delete(i);
              if (!disposed) decodeNear();
            });
        }
      }
    };

    const cover = (image: ImageBitmap) => {
      const scale = Math.max(width / frameSize.width, height / frameSize.height);
      const w = frameSize.width * scale;
      const h = frameSize.height * scale;
      context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
    };
    const nearestReady = (i: number) => {
      for (let d = 0; d < count; d++) {
        if (bitmaps.has(i - d)) return i - d;
        if (bitmaps.has(i + d)) return i + d;
      }
      return -1;
    };
    const draw = () => {
      const f = Math.min(count - 1, Math.max(0, display.frame));
      const a = Math.floor(f);
      const frac = f - a;
      if (a !== head) {
        heading = a > head ? 1 : -1;
        head = a;
        decodeNear();
      }
      const shown = bitmaps.has(a) ? a : nearestReady(a);
      if (shown < 0) return;
      // A twelfth of a frame is as fine as the crossfade needs.
      const step = Math.round(frac * 12);
      const next = bitmaps.get(a + 1);
      const blend = shown === a && step > 0 && next !== undefined;
      const key = `${shown}:${blend ? step : 0}:${width}`;
      if (key === drawn) return;
      drawn = key;
      context.globalAlpha = 1;
      cover(bitmaps.get(shown)!);
      if (blend) {
        context.globalAlpha = step / 12;
        cover(next);
        context.globalAlpha = 1;
      }
      // The canvas starts hidden (unpainted, it's black) over the poster.
      if (canvas.style.opacity !== "1") canvas.style.opacity = "1";
    };

    // The canvas at no more pixels than the frames have once they cover
    // the stage (more is only upscaling, and each draw costs by the
    // pixel), and no more than the screen's own.
    const size = () => {
      const cover = Math.max(stage.clientWidth / frameSize.width, stage.clientHeight / frameSize.height);
      const ratio = Math.min(window.devicePixelRatio || 1, Math.max(0.75, 1 / cover));
      width = canvas.width = Math.round(stage.clientWidth * ratio);
      height = canvas.height = Math.round(stage.clientHeight * ratio);
      vertical = window.matchMedia("(min-width: 768px)").matches;
      drawn = "";
      draw();
    };
    size();
    const sized = new ResizeObserver(size);
    sized.observe(stage);

    // Fetch every frame, nearest the playhead first (in viewing order from
    // the top of the section), a few at a time.
    let loading = false;
    const load = () => {
      if (loading) return;
      loading = true;
      const from = Math.round(play.frame);
      const order = Array.from({ length: count }, (_, i) => i).sort((p, q) => {
        const dp = p >= from ? p - from : (from - p) * 1.5;
        const dq = q >= from ? q - from : (from - q) * 1.5;
        return dp - dq;
      });
      let next = 0;
      const pump = () => {
        if (disposed || next >= order.length) return;
        const i = order[next++];
        fetch(frameUrl(set, i))
          .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(response.statusText))))
          .then((blob) => {
            blobs[i] = blob;
            if (inWindow(i)) decodeNear();
          })
          .catch(() => {})
          .finally(pump);
      };
      for (let k = 0; k < PARALLEL; k++) pump();
    };

    // Which service the stage is on: its hold, or the nearer side of a morph.
    const serviceAt = (p: number) => {
      const seg = segments.find((s) => p >= s.start && p <= s.end) ?? segments[segments.length - 1];
      if (seg.kind === "hold") return seg.service;
      return (p - seg.start) / (seg.end - seg.start) < 0.5 ? seg.from : seg.from + 1;
    };
    let current = 0;

    const ctx = gsap.context(() => {
      gsap.set(chapters.slice(1), { opacity: 0, y: 26 });

      // Drawn with the playhead while it moves; a moment after it stops, on
      // to the nearest whole frame.
      let settling: gsap.core.Tween | null = null;
      const rest = gsap
        .delayedCall(0.18, () => {
          const whole = Math.round(play.frame);
          if (Math.abs(whole - display.frame) > 0.01) settling = gsap.to(display, { frame: whole, duration: 0.35, ease: "power1.out", onUpdate: draw });
        })
        .pause();
      const scrubbed = () => {
        settling?.kill();
        display.frame = play.frame;
        draw();
        rest.restart(true);
      };

      const film = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => "+=" + window.innerHeight * total,
          pin: true,
          scrub: SCRUB,
          invalidateOnRefresh: true,
          // Never at rest mid-morph: on to whichever service is nearer.
          snap: {
            // Judged by where the scroll stopped, not where its momentum
            // projects (`value`), so a fling never carries the page past
            // the next service: in a hold, stay; mid-morph, go on the way
            // it was moving, or to the nearer end.
            snapTo: (value: number, self?: ScrollTrigger) => {
              const now = self?.progress ?? value;
              const morph = segments.find((s) => s.kind === "morph" && now > s.start && now < s.end);
              if (!morph) return now;
              const heading = value - now;
              if (Math.abs(heading) > 0.002) return heading > 0 ? morph.end : morph.start;
              return now - morph.start < morph.end - now ? morph.start : morph.end;
            },
            delay: 0.12,
            duration: { min: 0.3, max: 0.9 },
            ease: "power2.inOut",
          },
          onUpdate: (self) => {
            gsap.set(rail, vertical ? { scaleX: 1, scaleY: self.progress } : { scaleX: self.progress, scaleY: 1 });
            const next = serviceAt(self.progress);
            if (next !== current) {
              current = next;
              setActive(next);
            }
          },
        },
        onUpdate: scrubbed,
      });

      // The playhead through each segment: a hold from its first frame to
      // its last, a morph on to the next hold's first. Each service's text
      // leaves as its morph begins and arrives as it lands.
      segments.forEach((s) => {
        const end = s.frames[1];
        const position = s.start * total;
        film.to(play, { frame: s.kind === "hold" ? end - 1 : end, duration: s.len }, position);
        if (s.kind === "morph") {
          film
            .to(chapters[s.from], { opacity: 0, y: -18, duration: s.len * 0.32, ease: "power2.in" }, position)
            .fromTo(
              chapters[s.from + 1],
              { opacity: 0, y: 26 },
              { opacity: 1, y: 0, duration: s.len * 0.32, ease: "power2.out", immediateRender: false },
              position + s.len * 0.68
            );
        }
      });

      // Scrolls to a service: the middle of its hold.
      goToRef.current = (service: number) => {
        const st = film.scrollTrigger;
        const hold = holds[service];
        if (!st || !hold) return;
        const target = st.start + ((hold.start + hold.end) / 2) * (st.end - st.start);
        const proxy = { y: window.scrollY };
        gsap.to(proxy, {
          y: target,
          duration: Math.min(1.8, 0.6 + Math.abs(target - proxy.y) / 3000),
          ease: "power2.inOut",
          onUpdate: () => window.scrollTo(0, proxy.y),
        });
      };

      // The frames start loading a couple of screens before the section.
      ScrollTrigger.create({ trigger: section, start: "top bottom+=200%", once: true, onEnter: load });

      // A very slow drift, only while the section is on screen.
      const breathe = gsap.to(drift, { scale: 1.035, duration: 10, ease: "sine.inOut", repeat: -1, yoyo: true, paused: true });
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? breathe.play() : breathe.pause()),
      });
    }, section);

    return () => {
      disposed = true;
      bitmaps.forEach((bitmap) => bitmap.close());
      bitmaps.clear();
      sized.disconnect();
      // The settle is made after the context, so it isn't reverted with it.
      gsap.killTweensOf(display);
      ctx.revert();
      goToRef.current = () => {};
    };
  }, []);

  return (
    <section ref={sectionRef} id="services" className="relative w-full bg-ink">
      <div className="px-6 pb-12 pt-20 sm:px-10 md:px-16 md:pb-16 md:pt-28 lg:px-20">
        <div className="max-w-3xl">
          <p className="mb-5 w-fit font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand md:text-sm">What We Do</p>
          <h2 className="mb-6 font-headline text-[clamp(2.25rem,6vw,5rem)] uppercase leading-[1.02] tracking-[-0.01em] text-cream">
            The complete journey, managed.
          </h2>
          <p className="max-w-xl font-body text-sm leading-relaxed text-cream/65 md:text-base">
            We don&apos;t simply source products — we take responsibility for the entire journey, from factory floor to your door.
          </p>
        </div>
      </div>

      <div ref={stageRef} className="relative h-svh min-h-[560px] w-full overflow-hidden">
        {/* The film. Named for the service on screen, so "Learn more"
            carries the frame into that service's page hero. */}
        <ViewTransition name={`hero-service-${SERVICES[active].slug}`} share="morph" default="none">
          <div className="absolute inset-0 overflow-hidden">
            <div ref={driftRef} className="absolute inset-0 will-change-transform">
              <picture className="absolute inset-0">
                <source media={`(max-aspect-ratio: ${Math.round(TALL_BELOW * 100)}/100)`} srcSet={frameUrl("tall", 0)} />
                <img src={frameUrl("wide", 0)} alt="" className="h-full w-full object-cover" />
              </picture>
              <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full opacity-0 transition-opacity duration-300" />
            </div>
          </div>
        </ViewTransition>

        {/* Shade for the text: from the left on wide screens, from the
            foot on narrow ones. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(16,13,9,0.92)_0%,rgba(16,13,9,0.7)_32%,rgba(16,13,9,0.15)_62%,rgba(16,13,9,0)_78%)] md:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(16,13,9,0.95)_0%,rgba(16,13,9,0.75)_30%,rgba(16,13,9,0.1)_58%,rgba(16,13,9,0)_70%)] md:hidden"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/70 to-transparent" />

        {/* Each service's text, all in one cell; only the one on screen
            takes the pointer. A hidden one taking keyboard focus scrolls
            the film to it. */}
        <div className="absolute inset-0 flex items-end px-6 pb-20 sm:px-10 md:items-center md:px-16 md:pb-0 lg:px-20">
          <div className="grid w-full md:w-[46%] md:max-w-xl">
            {SERVICES.map((service, i) => (
              <article
                key={service.slug}
                ref={(el) => {
                  chapterRefs.current[i] = el;
                }}
                onFocus={() => {
                  if (i !== active) goToRef.current(i);
                }}
                className={`col-start-1 row-start-1 self-end md:self-center ${i === active ? "" : "pointer-events-none"}`}
                // Only the first shows before the film takes over.
                style={i === 0 ? undefined : { opacity: 0 }}
              >
                <div className="mb-5 flex items-center gap-4">
                  <span className="text-gradient-brand font-headline text-4xl leading-none md:text-5xl">{service.number}</span>
                  <span className="bg-gradient-brand h-px w-16 opacity-60 md:w-24" />
                </div>
                <h3 className="mb-4 font-headline text-[clamp(2rem,4.2vw,3.4rem)] uppercase leading-[1.02] tracking-[-0.01em] text-cream">
                  {service.title}
                </h3>
                <p className="mb-6 max-w-md font-serif text-lg italic leading-snug text-cream/85 md:text-xl">{service.summary}</p>
                <ul className="mb-8 hidden flex-col gap-2.5 md:flex">
                  {service.highlights.map((point) => (
                    <li key={point} className="flex items-start gap-3 font-body text-sm text-cream/75 md:text-[0.95rem]">
                      <span aria-hidden="true" className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-bright" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/services/${service.slug}`}
                  onPointerEnter={() => preloadHero(service.image)}
                  onFocus={() => preloadHero(service.image)}
                  onTouchStart={() => preloadHero(service.image)}
                  className="group inline-flex w-fit items-center gap-3 rounded-full border border-cream/30 bg-ink/30 px-6 py-3 font-body text-xs font-semibold uppercase tracking-[0.15em] text-cream transition-colors hover:border-gold hover:bg-gold hover:text-ink md:text-sm"
                >
                  Learn more
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                  <span className="sr-only"> — {service.title}</span>
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Where you are: a rail with a stop per service (down the right on
            wide screens; along the foot on narrow ones, clear of the
            header when it comes back). */}
        <nav
          aria-label="Services"
          className="absolute bottom-5 left-6 right-6 flex items-center gap-3 sm:left-10 sm:right-10 md:bottom-auto md:left-auto md:right-12 md:top-1/2 md:-translate-y-1/2 md:flex-col md:gap-0 lg:right-16"
        >
          <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-cream/15 md:inset-x-auto md:inset-y-0 md:left-1/2 md:top-0 md:h-auto md:w-px" />
          <span
            ref={railRef}
            aria-hidden="true"
            className="bg-gradient-brand absolute inset-x-0 top-1/2 h-px origin-left md:inset-x-auto md:inset-y-0 md:left-1/2 md:top-0 md:h-auto md:w-px md:origin-top"
            style={{ transform: "scale(0)" }}
          />
          {SERVICES.map((service, i) => (
            <button
              key={service.slug}
              type="button"
              onClick={() => goToRef.current(i)}
              aria-current={i === active ? "step" : undefined}
              className={`relative flex flex-1 items-center justify-center md:flex-none md:py-5 ${i === 0 ? "md:pt-0" : ""} ${i === SERVICES.length - 1 ? "md:pb-0" : ""}`}
            >
              <span
                className={`rounded-full bg-ink px-2 py-1 font-body text-[0.65rem] font-semibold tracking-[0.2em] transition-colors md:text-xs ${
                  i === active ? "text-gold" : "text-cream/45 hover:text-cream"
                }`}
              >
                {service.number}
              </span>
              <span className="sr-only">{service.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
