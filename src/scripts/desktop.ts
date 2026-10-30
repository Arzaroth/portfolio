import type { Tree } from '../data/desktop';
import { HotkeyManager } from '@tanstack/hotkeys';
import { tile } from './tile';
import { createFloating } from './floating';

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
  shown: number;
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
      shown: 1,
    };
  });
  let cur = -1;

  const find = (hash: string) => spaces.findIndex((s) => s.id === hash || s.aliases.includes(hash));

  const progressive = () => wide.matches && !reduce;
  const open = (s: Space) => (progressive() ? s.shown : s.wins.length);
  const steps = document.querySelector<HTMLElement>('.steps')!;
  let floatShown = 1;
  const floating = createFloating(desk, () => {
    spaces[cur].shown = floatShown;
    layout(spaces[cur]);
  });
  const toast = document.querySelector<HTMLElement>('.toast')!;
  let toastTimer: number | undefined;
  function notify(title: string, body: string) {
    toast.querySelector('b')!.textContent = title;
    toast.querySelector('span')!.textContent = body;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast.hidden = true), 6000);
  }

  function layout(s: Space) {
    if (floating.active && s === spaces[cur]) return;
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
    const area = { x: box.left + gap, y: box.top, w: box.width - gap * 2, h: box.height - gap };
    const k = open(s);
    const rects = tile(s.tree, area, gap, snap, (p) => p < k);
    s.order.forEach((wi, pos) => {
      const w = s.wins[wi];
      const r = pos < k ? rects.get(pos)! : tile(s.tree, area, gap, snap, (p) => p < k || p === pos).get(pos)!;
      Object.assign(w.style, { left: `${r.x - box.left}px`, top: `${r.y - box.top}px`, width: `${r.w}px`, height: `${r.h}px` });
      w.style.setProperty('--i', String(Math.min(pos, k)));
      w.classList.toggle('master', pos === 0);
      w.classList.toggle('pane-hidden', pos >= k);
    });
    if (s === spaces[cur]) paintSteps(s);
  }

  function paintSteps(s: Space) {
    steps.hidden = !progressive();
    steps.style.setProperty('--c', buttons[cur].style.getPropertyValue('--c'));
    steps.innerHTML = s.wins.map((_, i) => `<i class="${i < s.shown ? 'on' : ''}"></i>`).join('');
  }

  function stepPanes(by: 1 | -1) {
    const s = spaces[cur];
    const n = s.wins.length;
    if (by > 0 && s.shown < n) {
      s.shown++;
      layout(s);
      setFocus(s, s.order[s.shown - 1]);
    } else if (by < 0 && s.shown > 1) {
      s.shown--;
      if (s.order.indexOf(s.focus) >= s.shown) setFocus(s, s.order[s.shown - 1]);
      layout(s);
    } else if (by > 0 && cur < spaces.length - 1) go(spaces[cur + 1].id, 'push', 'first');
    else if (by < 0 && cur > 0) go(spaces[cur - 1].id, 'push', 'all');
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

  function go(wanted: string, mode: 'push' | 'replace' = 'push', reveal: 'first' | 'all' = 'all') {
    const at = find(wanted);
    const next = at < 0 ? 0 : at;
    const s = spaces[next];
    if (next === cur) return record(s.id, 'replace');
    floating.stop();
    const prev = cur;
    cur = next;
    s.shown = reveal === 'all' ? s.wins.length : 1;
    if (s.order.indexOf(s.focus) >= open(s)) s.focus = s.order[0];
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
      if (w.classList.contains('pane-hidden')) return;
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

  const visibleCli = (w: HTMLElement) =>
    [...w.querySelectorAll<HTMLInputElement>('.cli')].find((c) => !c.closest('.panel[hidden]'));

  const tabbed = new Map<HTMLElement, (by: number) => void>();
  let under: HTMLElement | null = null;

  function initTabs(w: HTMLElement, s: Space) {
    const tabs = [...w.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')!)!);
    const body = w.querySelector<HTMLElement>('.body')!;
    let at = 0;
    const select = (n: number, quiet = false) => {
      at = n;
      tabs.forEach((t, i) => {
        t.setAttribute('aria-selected', String(i === n));
        t.tabIndex = i === n ? 0 : -1;
        panels[i].hidden = i !== n;
      });
      w.dataset.label = tabs[n].textContent!.trim();
      body.scrollTop = w.classList.contains('term') ? body.scrollHeight : 0;
      if (!quiet) setFocus(s, s.wins.indexOf(w));
    };
    const step = (by: number) => {
      const active = document.activeElement;
      const typing = active?.matches('.cli') && w.contains(active);
      const onTab = tabs.includes(active as HTMLButtonElement);
      select((at + by + tabs.length) % tabs.length);
      if (typing) visibleCli(w)?.focus({ preventScroll: true });
      else if (onTab) tabs[at].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const by = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
        if (!by) return;
        e.preventDefault();
        step(by);
      });
    });
    tabbed.set(w, step);
    select(0, true);
  }

  spaces.forEach((s) => {
    s.wins.forEach((w, i) => {
      if (w.classList.contains('tabbed')) initTabs(w, s);
      w.addEventListener('pointerdown', () => setFocus(s, i));
      w.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse' || !wide.matches || s !== spaces[cur]) return;
        under = w;
        setFocus(s, i);
        const cli = visibleCli(w);
        const active = document.activeElement as HTMLElement | null;
        if (cli) cli.focus({ preventScroll: true });
        else if (active?.matches('.cli')) active.blur();
      });
      w.addEventListener('pointerleave', () => {
        if (under === w) under = null;
      });
      w.addEventListener('focusin', () => {
        const pos = s.order.indexOf(i);
        if (s === spaces[cur] && pos >= open(s)) {
          s.shown = pos + 1;
          layout(s);
        }
        setFocus(s, i);
      });
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

  const keys = HotkeyManager.getInstance();
  spaces.slice(0, 10).forEach((s, i) => keys.register({ key: String((i + 1) % 10), ctrl: true }, () => go(s.id)));
  const onWide = (fn: () => void) => () => wide.matches && fn();
  keys.register('H', onWide(() => moveFocus('l')));
  keys.register('J', onWide(() => (progressive() ? stepPanes(1) : moveFocus('d'))));
  keys.register('K', onWide(() => (progressive() ? stepPanes(-1) : moveFocus('u'))));
  keys.register('L', onWide(() => moveFocus('r')));
  keys.register('M', onWide(() => promote(spaces[cur], spaces[cur].focus)));

  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'A'] as const;
  keys.register(
    [...konami],
    (e) => {
      if (!wide.matches) return;
      e.preventDefault();
      const typed = e.target as HTMLInputElement;
      if (typed.matches?.('.cli')) typed.value = typed.value.replace(/b$/i, '');
      if (floating.active) return floating.stop();
      if (reduce) return notify('Floating mode', 'It needs motion, and your system asks for less.');
      const s = spaces[cur];
      floatShown = s.shown;
      s.shown = s.wins.length;
      layout(s);
      floating.start(s.el);
      notify('Floating mode', 'Grab a window by its title bar and throw it. Esc tiles them back.');
    },
    { preventDefault: false, stopPropagation: false, ignoreInputs: false, timeout: 1500 },
  );
  keys.register(
    'Escape',
    (e) => {
      if (!floating.active) return;
      e.preventDefault();
      floating.stop();
      toast.hidden = true;
    },
    { preventDefault: false, stopPropagation: false },
  );

  const cycleTabs = (by: number) => (e: KeyboardEvent) => {
    if (e.defaultPrevented) return;
    const step = under && tabbed.get(under);
    if (!step || !spaces[cur].el.contains(under)) return;
    e.preventDefault();
    step(by);
  };
  const free = { preventDefault: false, stopPropagation: false, ignoreInputs: false } as const;
  keys.register('Tab', cycleTabs(1), free);
  keys.register('Shift+Tab', cycleTabs(-1), free);

  let pull = 0;
  let quiet = 0;
  let nativeAt = 0;
  let lastWheel = 0;
  let stepped = false;
  const scrollsInside = (target: EventTarget | null, dir: number) => {
    for (let el = target instanceof Element ? target : null; el && el !== desk; el = el.parentElement) {
      if (!(el instanceof HTMLElement) || el.scrollHeight <= el.clientHeight + 1) continue;
      const y = getComputedStyle(el).overflowY;
      if (y !== 'auto' && y !== 'scroll') continue;
      if (dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
    return false;
  };
  addEventListener(
    'wheel',
    (e) => {
      if (!progressive() || floating.active || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const dir = Math.sign(e.deltaY);
      if (!dir) return;
      const now = performance.now();
      const sameGesture = now - lastWheel < 150;
      lastWheel = now;
      if (!sameGesture) {
        stepped = false;
        pull = 0;
      }
      if (scrollsInside(e.target, dir)) {
        nativeAt = now;
        return;
      }
      e.preventDefault();
      if (now - nativeAt < 300) {
        nativeAt = now;
        return;
      }
      const notch = e.deltaMode !== 0 || Math.abs(e.deltaY) >= 50;
      if (notch) {
        if (now < quiet) return;
        quiet = now + 120;
        stepPanes(dir > 0 ? 1 : -1);
        return;
      }
      if (stepped) return;
      pull += e.deltaY;
      if (Math.abs(pull) >= 60) {
        stepped = true;
        stepPanes(dir > 0 ? 1 : -1);
      }
    },
    { passive: false },
  );

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
  go(location.hash.slice(1) || 'about', 'replace', 'first');
  requestAnimationFrame(() => scrollTo(0, 0));
}
