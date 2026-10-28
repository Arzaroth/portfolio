import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RACK_UNITS, freeUnits, type Unit } from '../data/rack';
import type { Role } from '../data/projects';

const U = 0.0445;
const WIDTH = 0.483;
const DEPTH = 0.62;
const HEIGHT = RACK_UNITS * U;
const POST = 0.035;

export interface Rack {
  highlight(i: number | null): void;
}

export function mountRack(host: HTMLElement, units: Unit[], tint: Record<Role, string>, onHover: (i: number | null) => void): Rack {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const color = (name: string) => new THREE.Color(css.getPropertyValue(name).trim());

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(1.05, 1.3, 3.9);

  scene.add(new THREE.HemisphereLight(color('--sky3'), color('--sky0'), 1.1));
  const key = new THREE.DirectionalLight(color('--sky4'), 2.2);
  key.position.set(2.5, 3, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(color('--rose'), 2);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);

  const metal = new THREE.MeshStandardMaterial({ color: 0x5a5368, metalness: 0.8, roughness: 0.35 });
  const shell = new THREE.MeshStandardMaterial({ color: 0x2a2433, metalness: 0.5, roughness: 0.6 });
  const blank = new THREE.MeshStandardMaterial({ color: 0x1f1b27, metalness: 0.6, roughness: 0.5 });
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  };

  const sideX = WIDTH / 2 + POST;
  box(0.012, HEIGHT + 0.08, DEPTH, shell, -sideX - 0.006, HEIGHT / 2, 0);
  box(0.012, HEIGHT + 0.08, DEPTH, shell, sideX + 0.006, HEIGHT / 2, 0);
  box(WIDTH + POST * 2 + 0.024, 0.04, DEPTH, shell, 0, HEIGHT + 0.06, 0);
  box(WIDTH + POST * 2 + 0.024, 0.06, DEPTH, shell, 0, -0.03, 0);
  box(WIDTH + POST * 2, HEIGHT, 0.01, shell, 0, HEIGHT / 2, -DEPTH / 2);
  for (const x of [-WIDTH / 2 - POST / 2, WIDTH / 2 + POST / 2]) box(POST, HEIGHT, POST, metal, x, HEIGHT / 2, DEPTH / 2 - POST / 2);

  const unitY = (top: number, height: number) => (top - height) * U + (height * U) / 2;
  for (const u of freeUnits(units)) {
    box(WIDTH, U * 0.92, 0.01, blank, 0, unitY(u, 1), DEPTH / 2 - 0.02);
  }

  interface Server {
    group: THREE.Group;
    face: THREE.MeshStandardMaterial;
    leds: THREE.MeshStandardMaterial[];
    out: number;
  }
  const servers: Server[] = units.map((u) => {
    const group = new THREE.Group();
    group.position.set(0, unitY(u.top, u.height), 0);
    const h = u.height * U * 0.92;
    const face = new THREE.MeshStandardMaterial({ color: 0x6d6680, metalness: 0.75, roughness: 0.3, emissive: color(tint[u.role]), emissiveIntensity: 0 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(WIDTH - 0.004, h, DEPTH - 0.06), face);
    body.position.z = -0.01;
    group.add(body);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, h * 0.7, 0.004),
      new THREE.MeshStandardMaterial({ color: color(tint[u.role]), emissive: color(tint[u.role]), emissiveIntensity: 0.6 }),
    );
    stripe.position.set(-WIDTH / 2 + 0.03, 0, DEPTH / 2 - 0.038);
    group.add(stripe);
    for (const side of [-1, 1]) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.008, h * 0.6, 0.016), metal);
      handle.position.set(side * (WIDTH / 2 - 0.012), 0, DEPTH / 2 - 0.03);
      group.add(handle);
    }
    const vent = new THREE.Mesh(new THREE.BoxGeometry(WIDTH * 0.42, h * 0.5, 0.002), blank);
    vent.position.set(0.02, 0, DEPTH / 2 - 0.039);
    group.add(vent);
    const leds = [0, 1].map((n) => {
      const m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: n ? color(tint[u.role]) : color('--sage'), emissiveIntensity: 1.6 });
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.004), m);
      led.position.set(WIDTH / 2 - 0.05 + n * 0.018, 0, DEPTH / 2 - 0.038);
      group.add(led);
      return m;
    });
    scene.add(group);
    return { group, face, leds, out: 0 };
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, HEIGHT / 2, 0);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minPolarAngle = Math.PI * 0.32;
  controls.maxPolarAngle = Math.PI * 0.56;
  controls.minAzimuthAngle = -Math.PI * 0.45;
  controls.maxAzimuthAngle = Math.PI * 0.45;
  controls.update();

  let lit: number | null = null;
  let dirty = true;
  const highlight = (i: number | null) => {
    if (i === lit) return;
    lit = i;
    dirty = true;
  };

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const tip = document.createElement('div');
  tip.className = 'rack-tip';
  tip.hidden = true;
  host.append(tip);
  renderer.domElement.addEventListener('pointermove', (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(servers.map((s) => s.group), true)[0];
    const i = hit ? servers.findIndex((s) => s.group === hit.object.parent) : -1;
    highlight(i < 0 ? null : i);
    onHover(i < 0 ? null : i);
    tip.hidden = i < 0;
    if (i >= 0) {
      tip.textContent = units[i].name;
      tip.style.left = `${e.clientX - r.left + 14}px`;
      tip.style.top = `${e.clientY - r.top + 10}px`;
    }
  });
  renderer.domElement.addEventListener('pointerleave', () => {
    highlight(null);
    onHover(null);
    tip.hidden = true;
  });
  controls.addEventListener('change', () => (dirty = true));

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width / height < 0.8 ? 34 : 28;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  new ResizeObserver(resize).observe(host);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);

  let blink = 0;
  const loop = (t: number) => {
    requestAnimationFrame(loop);
    if (!visible || !host.offsetParent) return;
    let moving = controls.update();
    servers.forEach((s, i) => {
      const goal = i === lit ? 0.14 : 0;
      if (Math.abs(s.out - goal) > 0.001) {
        s.out = reduce ? goal : s.out + (goal - s.out) * 0.18;
        s.group.position.z = s.out;
        s.face.emissiveIntensity = (s.out / 0.14) * 0.35;
        moving = true;
      }
    });
    if (!reduce && t - blink > 120) {
      blink = t;
      for (const s of servers) if (Math.random() < 0.25) s.leds[1].emissiveIntensity = Math.random() < 0.5 ? 0.2 : 2;
      moving = true;
    }
    if (moving || dirty) {
      renderer.render(scene, camera);
      dirty = false;
    }
  };
  requestAnimationFrame(loop);

  return { highlight };
}
