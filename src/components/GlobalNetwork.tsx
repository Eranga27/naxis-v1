"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { NETWORK_MAP } from "@/content/networkMap";
import { CONTACT_HREF } from "@/lib/navLinks";
import { useIsomorphicLayoutEffect } from "@/lib/motion";
import type { Globe, ScreenPoint } from "@/lib/globeScene";

gsap.registerPlugin(ScrollTrigger);

// The logistics journey from the client's company profile (page 5),
// shown as status pills around the globe.
const JOURNEY = [
  "Shipping documentation",
  "Freight coordination",
  "Customs clearance",
  "Doorstep delivery",
];

// Home is Australia; the routes go out from it to each country.
const HOME = NETWORK_MAP.destination;
const PLACES = NETWORK_MAP.origins;

// Which side of its marker each label sits, so the close-together
// countries of South Asia don't collide.
const LABEL_SIDE: Record<string, "left" | "right" | "above" | "below"> = {
  Italy: "right",
  India: "left",
  "Sri Lanka": "left",
  Bangladesh: "above",
  China: "right",
  Vietnam: "right",
  Australia: "below",
};
const SIDE_CLASS = {
  left: "-translate-x-full -translate-y-1/2 pr-3",
  right: "-translate-y-1/2 pl-3",
  above: "-translate-x-1/2 -translate-y-full pb-3",
  below: "-translate-x-1/2 pt-3",
};

// Where the status pills float, in globe radii from its centre (y up), on
// screens wide enough to scatter them.
const PILL_AT = [
  { x: -0.95, y: 0.02 },
  { x: 0.62, y: 0.86 },
  { x: -0.34, y: 0.2 },
  { x: 0.36, y: -0.02 },
];

// The face of the globe towards us: first Australia, close in; then,
// following the routes out, the whole network from Italy to Australia.
const START = { lon: 125, lat: -52, roll: 10 };
const END = { lon: 76, lat: -11, roll: 23 };

// Routes launch nearest first, so the last to land is Italy as the globe
// finishes turning west.
const LAUNCH_ORDER = PLACES.map((place, i) => ({ i, d: Math.hypot(place.lon - HOME.lon, place.lat - HOME.lat) }))
  .sort((a, b) => a.d - b.d)
  .map(({ i }) => i);

const lerp = gsap.utils.interpolate;
const smooth = (a: number, b: number, x: number) => {
  const t = gsap.utils.clamp(0, 1, (x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * The network as a night globe rising from the foot of the section. The
 * section pins: the globe rises, Australia lights up, and a route leaves
 * it for each of the six countries while the globe turns to follow them
 * west; each country lights as its route lands, and the journey's steps
 * pop up as status pills. After that, shipments keep running out along
 * the routes. three.js and the textures load only as the section
 * approaches. Reduced motion shows the finished network, still; without
 * WebGL the countries are listed instead.
 */
export default function GlobalNetwork() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const homeLabelRef = useRef<HTMLSpanElement>(null);
  const pillRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [noWebGL, setNoWebGL] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const text = textRef.current;
    const homeLabel = homeLabelRef.current;
    if (!section || !stage || !text || !homeLabel) return;
    const labels = labelRefs.current;
    const pills = pillRefs.current.filter((el): el is HTMLLIElement => el !== null);
    const pillInners = pills.map((pill) => pill.firstElementChild!.firstElementChild as HTMLElement);

    // What the scroll drives; the render loop reads it every frame.
    // Each route's progress is its own object: GSAP reads an array as a
    // list of targets, not as values to tween.
    const state = { rise: 0, view: 0, home: 0 };
    const routes = PLACES.map(() => ({ p: 0 }));
    let reduce = false;
    let globe: Globe | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let disposed = false;
    let dirty = true;
    let width = section.clientWidth;
    let height = section.clientHeight;

    // Size and place the globe for this screen. It starts low, only its
    // crown showing, and rises until Australia and its label clear the
    // bottom edge.
    const layout = () => {
      const phone = width < 640;
      const radius = phone ? width * 0.56 : width < 1024 ? width * 0.44 : Math.min(width * 0.32, height * 0.52);
      const startCy = height * (phone ? 0.8 : 0.66) + radius;
      // Phones keep room at the foot for the pills.
      const endCy = height - 0.07 * radius - (phone ? 150 : 56);
      return { phone, radius, cx: width / 2, cy: lerp(startCy, endCy, state.rise), endTop: endCy - radius };
    };
    // Whether the risen globe would run into a line of the copy; those
    // lines make way as it rises (all of it, if even the heading would).
    const heading = text.querySelector("h2")!;
    const clashes = (el: Element) => {
      const box = el as HTMLElement;
      return text.offsetTop + box.offsetTop + box.offsetHeight > layout().endTop;
    };
    const makesWay = (el: Element) => clashes(heading) || clashes(el);

    const place = (el: HTMLElement | null, name: string, point: ScreenPoint, shown: number) => {
      if (!el) return;
      const opacity = shown * smooth(0.02, 0.16, point.facing);
      el.style.opacity = `${opacity}`;
      if (opacity <= 0.01) return;
      // Keep the label on screen, whichever side of its marker it sits.
      const w = el.offsetWidth;
      const side = LABEL_SIDE[name] ?? "right";
      const [min, max] =
        side === "right" ? [12, width - 12 - w] : side === "left" ? [12 + w, width - 12] : [12 + w / 2, width - 12 - w / 2];
      const x = gsap.utils.clamp(min, max, point.x);
      el.style.transform = `translate3d(${x}px, ${point.y}px, 0)`;
    };

    // Phones spare the GPU: between scroll updates only the pulses move, so
    // they're redrawn at half rate while the section is pinned, and not at
    // all as it scrolls in or out (the canvas keeps its last frame). Any
    // scroll that changes the scene marks it dirty and gets every frame.
    let lastDraw = 0;
    let pinned = false;
    const tick = (time: number) => {
      if (!globe || (reduce && !dirty)) return;
      if (!dirty && width < 768 && (!pinned || time - lastDraw < 1 / 30)) return;
      lastDraw = time;
      const L = layout();
      const v = smooth(0, 1, state.view);
      const drift = reduce ? 0 : Math.sin(time * 0.3) * 4 * (1 - v);
      // Keep drawing (even when still) until the Earth has faded in.
      dirty = globe.render({
        radius: L.radius,
        cx: L.cx,
        cy: L.cy,
        lon: lerp(START.lon, END.lon, v) + drift,
        lat: lerp(START.lat, END.lat, v),
        roll: lerp(START.roll, END.roll, v),
        home: state.home,
        routes: routes.map((route) => route.p),
        time: reduce ? 0 : time,
      });
      const points = globe.screenPoints();
      place(homeLabel, HOME.name, points.home, state.home);
      points.places.forEach((point, i) => {
        place(labels[i], PLACES[i].name, point, smooth(0.9, 1, routes[i].p));
      });
      if (!L.phone) {
        pills.forEach((pill, i) => {
          const at = PILL_AT[i];
          const half = 12 + pill.offsetWidth / 2;
          const x = gsap.utils.clamp(half, width - half, L.cx + at.x * L.radius);
          pill.style.transform = `translate3d(${x}px, ${L.cy - at.y * L.radius}px, 0)`;
        });
      } else {
        pills.forEach((pill) => (pill.style.transform = ""));
      }
    };

    const resize = () => {
      width = section.clientWidth;
      height = section.clientHeight;
      globe?.setSize(width, height);
      dirty = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(section);

    // Load three.js and the globe as the section approaches.
    // No WebGL: list the countries instead, and drop the pin and the
    // copy's fade, which would otherwise play over an empty stage.
    const giveUp = () => {
      if (disposed) return;
      setNoWebGL(true);
      mm.revert();
      ScrollTrigger.refresh();
    };
    const hasWebGL = () => {
      const probe = document.createElement("canvas").getContext("webgl2");
      probe?.getExtension("WEBGL_lose_context")?.loseContext();
      return probe !== null;
    };

    const load = () => {
      if (!hasWebGL()) return giveUp();
      import("@/lib/globeScene")
        .then(({ createGlobe }) => {
          if (disposed) return;
          canvas = document.createElement("canvas");
          canvas.setAttribute("aria-hidden", "true");
          canvas.className = "absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000";
          stage.appendChild(canvas);
          try {
            globe = createGlobe(canvas, {
              home: HOME,
              places: [...PLACES],
              textureSize: width >= 1024 ? 4096 : 2048,
              // Phones draw it at up to 1.5x rather than 2x: about half
              // the pixels, on a screen too dense to tell.
              maxPixelRatio: width < 768 ? 1.5 : 2,
            });
          } catch {
            canvas.remove();
            canvas = null;
            return giveUp();
          }
          globe.setSize(width, height);
          canvas.style.opacity = "1";
          dirty = true;
          globe.ready.then(() => (dirty = true));
        })
        .catch(giveUp);
    };
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          near.disconnect();
          load();
        }
      },
      { rootMargin: "150% 0px" }
    );
    near.observe(section);

    const mm = gsap.matchMedia();
    mm.add(
      {
        wide: "(min-width: 640px) and (prefers-reduced-motion: no-preference)",
        narrow: "(max-width: 639px) and (prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { narrow, reduced } = context.conditions as { narrow: boolean; reduced: boolean };
        reduce = reduced;
        dirty = true;
        if (reduced) {
          Object.assign(state, { rise: 1, view: 1, home: 1 });
          routes.forEach((route) => (route.p = 1));
          gsap.set(pillInners, { autoAlpha: 1, y: 0 });
          return;
        }
        Object.assign(state, { rise: 0, view: 0, home: 0 });
        routes.forEach((route) => (route.p = 0));
        gsap.set(pillInners, { autoAlpha: 0, y: 14 });

        gsap.from(text.children, {
          autoAlpha: 0,
          y: 28,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: section, start: "top 70%", once: true },
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + window.innerHeight * (narrow ? 1.5 : 1.9),
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: () => (dirty = true),
            onToggle: (self) => {
              pinned = self.isActive;
              dirty = true;
            },
          },
        });
        tl.to(state, { rise: 1, duration: 0.36, ease: "power2.inOut" }, 0)
          .to(
            text.children,
            {
              autoAlpha: (_: number, el: Element) => (makesWay(el) ? 0 : 1),
              y: (_: number, el: Element) => (makesWay(el) ? -30 : 0),
              duration: 0.22,
            },
            0.06
          )
          .to(state, { home: 1, duration: 0.1 }, 0.1)
          .to(state, { view: 1, duration: 0.62 }, 0.2);
        LAUNCH_ORDER.forEach((index, n) => {
          tl.to(routes[index], { p: 1, duration: 0.26, ease: "power1.inOut" }, 0.28 + n * 0.075);
        });
        pillInners.forEach((pill, i) => {
          tl.to(pill, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power2.out" }, 0.42 + i * 0.13);
        });
        tl.to({}, { duration: 0.06 });
      }
    );

    // Only render while the section is on screen. An observer rather than
    // a ScrollTrigger: one on the pinned section itself ends at its bottom
    // edge, partway through the pin, whereas the section stays in view (and
    // so observed) for the whole pinned stretch.
    const visible = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        dirty = true;
        gsap.ticker.add(tick);
      } else {
        gsap.ticker.remove(tick);
      }
    });
    visible.observe(section);

    return () => {
      disposed = true;
      mm.revert();
      visible.disconnect();
      gsap.ticker.remove(tick);
      near.disconnect();
      observer.disconnect();
      globe?.dispose();
      canvas?.remove();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="global-network"
      aria-labelledby="global-network-title"
      className="relative h-svh min-h-[560px] w-full overflow-hidden bg-ink"
    >
      {/* Where the globe rises: a faint blue light at the foot */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-[radial-gradient(ellipse_55%_60%_at_50%_100%,rgba(70,110,210,0.2),transparent_70%)]"
      />
      <div ref={stageRef} className="absolute inset-0" />

      <div
        ref={textRef}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-28 text-center md:pt-32"
      >
        <p className="mb-5 w-fit font-body text-xs font-bold uppercase tracking-[0.35em] text-gradient-brand md:text-sm">
          Global Network
        </p>
        <h2
          id="global-network-title"
          className="font-headline text-[clamp(2.5rem,6.5vw,5.75rem)] uppercase leading-[0.95] tracking-[-0.01em] text-cream"
        >
          Six countries. <br className="hidden sm:block" />
          One journey to your door.
        </h2>
        <p className="mt-5 max-w-xl font-body text-sm leading-relaxed text-cream/70 md:text-base">
          We manage the journey from factory to your doorstep — evaluating the shipping options for each
          order to find the right balance of cost, transit time and reliability.
        </p>
        <Link
          href={CONTACT_HREF}
          className="mt-8 inline-flex items-center rounded-full bg-cream px-8 py-3.5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold"
        >
          Start a project
        </Link>
      </div>

      {noWebGL ? (
        <ul className="relative z-10 mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-3 px-6">
          {[HOME, ...PLACES].map((p) => (
            <li
              key={p.name}
              className="rounded-full border border-cream/15 bg-cream/5 px-4 py-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-cream"
            >
              {p.name === HOME.name ? "NAXIS Australia" : p.name}
            </li>
          ))}
        </ul>
      ) : (
        <>
          {/* Country labels, placed each frame over their markers. Labels
              and pills are solid rather than frosted: a backdrop blur over
              a canvas that redraws every frame is recomputed every frame. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
            <span ref={homeLabelRef} className="absolute left-0 top-0 opacity-0">
              <span className={`block whitespace-nowrap ${SIDE_CLASS[LABEL_SIDE.Australia]}`}>
                <span className="block rounded-full bg-emerald px-3 py-1 font-body text-[0.6rem] font-bold uppercase tracking-[0.18em] text-cream shadow-[0_0_24px_rgba(47,208,138,0.45)] sm:text-[0.68rem]">
                  NAXIS Australia
                </span>
              </span>
            </span>
            {PLACES.map((place, i) => (
              <span
                key={place.name}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className="absolute left-0 top-0 opacity-0"
              >
                <span className={`block whitespace-nowrap ${SIDE_CLASS[LABEL_SIDE[place.name] ?? "right"]}`}>
                  <span className="block rounded-full border border-cream/15 bg-ink/80 px-2.5 py-0.5 font-body text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-cream sm:text-[0.66rem]">
                    {place.name}
                  </span>
                </span>
              </span>
            ))}
          </div>

          {/* The journey's steps, as status pills */}
          <ul
            aria-label="Every shipment, managed"
            className="pointer-events-none absolute inset-0 z-10 max-sm:inset-auto max-sm:bottom-6 max-sm:left-4 max-sm:right-4 max-sm:flex max-sm:flex-wrap max-sm:justify-center max-sm:gap-2"
          >
            {JOURNEY.map((step, i) => (
              <li
                key={step}
                ref={(el) => {
                  pillRefs.current[i] = el;
                }}
                className="sm:absolute sm:left-0 sm:top-0"
              >
                {/* Centred on its point by translate; the pill inside is
                    what animates (a GSAP y would replace the translate). */}
                <span className="block w-max -translate-x-1/2 -translate-y-1/2 max-sm:translate-x-0 max-sm:translate-y-0">
                  <span className="flex items-center gap-2 rounded-full border border-cream/10 bg-[#16140f]/90 px-3.5 py-2 font-body text-xs font-semibold text-cream shadow-[0_10px_30px_rgba(0,0,0,0.45)] max-sm:px-3 max-sm:py-1.5 max-sm:text-[0.7rem] md:gap-2.5 md:px-4 md:py-2.5 md:text-sm">
                    <CheckIcon />
                    {step}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="sr-only">
        A globe showing routes from NAXIS Australia to its network in Italy, India, Sri Lanka, Bangladesh, China and
        Vietnam.
      </p>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-emerald-bright md:h-[1.1rem] md:w-[1.1rem]" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.3 10.2 8.8 12.6 13.8 7.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
