"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { INTRO_SESSION_KEY, onReveal, setHeroReady } from "@/lib/intro";
import { CARD_CLIP_PHONE, CARD_CLIP_WIDE, FULL_CLIP, prefersReducedMotion, useReducedMotion } from "@/lib/motion";
import { VEIL_EXIT_MS } from "@/components/Preloader";
import type { WovenScene } from "@/lib/wovenScene";

gsap.registerPlugin(ScrollTrigger);

const DISC_SRC = "/images/wheel/centre.webp";
const TURN = Math.PI * 2;
// Each ring's own pace and direction (rad/s; negative is clockwise as
// seen): values, motto, name, disc.
const SPIN = [-TURN / 150, TURN / 210, -TURN / 110, TURN / 260];
// The light that runs round the wheel, once every 9 seconds.
const SCAN = TURN / 9;

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

/**
 * The homepage hero, woven (V2, hero C): the client's Giant Wheel as a
 * hundred thousand or so points of light in its own colours, which lie
 * loose as threads or come together as the wheel (see lib/wovenScene).
 * A garment maker's wheel, made the way their garments are: from thread.
 *
 * Arrival: the intro's zoom through the X lands on a loom — coloured
 * threads running across the dark — and they swirl in and weave the
 * wheel from its centre out, finished with a ripple through the cloth.
 *
 * Then a loop to hold a large screen: the woven wheel turns ring by ring
 * while a light runs round it and a ripple passes through now and then;
 * then it comes undone into threads streaming the other way (warp, then
 * weft, in turn) and weaves itself again. On desktop the threads part
 * round the pointer, like fingers through cloth.
 *
 * Scrolling pins it, unpicks the wheel into threads and closes the stage
 * to a card on cream for Mission. It rests while off screen. Without
 * WebGL, or under reduced motion, the flat wheel hero (hero A, passed in
 * as `fallback`) stands in.
 */
export default function WovenWheelStage({ fallback }: { fallback: React.ReactNode }) {
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
    const land = alreadySeen ? 0.3 : VEIL_EXIT_MS / 1000;

    // Everything the scene is drawn from, tweened by the timelines below.
    // Before the reveal: loose threads, running across.
    const st = { form: 0, weft: 0, ripple: 0, exit: 0, azimuth: 0, elevation: 0, dolly: 1 };
    const angles: [number, number, number, number] = [0, 0, 0, 0];
    let scan = -Math.PI / 2;
    // The pointer, in the wheel's units, and how near it is to count.
    const pointer = { x: 0, y: 0, on: 0, sx: 0, sy: 0, son: 0 };

    let scene: WovenScene | null = null;
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
      for (let i = 0; i < 4; i++) angles[i] += SPIN[i] * dt;
      scan += SCAN * dt;
      const ease = Math.min(1, dt * 4);
      pointer.sx += (pointer.x - pointer.sx) * ease;
      pointer.sy += (pointer.y - pointer.sy) * ease;
      pointer.son += (pointer.on - pointer.son) * ease;
      scene.render({
        time,
        // Scrolling unpicks the weave.
        form: st.form * (1 - st.exit * 0.75),
        weft: st.weft,
        angles,
        ripple: st.ripple,
        scan,
        pointer: { x: pointer.sx, y: pointer.sy, on: pointer.son * st.form },
        azimuth: st.azimuth + Math.sin(time * 0.1) * 0.1 + pointer.sx * 0.05,
        elevation: st.elevation + Math.sin(time * 0.07) * 0.07 - pointer.sy * 0.04 + st.exit * 0.35,
        dolly: st.dolly * (1 - st.exit * 0.2),
      });
    };

    const ripple = () => gsap.timeline().fromTo(st, { ripple: 0.001 }, { ripple: 1, duration: 2.4, ease: "power1.out", immediateRender: false }).set(st, { ripple: 0 });

    // The loop, for as long as the wheel is on screen: woven and turning,
    // a ripple through the cloth; undone into threads, the other way from
    // last time; woven again.
    let crossings = 0;
    const loop = gsap.timeline({
      paused: true,
      repeat: -1,
      onRepeat: () => {
        crossings++;
      },
    });
    loop
      .add(ripple(), 5)
      .add(() => {
        // Set while woven, where it can't be seen: the threads run the
        // other way each time.
        st.weft = crossings % 2 === 0 ? 1 : 0;
      }, 10)
      .to(st, { form: 0, duration: 3.6, ease: "power2.in" }, 11)
      .to(st, { dolly: 1.06, duration: 3.6, ease: "power1.inOut" }, 11)
      .to(st, { form: 1, duration: 4.4, ease: "power2.inOut" }, 16.4)
      .to(st, { dolly: 1, duration: 4.4, ease: "power1.inOut" }, 16.4)
      .add(ripple(), 20.4)
      .to({}, { duration: 5 }, 21);

    // Arrival: the threads on the loom swirl in and weave the wheel.
    const intro = gsap
      .timeline({ paused: true })
      .fromTo(st, { dolly: 1.12 }, { dolly: 1, duration: 5, ease: "power2.inOut", immediateRender: false }, Math.max(0, land - 0.4))
      .to(st, { form: 1, duration: 4.6, ease: "power2.inOut" }, land + 0.2)
      .add(ripple(), land + 4.5)
      .to(cue, { autoAlpha: 1, duration: 1, ease: "power2.out" }, land + 4.8)
      .add(() => {
        loop.play();
      }, land + 5.2);
    gsap.set(cue, { autoAlpha: 0 });

    // Build the scene (three.js loads now); the intro's veil waits for it.
    const ready = import("@/lib/wovenScene")
      .then(({ createWovenScene }) =>
        createWovenScene(canvas, { count: phone ? 42000 : 120000, discSrc: DISC_SRC })
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

    // The threads part round the pointer, where there is one.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (event: PointerEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const radius = Math.min(h * 0.8, w * 0.92) / 2;
      pointer.x = (event.clientX - w / 2) / radius;
      pointer.y = -(event.clientY - h / 2) / radius;
      pointer.on = 1;
    };
    const onLeave = () => {
      pointer.on = 0;
    };
    if (fine) {
      section.addEventListener("pointermove", onMove);
      section.addEventListener("pointerleave", onLeave);
    }

    // Scrolling on: the section pins, the wheel comes undone into threads
    // as the camera lifts, and the stage closes to a card on the cream of
    // Mission.
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
    // Drawn every frame the stage is on screen; the check is in the loop
    // (an IntersectionObserver lost track of the section once the pin
    // moved it into its spacer).
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

        {/* Lens: a warm pool of light, a vignette, and grain on larger screens. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 55% at 50% 50%, rgba(255,190,90,0.07), transparent 70%), radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)",
          }}
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
