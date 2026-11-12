import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

type Mode = 'body' | 'tail' | 'head' | 'ear';

const FUR_GLSL = `
  float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
  float fbm(vec3 p){ return vn(p)*0.55 + vn(p*2.1)*0.3 + vn(p*4.3)*0.15; }
`;

const COAT: Record<Mode, string> = {
  ear: 'c = mix(ginger, dark, 0.15 + smoothstep(0.01, 0.045, p.y) * 0.6);',
  tail: `
    float st = smoothstep(0.45, 0.9, sin(p.x * 110.0 + wob));
    c = mix(ginger, dark, st * 0.8);`,
  head: `
    float st = smoothstep(0.5, 0.92, sin(p.z * 160.0 + wob)) * smoothstep(0.205, 0.225, p.y) * (1.0 - smoothstep(0.17, 0.2, p.x));
    float cr = smoothstep(0.172, 0.2, p.x) * smoothstep(0.19, 0.172, p.y);
    cr = max(cr, smoothstep(0.17, 0.155, p.y));
    cr = clamp(cr + (fbm(p * 50.0) - 0.5) * 0.35, 0.0, 1.0);
    c = mix(mix(ginger, dark, st * 0.75), cream, cr);`,
  body: `
    float st = smoothstep(0.42, 0.92, sin(p.x * (80.0 + fbm(p * 6.0) * 30.0) + p.y * 26.0 + wob * 1.4)) * smoothstep(0.045, 0.12, p.y);
    float dorsal = smoothstep(0.035, 0.0, abs(p.z + (fbm(p * 9.0) - 0.5) * 0.02)) * smoothstep(0.12, 0.16, p.y);
    float cr = smoothstep(0.045, 0.012, p.y);
    cr = max(cr, smoothstep(0.1, 0.15, p.x) * smoothstep(0.12, 0.07, p.y));
    cr = clamp(cr + (fbm(p * 40.0) - 0.5) * 0.4, 0.0, 1.0);
    c = mix(mix(ginger, dark, clamp(st * 0.8 + dorsal * 0.55, 0.0, 0.9)), cream, cr);`,
};

function furMat(mode: Mode, shells: number, len: number) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0 });
  m.customProgramCacheKey = () => `fur-${mode}-${shells}-${len}`;
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFur;\nvarying float vH;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vFur = position;
        float h = ${shells ? `float(gl_InstanceID + 1) / ${shells}.0` : '0.0'};
        vH = h;
        float L = ${len.toFixed(4)} * ${mode === 'head' ? 'mix(1.0, 0.22, smoothstep(0.175, 0.2, position.x))' : '1.0'};
        transformed += normalize(normal) * h * L;
        transformed.y -= h * h * L * 0.35;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFur;\nvarying float vH;\n' + FUR_GLSL)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 p = vFur;
        if (vH > 0.0) {
          vec3 q = p * 820.0;
          float strand = h31(floor(q)) * 0.6 + h31(floor(q * 1.7 + 11.0)) * 0.4;
          float clump = vn(p * 95.0);
          if (strand * (0.72 + clump * 0.56) < vH * 0.95 + 0.05) discard;
        }
        vec3 ginger = vec3(0.84, 0.47, 0.19), dark = vec3(0.44, 0.2, 0.06), cream = vec3(0.97, 0.83, 0.62);
        vec3 c;
        float wob = fbm(p * 16.0) * 2.4;
        ${COAT[mode]}
        c *= 0.88 + fbm(p * 70.0) * 0.24;
        diffuseColor.rgb = c * mix(0.42, 1.05, pow(vH, 0.75));`,
      );
  };
  return m;
}

function furred(geo: THREE.BufferGeometry, mode: Mode, shells: number, len: number) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(geo, furMat(mode, 0, len));
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);
  if (shells) {
    const inst = new THREE.InstancedMesh(geo, furMat(mode, shells, len), shells);
    const I = new THREE.Matrix4();
    for (let i = 0; i < shells; i++) inst.setMatrixAt(i, I);
    inst.receiveShadow = true;
    inst.raycast = () => {};
    inst.frustumCulled = false;
    g.add(inst);
  }
  return { group: g, base };
}

type Ball = [number, number, number, number];

function metaGeo(balls: Ball[], res: number, half: number, center: [number, number, number]) {
  const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 500000);
  mc.isolation = 80;
  mc.reset();
  const at = (v: number, c: number) => 0.5 + (v - c) / (2 * half);
  for (const [x, y, z, r] of balls) mc.addBall(at(x, center[0]), at(y, center[1]), at(z, center[2]), 120 * (r / (2 * half)) ** 2, 40);
  mc.update();
  const n = mc.count * 3;
  const pos = mc.positionArray.slice(0, n);
  const nrm = mc.normalArray.slice(0, n);
  for (let i = 0; i < n; i += 3) {
    pos[i] = pos[i] * half + center[0];
    pos[i + 1] = pos[i + 1] * half + center[1];
    pos[i + 2] = pos[i + 2] * half + center[2];
    const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1;
    nrm[i] /= l;
    nrm[i + 1] /= l;
    nrm[i + 2] /= l;
    if (pos[i + 1] < 0.004) {
      pos[i + 1] = 0.004;
      nrm[i] = 0;
      nrm[i + 1] = -1;
      nrm[i + 2] = 0;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  mc.geometry.dispose();
  return geo;
}

export function buildCat(shells: number) {
  const cat = new THREE.Group();
  const breathe = new THREE.Group();
  cat.add(breathe);
  const bodyGeo = metaGeo(
    [
      [-0.085, 0.078, 0, 0.083],
      [-0.08, 0.068, 0.034, 0.068],
      [-0.08, 0.068, -0.034, 0.068],
      [-0.01, 0.086, 0, 0.086],
      [0.06, 0.08, 0, 0.08],
      [0.115, 0.068, 0, 0.064],
      [0.165, 0.014, 0.024, 0.015],
      [0.165, 0.014, -0.024, 0.015],
    ],
    72,
    0.24,
    [-0.02, 0.15, 0],
  );
  breathe.add(furred(bodyGeo, 'body', shells, 0.012).group);

  const HC = new THREE.Vector3(0.165, 0.188, 0);
  const headGeo = metaGeo(
    [
      [HC.x, HC.y, 0, 0.056],
      [0.177, 0.176, 0.029, 0.034],
      [0.177, 0.176, -0.029, 0.034],
      [0.207, 0.171, 0, 0.022],
      [0.201, 0.158, 0, 0.017],
      [0.15, 0.17, 0, 0.042],
    ],
    64,
    0.09,
    [0.17, 0.18, 0],
  );
  const head = furred(headGeo, 'head', shells, 0.008);
  breathe.add(head.group);
  const ray = new THREE.Raycaster();
  const hit = (dir: [number, number, number], lift = 0.0015) => {
    const d = new THREE.Vector3(...dir).normalize();
    ray.set(HC.clone().addScaledVector(d, 0.2), d.clone().negate());
    const h = ray.intersectObject(head.base, false)[0];
    return h ? h.point.clone().addScaledVector(d, lift) : HC.clone().addScaledVector(d, 0.05);
  };

  const tc = new THREE.CatmullRomCurve3(
    (
      [
        [-0.11, 0.04, 0.04],
        [-0.165, 0.022, 0.075],
        [-0.12, 0.016, 0.105],
        [-0.03, 0.014, 0.11],
        [0.06, 0.014, 0.1],
        [0.13, 0.015, 0.075],
        [0.16, 0.017, 0.05],
      ] as const
    ).map((v) => new THREE.Vector3(...v)),
  );
  const TS = 64;
  const RS = 12;
  const tgeo = new THREE.TubeGeometry(tc, TS, 0.0155, RS, false);
  const tp = tgeo.attributes.position;
  const pt = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= TS; i++) {
    const t = i / TS;
    const r = 1 - t * 0.35 - (t > 0.9 ? (t - 0.9) * 5 : 0);
    tc.getPointAt(t, pt);
    for (let j = 0; j <= RS; j++) {
      const k = i * (RS + 1) + j;
      v.fromBufferAttribute(tp, k).sub(pt).multiplyScalar(r).add(pt);
      tp.setXYZ(k, v.x, v.y, v.z);
    }
  }
  tgeo.computeVertexNormals();
  breathe.add(furred(tgeo, 'tail', shells, 0.009).group);

  const earGeo = new THREE.ConeGeometry(0.027, 0.052, 24, 4);
  earGeo.scale(1, 1, 0.38);
  earGeo.translate(0, 0.02, 0);
  const innerGeo = new THREE.ConeGeometry(0.019, 0.04, 16);
  innerGeo.scale(1, 1, 0.18);
  innerGeo.translate(0, 0.02, 0.0075);
  const pink = new THREE.MeshStandardMaterial({ color: '#e3a7a0', roughness: 0.75 });
  const ears: THREE.Group[] = [];
  const fwd = new THREE.Vector3(1, 0.15, 0);
  for (const sg of [-1, 1]) {
    const Y = new THREE.Vector3(-0.1, 0.85, sg * 0.55).normalize();
    const base = hit([Y.x, Y.y, Y.z], -0.006);
    const Z = fwd.clone().addScaledVector(Y, -fwd.dot(Y)).normalize();
    const X = new THREE.Vector3().crossVectors(Y, Z);
    const pivot = new THREE.Group();
    pivot.position.copy(base);
    pivot.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
    pivot.rotateY(sg * -0.35);
    const ear = furred(earGeo, 'ear', Math.round(shells / 2), 0.004).group;
    ear.add(new THREE.Mesh(innerGeo, pink));
    pivot.add(ear);
    breathe.add(pivot);
    ears.push(ear);
  }
  const darkMat = new THREE.MeshStandardMaterial({ color: '#2b170c', roughness: 0.55 });
  for (const sg of [-1, 1]) {
    const c = new THREE.CatmullRomCurve3([hit([0.8, 0.28, sg * 0.18]), hit([0.78, 0.2, sg * 0.32]), hit([0.68, 0.26, sg * 0.5])]);
    breathe.add(new THREE.Mesh(new THREE.TubeGeometry(c, 12, 0.0017, 6), darkMat));
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 16, 10), new THREE.MeshStandardMaterial({ color: '#c7726d', roughness: 0.45 }));
  nose.scale.set(0.7, 0.65, 1.15);
  nose.position.copy(hit([1, 0.08, 0], 0.001));
  breathe.add(nose);
  const wp: number[] = [];
  const muzzle: [number, THREE.Vector3][] = [
    [1, hit([0.95, -0.12, 0.3], 0.002)],
    [-1, hit([0.95, -0.12, -0.3], 0.002)],
  ];
  for (const [sg, m] of muzzle) for (let i = 0; i < 4; i++) wp.push(m.x, m.y, m.z, m.x - 0.012 - i * 0.006, m.y + 0.012 - i * 0.008, m.z + sg * (0.07 + i * 0.004));
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
  const whiskers = new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: '#f6f1e8', transparent: true, opacity: 0.85 }));
  whiskers.raycast = () => {};
  breathe.add(whiskers);

  let next = 3 + Math.random() * 4;
  let which = 0;
  let start = -10;
  const tick = (t: number) => {
    const b = Math.sin(t * 1.4);
    breathe.scale.set(1 + b * 0.006, 1 + b * 0.016, 1 + b * 0.01);
    if (t > next) {
      start = t;
      which = Math.random() < 0.5 ? 0 : 1;
      next = t + 4 + Math.random() * 7;
    }
    const k = t - start;
    const tw = k < 0.5 ? Math.sin((k / 0.5) * Math.PI * 3) * Math.exp(-k * 4) * 0.45 : 0;
    ears.forEach((e, i) => {
      e.rotation.x = i === which ? -tw : 0;
    });
  };
  return { cat, tick };
}
