export interface Body {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  a: number;
  va: number;
  held: boolean;
}

export const GRAVITY = 2200;
const BOUNCE = 0.5;
const FRICTION = 0.9;
const TILT = 14;

export function step(bodies: Body[], dt: number, width: number, height: number) {
  for (const b of bodies) {
    if (b.held) continue;
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.a = Math.max(-TILT, Math.min(TILT, b.a + b.va * dt));
    if (b.x < 0) {
      b.x = 0;
      b.vx = Math.abs(b.vx) * BOUNCE;
      b.va = -b.va * BOUNCE;
    } else if (b.x + b.w > width) {
      b.x = width - b.w;
      b.vx = -Math.abs(b.vx) * BOUNCE;
      b.va = -b.va * BOUNCE;
    }
    if (b.y < 0) {
      b.y = 0;
      b.vy = Math.abs(b.vy) * BOUNCE;
    } else if (b.y + b.h > height) {
      b.y = height - b.h;
      b.vy = -Math.abs(b.vy) * BOUNCE;
      b.vx *= FRICTION;
      b.va = b.va * 0.8 - b.a * 30 * dt;
      b.a *= 0.8;
      if (Math.abs(b.vy) < 160) b.vy = 0;
    }
  }
}

export function burst(rects: { x: number; y: number; w: number; h: number }[], width: number, height: number, rand = Math.random): Body[] {
  return rects.map((r) => {
    const w = Math.min(r.w, Math.max(320, width * 0.32));
    const h = Math.min(r.h, Math.max(240, height * 0.42));
    const x = r.x + (r.w - w) / 2;
    const y = r.y + (r.h - h) / 2;
    const dx = x + w / 2 - width / 2;
    return {
      x,
      y,
      w,
      h,
      vx: Math.sign(dx || rand() - 0.5) * (300 + rand() * 900),
      vy: -(700 + rand() * 900),
      a: 0,
      va: (rand() - 0.5) * 240,
      held: false,
    };
  });
}

export function createFloating(desk: HTMLElement, onStop: () => void) {
  let bodies: Body[] = [];
  let wins: HTMLElement[] = [];
  let frame = 0;
  let last = 0;
  let z = 10;
  let off: (() => void)[] = [];

  const paint = () =>
    bodies.forEach((b, i) => {
      Object.assign(wins[i].style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px`, rotate: `${b.a}deg` });
    });

  const tick = (t: number) => {
    const dt = Math.min(0.033, (t - (last || t)) / 1000);
    last = t;
    step(bodies, dt, desk.clientWidth, desk.clientHeight);
    paint();
    frame = requestAnimationFrame(tick);
  };

  function grab(i: number, e: PointerEvent) {
    if (e.button !== 0) return;
    const b = bodies[i];
    const chrome = e.currentTarget as HTMLElement;
    chrome.setPointerCapture(e.pointerId);
    b.held = true;
    wins[i].style.zIndex = String(++z);
    let px = e.clientX;
    let py = e.clientY;
    let pt = performance.now();
    const move = (m: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(1, now - pt) / 1000;
      const cap = (v: number) => Math.max(-3000, Math.min(3000, v));
      b.vx = cap((m.clientX - px) / dt);
      b.vy = cap((m.clientY - py) / dt);
      b.x += m.clientX - px;
      b.y += m.clientY - py;
      px = m.clientX;
      py = m.clientY;
      pt = now;
    };
    const drop = () => {
      b.held = false;
      chrome.removeEventListener('pointermove', move);
      chrome.removeEventListener('pointerup', drop);
      chrome.removeEventListener('pointercancel', drop);
    };
    chrome.addEventListener('pointermove', move);
    chrome.addEventListener('pointerup', drop);
    chrome.addEventListener('pointercancel', drop);
  }

  return {
    get active() {
      return bodies.length > 0;
    },
    start(ws: HTMLElement) {
      wins = [...ws.querySelectorAll<HTMLElement>(':scope > .win')];
      bodies = burst(
        wins.map((w) => ({ x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight })),
        desk.clientWidth,
        desk.clientHeight,
      );
      ws.classList.add('floating');
      document.documentElement.classList.add('party');
      off = wins.map((w, i) => {
        const chrome = w.querySelector<HTMLElement>('.chrome')!;
        const down = (e: PointerEvent) => grab(i, e);
        chrome.addEventListener('pointerdown', down);
        return () => chrome.removeEventListener('pointerdown', down);
      });
      last = 0;
      frame = requestAnimationFrame(tick);
    },
    stop() {
      if (!bodies.length) return;
      cancelAnimationFrame(frame);
      off.forEach((f) => f());
      const ws = wins[0]?.closest('.ws');
      ws?.classList.remove('floating');
      document.documentElement.classList.remove('party');
      wins.forEach((w) => {
        w.style.rotate = '';
        w.style.zIndex = '';
      });
      bodies = [];
      wins = [];
      onStop();
    },
  };
}
