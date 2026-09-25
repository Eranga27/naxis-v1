import * as THREE from "three";
import { GIANT_WHEEL as W } from "@/content/giantWheel";

// The homepage hero's wheel, woven (V2 hero C): the client's Giant Wheel
// exactly as they drew it, which comes apart into threads and is woven
// back together.
//
// At rest it is the artwork itself — a plain render of their PDF
// (public/images/wheel/original-*.webp, from scripts/build-giant-wheel.py),
// white face and all — with each ring turning in its own plane. Loose, it
// is some hundred thousand points of light sampled from that same image,
// each in the colour of the spot it came from, lying along threads that
// run across the screen. Weaving, the points swirl into place, centre
// first, and the artwork takes over from them as they land, so the wheel
// always settles back to exactly the client's.
//
// Loaded on demand (it pulls in three.js) and driven entirely by the
// WovenFrame the hero passes to render().

export type WovenFrame = {
  /** Seconds, for the threads' flow. */
  time: number;
  /** Loose threads (0) to the woven wheel (1). */
  form: number;
  /** Threads run across (0, warp) or down (1, weft). */
  weft: number;
  /** Each ring's turn in its own plane, radians: values, motto, name, disc. */
  angles: [number, number, number, number];
  /** A ripple running out through the weave, 0–1 (0: none). */
  ripple: number;
  /** Where the light running round the wheel is, radians. */
  scan: number;
  /** The pointer, in the wheel's units (radius 1), and how much it pulls threads out. */
  pointer: { x: number; y: number; on: number };
  /** Camera orbit (radians) and distance (1 = the wheel fits the frame). */
  azimuth: number;
  elevation: number;
  dolly: number;
};

// Where one ring ends and the next begins, as a share of the wheel's
// radius: each boundary sits in the white just inside a rim, so however
// the rings turn against each other, their edges meet white on white.
const [R1, R2, R3, R4] = W.radii;
const EDGE = R1 + W.rimWidth / 2;
const BOUNDS = new THREE.Vector3((R2 - 8) / EDGE, (R3 - 7) / EDGE, (R4 + 6) / EDGE);
const ringOf = (r: number) => (r > BOUNDS.x ? 0 : r > BOUNDS.y ? 1 : r > BOUNDS.z ? 2 : 3);

/**
 * Points sampled from the artwork: where each sits (radius 1 = the
 * wheel's edge), its colour, and which ring it turns with. Most go to the
 * ink — lettering, rims, stars, icons — and a light scatter to the white
 * face, so the loose threads carry the wheel's colours.
 */
function sample(image: HTMLImageElement, count: number) {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  const ink: number[] = [];
  const ground: number[] = [];
  for (let i = 0, p = 0; i < size * size; i++, p += 4) {
    if (data[p + 3] < 200) continue;
    const lightest = Math.min(data[p], data[p + 1], data[p + 2]);
    (lightest < 225 ? ink : ground).push(i);
  }

  const target = new Float32Array(count * 3);
  const colour = new Float32Array(count * 3);
  const ring = new Float32Array(count);
  const seed = new Float32Array(count * 4);
  const half = size / 2;
  let n = 0;
  for (const [pool, share] of [
    [ink, 0.86],
    [ground, 0.14],
  ] as const) {
    const want = Math.round(count * share);
    for (let k = 0; k < want && n < count && pool.length; k++, n++) {
      const i = pool[Math.floor(Math.random() * pool.length)];
      const x = ((i % size) + Math.random() - half) / half;
      const y = -(Math.floor(i / size) + Math.random() - half) / half;
      const p = i * 4;
      target.set([x, y, (Math.random() - 0.5) * 0.01], n * 3);
      colour.set([data[p] / 255, data[p + 1] / 255, data[p + 2] / 255], n * 3);
      ring[n] = ringOf(Math.hypot(x, y));
      seed.set([Math.random(), Math.random(), Math.random(), Math.random()], n * 4);
    }
  }
  return { target, colour, ring, seed, count: n };
}

// Shared by the points and the artwork: how woven a spot at radius r is.
// The centre weaves first; `lag` holds a spot back (the artwork waits for
// the slowest thread at its radius).
const weaveGlsl = /* glsl */ `
  float woven(float form, float r, float lag) {
    float p = clamp(form * 1.8 - r * 0.5 - lag, 0.0, 1.0);
    return p * p * (3.0 - 2.0 * p);
  }
  vec2 turn(vec2 p, float a) {
    float c = cos(a), s = sin(a);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  }
  float ringAngle(float r, vec3 bounds, vec4 angles) {
    return r > bounds.x ? angles.x : r > bounds.y ? angles.y : r > bounds.z ? angles.z : angles.w;
  }
`;

const pointsVertex = /* glsl */ `
  uniform float uTime;
  uniform float uForm;
  uniform float uWeft;
  uniform vec4 uAngles;
  uniform vec3 uBounds;
  uniform vec3 uPointer;
  uniform vec2 uField;
  uniform float uSize;
  uniform float uDistance;
  attribute vec3 aTarget;
  attribute vec3 aColor;
  attribute vec4 aSeed;
  varying vec3 vColor;
  varying float vAlpha;
  ${weaveGlsl}

  void main() {
    float r = length(aTarget.xy);
    vec3 home = vec3(turn(aTarget.xy, ringAngle(r, uBounds, uAngles)), aTarget.z);

    // Near the pointer, threads are pulled out of the cloth and lifted.
    vec2 away = home.xy - uPointer.xy;
    float near = uPointer.z * smoothstep(0.2, 0.04, length(away));
    home.xy += normalize(away + 1e-5) * near * 0.06;
    home.z += near * 0.16;

    // Loose: along a thread across (warp) or down (weft) the screen. Each
    // thread has its own depth, pace and sway, shared by all its points,
    // so it stays a line.
    float thread = floor(aSeed.x * 190.0);
    float lane = (thread + 0.5) / 190.0 * 2.0 - 1.0;
    float depth = fract(sin(thread * 12.9898) * 43758.5453);
    float pace = 0.012 + fract(sin(thread * 78.233) * 12345.678) * 0.02;
    float along = fract(aSeed.y + uTime * pace) * 2.0 - 1.0;
    float sway = sin(along * 4.0 + uTime * 0.6 + thread * 0.37) * 0.012;
    vec2 warp = vec2(along * uField.x, (lane + sway) * uField.y);
    vec2 weft = vec2((lane + sway) * uField.x, along * uField.y);
    vec3 loose = vec3(mix(warp, weft, uWeft), (depth - 0.5) * 1.2);

    // Weaving: each point at its own moment, swirling in on the way.
    float p = woven(uForm, r, aSeed.z * 0.3);
    vec3 pos = mix(loose, home, p);
    pos.xy = turn(pos.xy, sin(p * 3.14159) * (0.9 + aSeed.w * 0.8));

    vec4 view = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * view;
    vColor = aColor;
    // Once a point lands, the artwork shows in its place and the point
    // fades — except where the pointer has pulled it out.
    float landed = smoothstep(0.8, 1.0, p);
    vAlpha = 0.8 * (1.0 - landed * (1.0 - near));
    gl_PointSize = uSize * (0.7 + aSeed.x * 0.6) * (uDistance / -view.z);
  }
`;

const pointsFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) * vAlpha;
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

const artVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const artFragment = /* glsl */ `
  uniform sampler2D uArt;
  uniform float uForm;
  uniform vec4 uAngles;
  uniform vec3 uBounds;
  uniform vec3 uPointer;
  uniform float uRipple;
  uniform float uScan;
  varying vec2 vUv;
  ${weaveGlsl}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    // The artwork turns with each ring: draw what's turned into this spot.
    vec4 art = texture2D(uArt, turn(p, -ringAngle(r, uBounds, uAngles)) * 0.5 + 0.5);
    // Shown once the slowest thread at this radius has landed.
    float shown = woven(uForm, r, 0.32);
    shown = smoothstep(0.75, 1.0, shown);
    // A hole where the pointer pulls threads out.
    float near = uPointer.z * smoothstep(0.17, 0.05, length(p - uPointer.xy));
    // Light passing over it: a faint sheen running round, and the ripple.
    float at = atan(p.y, p.x);
    float gap = abs(mod(at - uScan + 3.14159, 6.28318) - 3.14159);
    float sheen = exp(-gap * gap / 0.03) * smoothstep(0.45, 0.95, r) * 0.06;
    float front = uRipple * 1.6 - 0.1;
    float glint = uRipple > 0.0 ? exp(-pow(r - front, 2.0) / 0.004) * (1.0 - uRipple) * 0.12 : 0.0;
    gl_FragColor = vec4(art.rgb + sheen + glint, art.a * shown * (1.0 - near));
  }
`;

type Options = {
  /** How many points (fewer on phones). */
  count: number;
  /** The whole wheel as drawn (public/images/wheel/original-*.webp). */
  artSrc: string;
};

export async function createWovenScene(canvas: HTMLCanvasElement, { count, artSrc }: Options) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = artSrc;
  });
  const points = sample(image, count);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(ratio);
  renderer.setClearColor(0x0a0705, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);

  const shared = {
    uForm: { value: 0 },
    uAngles: { value: new THREE.Vector4() },
    uBounds: { value: BOUNDS },
    uPointer: { value: new THREE.Vector3() },
  };

  // The artwork: one texture on a disc, colours exactly as drawn (sampled
  // and written as they are, with no colour conversion either way).
  const texture = new THREE.Texture(image);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  const artUniforms = { ...shared, uArt: { value: texture }, uRipple: { value: 0 }, uScan: { value: 0 } };
  const artMaterial = new THREE.ShaderMaterial({
    uniforms: artUniforms,
    vertexShader: artVertex,
    fragmentShader: artFragment,
    transparent: true,
    depthWrite: false,
  });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), artMaterial);
  scene.add(art);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(points.target, 3));
  geometry.setAttribute("aTarget", new THREE.BufferAttribute(points.target, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(points.colour, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(points.seed, 4));
  geometry.setDrawRange(0, points.count);
  // The points travel far beyond their places; never cull them.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  const pointUniforms = {
    ...shared,
    uTime: { value: 0 },
    uWeft: { value: 0 },
    uField: { value: new THREE.Vector2(2, 1) },
    uSize: { value: 2 },
    uDistance: { value: 5 },
  };
  const pointsMaterial = new THREE.ShaderMaterial({
    uniforms: pointUniforms,
    vertexShader: pointsVertex,
    fragmentShader: pointsFragment,
    transparent: true,
    depthWrite: false,
  });
  const threads = new THREE.Points(geometry, pointsMaterial);
  threads.renderOrder = 1;
  scene.add(threads);

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
    pointUniforms.uDistance.value = fitDistance;
    // The loose threads fill the screen, a little past its edges.
    const halfHeight = fitDistance * t;
    pointUniforms.uField.value.set(halfHeight * camera.aspect * 1.12, halfHeight * 1.12);
    // Points sized to the wheel on screen: fewer, larger on small screens.
    const wheelPx = Math.min(height * 0.8, width * 0.92);
    pointUniforms.uSize.value = (wheelPx / Math.sqrt(points.count)) * 1.05 * ratio;
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
    shared.uForm.value = f.form;
    shared.uAngles.value.set(...f.angles);
    shared.uPointer.value.set(f.pointer.x, f.pointer.y, f.pointer.on);
    pointUniforms.uTime.value = f.time;
    pointUniforms.uWeft.value = f.weft;
    artUniforms.uRipple.value = f.ripple;
    artUniforms.uScan.value = f.scan;
    renderer.render(scene, camera);
  };

  return {
    render,
    resize,
    dispose: () => {
      geometry.dispose();
      pointsMaterial.dispose();
      art.geometry.dispose();
      artMaterial.dispose();
      texture.dispose();
      renderer.dispose();
    },
  };
}

export type WovenScene = Awaited<ReturnType<typeof createWovenScene>>;
