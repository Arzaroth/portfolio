import type { Tree } from '../data/desktop';
import { tile } from './tile';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = matchMedia('(min-width: 761px)');
const GAP = 12;

interface Space {
  el: HTMLElement;
  id: string;
  aliases: string[];
  tree: Tree;
  wins: HTMLElement[];
  order: number[];
  focus: number;
}

function countUp(el: HTMLElement) {
  const to = () => Number(el.dataset.count);
  const from = Number(el.dataset.from ?? 0);
  const fmt = (n: number) => n.toLocaleString('en-US');
  if (reduce) {
    el.textContent = fmt(to());
    return;
  }
  const dur = to() > 100 ? 1600 : 800;
  let t0: number | undefined;
  const step = (t: number) => {
    t0 ??= t;
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = fmt(Math.round(from + (to() - from) * (1 - (1 - k) ** 4)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function initDesktop() {
  const desk = document.getElementById('desk')!;
  const buttons = [...document.querySelectorAll<HTMLAnchorElement>('.ws-btn')];
  const title = document.querySelector<HTMLElement>('.bar-title')!;
  const spaces: Space[] = [...desk.querySelectorAll<HTMLElement>('.ws')].map((el) => {
    const wins = [...el.querySelectorAll<HTMLElement>(':scope > .win')];
    return {
      el,
      id: el.id,
      aliases: (el.dataset.aliases ?? '').split(' ').filter(Boolean),
      tree: JSON.parse(el.dataset.tree!) as Tree,
      wins,
      order: wins.map((_, i) => i),
      focus: 0,
    };
  });
  let cur = -1;

  const find = (hash: string) => spaces.findIndex((s) => s.id === hash || s.aliases.includes(hash));

  function layout(s: Space) {
    if (!wide.matches) {
      for (const w of s.wins) {
        w.style.removeProperty('left');
        w.style.removeProperty('top');
        w.style.removeProperty('width');
        w.style.removeProperty('height');
        w.classList.remove('master');
      }
      return;
    }
    const dpr = devicePixelRatio || 1;
    const snap = (v: number) => Math.round(v * dpr) / dpr;
    const gap = snap(GAP);
    const box = desk.getBoundingClientRect();
    const rects = tile(s.tree, { x: box.left + gap, y: box.top, w: box.width - gap * 2, h: box.height - gap }, gap, snap);
    let slot = 0;
    for (const [pos, r] of rects) {
      const w = s.wins[s.order[pos]];
      Object.assign(w.style, { left: `${r.x - box.left}px`, top: `${r.y - box.top}px`, width: `${r.w}px`, height: `${r.h}px` });
      w.style.setProperty('--i', String(slot++));
      w.classList.toggle('master', pos === 0);
    }
  }

  function setFocus(s: Space, i: number) {
    s.focus = i;
    s.wins.forEach((w, n) => w.classList.toggle('focus', n === i));
    if (s === spaces[cur]) {
      const w = s.wins[i];
      const kind = { browser: 'browser', term: 'terminal', files: 'files', notes: 'notes' }[w.dataset.kind!];
      title.innerHTML = `${kind} <b></b>`;
      title.querySelector('b')!.textContent = w.dataset.label!;
    }
  }

  function promote(s: Space, i: number) {
    const at = s.order.indexOf(i);
    if (at <= 0) return;
    [s.order[0], s.order[at]] = [s.order[at], s.order[0]];
    setFocus(s, i);
    layout(s);
  }

  function record(id: string, mode: 'push' | 'replace') {
    if (location.hash === `#${id}`) return;
    try {
      if (mode === 'replace') history.replaceState(null, '', `#${id}`);
      else history.pushState(null, '', `#${id}`);
    } catch {}
  }

  function go(wanted: string, mode: 'push' | 'replace' = 'push') {
    const at = find(wanted);
    const next = at < 0 ? 0 : at;
    const s = spaces[next];
    if (next === cur) return record(s.id, 'replace');
    const prev = cur;
    cur = next;
    spaces.forEach((sp, i) => {
      sp.el.classList.toggle('on', i === next);
      sp.el.classList.toggle('before', i < next);
      sp.el.classList.toggle('after', i > next);
      sp.el.inert = i !== next;
    });
    buttons.forEach((b, i) => {
      if (i === next) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    buttons[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    layout(s);
    setFocus(s, s.focus);
    s.el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
    if (!wide.matches && prev >= 0) scrollTo({ top: 0 });
    record(s.id, at < 0 ? 'replace' : mode);
  }

  function moveFocus(dir: 'l' | 'r' | 'u' | 'd') {
    const s = spaces[cur];
    const me = s.wins[s.focus].getBoundingClientRect();
    const cx = me.left + me.width / 2;
    const cy = me.top + me.height / 2;
    let best = -1;
    let bd = Infinity;
    s.wins.forEach((w, i) => {
      const r = w.getBoundingClientRect();
      const dx = r.left + r.width / 2 - cx;
      const dy = r.top + r.height / 2 - cy;
      const ok = { l: dx < -10, r: dx > 10, u: dy < -10, d: dy > 10 }[dir];
      if (!ok) return;
      const d = Math.abs(dx) + Math.abs(dy) * (dir === 'l' || dir === 'r' ? 2 : 0.5);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) setFocus(s, best);
    else if (dir === 'l' && cur > 0) go(spaces[cur - 1].id);
    else if (dir === 'r' && cur < spaces.length - 1) go(spaces[cur + 1].id);
  }

  function initTabs(w: HTMLElement, s: Space) {
    const tabs = [...w.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')!)!);
    const select = (n: number, focus = false) => {
      tabs.forEach((t, i) => {
        t.setAttribute('aria-selected', String(i === n));
        t.tabIndex = i === n ? 0 : -1;
        panels[i].hidden = i !== n;
      });
      w.dataset.label = tabs[n].textContent!.trim();
      if (focus) tabs[n].focus();
      setFocus(s, s.wins.indexOf(w));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const by = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
        if (!by) return;
        e.preventDefault();
        select((i + by + tabs.length) % tabs.length, true);
      });
    });
    select(0);
  }

  spaces.forEach((s) => {
    s.wins.forEach((w, i) => {
      if (w.classList.contains('tabbed')) initTabs(w, s);
      w.addEventListener('pointerdown', () => setFocus(s, i));
      w.addEventListener('focusin', () => setFocus(s, i));
      w.querySelector('.chrome')!.addEventListener('dblclick', () => promote(s, i));
      w.querySelector('.promote')!.addEventListener('click', (e) => {
        e.stopPropagation();
        promote(s, i);
      });
    });
  });

  document.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('[data-go]');
    if (!t) return;
    e.preventDefault();
    go(t.dataset.go!);
  });

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if ((e.target as Element).closest('input, textarea, select')) return;
    if ((e.target as Element).closest('[role="tab"]') && e.key.startsWith('Arrow')) return;
    const k = e.key;
    if (/^[1-9]$/.test(k) && spaces[+k - 1]) return go(spaces[+k - 1].id);
    if (!wide.matches) return;
    const dir = ({ h: 'l', ArrowLeft: 'l', l: 'r', ArrowRight: 'r', k: 'u', ArrowUp: 'u', j: 'd', ArrowDown: 'd' } as const)[k as 'h'];
    if (dir) {
      e.preventDefault();
      moveFocus(dir);
    } else if (k === 'm') promote(spaces[cur], spaces[cur].focus);
  });

  let pending: number | undefined;
  addEventListener('resize', () => {
    clearTimeout(pending);
    pending = window.setTimeout(() => spaces.forEach(layout), 80);
  });
  wide.addEventListener('change', () => spaces.forEach(layout));
  const follow = () => go(location.hash.slice(1), 'replace');
  addEventListener('popstate', follow);
  addEventListener('hashchange', follow);

  const clock = document.querySelector<HTMLElement>('.clock')!;
  const tick = () => (clock.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  tick();
  setInterval(tick, 15000);

  spaces.forEach(layout);
  go(location.hash.slice(1) || 'about', 'replace');
  requestAnimationFrame(() => scrollTo(0, 0));
}
