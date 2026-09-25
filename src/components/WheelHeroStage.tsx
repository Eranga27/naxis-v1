"use client";

import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { INTRO_SESSION_KEY, onReveal } from "@/lib/intro";
import { CARD_CLIP_PHONE, CARD_CLIP_WIDE, FULL_CLIP, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import { VEIL_EXIT_MS } from "@/components/Preloader";

gsap.registerPlugin(ScrollTrigger);

// The stage's lens: how strongly depth shows as the wheel tilts.
const PERSPECTIVE = 1800;
// How far each layer stands off the wheel's face, in px towards the
// viewer. The stage's slow tilt (and the pointer, on desktop) makes the
// layers slide over one another, so the wheel reads as a built object:
// light behind, a dark medallion, then the rings stepped up to the disc.
const DEPTH: Record<string, number> = {
  rays: -260,
  aura: -160,
  plate: -40,
  rims: 0,
  values: 26,
  motto: 48,
  name: 74,
  disc: 104,
  sheen: 112,
  spark: 112,
};
// A ring is lit clockwise from the top as --sweep grows, behind a soft
// leading edge.
const SWEEP_MASK = "conic-gradient(#000 calc(var(--sweep) - 14deg), transparent var(--sweep))";

// Static film grain, as an inline SVG turbulence tile.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

type Pointer = { x: number; y: number };

/**
 * Gold dust drifting up through the stage light, in depth: near motes
 * are bigger, softer, faster and follow the pointer further. Drawn from
 * one pre-rendered sprite, so a frame is only a few dozen image draws.
 */
function dustField(canvas: HTMLCanvasElement, pointer: Pointer) {
  const ctx = canvas.getContext("2d");
  const phone = window.innerWidth < 768;
  const count = phone ? 34 : 90;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const s = sprite.getContext("2d");
  if (s) {
    const g = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,246,220,1)");
    g.addColorStop(0.25, "rgba(255,214,140,0.75)");
    g.addColorStop(1, "rgba(255,190,90,0)");
    s.fillStyle = g;
    s.fillRect(0, 0, 64, 64);
  }
  const motes = Array.from({ length: count }, () => {
    const z = Math.random();
    return {
      x: Math.random(),
      y: Math.random(),
      z,
      size: z > 0.9 ? 10 + Math.random() * 14 : 1.4 + z * 4.5,
      alpha: z > 0.9 ? 0.12 + Math.random() * 0.12 : 0.25 + z * 0.55,
      rise: 0.006 + z * 0.02,
      sway: Math.random() * Math.PI * 2,
      twinkle: 0.6 + Math.random() * 1.8,
    };
  });

  let w = 0;
  let h = 0;
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  let running = false;
  let level = 0; // faded in by the intro
  let last = 0;
  let lastDraw = 0;
  const tick = (time: number) => {
    if (!ctx) return;
    const t = time / 1000;
    const dt = Math.min(0.05, last ? t - last : 0);
    last = t;
    // Phones draw every other frame; the motes are slow enough not to show it.
    if (phone && t - lastDraw < 1 / 30) return;
    lastDraw = t;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (level <= 0) return;
    for (const m of motes) {
      m.y -= m.rise * dt;
      if (m.y < -0.05) {
        m.y = 1.05;
        m.x = Math.random();
      }
      const x = (m.x + Math.sin(t * 0.35 + m.sway) * 0.012 - pointer.x * m.z * 0.05) * w;
      const y = (m.y - pointer.y * m.z * 0.04) * h;
      const glint = 0.55 + 0.45 * Math.sin(t * m.twinkle + m.sway);
      ctx.globalAlpha = m.alpha * glint * level;
      ctx.drawImage(sprite, x - m.size / 2, y - m.size / 2, m.size, m.size);
    }
  };
  return {
    setLevel: (value: number) => {
      level = value;
    },
    start: () => {
      if (running) return;
      running = true;
      last = 0;
      gsap.ticker.add(tick);
    },
    stop: () => {
      running = false;
      gsap.ticker.remove(tick);
    },
    destroy: () => {
      gsap.ticker.remove(tick);
      observer.disconnect();
    },
  };
}

/**
 * The V2 homepage hero: the client's Giant Wheel alone on a dark stage,
 * always turning — made to hold a large screen on its own.
 *
 * After the intro's zoom through the X lands on the centre disc, the
 * camera pulls back and the wheel is lit ring by ring, each traced by a
 * spark as it ignites, while the outlines draw themselves in. Then it
 * never stops: the rings turn at their own paces in alternating
 * directions, the stage drifts in a slow tilt that parts the layers in
 * depth, light sweeps the rings, rays turn behind and gold dust rises.
 * On desktop the wheel also leans towards the pointer.
 *
 * Scrolling pins it, tips the wheel back and closes the stage to a card
 * on cream, handing over to Mission. It rests (animations paused, dust
 * stopped) while off screen. Under reduced motion it's the finished
 * wheel, still.
 */
export default function WheelHeroStage({ art }: { art: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const assemblyRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const exit = exitRef.current;
    const pointerWrap = pointerRef.current;
    const assembly = assemblyRef.current;
    const canvas = dustRef.current;
    const cue = cueRef.current;
    if (!section || !frame || !exit || !pointerWrap || !assembly || !canvas || !cue) return;
    const one = (selector: string) => section.querySelector<HTMLElement>(selector);
    const layer = (name: string) => one(`[data-layer="${name}"]`) ?? one(`[data-ring="${name}"]`);
    const rings = ["name", "motto", "values"].map((name) => one(`[data-ring="${name}"]`)!);
    const sparks = ["name", "motto", "values"].map((name) => one(`[data-spark="${name}"]`)!);
    const rims = Array.from(section.querySelectorAll<SVGCircleElement>("[data-rim]"));

    if (prefersReducedMotion()) return;

    const pointer: Pointer = { x: 0, y: 0 };
    const dust = dustField(canvas, pointer);
    let framed = false;
    const announce = (next: boolean) => {
      if (next === framed) return;
      framed = next;
      window.dispatchEvent(new CustomEvent("hero:framed", { detail: framed }));
    };

    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(INTRO_SESSION_KEY) === "done";
    } catch {
      // storage disabled / private mode
    }
    // When the intro's veil is gone, in seconds after the reveal.
    const land = alreadySeen ? 0.1 : VEIL_EXIT_MS / 1000;

    let intro: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      // Each layer at its depth, scaled back by the lens so that, face
      // on, every ring still sits exactly where the artwork puts it.
      for (const [name, z] of Object.entries(DEPTH)) {
        const targets = name === "spark" ? sparks : [layer(name)];
        for (const el of targets) if (el) gsap.set(el, { z, scale: (PERSPECTIVE - z) / PERSPECTIVE });
      }

      // Before the reveal: close in on the disc, everything else dark.
      gsap.set(assembly, { scale: 2.3 });
      for (const ring of rings) {
        ring.style.setProperty("--sweep", "0deg");
        ring.style.maskImage = SWEEP_MASK;
        ring.style.setProperty("-webkit-mask-image", SWEEP_MASK);
      }
      for (const rim of rims) {
        rim.setAttribute("pathLength", "1");
        rim.setAttribute("transform", "rotate(-90)");
        gsap.set(rim, { strokeDasharray: "1 1", strokeDashoffset: 1 });
      }
      gsap.set(["plate", "aura", "rays", "sheen"].map(layer), { opacity: 0 });
      gsap.set(cue, { autoAlpha: 0 });

      const level = { value: 0 };
      intro = gsap.timeline({
        paused: true,
        onComplete: () => {
          // The masks have done their work; don't keep compositing them.
          for (const ring of rings) {
            ring.style.maskImage = "none";
            ring.style.setProperty("-webkit-mask-image", "none");
          }
        },
      });
      // The camera pulls back off the disc to show the whole wheel...
      intro
        .to(assembly, { scale: 1, duration: 3.4, ease: "power2.inOut" }, Math.max(0, land - 0.7))
        .to(layer("plate"), { opacity: 1, duration: 1.4, ease: "power2.out" }, land)
        // ...its outlines drawing in from the centre outwards...
        .to(rims.slice().reverse(), { strokeDashoffset: 0, duration: 1.7, ease: "power2.inOut", stagger: 0.2 }, land + 0.15);
      // ...and each ring lit in turn, a spark running ahead of the light.
      rings.forEach((ring, i) => {
        const at = land + 0.55 + i * 0.38;
        const duration = 1.4 + i * 0.2;
        intro!
          .to(ring, { "--sweep": "374deg", duration, ease: "power2.inOut" }, at)
          .fromTo(sparks[i], { rotation: -8 }, { rotation: 366, duration, ease: "power2.inOut" }, at)
          .to(sparks[i], { opacity: 1, duration: 0.15 }, at)
          .to(sparks[i], { opacity: 0, duration: 0.35 }, at + duration - 0.3);
      });
      intro
        .to(layer("aura"), { opacity: 1, duration: 2.2, ease: "power1.inOut" }, land + 1.4)
        .to(layer("rays"), { opacity: 1, duration: 3, ease: "power1.inOut" }, land + 1.8)
        .to(layer("sheen"), { opacity: 1, duration: 2.5, ease: "power1.inOut" }, land + 2.8)
        .to(level, { value: 1, duration: 2.5, ease: "power1.inOut", onUpdate: () => dust.setLevel(level.value) }, land + 2.2)
        .to(cue, { autoAlpha: 1, duration: 1, ease: "power2.out" }, land + 4.2)
        // From then on, every few seconds a spark runs once round the
        // rim, and one the other way round the name, so a screen left on
        // the wheel always has something about to happen.
        .add(() => {
          ctx.add(() => {
            const orbit = (spark: HTMLElement, turn: number, delay: number) =>
              gsap
                .timeline({ repeat: -1, repeatDelay: 7, delay })
                .fromTo(spark, { rotation: 0 }, { rotation: turn, duration: 3.2, ease: "power1.inOut" }, 0)
                .fromTo(spark, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, 0)
                .to(spark, { opacity: 0, duration: 0.6, ease: "power1.in" }, 2.6);
            orbit(sparks[2], 360, 1.5);
            orbit(sparks[0], -360, 6.5);
          });
        }, land + 4.2);

      // The wheel leans towards the pointer, on devices that have one.
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const tiltX = gsap.quickTo(pointerWrap, "rotationX", { duration: 1.6, ease: "power3.out" });
        const tiltY = gsap.quickTo(pointerWrap, "rotationY", { duration: 1.6, ease: "power3.out" });
        const onMove = (event: PointerEvent) => {
          pointer.x = event.clientX / window.innerWidth - 0.5;
          pointer.y = event.clientY / window.innerHeight - 0.5;
          tiltY(pointer.x * 14);
          tiltX(-pointer.y * 10);
        };
        const onLeave = () => {
          pointer.x = pointer.y = 0;
          tiltX(0);
          tiltY(0);
        };
        section.addEventListener("pointermove", onMove);
        section.addEventListener("pointerleave", onLeave);
        return () => {
          section.removeEventListener("pointermove", onMove);
          section.removeEventListener("pointerleave", onLeave);
        };
      }
    }, section);

    // Scrolling on: the section pins, the wheel tips back and away, and
    // the stage closes in to a card on the cream of Mission.
    const isPhone = () => window.innerWidth < 768;
    ctx.add(() => {
      gsap
        .timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + window.innerHeight * (isPhone() ? 0.9 : 1.1),
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            refreshPriority: 10,
            onUpdate: (self) => announce(self.progress > 0.5),
          },
        })
        .to(exit, { scale: 0.72, rotationX: 34, yPercent: -4, duration: 1, ease: "power1.inOut" }, 0)
        .fromTo(frame, { clipPath: FULL_CLIP }, { clipPath: () => (isPhone() ? CARD_CLIP_PHONE : CARD_CLIP_WIDE), duration: 0.8 }, 0.2)
        .to(canvas, { opacity: 0.25, duration: 0.8 }, 0.2)
        .to(cue.parentElement, { opacity: 0, duration: 0.2 }, 0);
    });
    // Mission and the sections after measure from where the pin leaves
    // them; tell them it exists.
    const settle = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("hero:pinned"));
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });

    // Rest while off screen: nothing turns or drifts, no dust is drawn.
    const visibility = new IntersectionObserver(([entry]) => {
      section.classList.toggle("wheel-paused", !entry.isIntersecting);
      if (entry.isIntersecting) dust.start();
      else dust.stop();
    });
    visibility.observe(section);

    // Held back until the intro's veil turns the name into a window onto
    // this stage; immediately if the intro has already played.
    const unsubscribe = onReveal(() => intro?.play());

    return () => {
      cancelAnimationFrame(settle);
      unsubscribe();
      visibility.disconnect();
      dust.destroy();
      announce(false);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      data-dark-hero
      className="relative h-svh min-h-[560px] w-full overflow-hidden bg-cream"
    >
      <h1 className="sr-only">NAXIS Australia — delivering excellence through experience</h1>
      <p className="sr-only">Quality. Reliability. Flawless. Flexible. Fast. Integrity.</p>

      <div ref={frameRef} className="absolute inset-0 overflow-hidden bg-ink" style={{ perspective: PERSPECTIVE }}>
        {/* A warm pool of light on the stage, where the wheel stands. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 62% 58% at 50% 50%, #2c1d0f 0%, #17110b 48%, #0a0705 100%)" }}
        />
        <canvas ref={dustRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full motion-reduce:hidden" />

        <div ref={exitRef} className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
          <div className="wheel-drift relative aspect-square w-[min(94vw,86svh)] [transform-style:preserve-3d]">
            <div ref={pointerRef} className="absolute inset-0 [transform-style:preserve-3d]">
              <div ref={assemblyRef} className="absolute inset-0 [transform-style:preserve-3d]">
                {art}
              </div>
            </div>
          </div>
        </div>

        {/* Lens: a vignette, and grain on larger screens. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden opacity-[0.07] mix-blend-overlay md:block"
          style={{ backgroundImage: GRAIN }}
        />

        {/* The only words on the stage: a quiet cue to scroll on. */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-8">
          <div ref={cueRef} className="flex flex-col items-center gap-3 motion-reduce:!visible motion-reduce:!opacity-100">
            <span className="font-body text-[0.62rem] font-semibold uppercase tracking-[0.4em] text-cream/55">Scroll</span>
            <span className="relative block h-10 w-px overflow-hidden bg-cream/15">
              <span className="wheel-cue absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent to-gold" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
