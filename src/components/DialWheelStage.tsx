"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { INTRO_SESSION_KEY, onReveal, setHeroReady } from "@/lib/intro";
import { CARD_CLIP_PHONE, CARD_CLIP_WIDE, FULL_CLIP, prefersReducedMotion, useReducedMotion } from "@/lib/motion";
import { VEIL_EXIT_MS } from "@/components/Preloader";
import type { DialFrame, DialScene } from "@/lib/dialScene";

gsap.registerPlugin(ScrollTrigger);

// The wheel exactly as the client drew it: this close, desktop needs the
// 4096 to stay sharp; a phone's shot is wider, so the 2048 does.
const ART_SRC = { wide: "/images/wheel/original-4096.webp", phone: "/images/wheel/original-2048.webp" };
const TURN = Math.PI * 2;
// Each ring's own pace and direction (rad/s; negative is clockwise as
// seen): values, motto, name, disc. Slower than the other heroes — this
// close, a slow turn still carries the lettering across the screen. The
// disc at the centre holds still (the owner's call), so the N and the
// icons stay upright while the rings turn about them.
const SPIN = [-TURN / 240, TURN / 300, -TURN / 200, 0];
// How far each ring is wound off the artwork's arrangement before the
// intro, the way it turns (so it coasts on into place); not the disc.
const WIND = [-2.6, 2, -3, 0];

let glSupport: boolean | null = null;
const hasWebGL = () => {
  if (glSupport === null) {
    try {
      const canvas = document.createElement("canvas");
      glSupport = !!canvas.getContext("webgl2");
    } catch {
      glSupport = false;
    }
  }
  return glSupport;
};
const noSubscription = () => () => {};

/**
 * The homepage hero, close up (V2, hero D): the client's Giant Wheel as a
 * made thing — a gold-edged medallion on a dark table — shot so close
 * that a quarter of it fills a wide screen (half of it a phone's), its
 * rings turning slowly past like a watch's bezels (see lib/dialScene).
 * The face is their artwork exactly; the camera and light give it depth.
 *
 * Arrival: the intro's zoom through the X lands on it dim and out of
 * focus, the rings spinning; the light comes up, the focus pulls in and
 * the rings coast down to their resting pace as the camera settles, and
 * a light runs across the foil.
 *
 * Then, for a large screen left on it: the rings turn, the key light
 * drifts so the foil lettering glints as it passes, motes turn in the
 * beam, and now and then the focus racks out to the rim and back in past
 * the centre, or a light runs across. On desktop the light follows the
 * pointer a little.
 *
 * Scrolling pins it and pulls the camera back to the whole wheel, laid
 * back, while the stage closes to a card on the cream of the section
 * after (BrandStatement). It rests while off screen. Without WebGL 2, or under reduced motion, the still
 * close-up (passed in as `fallback`) stands in.
 */
export default function DialWheelStage({ fallback }: { fallback: React.ReactNode }) {
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
    // Before the reveal: dim, out of focus, the camera back and off to
    // one side, the rings wound round out of place.
    const st = { exposure: 0.45, defocus: 1, focus: 0, shine: 0, wind: 1, dolly: 1.22, azimuth: 0.08, elevation: 0.1, exit: 0 };
    // Each ring's steady turn; how far off register that will be when the
    // intro settles (taken out as it does, so nothing jumps); and what's
    // drawn: the turn, less the winding and that offset.
    const turned = [0, 0, 0, 0];
    const offset = [0, 0, 0, 0];
    const angles: [number, number, number, number] = [0, 0, 0, 0];
    // The pointer, -1 to 1 across the stage, eased.
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    const shot: DialFrame = {
      time: 0,
      angles,
      exposure: 0,
      defocus: 0,
      focus: 0,
      light: { x: 0, y: 0 },
      shine: 0,
      azimuth: 0,
      elevation: 0,
      dolly: 1,
      exit: 0,
    };

    let scene: DialScene | null = null;
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
      for (let i = 0; i < 4; i++) {
        turned[i] += SPIN[i] * dt;
        angles[i] = turned[i] - WIND[i] * st.wind - offset[i] * (1 - st.wind);
      }
      const ease = Math.min(1, dt * 2.5);
      pointer.sx += (pointer.x - pointer.sx) * ease;
      pointer.sy += (pointer.y - pointer.sy) * ease;

      shot.time = time;
      shot.exposure = st.exposure * (1 - st.exit * 0.3);
      shot.defocus = st.defocus;
      shot.focus = st.focus;
      // The key light drifts slowly, so the foil's glint wanders over
      // the lettering; the pointer leads it a little.
      shot.light.x = Math.sin(time * 0.06) * 0.26 + pointer.sx * 0.4;
      shot.light.y = Math.cos(time * 0.045) * 0.18 + pointer.sy * 0.3;
      shot.shine = st.shine;
      // A slow drift, as if on a slider: enough that the steps between
      // the rings shift against each other, which is what sells the depth.
      shot.azimuth = st.azimuth + Math.sin(time * 0.05) * 0.05 + pointer.sx * 0.02;
      shot.elevation = st.elevation + Math.sin(time * 0.037 + 1) * 0.03 - pointer.sy * 0.012;
      shot.dolly = st.dolly * (1 + Math.sin(time * 0.043) * 0.012);
      shot.exit = st.exit;
      scene.render(shot);
    };

    const shine = () =>
      gsap.timeline().fromTo(st, { shine: 0 }, { shine: 1, duration: 2.8, ease: "power1.inOut", immediateRender: false }).set(st, { shine: 0 });

    // The loop, for as long as the wheel is on screen: the focus racks
    // out to the rim, in past the centre and back; a light runs across.
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    loop
      .to(st, { focus: 0.14, duration: 3.2, ease: "power2.inOut" }, 7)
      .to(st, { focus: -0.1, duration: 3.6, ease: "power2.inOut" }, 13.5)
      .to(st, { focus: 0, duration: 3, ease: "power2.inOut" }, 20)
      .add(shine(), 25)
      .to({}, { duration: 4 }, 28);

    // Arrival: the light comes up, the focus pulls in, and the rings
    // coast round and settle into the client's arrangement as the camera
    // does — the lettering upright just as it comes into focus. Then
    // they turn on at their own paces.
    const settled = land + 4.2;
    const intro = gsap
      .timeline({ paused: true })
      .add(() => {
        for (let i = 0; i < 4; i++) offset[i] = turned[i] + SPIN[i] * settled;
      }, 0)
      .to(st, { dolly: 1, azimuth: 0, elevation: 0, duration: land + 3.4, ease: "power2.inOut" }, 0)
      .to(st, { wind: 0, duration: settled, ease: "power3.out" }, 0)
      .to(st, { exposure: 1, duration: 2.8, ease: "power2.inOut" }, Math.max(0, land - 0.4))
      .to(st, { defocus: 0, duration: 2.6, ease: "power2.inOut" }, land + 0.3)
      .add(shine(), land + 2.6)
      .to(cue, { autoAlpha: 1, duration: 1, ease: "power2.out" }, land + 3.4)
      .add(() => {
        loop.play();
      }, land + 4.4);
    gsap.set(cue, { autoAlpha: 0 });

    // Build the scene (three.js loads now); the intro's veil waits for it.
    const ready = import("@/lib/dialScene")
      .then(({ createDialScene }) => createDialScene(canvas, { artSrc: phone ? ART_SRC.phone : ART_SRC.wide, phone }))
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

    // The light follows the pointer, a little.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    if (fine) {
      section.addEventListener("pointermove", onMove);
      section.addEventListener("pointerleave", onLeave);
    }

    // Scrolling on: the section pins, the camera pulls back to the whole
    // wheel, laid back, and the stage closes to a card on the cream of
    // the section after.
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
        {/* The scene draws its own lens: depth of field, bloom, haze, vignette and grain. */}
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />

        {/* The only words on the stage: a quiet cue to scroll on, in the
            dark off the wheel's edge on wide screens; on a capsule of the
            dark where it has to sit over the wheel's white face. */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-8 md:left-8 md:translate-x-0 lg:left-12">
          <div ref={cueRef} className="flex flex-col items-center gap-3 rounded-full bg-[#0a0705]/75 px-3 pb-3 pt-4">
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
