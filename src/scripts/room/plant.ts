import * as THREE from 'three';

const canvasTexture = (w: number, h: number, draw: (x: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  draw(x);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
};

const speckle = (x: CanvasRenderingContext2D, w: number, h: number, n: number, rgb: string, alpha: number, size: number) => {
  for (let i = 0; i < n; i++) {
    x.fillStyle = `rgba(${rgb},${Math.random() * alpha})`;
    const r = Math.random() * size;
    x.fillRect(Math.random() * w, Math.random() * h, r, r);
  }
};

const terracotta = () =>
  canvasTexture(1024, 768, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 768);
    g.addColorStop(0, '#7e3f24');
    g.addColorStop(0.36, '#97502f');
    g.addColorStop(0.4, '#c27149');
    g.addColorStop(0.75, '#b8653e');
    g.addColorStop(1, '#a95a37');
    x.fillStyle = g;
    x.fillRect(0, 0, 1024, 768);
    for (let i = 0; i < 90; i++) {
      x.fillStyle = `rgba(${Math.random() < 0.5 ? '120,50,25' : '225,150,110'},${Math.random() * 0.1})`;
      x.beginPath();
      x.ellipse(Math.random() * 1024, 290 + Math.random() * 478, 30 + Math.random() * 120, 20 + Math.random() * 60, 0, 0, 7);
      x.fill();
    }
    speckle(x, 1024, 768, 26000, '70,30,15', 0.16, 2);
    speckle(x, 1024, 768, 9000, '255,220,190', 0.12, 1.5);
    for (let i = 0; i < 18; i++) {
      const grad = x.createRadialGradient(0, 0, 0, 0, 0, 1);
      grad.addColorStop(0, `rgba(232,226,208,${0.12 + Math.random() * 0.14})`);
      grad.addColorStop(1, 'rgba(232,226,208,0)');
      x.save();
      x.translate(Math.random() * 1024, 330 + Math.random() * 60);
      x.scale(50 + Math.random() * 90, 18 + Math.random() * 30);
      x.fillStyle = grad;
      x.beginPath();
      x.arc(0, 0, 1, 0, 7);
      x.fill();
      x.restore();
    }
  });

const resample = (pts: [number, number][], step = 0.004) => {
  const out: THREE.Vector2[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [r0, y0] = pts[i];
    const [r1, y1] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(r1 - r0, y1 - y0) / step));
    for (let k = 0; k < n; k++) out.push(new THREE.Vector2(r0 + ((r1 - r0) * k) / n, y0 + ((y1 - y0) * k) / n));
  }
  const [rl, yl] = pts[pts.length - 1];
  out.push(new THREE.Vector2(rl, yl));
  return out;
};

const soilTexture = () =>
  canvasTexture(
    512,
    512,
    (x) => {
      x.fillStyle = '#2b1d13';
      x.fillRect(0, 0, 512, 512);
      speckle(x, 512, 512, 30000, '15,9,5', 0.6, 3);
      speckle(x, 512, 512, 12000, '90,62,40', 0.5, 2.5);
      for (let i = 0; i < 160; i++) {
        x.fillStyle = `rgba(235,232,222,${0.5 + Math.random() * 0.45})`;
        x.beginPath();
        x.ellipse(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 3.5, 1.5 + Math.random() * 3, Math.random() * 3, 0, 7);
        x.fill();
      }
      x.strokeStyle = 'rgba(120,85,50,.5)';
      for (let i = 0; i < 40; i++) {
        x.lineWidth = 1 + Math.random();
        const sx = Math.random() * 512;
        const sy = Math.random() * 512;
        x.beginPath();
        x.moveTo(sx, sy);
        x.lineTo(sx + (Math.random() - 0.5) * 30, sy + (Math.random() - 0.5) * 30);
        x.stroke();
      }
    },
    [1, 1],
  );

const leafTexture = () =>
  canvasTexture(512, 512, (x) => {
    const c = 256;
    const g = x.createRadialGradient(c, c, 0, c, c, 256);
    g.addColorStop(0, '#8fae62');
    g.addColorStop(0.16, '#6e9a4c');
    g.addColorStop(0.75, '#5c8a3f');
    g.addColorStop(0.96, '#527d38');
    g.addColorStop(1, '#3f6629');
    x.fillStyle = g;
    x.fillRect(0, 0, 512, 512);
    speckle(x, 512, 512, 5000, '30,70,20', 0.12, 3);
    speckle(x, 512, 512, 3000, '170,210,120', 0.08, 2);
    const veins = 9;
    for (let i = 0; i < veins; i++) {
      const a = (i / veins) * Math.PI * 2 + 0.2;
      x.strokeStyle = 'rgba(185,215,150,.32)';
      x.lineWidth = 2.6;
      x.beginPath();
      x.moveTo(c, c);
      const ex = c + Math.cos(a) * 236;
      const ey = c + Math.sin(a) * 236;
      x.quadraticCurveTo(c + Math.cos(a + 0.12) * 130, c + Math.sin(a + 0.12) * 130, ex, ey);
      x.stroke();
      for (let k = 1; k < 4; k++) {
        const t = k / 4;
        const bx = c + Math.cos(a) * 236 * t;
        const by = c + Math.sin(a) * 236 * t;
        x.lineWidth = 1.3;
        x.strokeStyle = 'rgba(180,210,140,.14)';
        for (const s of [-1, 1]) {
          x.beginPath();
          x.moveTo(bx, by);
          x.quadraticCurveTo(bx + Math.cos(a + s * 0.9) * 30, by + Math.sin(a + s * 0.9) * 30, bx + Math.cos(a + s * 0.5) * 60 * (1 - t * 0.5), by + Math.sin(a + s * 0.5) * 60 * (1 - t * 0.5));
          x.stroke();
        }
      }
    }
    x.fillStyle = 'rgba(205,230,170,.8)';
    x.beginPath();
    x.arc(c, c, 9, 0, 7);
    x.fill();
  });

function leafGeometry(rings = 7, segs = 36) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  pos.push(0, 0, 0);
  uv.push(0.5, 0.5);
  for (let r = 1; r <= rings; r++) {
    const rr = r / rings;
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      const wobble = 1 + Math.sin(a * 3 + 1.3) * 0.025 + Math.sin(a * 5) * 0.015;
      const px = Math.cos(a) * rr * wobble;
      const pz = Math.sin(a) * rr * wobble;
      const dome = 0.16 * rr * rr - 0.1 * rr ** 4 + Math.sin(a * 4) * 0.025 * rr ** 3;
      pos.push(px, dome, pz);
      uv.push(0.5 + px * 0.47, 0.5 + pz * 0.47);
    }
  }
  for (let s = 0; s < segs; s++) idx.push(0, 1 + ((s + 1) % segs), 1 + s);
  for (let r = 1; r < rings; r++)
    for (let s = 0; s < segs; s++) {
      const a = 1 + (r - 1) * segs + s;
      const b = 1 + (r - 1) * segs + ((s + 1) % segs);
      const c = a + segs;
      const d = b + segs;
      idx.push(a, b, d, a, d, c);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function buildPlant() {
  const plant = new THREE.Group();
  const shadow = (m: THREE.Mesh, cast = true) => {
    m.castShadow = cast;
    m.receiveShadow = true;
    return m;
  };

  const potTex = terracotta();
  const potMat = new THREE.MeshStandardMaterial({ map: potTex, bumpMap: potTex, bumpScale: 0.25, roughness: 0.92, side: THREE.DoubleSide });
  const H = 0.3;
  const profile = [
    [0.0, 0.012],
    [0.098, 0.012],
    [0.104, 0.02],
    [0.124, H - 0.055],
    [0.128, H - 0.052],
    [0.138, H - 0.05],
    [0.141, H - 0.044],
    [0.142, H - 0.004],
    [0.138, H],
    [0.13, H],
    [0.127, H - 0.006],
    [0.118, H - 0.05],
    [0.1, 0.03],
  ] as [number, number][];
  plant.add(shadow(new THREE.Mesh(new THREE.LatheGeometry(resample(profile), 72), potMat)));
  const saucerProfile = [
    [0, 0.002],
    [0.13, 0.002],
    [0.142, 0.006],
    [0.148, 0.022],
    [0.143, 0.024],
    [0.137, 0.01],
    [0.0, 0.009],
  ] as [number, number][];
  plant.add(shadow(new THREE.Mesh(new THREE.LatheGeometry(resample(saucerProfile), 72), potMat)));

  const soilTex = soilTexture();
  const soilGeo = new THREE.CircleGeometry(0.121, 48);
  const sp = soilGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const r = Math.hypot(sp.getX(i), sp.getY(i));
    sp.setZ(i, (Math.random() - 0.5) * 0.004 - r * 0.03);
  }
  soilGeo.computeVertexNormals();
  const soil = shadow(new THREE.Mesh(soilGeo, new THREE.MeshStandardMaterial({ map: soilTex, bumpMap: soilTex, bumpScale: 2, roughness: 1 })), false);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = H - 0.03;
  plant.add(soil);
  const soilY = H - 0.03;

  const stemMat = new THREE.MeshStandardMaterial({ color: '#6f7a3c', roughness: 0.7 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#7b6a45', roughness: 0.85 });
  const petioleMat = new THREE.MeshStandardMaterial({ color: '#7f9a3e', roughness: 0.55 });
  const leafTex = leafTexture();
  const leafMats = ['#ffffff', '#eef3e4', '#f6fbe9', '#e2ead3'].map(
    (tint) => new THREE.MeshStandardMaterial({ map: leafTex, color: tint, roughness: 0.5, metalness: 0, side: THREE.DoubleSide }),
  );
  const leafGeo = leafGeometry();

  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, soilY - 0.01, 0),
    new THREE.Vector3(0.006, soilY + 0.08, 0.004),
    new THREE.Vector3(-0.004, soilY + 0.17, 0.01),
    new THREE.Vector3(0.004, soilY + 0.24, 0.006),
  ]);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 32, 0.011, 10, false);
  const tp = trunkGeo.attributes.position;
  const pt = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= 32; i++) {
    trunkCurve.getPointAt(i / 32, pt);
    const r = 1 - (i / 32) * 0.55;
    for (let j = 0; j <= 10; j++) {
      const k = i * 11 + j;
      v.fromBufferAttribute(tp, k).sub(pt).multiplyScalar(r).add(pt);
      tp.setXYZ(k, v.x, v.y, v.z);
    }
  }
  trunkGeo.computeVertexNormals();
  plant.add(shadow(new THREE.Mesh(trunkGeo, trunkMat)));
  for (let i = 0; i < 9; i++) {
    const t = 0.1 + i * 0.09;
    trunkCurve.getPointAt(t, pt);
    const scar = new THREE.Mesh(new THREE.TorusGeometry(0.0105 * (1 - t * 0.5), 0.0016, 4, 16), new THREE.MeshStandardMaterial({ color: '#5e5034', roughness: 0.9 }));
    scar.position.copy(pt);
    scar.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    plant.add(scar);
  }

  const UP = new THREE.Vector3(0, 1, 0);
  const addLeaf = (from: THREE.Vector3, azimuth: number, reach: number, rise: number, size: number, droop: number) => {
    const out = new THREE.Vector3(Math.cos(azimuth), 0, Math.sin(azimuth));
    const end = from.clone().addScaledVector(out, reach).addScaledVector(UP, rise - droop);
    const mid = from.clone().addScaledVector(out, reach * 0.45).addScaledVector(UP, rise * 0.85);
    const curve = new THREE.QuadraticBezierCurve3(from, mid, end);
    plant.add(shadow(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.0019 + size * 0.012, 6, false), petioleMat)));
    const tilt = 0.25 + droop * 3.5 + Math.random() * 0.2;
    const normal = UP.clone().applyAxisAngle(new THREE.Vector3(-out.z, 0, out.x), -tilt).normalize();
    const X = out.clone().addScaledVector(normal, -out.dot(normal)).normalize();
    const Z = new THREE.Vector3().crossVectors(X, normal);
    const leaf = shadow(new THREE.Mesh(leafGeo, leafMats[(Math.random() * leafMats.length) | 0]));
    leaf.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, normal, Z));
    leaf.rotateY(Math.random() * Math.PI * 2);
    leaf.scale.setScalar(size);
    leaf.position.copy(end).addScaledVector(X, size * 0.12).addScaledVector(normal, size * 0.03);
    plant.add(leaf);
  };

  const golden = Math.PI * (3 - Math.sqrt(5));
  const N = 24;
  for (let i = 0; i < N; i++) {
    const age = 1 - i / N;
    const t = 0.18 + (i / N) * 0.8;
    const from = trunkCurve.getPointAt(Math.min(1, t));
    const size = 0.026 + age * 0.03 + Math.random() * 0.008;
    const reach = 0.05 + age * 0.17 + Math.random() * 0.03;
    const rise = 0.03 + (1 - age) * 0.06 + Math.random() * 0.02;
    const droop = age * age * 0.09;
    addLeaf(from, i * golden + 0.4, reach, rise, size, droop);
  }
  for (const [ax, az, n] of [
    [0.07, 0.03, 3],
    [-0.05, -0.065, 2],
  ] as const) {
    const base = new THREE.Vector3(ax, soilY, az);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.05, 6), stemMat);
    stem.position.copy(base).add(new THREE.Vector3(0, 0.02, 0));
    plant.add(shadow(stem));
    for (let k = 0; k < n; k++) addLeaf(base.clone().add(new THREE.Vector3(0, 0.04, 0)), k * 2.2 + ax * 20, 0.025 + k * 0.01, 0.035, 0.018 + k * 0.004, 0.005);
  }
  return plant;
}
