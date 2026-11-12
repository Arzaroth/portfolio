import * as THREE from 'three';
import { cardOf, colors, discs, glyphLines, type Face, type Server, type Tape } from '../../data/room';

export const U = 0.04445;
export const FACE_W = 0.4826;
export const FACE_Z = 0.461;
export const PX = 1536 / FACE_W;
export const FACES: Record<Face, [string, string]> = {
  black: ['#202327', '#16181b'],
  silver: ['#b9bdc3', '#9ea3aa'],
  white: ['#e4e6e5', '#cdd0cf'],
  beige: ['#d3c7a6', '#bcae88'],
};
const TAPES: Record<Tape, [string, string]> = {
  red: ['#d6343c', '#b0212a'],
  blue: ['#2c5fbd', '#183f88'],
  green: ['#26905a', '#155d34'],
  black: ['#3a3d42', '#1c1d20'],
};
export const PORT_X = (i: number) => 560 + i * 36 + Math.floor(i / 8) * 26;

type Ctx = CanvasRenderingContext2D;

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('no 2d canvas');
  return ctx;
};

function finish(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

const paint = (w: number, h: number, draw: (x: Ctx, w: number, h: number) => void, repeat?: [number, number]) => {
  const x = canvas(w, h);
  draw(x, w, h);
  return finish(x.canvas, repeat);
};

function tape(ctx: Ctx, x: number, y: number, h: number, text: string, col: Tape) {
  ctx.save();
  ctx.font = `800 ${h * 0.6}px Archivo`;
  ctx.fontStretch = 'condensed';
  ctx.letterSpacing = `${h * 0.07}px`;
  const T = text.toUpperCase();
  const w = ctx.measureText(T).width + h * 0.8;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, TAPES[col][0]);
  g.addColorStop(1, TAPES[col][1]);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(x + 2, y + 3, w, h);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h * 0.08);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.fillRect(x, y + 1, w, h * 0.18);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.fillText(T, x + h * 0.4, y + h * 0.54 + 2);
  ctx.fillStyle = 'rgba(255,255,255,.93)';
  ctx.fillText(T, x + h * 0.4, y + h * 0.54);
  ctx.restore();
  return w;
}

export function faceTexture(s: Server) {
  const n = s.height;
  const W = 1536;
  const H = Math.round(n * U * PX);
  const ctx = canvas(W, H);
  const [c0, c1] = FACES[s.face];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const dark = s.face === 'black';
  ctx.fillStyle = dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.35)';
  ctx.fillRect(0, 0, W, 2);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(0, H - 3, W, 3);
  const ear = 70;
  ctx.fillStyle = dark ? '#15171a' : 'rgba(0,0,0,.12)';
  ctx.fillRect(0, 0, ear, H);
  ctx.fillRect(W - ear, 0, ear, H);
  for (let i = 0; i < n; i++)
    for (const x of [ear / 2, W - ear / 2]) {
      const y = ((i + 0.5) * H) / n;
      ctx.fillStyle = '#0c0d0f';
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#5b6066';
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, 7);
      ctx.fill();
      ctx.strokeStyle = '#25282c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + 6, y);
      ctx.stroke();
    }
  const vent = (x0: number, x1: number, y0: number, y1: number) => {
    ctx.fillStyle = dark ? '#0b0c0e' : 'rgba(0,0,0,.45)';
    for (let y = y0; y < y1 - 8; y += 14)
      for (let x = x0; x < x1 - 30; x += 40) {
        ctx.beginPath();
        ctx.roundRect(x, y, 30, 6, 3);
        ctx.fill();
      }
  };
  const th = Math.min(68, H * 0.56);
  const ty = (Math.min(H, 118) - th) / 2;
  const tw = s.label && s.tape ? tape(ctx, ear + 40, s.front === 'ups' ? 26 : ty, th, s.label, s.tape) : 0;
  const L = ear + 40 + tw + 40;
  const R = W - ear - 170;
  if (s.front === 'vent') vent(L, R, 22, H - 18);
  if (s.front === 'ports') {
    for (let i = 0; i < 24; i++) {
      const x = PORT_X(i);
      ctx.fillStyle = '#060708';
      ctx.fillRect(x, 54, 28, 26);
      ctx.fillStyle = '#2f3237';
      ctx.fillRect(x + 7, 80, 14, 5);
      ctx.fillStyle = '#9aa0a8';
      ctx.font = '600 15px Archivo';
      ctx.fillText(String(i + 1), x + 6, 112);
    }
    ctx.fillStyle = '#060708';
    for (let i = 0; i < 2; i++) ctx.fillRect(PORT_X(23) + 70 + i * 60, 50, 44, 34);
  }
  if (s.front === 'brush') {
    ctx.fillStyle = '#08090a';
    ctx.beginPath();
    ctx.roundRect(ear + 60, H * 0.32, W - 2 * ear - 120, H * 0.36, H * 0.18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,74,80,.9)';
    ctx.lineWidth = 1.5;
    for (let x = ear + 70; x < W - ear - 70; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, H * 0.34);
      ctx.lineTo(x + 2, H * 0.49);
      ctx.moveTo(x + 1, H * 0.66);
      ctx.lineTo(x - 1, H * 0.51);
      ctx.stroke();
    }
  }
  if (s.front === 'bays' || s.front === 'beige') {
    const beige = s.front === 'beige';
    const bayW = 150;
    const gap = 14;
    const cols = Math.floor((R - L) / (bayW + gap));
    const rows = Math.max(1, n - (beige ? 1 : 0));
    const bh = (H - 30) / rows - 10;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = L + c * (bayW + gap);
        const y = 15 + r * (bh + 10);
        ctx.fillStyle = beige ? '#b3a682' : dark ? '#2c3035' : 'rgba(0,0,0,.14)';
        ctx.beginPath();
        ctx.roundRect(x, y, bayW, bh, 6);
        ctx.fill();
        ctx.fillStyle = beige ? '#8e8262' : '#0d0e10';
        for (let k = 0; k < 6; k++) ctx.fillRect(x + 14 + k * 20, y + bh * 0.3, 8, bh * 0.4);
      }
    if (beige) {
      ctx.font = '700 30px Archivo';
      ctx.fillStyle = '#6b5f43';
      ctx.fillText('TURBO', R + 10, H - 30);
    }
  }
  if (s.front === 'discs') {
    const bh = (H - 40) / discs.length;
    discs.forEach((disc, i) => {
      const y = 20 + i * bh;
      ctx.fillStyle = '#0d0e10';
      ctx.beginPath();
      ctx.roundRect(L, y + 6, R - L, bh - 12, 6);
      ctx.fill();
      ctx.fillStyle = '#2a2d32';
      ctx.fillRect(L + 12, y + bh / 2 - 3, R - L - 220, 6);
      ctx.font = '600 28px Archivo';
      ctx.fillStyle = '#9aa0a8';
      ctx.textBaseline = 'middle';
      ctx.fillText(disc, R - 190, y + bh / 2);
    });
  }
  if (s.front === 'glyph') {
    const cx = L + 140;
    const cy = H / 2;
    const r = H * 0.36;
    ctx.strokeStyle = '#c9a24c';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0.35, Math.PI * 2 - 0.1);
    ctx.stroke();
    ctx.fillStyle = '#c9a24c';
    ctx.beginPath();
    ctx.ellipse(cx + r * Math.cos(0.18), cy + r * Math.sin(0.18) + 4, 18, 11, 1.2, 0, 7);
    ctx.fill();
    ctx.font = `800 ${H * 0.22}px Archivo`;
    ctx.textBaseline = 'middle';
    ctx.fillText(`${glyphLines.last.toLocaleString('en-US')} LINES`, cx + r + 60, cy - H * 0.12);
    ctx.font = `500 ${H * 0.1}px Archivo`;
    ctx.fillStyle = '#7c6a40';
    ctx.fillText(`FROM ${glyphLines.first}. SAME GLYPH.`, cx + r + 62, cy + H * 0.16);
    vent(R - 300, R, 22, H - 18);
  }
  if (s.front === 'sealed') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(L, 8, R - L, H - 16);
    ctx.clip();
    for (let x = L - 100; x < R; x += 60) {
      ctx.fillStyle = '#f2c230';
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + 30, H);
      ctx.lineTo(x + 30 + H, 0);
      ctx.lineTo(x + H, 0);
      ctx.fill();
    }
    ctx.restore();
  }
  if (s.front === 'ups') {
    ctx.fillStyle = '#0d1a12';
    ctx.beginPath();
    ctx.roundRect(L + 40, H * 0.22, 380, H * 0.34, 8);
    ctx.fill();
    ctx.font = `600 ${H * 0.09}px Archivo`;
    ctx.fillStyle = '#7dff9e';
    ctx.textBaseline = 'middle';
    ctx.fillText('ON LINE', L + 70, H * 0.33);
    ctx.fillText('21 SERVICES', L + 70, H * 0.46);
    vent(L + 40, R, H * 0.66, H - 20);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#2d3136';
      ctx.beginPath();
      ctx.arc(L + 520 + i * 70, H * 0.38, 22, 0, 7);
      ctx.fill();
    }
  }
  if (s.front !== 'brush' && s.front !== 'ports') {
    ctx.fillStyle = dark ? '#33373c' : 'rgba(0,0,0,.25)';
    ctx.beginPath();
    ctx.arc(W - ear - 60, H / 2, 16, 0, 7);
    ctx.fill();
  }
  return finish(ctx.canvas);
}

export const woodTexture = () =>
  paint(
    1024,
    1024,
    (x) => {
      const tones = ['#7a5230', '#6b4728', '#83603a', '#734d2c', '#8a633d'];
      const pw = 1024 / 6;
      for (let i = 0; i < 6; i++) {
        let y = -Math.random() * 400;
        while (y < 1024) {
          const L = 300 + Math.random() * 500;
          x.fillStyle = tones[(Math.random() * tones.length) | 0];
          x.fillRect(i * pw, y, pw, L);
          for (let k = 0; k < 40; k++) {
            x.strokeStyle = `rgba(30,15,5,${Math.random() * 0.15})`;
            x.lineWidth = Math.random() * 2;
            const gx = i * pw + Math.random() * pw;
            x.beginPath();
            x.moveTo(gx, y);
            x.bezierCurveTo(gx + 6, y + L / 3, gx - 6, y + (L * 2) / 3, gx, y + L);
            x.stroke();
          }
          x.fillStyle = 'rgba(20,10,4,.55)';
          x.fillRect(i * pw, y, pw, 3);
          y += L;
        }
        x.fillStyle = 'rgba(20,10,4,.6)';
        x.fillRect(i * pw, 0, 3, 1024);
      }
    },
    [3, 3],
  );

export const plasterTexture = () =>
  paint(
    512,
    512,
    (x) => {
      x.fillStyle = '#3a6560';
      x.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 9000; i++) {
        x.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.05})`;
        const r = Math.random() * 6;
        x.fillRect(Math.random() * 512, Math.random() * 512, r, r);
      }
    },
    [4, 2],
  );

export const skyTexture = (day: boolean) =>
  paint(512, 420, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, day ? '#7fb2e6' : '#060b1f');
    g.addColorStop(1, day ? '#d9ecf7' : '#1b2b4a');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    if (day) {
      for (let i = 0; i < 6; i++) {
        x.fillStyle = 'rgba(255,255,255,.75)';
        const cx = Math.random() * w;
        const cy = 40 + Math.random() * 180;
        for (let k = 0; k < 6; k++) {
          x.beginPath();
          x.ellipse(cx + k * 18 - 45, cy + Math.sin(k) * 6, 30, 16, 0, 0, 7);
          x.fill();
        }
      }
    } else {
      for (let i = 0; i < 140; i++) {
        x.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`;
        x.fillRect(Math.random() * w, Math.random() * h * 0.75, 1.5, 1.5);
      }
      x.fillStyle = '#f4f1dc';
      x.beginPath();
      x.arc(390, 90, 30, 0, 7);
      x.fill();
      x.fillStyle = '#060b1f';
      x.beginPath();
      x.arc(378, 82, 27, 0, 7);
      x.fill();
    }
    x.fillStyle = day ? '#8fa3ae' : '#0c1220';
    let bx = 0;
    while (bx < w) {
      const bw = 30 + Math.random() * 60;
      const bh = 40 + Math.random() * 110;
      x.fillRect(bx, h - bh, bw, bh);
      if (!day) {
        x.fillStyle = '#ffcf7a';
        for (let k = 0; k < 6; k++) if (Math.random() < 0.5) x.fillRect(bx + 6 + Math.random() * (bw - 12), h - bh + 10 + Math.random() * (bh - 20), 4, 5);
        x.fillStyle = '#0c1220';
      }
      bx += bw + 4;
    }
  });

export const noteTexture = () =>
  paint(256, 256, (x, w, h) => {
    x.fillStyle = '#ffe36e';
    x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,.06)';
    x.fillRect(0, 0, w, 40);
    x.fillStyle = '#26324a';
    x.textAlign = 'center';
    x.font = '700 50px Caveat, cursive';
    x.fillText('↑↑↓↓', w / 2, 98);
    x.fillText('←→←→', w / 2, 150);
    x.fillText('B A', w / 2, 204);
  });

function wrap(x: Ctx, text: string, maxW: number) {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w;
    if (x.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

const icons = new Map<string, HTMLImageElement>();

export function monitor() {
  const x = canvas(1024, 600);
  const tex = finish(x.canvas);
  const w = x.canvas.width;
  const h = x.canvas.height;
  const draw = (id: string | null) => {
    const card = id ? cardOf(id) : null;
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, card ? (colors[card.id] ?? '#1d2b33') : '#1d2b33');
    g.addColorStop(1, '#0d1013');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,.45)';
    x.fillRect(0, 0, w, 28);
    x.font = '600 15px Archivo';
    x.fillStyle = 'rgba(255,255,255,.75)';
    x.textBaseline = 'middle';
    x.fillText(card ? card.name : 'arzaroth', 16, 14);
    x.textAlign = 'right';
    x.fillText(new Date().toTimeString().slice(0, 5), w - 16, 14);
    x.textAlign = 'left';
    if (!card) {
      x.font = '400 104px Gloock, Georgia, serif';
      x.fillStyle = 'rgba(255,255,255,.9)';
      x.fillText('Arzaroth', 70, 290);
      x.font = '400 24px Archivo';
      x.fillStyle = 'rgba(255,255,255,.55)';
      x.fillText('Pull a server out and it opens here.', 74, 368);
      tex.needsUpdate = true;
      return;
    }
    x.fillStyle = 'rgba(250,250,248,.96)';
    x.beginPath();
    x.roundRect(46, 58, w - 92, h - 100, 14);
    x.fill();
    x.fillStyle = '#e8e8e6';
    x.beginPath();
    x.roundRect(46, 58, w - 92, 34, [14, 14, 0, 0]);
    x.fill();
    ['#ee6a5f', '#f5bd4f', '#61c454'].forEach((c, i) => {
      x.fillStyle = c;
      x.beginPath();
      x.arc(70 + i * 22, 75, 6.5, 0, 7);
      x.fill();
    });
    let tx = 84;
    if (card.icon) {
      let img = icons.get(card.icon);
      if (!img) {
        img = new Image();
        img.src = card.icon;
        icons.set(card.icon, img);
      }
      if (img.complete && img.naturalWidth) {
        x.save();
        x.beginPath();
        x.roundRect(84, 120, 112, 112, 26);
        x.clip();
        x.drawImage(img, 84, 120, 112, 112);
        x.restore();
      } else img.addEventListener('load', () => draw(id), { once: true });
      tx = 222;
    }
    x.fillStyle = '#16181b';
    x.font = '800 50px Archivo';
    x.fillText(card.name, tx, 160, w - tx - 70);
    if (card.sub) {
      x.font = '500 20px Archivo';
      x.fillStyle = '#5d636a';
      x.fillText(card.sub, tx + 2, 202, w - tx - 70);
    }
    x.font = '400 22px Archivo';
    x.fillStyle = '#2a2d31';
    let y = 274;
    for (const l of wrap(x, card.paragraphs[0] ?? card.sub ?? '', w - 180).slice(0, 6)) {
      x.fillText(l, 86, y);
      y += 32;
    }
    y += 8;
    x.font = '500 18px Archivo';
    x.fillStyle = '#4a5057';
    for (const r of (card.rows ?? []).slice(0, Math.max(0, Math.floor((h - 70 - y) / 26)))) {
      x.fillText(r.aside ? `${r.title}   ${r.aside}` : r.title, 86, y);
      y += 26;
    }
    const links = card.links ?? [];
    if (links.length && y < h - 90) {
      let bx = 86;
      y += 14;
      x.font = '600 18px Archivo';
      links.forEach((l, i) => {
        const bw = x.measureText(l.label).width + 36;
        x.fillStyle = i === 0 ? '#ffb45e' : '#e3e4e2';
        x.beginPath();
        x.roundRect(bx, y - 20, bw, 40, 20);
        x.fill();
        x.fillStyle = '#1d1408';
        x.fillText(l.label, bx + 18, y);
        bx += bw + 10;
      });
    }
    tex.needsUpdate = true;
  };
  draw(null);
  return { tex, draw };
}
