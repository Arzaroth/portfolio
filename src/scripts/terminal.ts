export type Outcome = { kind: 'clear' } | { kind: 'out'; cmd: string; html: string; ok: boolean; known?: string };

export const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function run(line: string, programs: string[]): Outcome {
  const cmd = line.trim();
  const [name] = cmd.split(/\s+/);
  if (!cmd) return { kind: 'out', cmd, html: '', ok: true };
  if (name === 'clear') return { kind: 'clear' };
  if (name === 'help') return { kind: 'out', cmd, html: `<span class="o-d">try</span> ${programs.join(', ')}<span class="o-d">, or clear</span>`, ok: true };
  if (name === 'whoami') return { kind: 'out', cmd, html: 'arzaroth', ok: true };
  if (programs.includes(name)) return { kind: 'out', cmd, html: '', ok: true, known: name };
  return { kind: 'out', cmd, html: `zsh: command not found: ${esc(name)}`, ok: false };
}

export function complete(partial: string, programs: string[]) {
  if (!partial) return undefined;
  const hits = programs.filter((p) => p.startsWith(partial));
  return hits.length === 1 ? hits[0] : undefined;
}

const clock = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

function wire(term: HTMLElement) {
  const body = term.closest<HTMLElement>('.body')!;
  const log = term.querySelector<HTMLElement>('.log')!;
  const input = term.querySelector<HTMLInputElement>('.cli')!;
  const status = term.querySelector<HTMLElement>('.rp .st')!;
  const time = term.querySelector<HTMLElement>('.rp .tm')!;
  const templates = new Map([...term.querySelectorAll<HTMLTemplateElement>('template[data-cmd]')].map((t) => [t.dataset.cmd!, t]));
  const programs = [...templates.keys()];
  time.textContent = clock();

  const print = (cmd: string, out: Node | string, ok: boolean) => {
    const line = document.createElement('div');
    line.className = 'prompt';
    line.innerHTML = `<span class="chev">❯</span> <span class="c">${esc(cmd)}</span>`;
    log.append(line);
    if (typeof out !== 'string') log.append(out);
    else if (out) {
      const pre = document.createElement('pre');
      pre.className = ok ? 'out' : 'out err';
      pre.innerHTML = out;
      log.append(pre);
    }
    status.textContent = ok ? '✔' : '127 ✘';
    status.classList.toggle('ok', ok);
    status.classList.toggle('bad', !ok);
    time.textContent = clock();
    body.scrollTop = body.scrollHeight;
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return input.blur();
    if (e.key === 'Tab') {
      const hit = complete(input.value, programs);
      if (hit) {
        e.preventDefault();
        input.value = `${hit} `;
      }
      return;
    }
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      log.replaceChildren();
      return;
    }
    if (e.key !== 'Enter') return;
    const res = run(input.value, programs);
    input.value = '';
    if (res.kind === 'clear') return log.replaceChildren();
    print(res.cmd, res.known ? templates.get(res.known)!.content.cloneNode(true) : res.html, res.ok);
  });

  term.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a, button, input') || getSelection()?.toString()) return;
    input.focus({ preventScroll: true });
  });
}

export function initTerminals() {
  document.querySelectorAll<HTMLElement>('.shell').forEach(wire);
}
