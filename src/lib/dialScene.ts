import * as THREE from "three";
import { GIANT_WHEEL as W } from "@/content/giantWheel";

// The homepage hero's wheel, close up (V2 hero D): the client's Giant
// Wheel as a made object — a medallion on a dark table, shot like a
// watch dial, so near that a quarter of it fills the screen.
//
// Its face is the artwork exactly as drawn (public/images/wheel/
// original-*.webp, a plain render of their PDF), cut into its four rings,
// each turning on its own. The rings step down towards the centre like
// the bezels of a dial, each step a thin gold wall, so the key light
// throws a hairline shadow inside every rim. The same image gives the
// face its relief: the ink stands a touch proud of the white, and the
// gold (lettering, rims, the N) is foil — it catches the light as it
// passes. Everything is drawn in the artwork's own colours: where the
// light falls full, the face is exactly the client's.
//
// After it: depth of field worked out from each pixel's distance (the
// focus sits on the middle of the frame, the far rim and the near centre
// soften), a bloom on the foil's glints only, haze from the light,
// vignette and grain; then motes in the beam, drawn as their own bokeh.
//
// Loaded on demand (it pulls in three.js) and driven entirely by the
// DialFrame the hero passes to render().

export type DialFrame = {
  /** Seconds, for the motes and the grain. */
  time: number;
  /** Each ring's turn in its own plane, radians: values, motto, name, disc. */
  angles: [number, number, number, number];
  /** The key light, from off (0) to full (1). */
  exposure: number;
  /** Blur over everything, 0–1 (the intro racks focus from 1). */
  defocus: number;
  /** Where the focus sits, in wheel units past (+) or short of (−) the frame's centre. */
  focus: number;
  /** The key light moved across the wheel's face, in wheel units. */
  light: { x: number; y: number };
  /** A light passing across the foil, 0–1 through its pass (0: none). */
  shine: number;
  /** Camera nudges (radians) and distance (1 = the resting shot). */
  azimuth: number;
  elevation: number;
  dolly: number;
  /** Scrolling on, 0–1: the camera pulls back to the whole wheel, laid back. */
  exit: number;
};

// The wheel's radius is 1: the artwork's outer edge. Where one ring ends
// and the next begins (as in hero C): each boundary sits in the white
// just inside a rim, so the steps between rings never cut the lettering.
const [R1, R2, R3, R4] = W.radii;
const EDGE = R1 + W.rimWidth / 2;
const BOUNDS = [1, (R2 - 8) / EDGE, (R3 - 7) / EDGE, (R4 + 6) / EDGE, 0];
// Each ring sits this far below the one outside it.
const STEP = 0.011;
// The outer edge's chamfer, and the medallion's thickness.
const BEVEL = 0.012;
const THICK = 0.07;
// The artwork's gold, as drawn (sRGB, used as is, like the texture).
const hex = (value: string) =>
  new THREE.Vector3(parseInt(value.slice(1, 3), 16) / 255, parseInt(value.slice(3, 5), 16) / 255, parseInt(value.slice(5, 7), 16) / 255);
const GOLD = hex(W.rimColours[0]);

// The resting shot, for a wide screen and a tall one (blended between by
// aspect): the point on the face at the frame's centre, how many wheel
// units the frame is tall there, and the camera's angle off square
// (azimuth to the right, elevation below), which makes the far rim recede.
type Shot = { x: number; y: number; frame: number; azimuth: number; elevation: number };
const WIDE: Shot = { x: -0.4, y: 0.4, frame: 1.02, azimuth: 0.26, elevation: 0.3 };
const TALL: Shot = { x: -0.1, y: 0.52, frame: 1.85, azimuth: 0.12, elevation: 0.34 };
const FOV = 28;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Shared by every surface: the key light (a soft spot), depth of field
// written out as each pixel's circle of confusion, and the passing shine.
const lightGlsl = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uSpotDir;
  uniform vec2 uSpotCone;
  uniform float uExposure;
  uniform float uFocus;
  uniform float uAperture;
  uniform float uDefocus;
  uniform vec3 uShineDir;
  uniform float uShine;

  float pool(vec3 p) {
    return smoothstep(uSpotCone.x, uSpotCone.y, dot(normalize(p - uLight), uSpotDir));
  }
  float cocOf(vec3 p) {
    float d = distance(p, cameraPosition);
    return clamp(abs(d - uFocus) / d * uAperture + uDefocus, 0.0, 1.0);
  }
  float shineAt(vec3 p) {
    if (uShine <= 0.0) return 0.0;
    float x = dot(p.xy, uShineDir.xy) - uShineDir.z;
    return exp(-x * x / 0.01) * uShine;
  }
`;

const ringVertex = /* glsl */ `
  varying vec3 vWorld;
  varying vec2 vLocal;
  varying vec2 vAxis;
  void main() {
    vLocal = position.xy;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    // The ring's turn: where its x axis points.
    vAxis = normalize(modelMatrix[0].xy);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const ringFragment = /* glsl */ `
  uniform sampler2D uArt;
  uniform sampler2D uNoise;
  uniform float uTexel;
  uniform float uBump;
  uniform float uPaper;
  uniform float uEdge;
  uniform float uStep;
  uniform float uDiscEdge;
  uniform vec3 uGold;
  varying vec3 vWorld;
  varying vec2 vLocal;
  varying vec2 vAxis;
  ${lightGlsl}

  // How much ink there is here, softened (the ink stands proud of the white).
  float inkAt(vec2 uv) {
    vec4 c = textureLod(uArt, uv, 1.6);
    return mix(1.0, 1.0 - smoothstep(0.5, 0.9, min(c.r, min(c.g, c.b))), c.a);
  }
  // Gold ink — the lettering, rims and N — is foil. (Not the icons' own
  // oranges: only on the rings, and the N at the centre.)
  float foilOf(vec3 c, float r) {
    float hi = max(c.r, max(c.g, c.b));
    float lo = min(c.r, min(c.g, c.b));
    float sat = (hi - lo) / max(hi, 1e-3);
    float g = c.g / max(c.r, 1e-3);
    float hue = smoothstep(0.38, 0.5, g) * (1.0 - smoothstep(0.78, 0.92, g)) * step(c.b, c.g);
    float where = max(step(uDiscEdge, r), 1.0 - step(0.12, r));
    return hue * smoothstep(0.3, 0.5, sat) * smoothstep(0.3, 0.46, hi) * where;
  }

  void main() {
    float r = length(vLocal);
    // Past the artwork's last pixel, keep to its gold rim.
    vec2 p = r > 0.996 ? vLocal * (0.996 / r) : vLocal;
    vec2 uv = p * 0.5 + 0.5;
    vec4 art = texture2D(uArt, uv);
    vec3 base = mix(uGold, art.rgb, art.a);

    // Relief from the ink, turned with the ring.
    vec2 e = vec2(uTexel * 2.5, 0.0);
    float hx = inkAt(uv + e.xy) - inkAt(uv - e.xy);
    float hy = inkAt(uv + e.yx) - inkAt(uv - e.yx);
    vec3 n = vec3(-hx * uBump, -hy * uBump, 1.0);
    float ink = 1.0 - smoothstep(0.55, 0.85, min(base.r, min(base.g, base.b)));
    if (uPaper > 0.0) n.xy += (texture2D(uNoise, p * 1.4).rg - 0.5) * uPaper * (1.0 - ink);
    n = normalize(n);
    vec3 N = vec3(vAxis.x * n.x - vAxis.y * n.y, vAxis.y * n.x + vAxis.x * n.y, n.z);

    vec3 V = normalize(cameraPosition - vWorld);
    vec3 L = normalize(uLight - vWorld);
    float lit = pool(vWorld);
    // Relief shading, relative to the flat face, so the face itself keeps
    // the artwork's colours where the light is full.
    float shade = clamp(max(dot(N, L), 0.0) / max(L.z, 0.12), 0.35, 1.8);

    // The ring outside stands a step higher: its wall throws a shadow in,
    // and the corner at its foot is a little darker.
    float shadow = 0.0;
    float corner = 1.0;
    if (uStep > 0.0) {
      vec2 q = vWorld.xy + L.xy * (uStep / max(L.z, 0.05));
      shadow = smoothstep(uEdge - 0.003, uEdge + 0.006, length(q));
      corner = 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.016, uEdge - r));
    }
    float key = lit * (1.0 - shadow * 0.85);
    vec3 col = base * (0.3 + 0.72 * key * shade) * corner;

    // Highlights: foil glints and sheens, glossy ink a little, the white
    // barely.
    vec3 H = normalize(L + V);
    float nh = max(dot(N, H), 0.0);
    float foil = foilOf(base, r);
    // Foil lights to a pale gold, not a brighter orange.
    vec3 gilt = mix(base, vec3(1.0, 0.86, 0.58), 0.55) * 1.25;
    col += gilt * foil * ((pow(nh, 140.0) * 1.25 + pow(nh, 16.0) * 0.12) * key + shineAt(vWorld) * 1.1);
    col += vec3(1.0, 0.96, 0.9) * (1.0 - foil) * ink * pow(nh, 70.0) * 0.3 * key;
    col += vec3(1.0, 0.97, 0.92) * (1.0 - ink) * pow(nh, 30.0) * 0.05 * key;

    gl_FragColor = vec4(col * uExposure, cocOf(vWorld));
  }
`;

const metalVertex = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normal;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// The steps' walls, the chamfer and the outer edge: gold.
const metalFragment = /* glsl */ `
  uniform vec3 uGold;
  varying vec3 vWorld;
  varying vec3 vNormal;
  ${lightGlsl}
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 L = normalize(uLight - vWorld);
    float lit = pool(vWorld);
    vec3 H = normalize(L + V);
    float nh = max(dot(N, H), 0.0);
    vec3 col = uGold * (0.24 + 0.85 * lit * max(dot(N, L), 0.0));
    col += (uGold * 1.4 + 0.08) * (pow(nh, 60.0) * 1.8 + pow(nh, 8.0) * 0.18) * lit;
    // A soft studio reflection, up and to the left, where the light is.
    vec3 R = reflect(-V, N);
    col += uGold * smoothstep(0.2, 0.9, dot(R, normalize(vec3(-0.5, 0.6, 0.6)))) * 0.3;
    col += uGold * shineAt(vWorld) * 1.2;
    gl_FragColor = vec4(col * uExposure, cocOf(vWorld));
  }
`;

// The table: near-black, a faint pool of the key light, and the
// medallion's soft shadow.
const tableFragment = /* glsl */ `
  uniform sampler2D uNoise;
  uniform float uLift;
  uniform float uRim;
  varying vec3 vWorld;
  varying vec3 vNormal;
  ${lightGlsl}
  void main() {
    vec3 L = normalize(uLight - vWorld);
    float lit = pool(vWorld);
    float reach = uLift / max(L.z, 0.05);
    float soft = 0.015 + reach * 0.35;
    float shadow = 1.0 - smoothstep(uRim - soft, uRim + soft, length(vWorld.xy + L.xy * reach));
    float r = length(vWorld.xy);
    float corner = 1.0 - 0.55 * exp(-max(r - uRim, 0.0) * 28.0);
    float grain = texture2D(uNoise, vWorld.xy * 2.5).b;
    vec3 base = vec3(0.05, 0.036, 0.027) * (0.85 + grain * 0.3);
    vec3 col = base * (0.55 + 2.4 * lit * max(L.z, 0.0) * (1.0 - shadow * 0.9)) * corner;
    gl_FragColor = vec4(col * uExposure, cocOf(vWorld));
  }
`;

const quadVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Depth of field, one direction at a time: each pixel blurred by its own
// circle of confusion (in the alpha), which is passed on.
const blurGlsl = /* glsl */ `
  uniform sampler2D tMap;
  uniform vec2 uStep;
  uniform float uMaxBlur;
  vec4 dof(vec2 uv) {
    vec4 c = texture2D(tMap, uv);
    float radius = c.a * uMaxBlur;
    if (radius < 0.5) return c;
    vec3 sum = vec3(0.0);
    float total = 0.0;
    for (int i = -6; i <= 6; i++) {
      float t = float(i) / 6.0;
      float w = exp(-t * t * 2.0);
      sum += texture2D(tMap, uv + uStep * t * radius).rgb * w;
      total += w;
    }
    return vec4(sum / total, c.a);
  }
`;

const dofFragment = /* glsl */ `
  varying vec2 vUv;
  ${blurGlsl}
  void main() {
    gl_FragColor = dof(vUv);
  }
`;

// Bloom: what's brighter than the paper (the foil's glints), a quarter
// the size, blurred each way.
const brightFragment = /* glsl */ `
  uniform sampler2D tMap;
  uniform vec2 uTexel;
  varying vec2 vUv;
  vec3 over(vec2 uv) {
    return max(texture2D(tMap, uv).rgb - 1.05, 0.0);
  }
  void main() {
    vec3 s = over(vUv + uTexel * vec2(-1.0, -1.0)) + over(vUv + uTexel * vec2(1.0, -1.0))
      + over(vUv + uTexel * vec2(-1.0, 1.0)) + over(vUv + uTexel * vec2(1.0, 1.0));
    gl_FragColor = vec4(s * 0.25, 1.0);
  }
`;

const glowFragment = /* glsl */ `
  uniform sampler2D tMap;
  uniform vec2 uStep;
  varying vec2 vUv;
  void main() {
    vec3 sum = vec3(0.0);
    float total = 0.0;
    for (int i = -4; i <= 4; i++) {
      float t = float(i) / 4.0;
      float w = exp(-t * t * 2.5);
      sum += texture2D(tMap, vUv + uStep * float(i) * 1.6).rgb * w;
      total += w;
    }
    gl_FragColor = vec4(sum / total, 1.0);
  }
`;

// The last pass: the other half of the depth of field, the bloom, haze
// from the light, vignette and grain.
const finalFragment = /* glsl */ `
  uniform sampler2D tGlow;
  uniform float uGlow;
  uniform vec2 uLightUv;
  uniform float uAspect;
  uniform float uHaze;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;
  ${blurGlsl}
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  void main() {
    vec3 col = dof(vUv).rgb;
    col += texture2D(tGlow, vUv).rgb * uGlow;
    vec2 toLight = (vUv - uLightUv) * vec2(uAspect, 1.0);
    col += vec3(1.0, 0.8, 0.55) * exp(-dot(toLight, toLight) * 1.6) * uHaze;
    vec2 c = (vUv - 0.5) * vec2(uAspect, 1.0);
    float corner = length(c) / length(vec2(uAspect, 1.0) * 0.5);
    col *= 1.0 - 0.5 * smoothstep(0.42, 1.0, corner);
    col += (hash(vUv * uResolution + fract(uTime * 7.31) * 91.7) - 0.5) * 0.03;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

// Motes in the beam, each its own bokeh: a point in focus, a soft disc
// out of it.
const moteVertex = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBoxMin;
  uniform vec3 uBoxSize;
  uniform float uPx;
  uniform float uBlurPx;
  attribute vec4 aSeed;
  varying float vAlpha;
  varying float vSoft;
  ${lightGlsl}
  void main() {
    vec3 p = position;
    p.x += sin(uTime * (0.05 + aSeed.x * 0.05) + aSeed.y * 6.283) * 0.04 + uTime * 0.004;
    p.y += uTime * (0.005 + aSeed.z * 0.008);
    p.z += cos(uTime * (0.04 + aSeed.w * 0.05) + aSeed.x * 6.283) * 0.03;
    p = fract(p);
    vec3 world = uBoxMin + p * uBoxSize;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
    // Motes lie between the lens and the face, mostly well out of focus:
    // a gentler blur than the face's, or every one would be a faint disc.
    float d = distance(world, cameraPosition);
    float coc = clamp(abs(d - uFocus) / d * uAperture * 0.3 + uDefocus * 0.5, 0.0, 1.0);
    float size = uPx * (1.0 + aSeed.w * 1.4) + coc * uBlurPx;
    gl_PointSize = size;
    float toward = max(dot(normalize(uLight - world), normalize(world - cameraPosition)), 0.0);
    float fade = smoothstep(0.0, 0.1, p.x) * smoothstep(1.0, 0.9, p.x) * smoothstep(0.0, 0.1, p.y)
      * smoothstep(1.0, 0.9, p.y) * smoothstep(0.0, 0.15, p.z) * smoothstep(1.0, 0.85, p.z);
    vAlpha = pool(world) * (0.4 + 0.6 * toward * toward) * fade * uExposure * mix(0.85, 0.16, coc);
    vSoft = coc;
  }
`;

const moteFragment = /* glsl */ `
  varying float vAlpha;
  varying float vSoft;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float disc = smoothstep(1.0, 0.82, d) * (0.75 + 0.25 * smoothstep(0.3, 0.9, d));
    float point = exp(-d * d * 5.0);
    float a = mix(point, disc, smoothstep(0.08, 0.35, vSoft)) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(1.0, 0.86, 0.62, a);
  }
`;

/** A ring of quads round the axis from (r0, z0) to (r1, z1), its normal (nr, nz) in the profile. */
function band(r0: number, z0: number, r1: number, z1: number, nr: number, nz: number, segments: number) {
  const length = Math.hypot(nr, nz);
  nr /= length;
  nz /= length;
  const position: number[] = [];
  const normal: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    position.push(r0 * c, r0 * s, z0, r1 * c, r1 * s, z1);
    normal.push(nr * c, nr * s, nz, nr * c, nr * s, nz);
  }
  for (let i = 0; i < segments; i++) {
    const k = i * 2;
    index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
  }
  return { position, normal, index };
}

function metalGeometry(segments: number) {
  const parts = [
    // Each step's wall, facing in, from the ring below up to the ring outside.
    ...[1, 2, 3].map((k) => band(BOUNDS[k], -STEP * k, BOUNDS[k], -STEP * (k - 1), -1, 0, segments)),
    // The chamfer round the outer edge, and the edge itself.
    band(1, 0, 1 + BEVEL, -BEVEL, 1, 1, segments),
    band(1 + BEVEL, -BEVEL, 1 + BEVEL, -THICK, 1, 0, segments),
  ];
  const position: number[] = [];
  const normal: number[] = [];
  const index: number[] = [];
  for (const part of parts) {
    const offset = position.length / 3;
    position.push(...part.position);
    normal.push(...part.normal);
    index.push(...part.index.map((i) => i + offset));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  geometry.setIndex(index);
  return geometry;
}

/** Soft random noise, for the paper's tooth and the table's grain. */
function noiseTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 255;
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

type Options = {
  /** The whole wheel as drawn (public/images/wheel/original-*.webp). */
  artSrc: string;
  /** A lighter build: fewer pixels and motes, no paper tooth. */
  phone: boolean;
};

export async function createDialScene(canvas: HTMLCanvasElement, { artSrc, phone }: Options) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = artSrc;
  });
  await image.decode?.().catch(() => {});

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 1);
  // Glints above the paper's white only survive (for the bloom) in a
  // float target; without one, there's no bloom.
  const hdr = renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float");
  const type = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 50);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  const shared = {
    uLight: { value: new THREE.Vector3() },
    uSpotDir: { value: new THREE.Vector3(0, 0, -1) },
    uSpotCone: { value: new THREE.Vector2(Math.cos(0.9), Math.cos(0.12)) },
    uExposure: { value: 1 },
    uFocus: { value: 2 },
    uAperture: { value: phone ? 6 : 8 },
    uDefocus: { value: 0 },
    uShineDir: { value: new THREE.Vector3(0.86, -0.51, 0) },
    uShine: { value: 0 },
    uGold: { value: GOLD },
  };

  // The artwork, colours exactly as drawn (sampled and written as they
  // are, with no colour conversion either way).
  const art = new THREE.Texture(image);
  art.anisotropy = renderer.capabilities.getMaxAnisotropy();
  art.generateMipmaps = true;
  art.minFilter = THREE.LinearMipmapLinearFilter;
  art.needsUpdate = true;
  const noise = noiseTexture();

  // The four rings, stepping down towards the centre. Each reaches a
  // little under the ring outside it, so no seam opens as they turn.
  const segments = phone ? 256 : 384;
  const rings = [0, 1, 2, 3].map((k) => {
    const inner = BOUNDS[k + 1];
    const outer = BOUNDS[k] + (k > 0 ? 0.01 : 0);
    const geometry = inner > 0 ? new THREE.RingGeometry(inner, outer, segments, 1) : new THREE.CircleGeometry(outer, segments);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        ...shared,
        uArt: { value: art },
        uNoise: { value: noise },
        uTexel: { value: 1 / image.width },
        uBump: { value: 0.55 },
        uPaper: { value: phone ? 0 : 0.05 },
        uEdge: { value: BOUNDS[k] },
        uStep: { value: k > 0 ? STEP : 0 },
        uDiscEdge: { value: BOUNDS[3] },
      },
      vertexShader: ringVertex,
      fragmentShader: ringFragment,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -STEP * k;
    scene.add(mesh);
    return mesh;
  });

  const metalMaterial = new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: metalVertex,
    fragmentShader: metalFragment,
    side: THREE.DoubleSide,
  });
  const metal = new THREE.Mesh(metalGeometry(segments), metalMaterial);
  scene.add(metal);

  const tableMaterial = new THREE.ShaderMaterial({
    uniforms: { ...shared, uNoise: { value: noise }, uLift: { value: THICK }, uRim: { value: 1 + BEVEL } },
    vertexShader: metalVertex,
    fragmentShader: tableFragment,
  });
  const table = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), tableMaterial);
  table.position.z = -THICK;
  scene.add(table);

  // Motes, in a box in front of the face, filling the shot.
  const moteCount = phone ? 45 : 110;
  const moteGeometry = new THREE.BufferGeometry();
  const motePositions = new Float32Array(moteCount * 3).map(() => Math.random());
  const moteSeeds = new Float32Array(moteCount * 4).map(() => Math.random());
  moteGeometry.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
  moteGeometry.setAttribute("aSeed", new THREE.BufferAttribute(moteSeeds, 4));
  const moteUniforms = {
    ...shared,
    uTime: { value: 0 },
    uBoxMin: { value: new THREE.Vector3() },
    uBoxSize: { value: new THREE.Vector3(1, 1, 1) },
    uPx: { value: 2 },
    uBlurPx: { value: 30 },
  };
  const moteMaterial = new THREE.ShaderMaterial({
    uniforms: moteUniforms,
    vertexShader: moteVertex,
    fragmentShader: moteFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const motes = new THREE.Points(moteGeometry, moteMaterial);
  motes.frustumCulled = false;
  const moteScene = new THREE.Scene();
  moteScene.add(motes);

  // Passes: the scene (multisampled), depth of field across, bloom at a
  // quarter size, then the last pass to the screen.
  const target = (samples = 0) =>
    new THREE.WebGLRenderTarget(1, 1, { type, samples, depthBuffer: samples > 0, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter });
  const sceneTarget = target(phone ? 2 : 4);
  const acrossTarget = target();
  const glowA = target();
  const glowB = target();

  const quadGeometry = new THREE.BufferGeometry();
  quadGeometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  quadGeometry.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const pass = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) => {
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: quadVertex, fragmentShader, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(quadGeometry, material);
    mesh.frustumCulled = false;
    const holder = new THREE.Scene();
    holder.add(mesh);
    return {
      material,
      uniforms,
      draw: (to: THREE.WebGLRenderTarget | null) => {
        renderer.setRenderTarget(to);
        renderer.render(holder, quadCamera);
      },
    };
  };
  const across = pass(dofFragment, { tMap: { value: sceneTarget.texture }, uStep: { value: new THREE.Vector2() }, uMaxBlur: { value: 10 } });
  const bright = pass(brightFragment, { tMap: { value: sceneTarget.texture }, uTexel: { value: new THREE.Vector2() } });
  const glowAcross = pass(glowFragment, { tMap: { value: glowA.texture }, uStep: { value: new THREE.Vector2() } });
  const glowDown = pass(glowFragment, { tMap: { value: glowB.texture }, uStep: { value: new THREE.Vector2() } });
  const final = pass(finalFragment, {
    tMap: { value: acrossTarget.texture },
    uStep: { value: new THREE.Vector2() },
    uMaxBlur: { value: 10 },
    tGlow: { value: glowA.texture },
    uGlow: { value: hdr ? 0.7 : 0 },
    uLightUv: { value: new THREE.Vector2() },
    uAspect: { value: 1 },
    uHaze: { value: 0.07 },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
  });

  let aspect = 1;
  let ratio = 1;
  const resize = () => {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    // Sharp enough for the lettering this close, within a pixel budget
    // (a large screen at 2x would be 8M pixels a pass).
    ratio = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2, Math.sqrt((phone ? 1.4e6 : 4.2e6) / (width * height)));
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    sceneTarget.setSize(w, h);
    acrossTarget.setSize(w, h);
    const qw = Math.max(1, Math.ceil(w / 4));
    const qh = Math.max(1, Math.ceil(h / 4));
    glowA.setSize(qw, qh);
    glowB.setSize(qw, qh);
    // The widest blur, a little under 1% of the height.
    const maxBlur = h * 0.009;
    across.uniforms.uStep.value.set(1 / w, 0);
    across.uniforms.uMaxBlur.value = maxBlur;
    final.uniforms.uStep.value.set(0, 1 / h);
    final.uniforms.uMaxBlur.value = maxBlur;
    final.uniforms.uAspect.value = aspect;
    final.uniforms.uResolution.value.set(w, h);
    bright.uniforms.uTexel.value.set(1 / w, 1 / h);
    glowAcross.uniforms.uStep.value.set(1 / qw, 0);
    glowDown.uniforms.uStep.value.set(0, 1 / qh);
    moteUniforms.uPx.value = 1.6 * ratio;
    moteUniforms.uBlurPx.value = h * 0.035;
  };
  resize();

  const focusPoint = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const lightScreen = new THREE.Vector3();

  const render = (f: DialFrame) => {
    // The shot: blended by aspect, and pulled back to the whole wheel,
    // laid back, as the page scrolls on.
    const k = smooth(0.62, 1.45, aspect);
    const x = lerp(TALL.x, WIDE.x, k);
    const y = lerp(TALL.y, WIDE.y, k);
    const e = f.exit;
    const frame = lerp(lerp(TALL.frame, WIDE.frame, k), Math.max(2.8, 2.45 / aspect), e * e);
    const azimuth = lerp(lerp(TALL.azimuth, WIDE.azimuth, k), 0, e) + f.azimuth;
    const elevation = lerp(TALL.elevation, WIDE.elevation, k) + e * 0.5 + f.elevation;
    focusPoint.set(lerp(x, 0, e), lerp(y, 0.06, e), 0);
    const distance = (frame / (2 * tanHalf)) * f.dolly;
    camera.position.set(
      focusPoint.x + distance * Math.sin(azimuth) * Math.cos(elevation),
      focusPoint.y - distance * Math.sin(elevation),
      distance * Math.cos(azimuth) * Math.cos(elevation)
    );
    camera.lookAt(focusPoint);
    camera.updateMatrixWorld();

    for (let i = 0; i < 4; i++) rings[i].rotation.z = f.angles[i];

    // The key light, up and to the left of the shot, aimed just past its
    // centre; its glint lands on the outer ring.
    shared.uLight.value.set(focusPoint.x - 0.65 + f.light.x, focusPoint.y + 0.77 + f.light.y, 1.1);
    aim.set(focusPoint.x + 0.12, focusPoint.y - 0.12, 0);
    shared.uSpotDir.value.copy(aim).sub(shared.uLight.value).normalize();
    shared.uExposure.value = f.exposure;
    shared.uFocus.value = distance + f.focus;
    shared.uDefocus.value = f.defocus;
    if (f.shine > 0 && f.shine < 1) {
      shared.uShine.value = Math.sin(f.shine * Math.PI);
      shared.uShineDir.value.z = lerp(-1.9, 1.3, f.shine);
    } else shared.uShine.value = 0;

    renderer.setRenderTarget(sceneTarget);
    renderer.clear();
    renderer.render(scene, camera);
    across.draw(acrossTarget);
    bright.draw(glowA);
    glowAcross.draw(glowB);
    glowDown.draw(glowA);

    lightScreen.copy(shared.uLight.value).project(camera);
    final.uniforms.uLightUv.value.set(lightScreen.x * 0.5 + 0.5, lightScreen.y * 0.5 + 0.5);
    final.uniforms.uTime.value = f.time;
    final.uniforms.uHaze.value = 0.07 * f.exposure;
    renderer.setRenderTarget(null);
    renderer.clear();
    final.draw(null);

    // The motes' box: in front of the face, round the shot.
    const halfHeight = frame * 0.7;
    moteUniforms.uBoxMin.value.set(focusPoint.x - halfHeight * aspect, focusPoint.y - halfHeight, 0.04);
    moteUniforms.uBoxSize.value.set(halfHeight * aspect * 2, halfHeight * 2, 0.9);
    moteUniforms.uTime.value = f.time;
    renderer.render(moteScene, camera);
  };

  // Upload the artwork and build the shaders now, not on the first frame.
  renderer.initTexture(art);
  renderer.compile(scene, camera);

  return {
    render,
    resize,
    dispose: () => {
      for (const ring of rings) {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      }
      metal.geometry.dispose();
      metalMaterial.dispose();
      table.geometry.dispose();
      tableMaterial.dispose();
      moteGeometry.dispose();
      moteMaterial.dispose();
      quadGeometry.dispose();
      for (const p of [across, bright, glowAcross, glowDown, final]) p.material.dispose();
      for (const t of [sceneTarget, acrossTarget, glowA, glowB]) t.dispose();
      art.dispose();
      noise.dispose();
      renderer.dispose();
    },
  };
}

export type DialScene = Awaited<ReturnType<typeof createDialScene>>;
