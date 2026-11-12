import { bootDrives, bootServices } from '../../data/room';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export async function runBoot(boot: HTMLElement, label: string, slot: string, alive: () => boolean) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pre = boot.querySelector('pre')!;
  let fast = false;
  const hurry = (e: Event) => {
    if (e instanceof KeyboardEvent && (e.key === 'Escape' || e.key === 'Tab')) return;
    fast = true;
  };
  addEventListener('keydown', hurry);
  boot.addEventListener('pointerdown', hurry);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, fast || reduce ? Math.min(ms, 12) : ms));
  const line = async (html: string, ms = 120) => {
    const d = document.createElement('div');
    d.innerHTML = html || '&nbsp;';
    pre.append(d);
    boot.scrollTop = boot.scrollHeight;
    await sleep(ms);
    return d;
  };
  const ok = '<span class="ok">  OK  </span>';
  const steps = async () => {
    pre.textContent = '';
    boot.hidden = false;
    requestAnimationFrame(() => boot.classList.add('on'));
    await sleep(500);
    if (!alive()) return false;
    await line('<span class="logo">ARZAROTH BIOS 4.2.0</span>', 80);
    await line('<span class="dim">Copyright 2014-2026, the living room</span>', 300);
    await line('');
    await line(`<span class="hi">${esc(label.toUpperCase())}</span>  ${esc(slot)}`, 260);
    await line('Main processor : whatever was on sale', 200);
    const mem = await line('Memory test    : 0K', 0);
    for (let k = 0; k <= 65536 && alive(); k += 2048) {
      mem.textContent = `Memory test    : ${k}K`;
      await sleep(18);
    }
    mem.innerHTML = 'Memory test    : 65536K <span class="ok">OK</span>';
    await sleep(300);
    await line('');
    for (const [k, v] of bootDrives) {
      if (!alive()) return false;
      const d = await line(`Detecting ${k} ...`, 380);
      d.innerHTML += ` <span class="${v === 'None' ? 'dim' : 'hi'}">${esc(v)}</span>`;
    }
    await line('');
    await line('<span class="dim">Press any key to hurry, ESC to back out of the machine</span>', 900);
    if (!alive()) return false;
    pre.textContent = '';
    await sleep(300);
    await line('Booting from disk...', 400);
    await line('Loading Linux linux-arzaroth ...', 350);
    await line('Loading initial ramdisk ...', 500);
    if (!alive()) return false;
    pre.textContent = '';
    for (const u of bootServices) {
      if (!alive()) return false;
      await line(`[${ok}] Started <span class="hi">${esc(u)}</span>.`, 55 + Math.random() * 90);
    }
    await line(`[${ok}] Reached target <span class="hi">Graphical Interface</span>.`, 700);
    return alive();
  };
  try {
    return await steps();
  } finally {
    removeEventListener('keydown', hurry);
    boot.removeEventListener('pointerdown', hurry);
  }
}
