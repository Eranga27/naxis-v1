import * as THREE from "three";
import { GIANT_WHEEL as W } from "@/content/giantWheel";

// The homepage hero's wheel, woven (V2 hero C): the client's Giant Wheel
// as some hundred thousand points of light, each taking its colour from
// the artwork — gold lettering, cream motto, emerald stars, the icon
// disc's own colours — that can lie loose as threads running across the
// screen, or be woven into the wheel.
//
// The artwork is drawn once to canvases (its rings from the same path
// data as the flat wheel, its disc from the same image) and sampled;
// everything after that happens in one vertex shader, so a frame is a
// single draw of points however many there are.
//
// Loaded on demand (it pulls in three.js) and driven entirely by the
// WovenFrame the hero passes to render().

export type WovenFrame = {
  /** Seconds, for the threads' flow. */
  time: number;
  /** Loose threads (0) to woven wheel (1). */
  form: number;
  /** Threads run across (0, warp) or down (1, weft). */
  weft: number;
  /** Each ring's turn in its own plane, radians: values, motto, name, disc. */
  angles: [number, number, number, number];
  /** A ripple running out through the weave, 0–1 (0: none). */
  ripple: number;
  /** Where the light running round the wheel is, radians. */
  scan: number;
  /** The pointer, in the wheel's units (radius 1), and how much it parts the threads. */
  pointer: { x: number; y: number; on: number };
  /** Camera orbit (radians) and distance (1 = the wheel fits the frame). */
  azimuth: number;
  elevation: number;
  dolly: number;
};

const [R1, R2, R3, R4] = W.radii;
const EDGE = R1 + W.rimWidth / 2; // the wheel's radius, artwork units
const DISC = R4 + W.rimWidth / 2;
const CREAM = "#f4efe4";
const EMERALD = "#2fd08a";

/** A banded metallic gold, as on the flat wheel's dark tone. */
function gild(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(-160, -480, 160, 480);
  const stops: Array<[number, string]> = [
    [0, "#fff3d1"],
    [0.2, "#f0c565"],
    [0.42, "#c98a33"],
    [0.6, "#f7dc97"],
    [0.8, "#cf9440"],
    [1, "#fbe3a8"],
  ];
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  return g;
}

/**
 * The artwork, sampled into points: where each sits (radius 1 = the
 * wheel's edge), its colour, and which ring it turns with. Lettering and
 * rims get the most points, the icons fewer, the disc's cream ground a
 * light scatter, so the words read.
 */
async function sampleArtwork(count: number, discSrc: string) {
  const size = 1200;
  const scale = size / (EDGE * 2 + 16);
  const canvas = (draw: (ctx: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.translate(size / 2, size / 2);
    ctx.scale(scale, scale);
    draw(ctx);
    return ctx.getImageData(0, 0, size, size).data;
  };

  const rings = canvas((ctx) => {
    const gold = gild(ctx);
    const rimStrokes = [gold, "rgba(244,239,228,0.55)", gold, "rgba(230,205,147,0.85)"];
    W.radii.forEach((r, i) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.lineWidth = W.rimWidth;
      ctx.strokeStyle = rimStrokes[i];
      ctx.stroke();
    });
    const fill = (d: string, style: string | CanvasGradient) => {
      ctx.fillStyle = style;
      ctx.fill(new Path2D(d));
    };
    for (const value of W.values) fill(value.d, gold);
    fill(W.valueBars, EMERALD);
    fill(W.motto.top + W.motto.bottom, CREAM);
    fill(W.mottoBars, EMERALD);
    fill(W.name.top, gold);
    fill(W.name.bottom, CREAM);
    fill(W.stars, EMERALD);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = discSrc;
  });
  const icons = canvas((ctx) => ctx.drawImage(image, -DISC, -DISC, DISC * 2, DISC * 2));

  // Candidate pixels in three pools, then a random pick from each.
  const ink: number[] = [];
  const art: number[] = [];
  const ground: number[] = [];
  const centre = size / 2;
  const discPx = R4 * scale;
  for (let i = 0, p = 0; i < size * size; i++, p += 4) {
    if (rings[p + 3] > 110) ink.push(i);
    else {
      const x = (i % size) - centre;
      const y = Math.floor(i / size) - centre;
      if (x * x + y * y > discPx * discPx) continue;
      if (icons[p + 3] > 110) art.push(i);
      else ground.push(i);
    }
  }
  const picks: Array<{ pool: number[]; share: number; data: Uint8ClampedArray | null }> = [
    { pool: ink, share: 0.5, data: rings },
    { pool: art, share: 0.4, data: icons },
    { pool: ground, share: 0.1, data: null },
  ];

  const target = new Float32Array(count * 3);
  const colour = new Float32Array(count * 3);
  const ring = new Float32Array(count);
  const seed = new Float32Array(count * 4);
  let n = 0;
  const unit = 1 / (EDGE * scale);
  const cream = new THREE.Color(CREAM);
  for (const { pool, share, data } of picks) {
    const want = Math.round(count * share);
    for (let k = 0; k < want && n < count && pool.length; k++, n++) {
      const i = pool[Math.floor(Math.random() * pool.length)];
      const x = ((i % size) - centre + Math.random() - 0.5) * unit;
      const y = -(Math.floor(i / size) - centre + Math.random() - 0.5) * unit;
      target.set([x, y, (Math.random() - 0.5) * 0.012], n * 3);
      if (data) {
        const p = i * 4;
        colour.set([data[p] / 255, data[p + 1] / 255, data[p + 2] / 255], n * 3);
      } else {
        // The disc's cream ground, a little dimmer so the icons lead.
        colour.set([cream.r * 0.8, cream.g * 0.78, cream.b * 0.72], n * 3);
      }
      const r = Math.hypot(x, y) * EDGE;
      ring[n] = r > R2 - 2 ? 0 : r > R3 - 2 ? 1 : r > DISC ? 2 : 3;
      seed.set([Math.random(), Math.random(), Math.random(), Math.random()], n * 4);
    }
  }
  return { target, colour, ring, seed, count: n };
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uForm;
  uniform float uWeft;
  uniform float uRipple;
  uniform float uScan;
  uniform vec4 uAngles;
  uniform vec3 uPointer;
  uniform vec2 uField;
  uniform float uSize;
  uniform float uDistance;
  attribute vec3 aTarget;
  attribute vec3 aColor;
  attribute float aRing;
  attribute vec4 aSeed;
  varying vec3 vColor;
  varying float vAlpha;

  vec2 turn(vec2 p, float a) {
    float c = cos(a), s = sin(a);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  }

  void main() {
    // Woven: in place on the wheel, turned with its ring.
    float angle = aRing < 0.5 ? uAngles.x : aRing < 1.5 ? uAngles.y : aRing < 2.5 ? uAngles.z : uAngles.w;
    vec3 woven = vec3(turn(aTarget.xy, angle), aTarget.z);
    float r = length(aTarget.xy);

    // A ripple running out through the weave, lifting it as it passes.
    float front = uRipple * 1.6 - 0.1;
    float bump = uRipple > 0.0 ? exp(-pow(r - front, 2.0) / 0.004) * (1.0 - uRipple) : 0.0;
    woven.z += bump * 0.1;

    // Threads part round the pointer, like fingers through cloth.
    vec2 away = woven.xy - uPointer.xy;
    float near = uPointer.z * smoothstep(0.24, 0.0, length(away));
    woven.xy += normalize(away + 1e-5) * near * 0.08;
    woven.z += near * 0.14;

    // Loose: laid along a lane, flowing, across (warp) or down (weft).
    // Each thread has its own depth, speed and sway, shared by all its
    // points, so it stays a line (points at their own depths scattered
    // into dust through the perspective).
    float thread = floor(aSeed.x * 190.0);
    float lane = (thread + 0.5) / 190.0 * 2.0 - 1.0;
    float depth = fract(sin(thread * 12.9898) * 43758.5453);
    float pace = 0.012 + fract(sin(thread * 78.233) * 12345.678) * 0.02;
    float along = fract(aSeed.y + uTime * pace) * 2.0 - 1.0;
    float wave = sin(along * 4.0 + uTime * 0.6 + thread * 0.37) * 0.012;
    vec2 warp = vec2(along * uField.x, (lane + wave) * uField.y);
    vec2 weft = vec2((lane + wave) * uField.x, along * uField.y);
    vec3 loose = vec3(mix(warp, weft, uWeft), (depth - 0.5) * 1.2);

    // Each point's own moment to be woven: the centre first, the rim
    // last; swirling in on the way.
    float delay = r * 0.5 + aSeed.z * 0.3;
    float p = clamp((uForm * 1.8 - delay) / 1.0, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p);
    vec3 pos = mix(loose, woven, p);
    pos.xy = turn(pos.xy, sin(p * 3.14159) * (0.9 + aSeed.w * 0.8));

    vec4 view = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * view;

    // A light running round the wheel, brightest on the woven points.
    float at = atan(woven.y, woven.x);
    float gap = abs(mod(at - uScan + 3.14159, 6.28318) - 3.14159);
    float scan = exp(-gap * gap / 0.045) * p * smoothstep(0.35, 0.8, r);
    vColor = aColor * (1.0 + scan * 0.8 + bump * 1.4) + vec3(scan * 0.12 + bump * 0.2);
    vAlpha = mix(0.6, 0.95, p);
    gl_PointSize = uSize * (0.7 + aSeed.x * 0.6) * (uDistance / -view.z) * mix(0.85, 1.0, p);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) * vAlpha;
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

type Options = {
  /** How many points (fewer on phones). */
  count: number;
  /** The centre disc's artwork (public/images/wheel/centre.webp). */
  discSrc: string;
};

export async function createWovenScene(canvas: HTMLCanvasElement, { count, discSrc }: Options) {
  const sample = await sampleArtwork(count, discSrc);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(ratio);
  renderer.setClearColor(0x0a0705, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(sample.target, 3));
  geometry.setAttribute("aTarget", new THREE.BufferAttribute(sample.target, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(sample.colour, 3));
  geometry.setAttribute("aRing", new THREE.BufferAttribute(sample.ring, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(sample.seed, 4));
  geometry.setDrawRange(0, sample.count);
  // The points travel far beyond their woven places; never cull them.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);

  const uniforms = {
    uTime: { value: 0 },
    uForm: { value: 0 },
    uWeft: { value: 0 },
    uRipple: { value: 0 },
    uScan: { value: 0 },
    uAngles: { value: new THREE.Vector4() },
    uPointer: { value: new THREE.Vector3() },
    uField: { value: new THREE.Vector2(2, 1) },
    uSize: { value: 2 },
    uDistance: { value: 5 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let fitDistance = 5;
  const resize = () => {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // The wheel (radius 1) fills 80% of the height, or 92% of the width
    // on a tall screen.
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    fitDistance = Math.max(2 / (0.8 * 2 * t), 2 / (0.92 * 2 * t * camera.aspect));
    uniforms.uDistance.value = fitDistance;
    // The loose threads fill the screen, a little past its edges.
    const halfHeight = fitDistance * t;
    uniforms.uField.value.set(halfHeight * camera.aspect * 1.12, halfHeight * 1.12);
    // Points sized to the wheel on screen, so it reads as woven at any
    // size: fewer, larger points on smaller screens.
    const wheelPx = Math.min(height * 0.8, width * 0.92);
    uniforms.uSize.value = ((wheelPx / Math.sqrt(sample.count)) * 1.05 * ratio);
  };
  resize();

  const render = (f: WovenFrame) => {
    const d = fitDistance * f.dolly;
    camera.position.set(
      d * Math.sin(f.azimuth) * Math.cos(f.elevation),
      d * Math.sin(f.elevation),
      d * Math.cos(f.azimuth) * Math.cos(f.elevation)
    );
    camera.lookAt(0, 0, 0);
    uniforms.uTime.value = f.time;
    uniforms.uForm.value = f.form;
    uniforms.uWeft.value = f.weft;
    uniforms.uRipple.value = f.ripple;
    uniforms.uScan.value = f.scan;
    uniforms.uAngles.value.set(...f.angles);
    uniforms.uPointer.value.set(f.pointer.x, f.pointer.y, f.pointer.on);
    renderer.render(scene, camera);
  };

  return {
    render,
    resize,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

export type WovenScene = Awaited<ReturnType<typeof createWovenScene>>;
