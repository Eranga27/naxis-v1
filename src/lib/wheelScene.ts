import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GIANT_WHEEL as W } from "@/content/giantWheel";

// The homepage hero's wheel, forged: the client's Giant Wheel built as a
// real object from their own artwork — the lettering extruded from its
// outlines into bevelled gold, cream and emerald relief on dark enamel
// bands, each band edged with a gold rim, and the disc of icons set in a
// gold bezel. Lit by a studio environment (so the gold reflects) and a
// raking key light, with light rays, a glow and gold dust around it.
//
// Loaded on demand (it pulls in three.js) and driven entirely by the
// WheelFrame the hero passes to render() — this module holds no timing or
// scroll logic of its own.

/** One ring's pose: turned in its own plane, tipped, and lifted. */
export type RingPose = {
  /** Turn in the ring's own plane, radians (accumulated by the caller). */
  spin: number;
  /** Tip about the ring's x and y axes, radians. */
  tiltX: number;
  tiltY: number;
  /** Turn of the tip's axis about the view axis, radians. */
  precess: number;
  /** Lift towards the viewer, in wheel radii. */
  lift: number;
};

export type WheelFrame = {
  rings: Record<RingName, RingPose>;
  /** The whole wheel's tip about x (edge-on at π/2) and y. */
  wheelX: number;
  wheelY: number;
  /** Camera orbit (radians) and distance (1 = the wheel fills the frame). */
  azimuth: number;
  elevation: number;
  dolly: number;
  /** Key light's angle round the wheel, radians. */
  light: number;
  /** A flash of light, 0–1 (the rings locking together). */
  flash: number;
  /** An expanding ring of light, 0–1 through its travel (0: none). */
  shock: number;
  /** Dust and glow presence, 0–1. */
  ambience: number;
  /** Seconds, for dust and rays. */
  time: number;
};

export type RingName = "values" | "motto" | "name" | "disc";

const UNIT = 0.01; // artwork units → scene units
const [R1, R2, R3, R4] = W.radii;
const RIM = W.rimWidth;
const WHEEL_RADIUS = (R1 + RIM) * UNIT;
const PLATE = 5; // enamel band thickness, artwork units
const RELIEF = 7; // lettering height above the band

const GOLD = 0xd9a441;
const CREAM = 0xdccfb3;
const EMERALD = 0x1f9e68;
const ENAMEL = 0x120d09;

/**
 * A dark photo studio for the gold to reflect: black walls and a few
 * softbox strips, as in a product shot. (A bright room made the enamel
 * read pale and the gold near white.)
 */
function studio(pmrem: THREE.PMREMGenerator) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x050403);
  const panels: THREE.Mesh[] = [];
  const softbox = (w: number, h: number, at: [number, number, number], power: number, colour: number) => {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colour).multiplyScalar(power), side: THREE.DoubleSide })
    );
    panel.position.set(...at);
    panel.lookAt(0, 0, 0);
    env.add(panel);
    panels.push(panel);
  };
  softbox(7, 1.1, [0, 5, 2.5], 7, 0xfff0d6); // a long strip overhead
  softbox(1.1, 5.5, [-5.5, 0.6, 3], 4.5, 0xffe3b8); // warm strip, left
  softbox(0.8, 4.5, [5.5, -0.4, 1.5], 2.2, 0xffffff); // cool strip, right
  softbox(10, 10, [0, 0, -9], 0.12, 0x3a2a16); // a faint warm backdrop
  // A broad, soft light behind the camera: the gold faces of the lettering
  // look straight at it, and with nothing there they reflected black.
  softbox(9, 6, [0, 1.2, 9], 1.1, 0xffe9c8);
  const texture = pmrem.fromScene(env, 0.03).texture;
  for (const panel of panels) {
    panel.geometry.dispose();
    (panel.material as THREE.Material).dispose();
  }
  return texture;
}

/** An annulus (or a disc, with no inner radius) as a shape. */
function ring(inner: number, outer: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  if (inner > 0) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}

/** A soft round sprite, for dust and glow. */
function glowTexture(size: number, stops: Array<[number, string]>) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Fine rays radiating from the centre, fading in and out with distance. */
function raysTexture(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  ctx.translate(c, c);
  const count = 72;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const w = (i % 3 === 0 ? 0.012 : 0.006) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, c, a - w, a + w);
    ctx.closePath();
    ctx.fillStyle = i % 3 === 0 ? "rgba(255,214,140,0.9)" : "rgba(255,214,140,0.5)";
    ctx.fill();
  }
  // Fade: nothing at the centre (behind the wheel), strongest just past
  // the rim, gone at the edge.
  ctx.globalCompositeOperation = "destination-in";
  const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, c);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(0.42, "rgba(0,0,0,0)");
  fade.addColorStop(0.52, "rgba(0,0,0,1)");
  fade.addColorStop(0.75, "rgba(0,0,0,0.35)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fade;
  ctx.fillRect(-c, -c, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type Options = {
  /** "low" for phones: coarser curves, no bloom, fewer motes. */
  quality: "high" | "low";
  /** The centre disc's artwork (public/images/wheel/centre.webp). */
  discSrc: string;
};

export async function createWheelScene(canvas: HTMLCanvasElement, { quality, discSrc }: Options) {
  const high = quality === "high";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !high, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 2 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x0a0705, 1);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = studio(pmrem);
  scene.environmentIntensity = 1;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  // --- Materials -------------------------------------------------------
  const gold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.32 });
  const cream = new THREE.MeshStandardMaterial({ color: CREAM, metalness: 0.1, roughness: 0.5 });
  const emerald = new THREE.MeshStandardMaterial({
    color: EMERALD,
    metalness: 0.55,
    roughness: 0.28,
    emissive: 0x0c4a30,
    emissiveIntensity: 0.6,
  });
  const enamel = new THREE.MeshStandardMaterial({ color: ENAMEL, metalness: 0.2, roughness: 0.55 });

  // --- Geometry --------------------------------------------------------
  const loader = new SVGLoader();
  const curveSegments = high ? 6 : 3;
  const relief = (d: string) => {
    // y flipped: SVG runs down, the scene runs up.
    const data = loader.parse(
      `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}" transform="scale(1,-1)"/></svg>`
    );
    const shapes = data.paths.flatMap((path) => path.toShapes());
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: RELIEF,
      curveSegments,
      bevelEnabled: true,
      bevelThickness: 1.4,
      bevelSize: 0.9,
      bevelSegments: high ? 2 : 1,
    });
    geometry.translate(0, 0, PLATE);
    return geometry;
  };
  const merged = (geometries: THREE.BufferGeometry[]) => {
    // Extruded geometry is already non-indexed, so these merge as they are.
    const geometry = mergeGeometries(geometries);
    for (const g of geometries) g.dispose();
    geometry.scale(UNIT, UNIT, UNIT);
    return geometry;
  };
  const band = (inner: number, outer: number) => {
    const geometry = new THREE.ExtrudeGeometry(ring(inner, outer), {
      depth: PLATE,
      curveSegments: high ? 160 : 96,
      bevelEnabled: false,
    });
    geometry.scale(UNIT, UNIT, UNIT);
    return geometry;
  };
  const rim = (radius: number) =>
    new THREE.TorusGeometry(radius * UNIT, (RIM / 2) * UNIT * 1.05, high ? 14 : 8, high ? 256 : 160).translate(
      0,
      0,
      PLATE * UNIT
    );

  const disposables: Array<{ dispose: () => void }> = [gold, cream, emerald, enamel];
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
    disposables.push(geometry);
    return new THREE.Mesh(geometry, material);
  };

  // Each ring nests three groups: the tip's axis turns (precess), the
  // ring tips (tilt), and the ring turns in its own plane (spin).
  const makeRing = (parts: THREE.Object3D[]) => {
    const precess = new THREE.Group();
    const tilt = new THREE.Group();
    const spin = new THREE.Group();
    precess.add(tilt);
    tilt.add(spin);
    if (parts.length) spin.add(...parts);
    return { precess, tilt, spin };
  };

  const valueWords = W.values.map((v) => relief(v.d));
  const rings: Record<RingName, ReturnType<typeof makeRing>> = {
    values: makeRing([
      mesh(band(R2, R1), enamel),
      mesh(merged(valueWords), gold),
      mesh(merged([relief(W.valueBars)]), emerald),
      mesh(rim(R1), gold),
    ]),
    motto: makeRing([
      mesh(band(R3, R2), enamel),
      mesh(merged([relief(W.motto.top + W.motto.bottom)]), cream),
      mesh(merged([relief(W.mottoBars)]), emerald),
      mesh(rim(R2), gold),
    ]),
    name: makeRing([
      mesh(band(R4, R3), enamel),
      mesh(merged([relief(W.name.top)]), gold),
      mesh(merged([relief(W.name.bottom)]), cream),
      mesh(merged([relief(W.stars)]), emerald),
      mesh(rim(R3), gold),
    ]),
    disc: makeRing([]),
  };

  // The disc: an enamel body, its artwork on cream on top, a gold bezel.
  const discArt = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = discSrc;
  });
  const discCanvas = document.createElement("canvas");
  const discSize = high ? 2048 : 1024;
  discCanvas.width = discCanvas.height = discSize;
  const dc = discCanvas.getContext("2d")!;
  const plate = dc.createRadialGradient(discSize / 2, discSize * 0.42, 0, discSize / 2, discSize / 2, discSize / 2);
  plate.addColorStop(0, "#f6eee0");
  plate.addColorStop(0.6, "#ebe2d0");
  plate.addColorStop(1, "#d6c7a8");
  dc.fillStyle = plate;
  dc.fillRect(0, 0, discSize, discSize);
  dc.drawImage(discArt, 0, 0, discSize, discSize);
  const discTexture = new THREE.CanvasTexture(discCanvas);
  discTexture.colorSpace = THREE.SRGBColorSpace;
  discTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  // The artwork spans the disc and its outline; the face is the disc.
  const discRadius = R4 + RIM / 2;
  const face = new THREE.CircleGeometry(R4 * UNIT, high ? 160 : 96);
  const uv = face.attributes.uv as THREE.BufferAttribute;
  const shrink = R4 / discRadius;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * shrink, 0.5 + (uv.getY(i) - 0.5) * shrink);
  }
  face.translate(0, 0, (PLATE + 2) * UNIT);
  // A touch of its own light, so the icons read in the dark studio.
  const faceMaterial = new THREE.MeshStandardMaterial({
    map: discTexture,
    roughness: 0.55,
    metalness: 0,
    emissive: 0xffffff,
    emissiveMap: discTexture,
    emissiveIntensity: 0.22,
  });
  disposables.push(discTexture, faceMaterial);
  const body = new THREE.CylinderGeometry(R4 * UNIT, R4 * UNIT, (PLATE + 2) * UNIT, high ? 160 : 96)
    .rotateX(Math.PI / 2)
    .translate(0, 0, ((PLATE + 2) / 2) * UNIT);
  rings.disc.spin.add(mesh(body, enamel), mesh(face, faceMaterial), mesh(rim(R4).translate(0, 0, 2 * UNIT), gold));

  const wheel = new THREE.Group();
  for (const r of Object.values(rings)) wheel.add(r.precess);
  scene.add(wheel);

  // --- Light and air ---------------------------------------------------
  const key = new THREE.DirectionalLight(0xffe2b0, 2);
  const rimLight = new THREE.DirectionalLight(0x5fe0a8, 0.9);
  rimLight.position.set(-4, 6, -6);
  scene.add(key, rimLight, new THREE.AmbientLight(0xfff1dc, 0.12));
  const flashLight = new THREE.PointLight(0xffe7b0, 0, 0, 2);
  flashLight.position.set(0, 0, 3);
  scene.add(flashLight);

  const additive = (map: THREE.Texture, opacity: number) =>
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  const raysMap = raysTexture(high ? 2048 : 1024);
  const raysMaterial = additive(raysMap, 0.05);
  const rays = new THREE.Mesh(new THREE.PlaneGeometry(WHEEL_RADIUS * 4.4, WHEEL_RADIUS * 4.4), raysMaterial);
  rays.position.z = -2.4;
  const glowMap = glowTexture(512, [
    [0, "rgba(255,201,74,0.3)"],
    [0.45, "rgba(255,160,60,0.1)"],
    [0.75, "rgba(47,208,138,0.03)"],
    [1, "rgba(0,0,0,0)"],
  ]);
  const glowMaterial = additive(glowMap, 0.5);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(WHEEL_RADIUS * 3.4, WHEEL_RADIUS * 3.4), glowMaterial);
  glow.position.z = -1.2;
  // The rays and glow stay behind the wheel however it turns.
  scene.add(rays, glow);
  disposables.push(raysMap, raysMaterial, glowMap, glowMaterial, rays.geometry, glow.geometry);

  // An expanding ring of light when the rings lock together.
  const shockMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd98a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const shock = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 256), shockMaterial);
  wheel.add(shock);
  disposables.push(shockMaterial, shock.geometry);

  // Gold dust in the stage's air, at every depth.
  const motes = high ? 420 : 160;
  const dustPositions = new Float32Array(motes * 3);
  const dustSeeds = Array.from({ length: motes }, () => ({
    x: (Math.random() - 0.5) * 22,
    y: Math.random() * 14 - 7,
    z: -8 + Math.random() * 13,
    rise: 0.08 + Math.random() * 0.22,
    sway: Math.random() * Math.PI * 2,
  }));
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMap = glowTexture(64, [
    [0, "rgba(255,246,220,1)"],
    [0.3, "rgba(255,214,140,0.7)"],
    [1, "rgba(255,190,90,0)"],
  ]);
  const dustMaterial = new THREE.PointsMaterial({
    map: dustMap,
    size: high ? 0.09 : 0.12,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);
  disposables.push(dustGeometry, dustMap, dustMaterial);

  // --- Output ----------------------------------------------------------
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  if (high) {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.4, 0.92);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  let width = 1;
  let height = 1;
  let fitDistance = 12;
  const resize = () => {
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    composer?.setSize(width, height);
    bloom?.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // Far enough that the wheel fills 80% of the height (clear of the
    // scroll cue), or 92% of the width on a tall screen.
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const diameter = WHEEL_RADIUS * 2;
    fitDistance = Math.max(diameter / (0.8 * 2 * t), diameter / (0.92 * 2 * t * camera.aspect));
  };
  resize();

  let lastTime = 0;
  const render = (f: WheelFrame) => {
    const dt = Math.min(0.1, lastTime ? f.time - lastTime : 0);
    lastTime = f.time;

    const d = fitDistance * f.dolly;
    camera.position.set(
      d * Math.sin(f.azimuth) * Math.cos(f.elevation),
      d * Math.sin(f.elevation),
      d * Math.cos(f.azimuth) * Math.cos(f.elevation)
    );
    camera.lookAt(0, 0, 0);

    wheel.rotation.set(f.wheelX, f.wheelY, 0);
    for (const name of Object.keys(rings) as RingName[]) {
      const pose = f.rings[name];
      const r = rings[name];
      r.precess.rotation.z = pose.precess;
      r.precess.position.z = pose.lift * WHEEL_RADIUS;
      r.tilt.rotation.set(pose.tiltX, pose.tiltY, 0);
      r.spin.rotation.z = pose.spin;
    }

    key.position.set(Math.cos(f.light) * 7, 3.5 + Math.sin(f.light * 0.7) * 2, 5 + Math.sin(f.light) * 3);
    flashLight.intensity = f.flash * 30;
    if (bloom) bloom.strength = 0.32 + f.flash * 0.6;

    rays.rotation.z = -f.time * 0.02;
    raysMaterial.opacity = 0.05 * f.ambience;
    const breath = 0.5 + 0.5 * Math.sin(f.time * 0.9);
    glowMaterial.opacity = (0.3 + breath * 0.15 + f.flash * 0.4) * f.ambience;
    glow.scale.setScalar(0.96 + breath * 0.08);

    shock.visible = f.shock > 0 && f.shock < 1;
    if (shock.visible) {
      const s = WHEEL_RADIUS * (1 + f.shock * 1.4);
      shock.scale.setScalar(s);
      shockMaterial.opacity = (1 - f.shock) * 0.9;
    }

    dustMaterial.opacity = 0.7 * f.ambience;
    for (let i = 0; i < motes; i++) {
      const m = dustSeeds[i];
      m.y += m.rise * dt;
      if (m.y > 7) m.y = -7;
      dustPositions[i * 3] = m.x + Math.sin(f.time * 0.3 + m.sway) * 0.25;
      dustPositions[i * 3 + 1] = m.y;
      dustPositions[i * 3 + 2] = m.z;
    }
    dustGeometry.attributes.position.needsUpdate = true;

    if (composer) composer.render();
    else renderer.render(scene, camera);
  };

  return {
    render,
    resize,
    dispose: () => {
      for (const d of disposables) d.dispose();
      scene.environment?.dispose();
      pmrem.dispose();
      composer?.dispose();
      renderer.dispose();
    },
  };
}

export type WheelScene = Awaited<ReturnType<typeof createWheelScene>>;
