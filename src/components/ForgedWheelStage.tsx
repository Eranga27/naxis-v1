"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { INTRO_SESSION_KEY, onReveal, setHeroReady } from "@/lib/intro";
import { CARD_CLIP_PHONE, CARD_CLIP_WIDE, FULL_CLIP, prefersReducedMotion, useReducedMotion } from "@/lib/motion";
import { VEIL_EXIT_MS } from "@/components/Preloader";
import type { RingName, RingPose, WheelScene } from "@/lib/wheelScene";

gsap.registerPlugin(ScrollTrigger);

const DISC_SRC = "/images/wheel/centre.webp";
const RINGS: RingName[] = ["values", "motto", "name", "disc"];
const TURN = Math.PI * 2;
// Each ring's own pace and direction in its plane (rad/s; negative is
// clockwise as seen), like the bezels of a watch.
const SPIN: Record<RingName, number> = {
  values: -TURN / 150,
  motto: TURN / 210,
  name: -TURN / 110,
  disc: TURN / 260,
};
// How fast each tipped ring's axis wanders while the rings are apart.
const PRECESS: Record<RingName, number> = { values: 0.32, motto: -0.46, name: 0.58, disc: -0.24 };

// Static film grain, as an inline SVG turbulence tile.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

let glSupport: boolean | null = null;
const hasWebGL = () => {
  if (glSupport === null) {
    try {
      const canvas = document.createElement("canvas");
      glSupport = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      glSupport = false;
    }
  }
  return glSupport;
};
const noSubscription = () => () => {};

const pose = (lift = 0): RingPose => ({ spin: 0, tiltX: 0, tiltY: 0, precess: 0, lift });

/**
 * The homepage hero, forged (V2, hero B): the client's Giant Wheel as a
 * real object in WebGL (see lib/wheelScene), alone on a dark stage and
 * never still.
 *
 * Arrival: the intro's zoom through the X lands on the wheel seen edge
 * on, a thin gold line in the dark; the camera keeps pushing in as the
 * wheel turns to face it, a raking light running over the relief, and
 * the rings settle into the seal and lock with a flash.
 *
 * Then a loop made to hold a large screen: the seal turns calmly, its
 * rings at their own paces in alternating directions, long enough to
 * read; then the rings lift apart and tip on their own axes, spinning
 * like a gyroscope while the camera swings round to show their depth;
 * then they swing back into the seal and lock together with a flash and
 * a ring of light. Gold dust rises through it throughout, and on desktop
 * the camera follows the pointer a little.
 *
 * Scrolling pins it, lifts the camera and tips the wheel back, and closes
 * the stage to a card on cream for Mission. It rests while off screen.
 * Without WebGL, or under reduced motion, the flat wheel hero (hero A,
 * passed in as `fallback`) stands in.
 */
export default function ForgedWheelStage({ fallback }: { fallback: React.ReactNode }) {
  const reduce = useReducedMotion();
  const gl = useSyncExternalStore(noSubscription, hasWebGL, () => true);
  const [failed, setFailed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const standIn = reduce || !gl || failed;

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const cue = cueRef.current;
    if (!section || !frame || !canvas || !cue) return;
    if (prefersReducedMotion() || !hasWebGL()) return;

    const phone = window.innerWidth < 768;
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(INTRO_SESSION_KEY) === "done";
    } catch {
      // storage disabled / private mode
    }
    // When the intro's veil is gone, in seconds after the reveal.
    const land = alreadySeen ? 0.2 : VEIL_EXIT_MS / 1000;

    // Everything the scene is drawn from, tweened by the timelines below.
    // Before the reveal: the wheel edge on, far off, its rings apart.
    const st = {
      rings: { values: pose(), motto: pose(0.25), name: pose(0.5), disc: pose(0.8) } as Record<RingName, RingPose>,
      wheelX: Math.PI / 2,
      wheelY: 0,
      azimuth: 0,
      elevation: 0.05,
      dolly: 1.9,
      light: -1.7,
      flash: 0,
      shock: 0,
      ambience: 0,
      speed: 1,
      gyro: 0,
      exit: 0,
    };
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

    let scene: WheelScene | null = null;
    let disposed = false;
    const start = performance.now();
    let last = 0;
    const tick = () => {
      if (!scene) return;
      const box = section.getBoundingClientRect();
      if (box.bottom <= 0 || box.top >= window.innerHeight) {
        last = 0;
        return;
      }
      const time = (performance.now() - start) / 1000;
      const dt = Math.min(0.1, last ? time - last : 0);
      last = time;
      for (const name of RINGS) {
        const r = st.rings[name];
        r.spin += SPIN[name] * st.speed * dt;
        r.precess += PRECESS[name] * st.gyro * dt;
      }
      const ease = Math.min(1, dt * 2.2);
      pointer.sx += (pointer.x - pointer.sx) * ease;
      pointer.sy += (pointer.y - pointer.sy) * ease;
      scene.render({
        rings: st.rings,
        wheelX: st.wheelX - st.exit * 0.6,
        wheelY: st.wheelY,
        azimuth: st.azimuth + pointer.sx * 0.18,
        elevation: st.elevation - pointer.sy * 0.12 + st.exit * 0.3,
        dolly: st.dolly * (1 + st.exit * 0.3),
        light: st.light + Math.sin(time * 0.13) * 0.7,
        flash: st.flash,
        shock: st.shock,
        ambience: st.ambience,
        time,
      });
    };

    // The rings meeting: a flash, and a ring of light running out.
    const lockFlash = () =>
      gsap
        .timeline()
        .to(st, { flash: 1, duration: 0.12, ease: "power2.out" }, 0)
        .to(st, { flash: 0, duration: 1.3, ease: "power2.in" }, 0.12)
        .fromTo(st, { shock: 0.001 }, { shock: 1, duration: 1.7, ease: "power2.out", immediateRender: false }, 0)
        .set(st, { shock: 0 });

    const R = st.rings;
    // The loop, for as long as the wheel is on screen: the seal, turning;
    // the rings apart as a gyroscope; the seal again, locked with light.
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    loop
      .to({}, { duration: 8 })
      .addLabel("apart")
      .to(st, { gyro: 1, speed: 3.2, duration: 2.8, ease: "power2.inOut" }, "apart")
      .to(st, { azimuth: 0.5, elevation: 0.32, dolly: 1.1, duration: 3.2, ease: "power2.inOut" }, "apart")
      .to(R.values, { tiltX: 1.1, lift: -0.12, duration: 2.8, ease: "power3.inOut" }, "apart")
      .to(R.motto, { tiltY: 1.15, lift: 0.2, duration: 2.8, ease: "power3.inOut" }, "apart+=0.15")
      .to(R.name, { tiltX: -0.9, tiltY: 0.55, lift: 0.4, duration: 2.8, ease: "power3.inOut" }, "apart+=0.3")
      .to(R.disc, { tiltY: -0.35, lift: 0.62, duration: 2.8, ease: "power3.inOut" }, "apart+=0.2")
      .addLabel("together", "apart+=8.5")
      .to([R.values, R.motto, R.name, R.disc], { tiltX: 0, tiltY: 0, lift: 0, duration: 2.2, ease: "back.out(1.25)" }, "together")
      .to(st, { gyro: 0, speed: 1, duration: 2.2, ease: "power2.out" }, "together")
      .to(st, { azimuth: 0, elevation: 0.05, dolly: 1, duration: 2.6, ease: "power3.inOut" }, "together")
      .add(lockFlash(), "together+=1.5")
      .to({}, { duration: 3 }, "together+=2.6");

    // Arrival: the camera pushes on from the zoom through the X as the
    // wheel turns from edge on to face it, a raking light over the relief;
    // then the rings close up into the seal and lock.
    const intro = gsap
      .timeline({ paused: true })
      .to(st, { wheelX: 0, duration: 3.8, ease: "power3.inOut" }, Math.max(0, land - 0.6))
      .to(st, { dolly: 1, duration: 4.4, ease: "power2.inOut" }, Math.max(0, land - 0.8))
      .to(st, { light: 1.1, duration: 4.6, ease: "sine.inOut" }, Math.max(0, land - 0.4))
      .to(st, { ambience: 1, duration: 3, ease: "power1.inOut" }, land + 0.4)
      .to([R.motto, R.name, R.disc], { lift: 0, duration: 2.2, ease: "back.out(1.4)", stagger: 0.18 }, land + 1.8)
      .add(lockFlash(), land + 2.7)
      .to(cue, { autoAlpha: 1, duration: 1, ease: "power2.out" }, land + 4)
      .add(() => {
        loop.play();
      }, land + 4.4);
    gsap.set(cue, { autoAlpha: 0 });

    // Build the scene (three.js loads now); the intro's veil waits for it.
    const ready = import("@/lib/wheelScene")
      .then(({ createWheelScene }) =>
        createWheelScene(canvas, { quality: phone ? "low" : "high", discSrc: DISC_SRC })
      )
      .then((built) => {
        if (disposed) {
          built.dispose();
          return;
        }
        scene = built;
        tick();
      });
    ready.catch(() => {
      if (!disposed) setFailed(true);
    });
    setHeroReady(ready);
    const unsubscribe = onReveal(() => {
      ready.then(() => intro.play()).catch(() => {});
    });

    const sized = new ResizeObserver(() => scene?.resize());
    sized.observe(canvas);

    // The camera follows the pointer a little, where there is one.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX / window.innerWidth - 0.5;
      pointer.y = event.clientY / window.innerHeight - 0.5;
    };
    const onLeave = () => {
      pointer.x = pointer.y = 0;
    };
    if (fine) {
      section.addEventListener("pointermove", onMove);
      section.addEventListener("pointerleave", onLeave);
    }

    // Scrolling on: the section pins, the camera lifts as the wheel tips
    // back, and the stage closes to a card on the cream of Mission.
    let framed = false;
    const announce = (next: boolean) => {
      if (next === framed) return;
      framed = next;
      window.dispatchEvent(new CustomEvent("hero:framed", { detail: framed }));
    };
    const isPhone = () => window.innerWidth < 768;
    const ctx = gsap.context(() => {
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
        .to(st, { exit: 1, duration: 1, ease: "power1.inOut" }, 0)
        .fromTo(frame, { clipPath: FULL_CLIP }, { clipPath: () => (isPhone() ? CARD_CLIP_PHONE : CARD_CLIP_WIDE), duration: 0.8 }, 0.2)
        .to(cue.parentElement, { opacity: 0, duration: 0.2 }, 0);
    }, section);
    // Draw every frame the stage is on screen. Checked in the loop itself:
    // an IntersectionObserver on the section kept reporting it off screen
    // once the pin had moved it into its spacer.
    gsap.ticker.add(tick);
    const settle = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("hero:pinned"));
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(settle);
      unsubscribe();
      sized.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      gsap.ticker.remove(tick);
      intro.kill();
      loop.kill();
      announce(false);
      ctx.revert();
      scene?.dispose();
    };
    // Re-run when the stand-in takes over, so this stage's scene is torn
    // down with its canvas.
  }, [standIn]);

  if (standIn) return <>{fallback}</>;

  return (
    <section ref={sectionRef} id="top" data-dark-hero className="relative h-svh min-h-[560px] w-full overflow-hidden bg-cream">
      <h1 className="sr-only">NAXIS Australia — delivering excellence through experience</h1>
      <p className="sr-only">Quality. Reliability. Flawless. Flexible. Fast. Integrity.</p>

      <div ref={frameRef} className="absolute inset-0 overflow-hidden bg-[#0a0705]">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />

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
          <div ref={cueRef} className="flex flex-col items-center gap-3">
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
