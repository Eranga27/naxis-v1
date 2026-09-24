// Golden wattle and eucalyptus framing for the "We make ideas wearable"
// section — a lightweight vector stand-in for the foliage on the client's
// artboard (client-details/*BACKGROUND*.png), until they supply the
// layered source file.
//
// Placement is procedural but seeded, so server and client render the
// exact same markup (no hydration mismatch). Everything sits in a ring
// around the edges, leaving the centre clear for the phrase.

// Two canvases: a landscape one for desktop and a portrait one for
// phones. A single landscape layout "sliced" into a portrait screen only
// shows its centre — exactly the part left empty for the phrase.
type Frame = { w: number; h: number };
const LANDSCAPE: Frame = { w: 1600, h: 900 };
const PORTRAIT: Frame = { w: 900, h: 1600 };

// Small deterministic PRNG (mulberry32).
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

// A point in the outer ring: outside an ellipse around the centre.
function ringPoint(rand: () => number, inner: number, f: Frame) {
  for (;;) {
    const x = rand() * f.w;
    const y = rand() * f.h;
    const nx = (x - f.w / 2) / (f.w / 2);
    const ny = (y - f.h / 2) / (f.h / 2);
    if (nx * nx + ny * ny > inner) return { x, y };
  }
}

type Leaf = { x: number; y: number; r: number; s: number; tone: number };
type Blossom = { x: number; y: number; r: number };

function layout(
  seed: number,
  leaves: number,
  clusters: number,
  inner: number,
  f: Frame
) {
  const rand = rng(seed);
  const leafList: Leaf[] = [];
  for (let i = 0; i < leaves; i++) {
    const { x, y } = ringPoint(rand, inner, f);
    // Leaves point roughly inward, like branches reaching from the edges.
    const inward = (Math.atan2(f.h / 2 - y, f.w / 2 - x) * 180) / Math.PI;
    leafList.push({
      x: round(x),
      y: round(y),
      r: round(inward + (rand() - 0.5) * 80),
      s: round(0.8 + rand() * 0.9),
      tone: Math.floor(rand() * 3),
    });
  }
  const blossomList: Blossom[] = [];
  for (let i = 0; i < clusters; i++) {
    const { x, y } = ringPoint(rand, inner + 0.08, f);
    const count = 3 + Math.floor(rand() * 5);
    for (let j = 0; j < count; j++) {
      blossomList.push({
        x: round(x + (rand() - 0.5) * 70),
        y: round(y + (rand() - 0.5) * 70),
        r: round(6 + rand() * 7),
      });
    }
  }
  return { leafList, blossomList };
}

const LAYOUTS = {
  landscape: {
    back: layout(7, 46, 12, 0.55, LANDSCAPE),
    front: layout(21, 30, 14, 0.78, LANDSCAPE),
  },
  portrait: {
    back: layout(11, 40, 10, 0.5, PORTRAIT),
    front: layout(29, 26, 12, 0.72, PORTRAIT),
  },
};

const LEAF_PATH = "M0 0 C 14 -11 52 -13 96 0 C 52 13 14 11 0 0 Z";
const LEAF_FILLS = ["url(#leaf-a)", "url(#leaf-b)", "url(#leaf-c)"];

function Layer({ data, id }: { data: ReturnType<typeof layout>; id: string }) {
  return (
    <g>
      {data.leafList.map((leaf, i) => (
        <g
          key={`${id}-l${i}`}
          transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.r}) scale(${leaf.s})`}
        >
          <path d={LEAF_PATH} fill={LEAF_FILLS[leaf.tone]} />
          <path d="M2 0 L 92 0" stroke="#a9b98a" strokeOpacity={0.35} strokeWidth={1} />
        </g>
      ))}
      {data.blossomList.map((b, i) => (
        <g key={`${id}-b${i}`}>
          <circle cx={b.x} cy={b.y} r={b.r} fill="url(#wattle)" />
          {/* dotted outline reads as the blossom's fluffy edge */}
          <circle
            cx={b.x}
            cy={b.y}
            r={b.r + 1.5}
            fill="none"
            stroke="#ffd33d"
            strokeWidth={2}
            strokeDasharray="1 2.4"
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>
  );
}

function WattleDefs() {
  return (
    <defs>
      <linearGradient id="leaf-a" x1="0" x2="1">
        <stop offset="0%" stopColor="#1d3a26" />
        <stop offset="100%" stopColor="#4f6e3f" />
      </linearGradient>
      <linearGradient id="leaf-b" x1="0" x2="1">
        <stop offset="0%" stopColor="#243f2c" />
        <stop offset="100%" stopColor="#6b8452" />
      </linearGradient>
      <linearGradient id="leaf-c" x1="0" x2="1">
        <stop offset="0%" stopColor="#16301f" />
        <stop offset="100%" stopColor="#3b5a35" />
      </linearGradient>
      <radialGradient id="wattle" cx="40%" cy="38%" r="65%">
        <stop offset="0%" stopColor="#fff07a" />
        <stop offset="55%" stopColor="#ffcc1a" />
        <stop offset="100%" stopColor="#e3a300" />
      </radialGradient>
    </defs>
  );
}

function Canvas({
  f,
  data,
  id,
  className,
}: {
  f: Frame;
  data: ReturnType<typeof layout>;
  id: string;
  className: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${f.w} ${f.h}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <Layer data={data} id={id} />
    </svg>
  );
}

// Each layer renders both orientations; CSS shows the one that matches.
export function WattleBack() {
  return (
    <>
      {/* Shared gradients, in a zero-size SVG that is always rendered —
          gradients inside a display:none SVG (whichever orientation is
          hidden) don't paint in Chrome or Firefox. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <WattleDefs />
      </svg>
      <Canvas f={LANDSCAPE} data={LAYOUTS.landscape.back} id="bl" className="h-full w-full portrait:hidden" />
      <Canvas f={PORTRAIT} data={LAYOUTS.portrait.back} id="bp" className="hidden h-full w-full portrait:block" />
    </>
  );
}

export function WattleFront() {
  return (
    <>
      <Canvas f={LANDSCAPE} data={LAYOUTS.landscape.front} id="fl" className="h-full w-full portrait:hidden" />
      <Canvas f={PORTRAIT} data={LAYOUTS.portrait.front} id="fp" className="hidden h-full w-full portrait:block" />
    </>
  );
}
