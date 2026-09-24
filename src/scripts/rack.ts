interface Wire {
  dev: HTMLElement;
  port: HTMLElement;
  shade: SVGPathElement;
  line: SVGPathElement;
  packets: SVGPathElement;
}

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = matchMedia('(max-width: 959px)');

function countUp(el: HTMLElement) {
  const to = Number(el.dataset.count);
  const from = Number(el.dataset.from ?? 0);
  const fmt = (n: number) => n.toLocaleString('en-US');
  if (reduce) {
    el.textContent = fmt(to);
    return;
  }
  const dur = to > 100 ? 1800 : 900;
  let t0: number | undefined;
  const step = (t: number) => {
    t0 ??= t;
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = fmt(Math.round(from + (to - from) * (1 - (1 - k) ** 4)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function initRack() {
  const side = document.getElementById('side')!;
  const stage = document.getElementById('stage')!;
  const zone = side.querySelector<HTMLElement>('.rack-zone')!;
  const rack = zone.querySelector<HTMLElement>('.rack')!;
  const bar = zone.querySelector<HTMLElement>('.patchbar')!;
  const devs = [...side.querySelectorAll<HTMLElement>('.dev')];
  const panes = [...document.querySelectorAll<HTMLElement>('.pane')];
  const order = devs.map((d) => d.dataset.to!);
  let current: string | null = null;

  const wires: Wire[] = devs.map((dev) => {
    const g = zone.querySelector(`.wires g[data-to="${dev.dataset.to}"]`)!;
    return {
      dev,
      port: bar.querySelector<HTMLElement>(`[data-to="${dev.dataset.to}"]`)!,
      shade: g.querySelector<SVGPathElement>('.shade')!,
      line: g.querySelector<SVGPathElement>('.w')!,
      packets: g.querySelector<SVGPathElement>('.pk')!,
    };
  });

  const colorOf = (el: Element) => getComputedStyle(el).getPropertyValue('--c').trim() || '#888';

  function layoutWires() {
    if (narrow.matches) return;
    bar.style.height = `${rack.offsetHeight}px`;
    const z = zone.getBoundingClientRect();
    const b = bar.getBoundingClientRect();
    for (const w of wires) {
      const p = w.dev.querySelector('.ports i:last-child')!.getBoundingClientRect();
      const sx = p.left + p.width / 2 - z.left;
      const sy = p.top + p.height / 2 - z.top;
      const ex = b.left + b.width / 2 - z.left;
      w.port.style.top = `${sy - (b.top - z.top)}px`;
      const droop = 16 + Math.min(10, w.dev.offsetHeight * 0.2);
      const d = `M${sx} ${sy} C${sx + 6} ${sy + droop}, ${ex - 6} ${sy + droop}, ${ex} ${sy}`;
      w.shade.setAttribute('d', d);
      w.line.setAttribute('d', d);
      w.packets.setAttribute('d', w.dev.classList.contains('on') ? d : '');
    }
    const on = devs[order.indexOf(current ?? '')];
    if (on) {
      const r = on.getBoundingClientRect();
      const sr = side.getBoundingClientRect();
      side.style.setProperty('--gy', `${(((r.top + r.height / 2 - sr.top) / sr.height) * 100).toFixed(1)}%`);
    }
  }

  function plugIn() {
    if (reduce) return;
    for (const w of wires) {
      w.line.classList.add('plug');
      w.shade.style.opacity = '0';
    }
    setTimeout(() => {
      for (const w of wires) {
        w.shade.style.transition = 'opacity .4s';
        w.shade.style.opacity = '';
      }
    }, 2600);
  }

  function show(wanted: string, opts: { focus?: boolean } = {}) {
    const id = order.includes(wanted) ? wanted : 'about';
    if (id === current) return;
    const prev = current ? document.getElementById(current) : null;
    const next = document.getElementById(id)!;
    current = id;
    for (const d of devs) {
      const on = d.dataset.to === id;
      d.classList.toggle('on', on);
      if (on) d.setAttribute('aria-current', 'page');
      else d.removeAttribute('aria-current');
    }
    side.style.setProperty('--glow', colorOf(next));

    const swap = () => {
      for (const p of panes) {
        p.hidden = p !== next;
        p.classList.remove('leaving');
      }
      next.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
      if (scrollY > stage.offsetTop) {
        scrollTo({ top: narrow.matches ? stage.offsetTop - 60 : 0, behavior: reduce ? 'auto' : 'smooth' });
      }
      if (opts.focus) {
        next.setAttribute('tabindex', '-1');
        next.focus({ preventScroll: true });
      }
      for (const w of wires) {
        const on = w.dev.dataset.to === id;
        w.line.classList.toggle('on', on);
        w.port.classList.toggle('on', on);
      }
      layoutWires();
      if (narrow.matches) {
        devs[order.indexOf(id)].scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      }
    };
    if (prev && !reduce) {
      prev.classList.add('leaving');
      setTimeout(swap, 160);
    } else swap();
    try {
      history.replaceState(null, '', `#${id}`);
    } catch {}
  }

  const step = (by: number) => order[(order.indexOf(current ?? 'about') + by + order.length) % order.length];

  for (const d of devs) {
    d.addEventListener('click', (e) => {
      e.preventDefault();
      show(d.dataset.to!);
    });
    d.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const id = step(e.key === 'ArrowDown' ? 1 : -1);
      devs[order.indexOf(id)].focus();
      show(id);
    });
  }
  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-go]');
    if (!b) return;
    e.preventDefault();
    show(b.dataset.go!, { focus: true });
  });
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/input|textarea|select/i.test((e.target as Element).tagName)) return;
    if (e.key === 'j') show(step(1));
    if (e.key === 'k') show(step(-1));
  });
  addEventListener('resize', layoutWires);
  document.fonts?.ready.then(layoutWires);
  addEventListener('hashchange', () => show(location.hash.slice(1)));

  plugIn();
  show(location.hash.slice(1) || 'about');
  setTimeout(layoutWires, 1200);
  requestAnimationFrame(() => scrollTo(0, 0));
  addEventListener('load', () => {
    scrollTo(0, 0);
    layoutWires();
  });
}
