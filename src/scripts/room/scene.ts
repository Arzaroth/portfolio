import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { fixtures, rack as layout, RACK_UNITS, slotOf, type Server } from '../../data/room';
import { buildCat } from './cat';
import { buildPlant } from './plant';
import { FACE_W, FACE_Z, FACES, PORT_X, PX, U, faceTexture, monitor, noteTexture, plasterTexture, skyTexture, woodTexture } from './textures';
import { runBoot } from './boot';

const BASE = 0.09;

interface Unit {
  id: string;
  s: Server;
  g: THREE.Group;
  faceMat: THREE.MeshStandardMaterial;
  z: number;
  tz: number;
  leds: THREE.MeshStandardMaterial[];
  lit: boolean;
}

interface Pickable {
  id: string;
}

interface View {
  yaw: number;
  pitch: number;
  r: number;
  tx: number;
  ty: number;
  tz: number;
}

const VIEW_KEYS = ['yaw', 'pitch', 'r', 'tx', 'ty', 'tz'] as const;

const need = <T extends Element>(root: ParentNode, sel: string) => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el;
};

const softwareGL = () => {
  const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl');
  if (!gl) return true;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
};

export async function startRoom(root: HTMLElement) {
  const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = need<HTMLCanvasElement>(root, '#rk-canvas');
  await Promise.race([
    Promise.all(['800 60px Archivo', '700 50px Caveat', '400 60px Gloock'].map((f) => document.fonts.load(f))).catch(() => {}),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  const SOFT = softwareGL();
  const LITE = MOBILE || SOFT;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LITE, powerPreference: 'high-performance' });
  let pr = SOFT ? 1 : Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(pr);
  renderer.shadowMap.enabled = !SOFT;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  let shadowDirty = 3;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const fog = new THREE.Fog('#142624', 7, 16);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 40);

  const hemi = new THREE.HemisphereLight('#9fb8cc', '#5a3a1c', 0.95);
  const fill = new THREE.DirectionalLight('#ffe2bf', 0.75);
  fill.position.set(-1.5, 3, 4);
  const moon = new THREE.DirectionalLight('#9fb4ff', 0.7);
  moon.position.set(4, 3.5, 3);
  const sun = new THREE.DirectionalLight('#fff0d8', 0);
  sun.position.set(-3.2, 4.2, 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(MOBILE ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -1, near: 0.5, far: 14 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.012;
  sun.shadow.radius = 3;
  const lampLight = new THREE.PointLight('#ffb25a', 0, 0, 1.6);
  lampLight.position.set(0.85, 1.52, -0.5);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.setScalar(MOBILE ? 512 : 1024);
  lampLight.shadow.bias = -0.002;
  lampLight.shadow.normalBias = 0.01;
  lampLight.shadow.radius = 4;
  const spill = new THREE.SpotLight('#ffcf94', 0, 4, 0.9, 0.8, 1.4);
  spill.position.set(0.85, 1.32, -0.5);
  spill.target.position.set(0.85, 0, -0.25);
  const ledGlow = new THREE.PointLight('#5dff9a', 0.25, 1.2, 2);
  ledGlow.position.set(0.15, 1.1, 0.75);
  scene.add(hemi, fill, moon, sun, lampLight, spill, spill.target, ledGlow);

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.62 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const wallMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), roughness: 0.95 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
  wall.position.set(0, 2.5, -0.75);
  wall.receiveShadow = true;
  const side = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), wallMat);
  side.position.set(-3.1, 2.5, 3);
  side.rotation.y = Math.PI / 2;
  side.receiveShadow = true;
  const trim = new THREE.MeshStandardMaterial({ color: '#e4e2da', roughness: 0.55 });
  const skirting = new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 0.02), trim);
  skirting.position.set(0, 0.05, -0.74);
  skirting.receiveShadow = true;
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.1, 64), new THREE.MeshStandardMaterial({ color: '#5a3346', roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-1.7, 0.004, 0.55);
  rug.scale.set(1.1, 1, 0.8);
  rug.receiveShadow = true;
  scene.add(floor, wall, side, skirting, rug);

  const win = new THREE.Group();
  win.position.set(-2.15, 1.62, -0.745);
  scene.add(win);
  const skyDay = skyTexture(true);
  const skyNight = skyTexture(false);
  const glassMat = new THREE.MeshBasicMaterial({ map: skyNight, toneMapped: false });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), glassMat);
  glass.position.z = 0.002;
  win.add(glass);
  for (const [w, h, x, y] of [
    [1.2, 0.06, 0, 0.48],
    [1.2, 0.08, 0, -0.48],
    [0.06, 1.02, -0.58, 0],
    [0.06, 1.02, 0.58, 0],
    [0.035, 0.9, 0, 0],
    [1.1, 0.035, 0, 0.05],
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), trim);
    m.position.set(x, y, 0.02);
    m.castShadow = true;
    win.add(m);
  }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.03, 0.14), trim);
  sill.position.set(0, -0.53, 0.06);
  win.add(sill);

  const steel = new THREE.MeshStandardMaterial({ color: '#1b1e22', roughness: 0.42, metalness: 0.65 });
  const rack = new THREE.Group();
  scene.add(rack);
  const rackH = RACK_UNITS * U;
  const rackTop = BASE + rackH + 0.06;
  add(new THREE.BoxGeometry(0.02, rackTop, 1.0), steel, -0.29, rackTop / 2, 0, rack);
  add(new THREE.BoxGeometry(0.02, rackTop, 1.0), steel, 0.29, rackTop / 2, 0, rack);
  add(new THREE.BoxGeometry(0.6, 0.04, 1.0), steel, 0, rackTop - 0.02, 0, rack);
  add(new THREE.BoxGeometry(0.6, BASE, 1.0), steel, 0, BASE / 2, 0, rack);
  const railMat = new THREE.MeshStandardMaterial({ color: '#2a2e33', roughness: 0.5, metalness: 0.7 });
  for (const x of [-0.262, 0.262]) add(new THREE.BoxGeometry(0.035, rackH, 0.03), railMat, x, BASE + rackH / 2, 0.44, rack);
  const footMat = new THREE.MeshStandardMaterial({ color: '#111' });
  for (const x of [-0.25, 0.25]) for (const z of [-0.4, 0.4]) add(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16), footMat, x, 0.015, z, rack);

  const bodyMat = new THREE.MeshStandardMaterial({ color: '#121417', roughness: 0.6, metalness: 0.5 });
  const servers: Unit[] = [];
  const leds: { m: THREE.MeshStandardMaterial; sv: Unit; rate: number; phase: number }[] = [];
  for (const s of layout) {
    const h = s.height * U - 0.0016;
    const g = new THREE.Group();
    g.position.set(0, BASE + (s.bottom - 1) * U + (s.height * U) / 2, 0);
    const tex = faceTexture(s);
    const faceMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: s.face === 'black' ? 0.55 : 0.4,
      metalness: s.face === 'silver' ? 0.6 : 0.25,
      emissive: '#ffffff',
      emissiveMap: tex,
      emissiveIntensity: 0,
    });
    const edgeMat = new THREE.MeshStandardMaterial({ color: FACES[s.face][1], roughness: 0.5, metalness: 0.4 });
    const face = new THREE.Mesh(new THREE.BoxGeometry(FACE_W, h, 0.006), [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, edgeMat]);
    face.position.z = 0.458;
    face.castShadow = face.receiveShadow = true;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.43, h - 0.002, 0.72), bodyMat);
    body.position.z = 0.455 - 0.36;
    body.castShadow = body.receiveShadow = true;
    g.add(face, body);
    const sv: Unit = { id: s.id, s, g, faceMat, z: 0, tz: 0, leds: [], lit: false };
    const ports = s.front === 'ports';
    const ledN = ports ? 24 : s.front === 'brush' ? 0 : 2;
    for (let i = 0; i < ledN; i++) {
      const activity = ports || i === 1;
      const col = ports ? (i % 7 === 3 ? '#ffb000' : '#3dff7a') : i === 0 ? '#3dff7a' : Math.random() < 0.5 ? '#ffb000' : '#5ab0ff';
      const m = new THREE.MeshStandardMaterial({ color: '#111', emissive: col, emissiveIntensity: 0 });
      const led = new THREE.Mesh(new THREE.BoxGeometry(ports ? 0.003 : 0.004, 0.0025, 0.002), m);
      if (ports) led.position.set(-FACE_W / 2 + (PORT_X(i) + 14) / PX, h / 2 - 34 / PX, FACE_Z + 0.001);
      else led.position.set(FACE_W / 2 - (70 + 120 - i * 30) / PX, s.height > 1 ? -h / 2 + 0.01 : 0, FACE_Z + 0.001);
      g.add(led);
      sv.leds.push(m);
      if (activity) leds.push({ m, sv, rate: 0.5 + Math.random() * 3, phase: Math.random() * 10 });
    }
    rack.add(g);
    const tag: Pickable | null = fixtures.has(s.id) ? null : { id: s.id };
    g.traverse((o) => {
      o.userData.pick = tag;
    });
    servers.push(sv);
  }

  const sw = servers.find((x) => x.id === 'switch');
  const brush = servers.find((x) => x.id === 'brush');
  if (sw && brush) {
    const plugMat = new THREE.MeshStandardMaterial({ color: '#d8dde2', roughness: 0.3, transparent: true, opacity: 0.85 });
    const cableCols = ['#2f6fd6', '#2f6fd6', '#2f6fd6', '#2f6fd6', '#2f6fd6', '#e8c22a', '#e8c22a', '#e8c22a', '#d13b3b', '#d13b3b', '#3aa05a', '#3aa05a', '#3aa05a', '#ececec', '#ececec', '#8a5bd6'];
    const plugged = [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 16, 17, 18, 20];
    const swY = sw.g.position.y;
    const brY = brush.g.position.y;
    plugged.forEach((port, i) => {
      const x = -FACE_W / 2 + (PORT_X(port) + 14) / PX;
      const yPort = swY + (sw.s.height * U) / 2 - 67 / PX;
      const plug = new THREE.Mesh(new THREE.BoxGeometry(0.0085, 0.0075, 0.018), plugMat);
      plug.position.set(x, yPort, FACE_Z + 0.009);
      const cableMat = new THREE.MeshStandardMaterial({ color: cableCols[i], roughness: 0.45 });
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.007, 0.012), cableMat);
      boot.position.set(x, yPort, FACE_Z + 0.024);
      const reach = 0.035 + (i % 2) * 0.006;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, yPort, FACE_Z + 0.03),
        new THREE.Vector3(x, yPort - 0.006, FACE_Z + reach),
        new THREE.Vector3(x, (yPort + brY) / 2 - 0.006, FACE_Z + reach + 0.004),
        new THREE.Vector3(x, brY + 0.003, FACE_Z + reach * 0.7),
        new THREE.Vector3(x, brY, FACE_Z - 0.01),
      ]);
      const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.0024, 6), cableMat);
      cable.castShadow = true;
      rack.add(plug, boot, cable);
    });
  }

  const lamp = new THREE.Group();
  lamp.position.set(0.85, 0, -0.5);
  scene.add(lamp);
  const black = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.4, metalness: 0.6 });
  add(new THREE.CylinderGeometry(0.15, 0.17, 0.03, 32), black, 0, 0.015, 0, lamp);
  add(new THREE.CylinderGeometry(0.011, 0.011, 1.4, 12), black, 0, 0.72, 0, lamp);
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#efe0c4', emissive: '#ffb25a', emissiveIntensity: 0, side: THREE.DoubleSide, roughness: 0.9 });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.24, 0.3, 48, 1, true), shadeMat);
  shade.position.y = 1.5;
  lamp.add(shade);

  const desk = new THREE.Group();
  desk.position.set(-2.15, 0, -0.42);
  scene.add(desk);
  const oak = new THREE.MeshStandardMaterial({ color: '#b98b5a', roughness: 0.55 });
  add(new THREE.BoxGeometry(1.25, 0.035, 0.62), oak, 0, 0.735, 0, desk);
  for (const x of [-0.58, 0.58]) for (const z of [-0.26, 0.26]) add(new THREE.BoxGeometry(0.035, 0.72, 0.035), black, x, 0.36, z, desk);
  const screenGroup = new THREE.Group();
  screenGroup.position.set(0.05, 0.755, -0.12);
  desk.add(screenGroup);
  add(new THREE.BoxGeometry(0.2, 0.012, 0.14), black, 0, 0.006, 0, screenGroup);
  add(new THREE.BoxGeometry(0.03, 0.2, 0.02), black, 0, 0.11, -0.03, screenGroup);
  add(new THREE.BoxGeometry(0.64, 0.38, 0.025), black, 0, 0.36, 0, screenGroup);
  const display = monitor();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.61, 0.345), new THREE.MeshBasicMaterial({ map: display.tex, toneMapped: false, color: '#d6d6d6' }));
  screen.position.set(0, 0.36, 0.0131);
  screenGroup.add(screen);
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.075), new THREE.MeshStandardMaterial({ map: noteTexture(), roughness: 0.9 }));
  note.position.set(0.29, 0.2, 0.0135);
  note.rotation.z = -0.12;
  screenGroup.add(note);
  const keyMat = new THREE.MeshStandardMaterial({ color: '#2b2d31', roughness: 0.6 });
  add(new THREE.BoxGeometry(0.42, 0.018, 0.13), keyMat, 0.0, 0.762, 0.14, desk);
  add(new THREE.BoxGeometry(0.06, 0.02, 0.1), keyMat, 0.32, 0.763, 0.15, desk);
  add(new THREE.CylinderGeometry(0.04, 0.036, 0.1, 24), new THREE.MeshStandardMaterial({ color: '#2d4d72', roughness: 0.3 }), -0.42, 0.803, 0.08, desk);
  add(new THREE.BoxGeometry(0.17, 0.03, 0.23), new THREE.MeshStandardMaterial({ color: '#8a2f3a', roughness: 0.7 }), 0.45, 0.768, 0.02, desk).rotation.y = 0.3;

  const chair = new THREE.Group();
  chair.position.set(-2.0, 0, 0.32);
  chair.rotation.y = -0.5;
  scene.add(chair);
  const fabric = new THREE.MeshStandardMaterial({ color: '#3b4e63', roughness: 0.9 });
  add(new THREE.BoxGeometry(0.46, 0.07, 0.44), fabric, 0, 0.47, 0, chair);
  add(new THREE.BoxGeometry(0.44, 0.48, 0.06), fabric, 0, 0.78, 0.22, chair).rotation.x = -0.1;
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 12), black, 0, 0.22, 0, chair);
  add(new THREE.CylinderGeometry(0.26, 0.26, 0.025, 5), black, 0, 0.03, 0, chair);

  const plant = buildPlant();
  plant.position.set(1.02, 0, 0.5);
  plant.scale.setScalar(1.35);
  scene.add(plant);
  const plantTag: Pickable = { id: 'poucevert' };
  plant.traverse((o) => {
    o.userData.pick = plantTag;
  });

  const { cat, tick: catTick } = buildCat(SOFT ? 0 : MOBILE ? 12 : 22);
  cat.position.set(-0.02, rackTop, 0.12);
  cat.rotation.y = -1.0;
  scene.add(cat);
  const catTag: Pickable = { id: 'cat' };
  cat.traverse((o) => {
    o.userData.pick = catTag;
  });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.5, 0.85);
  bloom.enabled = !LITE;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  let night = true;
  const applySky = () => {
    night = darkQuery.matches;
    root.classList.toggle('day', !night);
    const bg = night ? '#142624' : '#c9d6d8';
    scene.background = new THREE.Color(bg);
    fog.color.set(bg);
    hemi.color.set(night ? '#9fb8cc' : '#eef4f8');
    hemi.groundColor.set(night ? '#5a3a1c' : '#a5835a');
    hemi.intensity = night ? 0.95 : 1.5;
    fill.intensity = night ? 0.75 : 0.5;
    moon.intensity = night ? 0.7 : 0;
    sun.intensity = night ? 0 : 2.6;
    renderer.toneMappingExposure = night ? 1.45 : 1.0;
    bloom.strength = night ? 0.5 : 0.25;
    glassMat.map = night ? skyNight : skyDay;
    glassMat.needsUpdate = true;
    ledGlow.intensity = night ? 0.25 : 0;
    shadowDirty = 3;
  };
  applySky();
  darkQuery.addEventListener('change', applySky);

  const narrow = () => innerWidth < 760;
  const home = (): View =>
    narrow()
      ? { yaw: 0.2, pitch: 0.04, r: 5.6 * Math.max(1, 0.5 / (innerWidth / innerHeight)), tx: 0.04, ty: 1.3, tz: 0.25 }
      : { yaw: 0.42, pitch: 0.1, r: 4.15, tx: -0.62, ty: 1.17, tz: 0.25 };
  const cam = home();
  const goal = home();
  const resize = () => {
    const w = innerWidth;
    const h = innerHeight;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    bloom.setSize(w / 2, h / 2);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', () => {
    resize();
    if (!selected && !diving) Object.assign(goal, home());
  });
  resize();

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hover: Pickable | null = null;
  let selected: string | null = null;
  let drag: { x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null;
  let diving = false;
  const card = need<HTMLElement>(root, '.rk-card');
  const cbody = need<HTMLElement>(card, '.body');
  const leadSvg = need<SVGSVGElement>(root, '.rk-lead');
  const lead = need<SVGLineElement>(leadSvg, 'line');
  const leadDot = need<SVGCircleElement>(leadSvg, 'circle');
  const chips = new Map<string, HTMLAnchorElement>();
  for (const a of root.querySelectorAll<HTMLAnchorElement>('.rk-inv a[data-id]')) chips.set(a.dataset.id!, a);

  const pick = (e: PointerEvent): Pickable | null => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(scene.children, true)[0];
    return (hit?.object.userData.pick as Pickable | null | undefined) ?? null;
  };
  const anchor = new THREE.Vector3();
  const anchorFor = (id: string) => {
    const sv = servers.find((x) => x.id === id);
    if (sv) return anchor.set(FACE_W / 2 - 0.02, sv.g.position.y, FACE_Z + sv.g.position.z);
    if (id === 'poucevert') return anchor.set(1.02, 0.72, 0.5);
    if (id === 'cat') return anchor.copy(cat.position).add(new THREE.Vector3(0.1, 0.1, 0.05));
    return null;
  };
  const markChip = (id: string | null) => chips.forEach((a, k) => (k === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  const fillCard = (id: string) => {
    const entry = root.querySelector<HTMLElement>(`.rk-entries [data-id="${id}"]`);
    if (!entry) return;
    const copy = entry.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    copy.removeAttribute('id');
    copy.removeAttribute('aria-labelledby');
    cbody.replaceChildren(copy);
    cbody.scrollTop = 0;
    card.setAttribute('aria-label', entry.querySelector('h2')?.textContent ?? id);
  };

  const select = (id: string) => {
    const sv = servers.find((x) => x.id === id);
    servers.forEach((x) => (x.tz = 0));
    selected = id;
    markChip(id);
    fillCard(id);
    card.classList.add('open');
    display.draw(id);
    if (sv) {
      sv.tz = 0.34;
      const y = sv.g.position.y;
      Object.assign(goal, narrow() ? { yaw: 0.45, pitch: 0.26, r: 2.0, tx: 0.08, ty: y - 0.32, tz: 0.7 } : { yaw: 0.55, pitch: 0.18, r: 2.1, tx: 0.42, ty: y, tz: 0.55 });
    } else if (id === 'cat')
      Object.assign(goal, narrow() ? { yaw: 0.4, pitch: 0.35, r: 1.6, tx: 0, ty: rackTop - 0.3, tz: 0.2 } : { yaw: 0.5, pitch: 0.28, r: 1.6, tx: 0.35, ty: rackTop, tz: 0.2 });
    else Object.assign(goal, narrow() ? { yaw: 0.4, pitch: 0.3, r: 3.1, tx: 1.02, ty: 0.05, tz: 0.5 } : { yaw: 0.5, pitch: 0.2, r: 1.65, tx: 1.2, ty: 0.5, tz: 0.5 });
  };
  const deselect = () => {
    display.draw(null);
    servers.forEach((x) => (x.tz = 0));
    selected = null;
    card.classList.remove('open');
    leadSvg.classList.remove('on');
    markChip(null);
    Object.assign(goal, home());
  };
  need<HTMLButtonElement>(card, '.close').addEventListener('click', deselect);

  canvas.addEventListener('pointerdown', (e) => {
    if (diving) return;
    window.focus();
    drag = { x: e.clientX, y: e.clientY, yaw: goal.yaw, pitch: goal.pitch, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (diving) return;
    if (drag) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 4) {
        drag.moved = true;
        canvas.classList.add('drag');
      }
      if (drag.moved) {
        goal.yaw = Math.max(-1.1, Math.min(1.25, drag.yaw - dx * 0.005));
        goal.pitch = Math.max(-0.05, Math.min(0.6, drag.pitch + dy * 0.004));
      }
      return;
    }
    hover = pick(e);
    canvas.classList.toggle('hot', !!hover);
  });
  canvas.addEventListener('pointerup', (e) => {
    canvas.classList.remove('drag');
    if (drag && !drag.moved) {
      const hit = pick(e);
      if (hit) select(hit.id);
      else if (selected) deselect();
    }
    drag = null;
  });
  canvas.addEventListener('pointerleave', () => {
    hover = null;
    canvas.classList.remove('hot');
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      goal.r = Math.max(1.2, Math.min(6, goal.r * (1 + Math.sign(e.deltaY) * 0.08)));
    },
    { passive: false },
  );
  chips.forEach((a, id) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      select(id);
    }),
  );

  const boot = need<HTMLElement>(root, '.rk-boot');
  let bootRun = 0;
  const dive = () => {
    if (diving) return;
    diving = true;
    card.classList.remove('open');
    leadSvg.classList.remove('on');
    hover = null;
    canvas.classList.remove('hot');
    servers.forEach((x) => (x.tz = 0));
    const sv = servers.find((x) => x.id === selected) ?? servers.find((x) => x.id === 'forge')!;
    sv.tz = 0.3;
    Object.assign(goal, { yaw: 0, pitch: 0, r: 0.8, tx: 0, ty: sv.g.position.y, tz: FACE_Z + 0.3 });
    const run = ++bootRun;
    setTimeout(() => run === bootRun && (goal.r = 0.015), reduce ? 0 : 1300);
    setTimeout(() => {
      if (run !== bootRun) return;
      runBoot(boot, sv.s.label ?? sv.id, `slot ${slotOf(sv.s)}, ${sv.s.height}U`, () => run === bootRun).then((done) => {
        if (done && run === bootRun) location.assign('/desktop/');
      });
    }, reduce ? 0 : 2100);
  };
  const surface = () => {
    bootRun++;
    diving = false;
    boot.classList.remove('on');
    setTimeout(() => {
      boot.hidden = true;
      boot.querySelector('pre')!.textContent = '';
    }, 350);
    deselect();
  };
  addEventListener('pageshow', (e) => {
    if (e.persisted && diving) surface();
  });
  const KON = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kp = 0;
  addEventListener('keydown', (e) => {
    if (diving) {
      if (e.key === 'Escape') surface();
      return;
    }
    if (e.key === 'Escape') {
      deselect();
      return;
    }
    const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]');
    if ((e.key === 'j' || e.key === 'k') && !e.ctrlKey && !e.metaKey && !e.altKey && !typing) {
      const ids = [...chips.keys()];
      const at = selected ? ids.indexOf(selected) : -1;
      const next = e.key === 'j' ? (at < 0 ? 0 : Math.min(ids.length - 1, at + 1)) : at < 0 ? ids.length - 1 : Math.max(0, at - 1);
      select(ids[next]);
      chips.get(ids[next])?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kp = k === KON[kp] ? kp + 1 : k === KON[0] ? 1 : 0;
    if (kp === KON.length) {
      kp = 0;
      e.preventDefault();
      dive();
    }
  });

  need<HTMLElement>(root, '.rk-loading').remove();

  const t0 = performance.now();
  const proj = new THREE.Vector3();
  let lastDraw = 0;
  let cost = 0;
  let frames = 0;
  let slow = 0;
  let sampleStart = 0;
  let quality = 2;
  const degrade = () => {
    if (quality === 2) {
      pr = 1;
      resize();
    } else if (quality === 1) bloom.enabled = false;
    quality--;
  };
  const loop = (now = 0) => {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    const t = (performance.now() - t0) / 1000;
    const k = reduce ? 1 : 0.075;
    let moving = !!drag || t < 3;
    for (const key of VIEW_KEYS) if (Math.abs(goal[key] - cam[key]) > 1e-4) moving = true;
    for (const sv of servers)
      if (Math.abs(sv.tz - sv.z) > 1e-4 || (hover?.id === sv.id && sv.z < 0.024)) {
        moving = true;
        shadowDirty = 2;
      }
    if (now - lastDraw < Math.max(moving ? 0 : 66, cost * 3)) return;
    if (moving && quality > 0 && now) {
      if (!sampleStart) sampleStart = now;
      frames++;
      if (now - lastDraw > 26) slow++;
      if (now - sampleStart > 1500) {
        if (frames > 20 && slow / frames > 0.5) degrade();
        frames = slow = 0;
        sampleStart = now;
      }
    }
    lastDraw = now;
    if (shadowDirty > 0) {
      renderer.shadowMap.needsUpdate = true;
      shadowDirty--;
    }
    for (const key of VIEW_KEYS) cam[key] += (goal[key] - cam[key]) * k;
    camera.position.set(cam.tx + cam.r * Math.sin(cam.yaw) * Math.cos(cam.pitch), cam.ty + cam.r * Math.sin(cam.pitch), cam.tz + cam.r * Math.cos(cam.yaw) * Math.cos(cam.pitch));
    camera.position.x = Math.max(-2.95, camera.position.x);
    camera.position.y = Math.max(0.25, camera.position.y);
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    for (const sv of servers) {
      const hot = hover?.id === sv.id;
      const tz = sv.tz || (hot && !selected ? 0.025 : 0);
      sv.z += (tz - sv.z) * (reduce ? 1 : 0.12);
      sv.g.position.z = sv.z;
      sv.faceMat.emissiveIntensity = hot || selected === sv.id ? 0.07 : 0;
    }
    const lampOn = night ? (reduce ? 1 : Math.min(1, Math.max(0, (t - 0.35) / 0.25))) : 0;
    lampLight.intensity = 8 * lampOn;
    spill.intensity = 6 * lampOn;
    shadeMat.emissiveIntensity = 1.1 * lampOn;
    servers.forEach((sv, i) => {
      if (!sv.lit && (reduce || t > 1.1 + i * 0.06)) {
        sv.lit = true;
        sv.leds.forEach((m) => (m.emissiveIntensity = 3));
      }
    });
    for (const l of leds) {
      if (!l.sv.lit) continue;
      const v = Math.sin(t * l.rate * 6 + l.phase) + Math.sin(t * l.rate * 13.7 + l.phase * 2);
      l.m.emissiveIntensity = reduce ? 2.5 : v > 0.2 ? 3.2 : 0.4;
    }
    if (!reduce) catTick(t);
    const before = performance.now();
    if (bloom.enabled) composer.render();
    else renderer.render(scene, camera);
    cost = cost * 0.7 + (performance.now() - before) * 0.3;
    const a = selected && !narrow() ? anchorFor(selected) : null;
    if (a) {
      proj.copy(a).project(camera);
      const sx = ((proj.x + 1) / 2) * innerWidth;
      const sy = ((1 - proj.y) / 2) * innerHeight;
      const top = Math.max(20, Math.min(innerHeight - card.offsetHeight - 84, sy - 48));
      card.style.top = `${top}px`;
      const cx = card.getBoundingClientRect().left;
      const cy = top + 48;
      lead.setAttribute('x1', String(sx));
      lead.setAttribute('y1', String(sy));
      lead.setAttribute('x2', String(cx));
      lead.setAttribute('y2', String(cy));
      leadDot.setAttribute('cx', String(sx));
      leadDot.setAttribute('cy', String(sy));
      leadSvg.classList.toggle('on', cx - sx > 24);
    }
  };
  loop();

  const initial = location.hash.match(/^#server-(.+)$/)?.[1];
  if (initial && chips.has(initial)) select(initial);
}
