import * as THREE from "three";

// The homepage Global Network globe: a night Earth lit from above and
// behind, with routes that leave Australia for each country in the
// network. Loaded on demand (it pulls in three.js), and driven entirely by
// the numbers GlobalNetwork passes to render() — this module holds no
// scroll or timing logic of its own.
//
// Textures (public/images/globe/) are NASA's Blue Marble and, for the city
// lights, a mask taken from NASA's Earth at Night; both public domain.

export type Place = { name: string; lat: number; lon: number };

export type GlobeFrame = {
  /** Globe radius and centre, in CSS px from the canvas's top-left. */
  radius: number;
  cx: number;
  cy: number;
  /** The point facing the viewer, and a roll about the view axis (deg). */
  lon: number;
  lat: number;
  roll: number;
  /** Home marker appearance, 0–1. */
  home: number;
  /** Each route's progress from home to its place, 0–1. */
  routes: number[];
  /** Seconds, for the pulses; hold it still under reduced motion. */
  time: number;
};

export type ScreenPoint = { x: number; y: number; facing: number };

const GOLD = new THREE.Color("#ffc94a");
const EMERALD = new THREE.Color("#2fd08a");
// Sun above and a little behind the globe, in view space: the top of the
// globe is in daylight, the face towards us is night.
const SUN = new THREE.Vector3(-0.12, 0.62, -0.78).normalize();

const rad = THREE.MathUtils.degToRad;

/** A unit vector for a latitude/longitude, in SphereGeometry's own UV
    layout (u = 0 at 180°W), so markers land on the texture's places. */
export function surfacePoint(lat: number, lon: number) {
  const phi = rad(lon + 180);
  const theta = rad(90 - lat);
  return new THREE.Vector3(
    -Math.cos(phi) * Math.sin(theta),
    Math.cos(theta),
    Math.sin(phi) * Math.sin(theta)
  );
}

const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragment = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D lightsMap;
  uniform vec3 sun;
  uniform float ready;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 n = normalize(vNormal);
    float sunlit = dot(n, sun);
    float day = smoothstep(-0.05, 0.4, sunlit);
    vec3 surface = texture2D(dayMap, vUv).rgb;
    float lights = texture2D(lightsMap, vUv).r;
    // Night: the land barely there, the cities warm gold.
    vec3 night = surface * vec3(0.05, 0.07, 0.11) + pow(lights, 0.8) * vec3(1.0, 0.72, 0.36) * 2.1;
    vec3 lit = surface * (0.45 + 1.1 * max(sunlit, 0.0));
    vec3 color = mix(night, lit, day);
    // Atmospheric rim, brighter on the sunward side.
    float rim = pow(1.0 - max(n.z, 0.0), 3.0);
    color += vec3(0.42, 0.62, 1.0) * rim * (0.35 + 0.9 * smoothstep(-0.3, 0.8, sunlit));
    // The sunlit crown glows white at the limb, as seen from orbit.
    color += vec3(0.8, 0.88, 1.0) * pow(1.0 - max(n.z, 0.0), 1.5) * day * 0.55;
    gl_FragColor = vec4(color * ready, 1.0);
  }
`;

const haloVertex = earthVertex;
const haloFragment = /* glsl */ `
  uniform vec3 sun;
  uniform float limb;
  varying vec3 vNormal;
  void main() {
    vec3 n = normalize(vNormal);
    float t = max(n.z, 0.0);
    // Peaks at the planet's edge, falls away outwards and over the disc.
    float a = t < limb ? pow(t / limb, 2.6) : pow(max(0.0, 1.0 - (t - limb) / (1.0 - limb)), 10.0);
    float lit = 0.15 + 0.85 * smoothstep(-0.3, 0.9, dot(n, sun));
    vec3 color = mix(vec3(0.35, 0.55, 1.0), vec3(0.85, 0.93, 1.0), a);
    // Additive, with the intensity in alpha, so where the halo fades the
    // page behind shows through instead of a black ring.
    gl_FragColor = vec4(color, a * lit * 0.9);
  }
`;

const routeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const routeFragment = /* glsl */ `
  uniform float progress;
  uniform float time;
  uniform float offset;
  uniform float strength;
  uniform vec3 from;
  uniform vec3 to;
  varying vec2 vUv;
  void main() {
    float s = vUv.x;
    if (s > progress) discard;
    // Brightest at the head while it's drawing; once it has landed, a
    // shipment runs out along it every few seconds.
    float head = smoothstep(progress - 0.18, progress, s) * step(progress, 0.999);
    float travel = fract(time * 0.22 + offset);
    float pulse = step(0.999, progress) * smoothstep(0.1, 0.0, abs(s - travel));
    vec3 color = mix(from, to, s);
    float a = (0.55 + 0.45 * head + 0.9 * pulse) * strength;
    gl_FragColor = vec4(color * max(a, 1.0), min(a, 1.0));
  }
`;

function glowTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,226,150,0.85)");
  g.addColorStop(1, "rgba(255,201,74,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function createGlobe(
  canvas: HTMLCanvasElement,
  { home, places, textureSize }: { home: Place; places: Place[]; textureSize: 2048 | 4096 }
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  // Orthographic, one unit per CSS px; the depth range has to hold a
  // globe hundreds of px deep.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10000, 10000);

  // globe: placed and sized in px; spin: the Earth's orientation.
  const globe = new THREE.Group();
  const spin = new THREE.Group();
  spin.rotation.order = "ZXY";
  globe.add(spin);
  scene.add(globe);

  const earthUniforms = {
    dayMap: { value: null as THREE.Texture | null },
    lightsMap: { value: null as THREE.Texture | null },
    sun: { value: SUN },
    ready: { value: 0 },
  };
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 96),
    new THREE.ShaderMaterial({ uniforms: earthUniforms, vertexShader: earthVertex, fragmentShader: earthFragment })
  );
  spin.add(earth);

  // The halo is a larger sphere in front, added over the scene; it doesn't
  // turn with the Earth.
  const HALO = 1.1;
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(HALO, 96, 64),
    new THREE.ShaderMaterial({
      uniforms: { sun: { value: SUN }, limb: { value: Math.sqrt(1 - 1 / (HALO * HALO)) } },
      vertexShader: haloVertex,
      fragmentShader: haloFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  globe.add(halo);

  const homeVec = surfacePoint(home.lat, home.lon);
  const glow = glowTexture();

  // Markers: a disc on the surface and a ring that pulses out from it.
  const disc = new THREE.CircleGeometry(1, 32);
  const ring = new THREE.RingGeometry(0.62, 1, 48);
  const makeMarker = (at: THREE.Vector3, color: THREE.Color) => {
    const group = new THREE.Group();
    group.position.copy(at).multiplyScalar(1.004);
    group.lookAt(at.clone().multiplyScalar(2));
    const dot = new THREE.Mesh(disc, new THREE.MeshBasicMaterial({ color, transparent: true }));
    const pulse = new THREE.Mesh(
      ring,
      new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    group.add(dot, pulse);
    spin.add(group);
    return { group, dot, pulse };
  };
  const homeMarker = makeMarker(homeVec, EMERALD);

  // Routes: great-circle arcs lifted off the surface, higher the further
  // they go. Tubes are rebuilt when the radius changes so they keep the
  // same thickness in px.
  const routes = places.map((place, i) => {
    const to = surfacePoint(place.lat, place.lon);
    const angle = homeVec.angleTo(to);
    const lift = 0.05 + 0.2 * (angle / Math.PI);
    const axis = new THREE.Vector3().crossVectors(homeVec, to).normalize();
    const points: THREE.Vector3[] = [];
    const STEPS = 64;
    for (let s = 0; s <= STEPS; s++) {
      const t = s / STEPS;
      const p = homeVec.clone().applyAxisAngle(axis, angle * t);
      points.push(p.multiplyScalar(1 + Math.sin(Math.PI * t) * lift));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const material = (strength: number) =>
      new THREE.ShaderMaterial({
        uniforms: {
          progress: { value: 0 },
          time: { value: 0 },
          offset: { value: i * 0.17 },
          strength: { value: strength },
          from: { value: EMERALD },
          to: { value: GOLD },
        },
        vertexShader: routeVertex,
        fragmentShader: routeFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    const line = new THREE.Mesh(new THREE.BufferGeometry(), material(1));
    const haze = new THREE.Mesh(new THREE.BufferGeometry(), material(0.22));
    spin.add(haze, line);
    const head = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    spin.add(head);
    return { place, to, curve, line, haze, head, marker: makeMarker(to, GOLD) };
  });

  let builtFor = 0;
  const buildTubes = (radius: number) => {
    const px = 1 / radius;
    routes.forEach(({ curve, line, haze }) => {
      line.geometry.dispose();
      haze.geometry.dispose();
      line.geometry = new THREE.TubeGeometry(curve, 160, 0.9 * px, 6, false);
      haze.geometry = new THREE.TubeGeometry(curve, 160, 3.2 * px, 6, false);
    });
    builtFor = radius;
  };

  const loader = new THREE.TextureLoader();
  const load = (url: string) =>
    loader.loadAsync(url).then((texture) => {
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return texture;
    });
  const size = renderer.capabilities.maxTextureSize >= 4096 ? textureSize : 2048;
  const ready = Promise.all([
    load(`/images/globe/earth-day-${size}.webp`),
    load(`/images/globe/earth-lights-${size}.webp`),
  ]).then(([day, lights]) => {
    earthUniforms.dayMap.value = day;
    earthUniforms.lightsMap.value = lights;
  });

  let width = 1;
  let height = 1;
  const setSize = (w: number, h: number) => {
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  };

  const project = (v: THREE.Vector3): ScreenPoint => {
    const world = v.clone().applyMatrix4(spin.matrixWorld);
    const normal = v.clone().applyQuaternion(spin.quaternion);
    return { x: world.x + width / 2, y: height / 2 - world.y, facing: normal.z };
  };

  let ease = 0;
  const render = (frame: GlobeFrame) => {
    if (Math.abs(frame.radius - builtFor) / Math.max(builtFor, 1) > 0.08) buildTubes(frame.radius);
    globe.scale.setScalar(frame.radius);
    globe.position.set(frame.cx - width / 2, height / 2 - frame.cy, 0);
    spin.rotation.set(rad(frame.lat), -rad(frame.lon + 90), rad(frame.roll));
    // Fade the Earth in once its textures are here.
    if (earthUniforms.dayMap.value) ease = Math.min(1, ease + 0.05);
    earthUniforms.ready.value = ease;

    const beat = (offset: number) => (frame.time * 0.6 + offset) % 1;
    const px = 1 / frame.radius;
    const pulseMarker = (m: ReturnType<typeof makeMarker>, shown: number, dotPx: number, offset: number) => {
      m.group.visible = shown > 0.01;
      m.dot.scale.setScalar(dotPx * px * shown);
      const b = beat(offset);
      m.pulse.scale.setScalar(dotPx * px * (1.4 + b * 3.2) * shown);
      (m.pulse.material as THREE.MeshBasicMaterial).opacity = (1 - b) * 0.8 * shown;
    };
    pulseMarker(homeMarker, frame.home, 6, 0);

    routes.forEach((route, i) => {
      const p = frame.routes[i] ?? 0;
      for (const mesh of [route.line, route.haze]) {
        const u = (mesh.material as THREE.ShaderMaterial).uniforms;
        u.progress.value = p;
        u.time.value = frame.time;
      }
      route.line.visible = route.haze.visible = p > 0.001;
      // The shipment's light rides the head of the route as it draws.
      const flying = p > 0.001 && p < 0.999;
      route.head.visible = flying;
      if (flying) {
        route.head.position.copy(route.curve.getPointAt(p));
        route.head.scale.setScalar(26 * px);
      }
      const landed = THREE.MathUtils.smoothstep(p, 0.9, 1);
      pulseMarker(route.marker, landed, 4, 0.3 + i * 0.13);
    });

    renderer.render(scene, camera);
    // Still fading in: the caller should draw again.
    return ease < 1;
  };

  return {
    ready,
    setSize,
    render,
    /** Where home and each place sit on screen, and whether they face us. */
    screenPoints: () => ({ home: project(homeVec), places: routes.map((r) => project(r.to)) }),
    dispose: () => {
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        materials.forEach((m) => m.dispose());
      });
      disc.dispose();
      ring.dispose();
      glow.dispose();
      earthUniforms.dayMap.value?.dispose();
      earthUniforms.lightsMap.value?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

export type Globe = ReturnType<typeof createGlobe>;
