/**
 * Text splitting for masked reveals.
 *
 * Written by hand rather than pulled from a plugin because the reveals here
 * need a specific DOM shape: an overflow-hidden line box wrapping an inner
 * element that is the only thing transformed. That keeps the clip stable
 * while the child moves, which is what makes a mask reveal read cleanly.
 */

export type SplitResult = {
  /** The moving elements — hand these to GSAP. */
  targets: HTMLElement[];
  /** Restores the original markup. Call on cleanup. */
  revert: () => void;
};

type SplitMode = 'chars' | 'words' | 'lines';

const wrapInner = (text: string, cls: string) => {
  const outer = document.createElement('span');
  outer.className = cls;
  outer.style.display = 'inline-block';
  outer.style.overflow = 'hidden';
  // Descenders sit below the baseline; without the pad/pull they get clipped.
  outer.style.paddingBottom = '0.14em';
  outer.style.marginBottom = '-0.14em';
  outer.style.verticalAlign = 'top';

  const inner = document.createElement('span');
  inner.className = `${cls}__i`;
  inner.style.display = 'inline-block';
  inner.style.willChange = 'transform';
  inner.textContent = text;

  outer.appendChild(inner);
  return { outer, inner };
};

/**
 * Splits an element's text. `lines` measures rendered line boxes by walking
 * word offsets, so it reflows correctly when re-run after a resize.
 */
export function split(el: HTMLElement, mode: SplitMode): SplitResult {
  const original = el.innerHTML;
  const source = el.textContent ?? '';
  const targets: HTMLElement[] = [];

  if (mode === 'lines') {
    // Pass 1: every word becomes a probe we can measure.
    const words = source.split(/\s+/).filter(Boolean);
    el.textContent = '';
    const probes = words.map((w) => {
      const s = document.createElement('span');
      s.style.display = 'inline-block';
      s.textContent = w;
      el.appendChild(s);
      el.appendChild(document.createTextNode(' '));
      return s;
    });

    // Pass 2: group by vertical offset — words sharing a top are one line.
    const lines: string[][] = [];
    let lastTop: number | null = null;
    probes.forEach((p, i) => {
      const top = Math.round(p.offsetTop);
      if (lastTop === null || Math.abs(top - lastTop) > 2) {
        lines.push([]);
        lastTop = top;
      }
      lines[lines.length - 1].push(words[i]);
    });

    // Pass 3: rebuild as masked line boxes.
    el.textContent = '';
    lines.forEach((line) => {
      const { outer, inner } = wrapInner(line.join(' '), 'split-line');
      outer.style.display = 'block';
      inner.style.display = 'block';
      el.appendChild(outer);
      targets.push(inner);
    });
  } else if (mode === 'words') {
    el.textContent = '';
    source.split(/(\s+)/).forEach((chunk) => {
      if (!chunk.trim()) {
        el.appendChild(document.createTextNode(chunk));
        return;
      }
      const { outer, inner } = wrapInner(chunk, 'split-word');
      el.appendChild(outer);
      targets.push(inner);
    });
  } else {
    el.textContent = '';
    Array.from(source).forEach((ch) => {
      if (ch === ' ') {
        el.appendChild(document.createTextNode(' '));
        return;
      }
      const { outer, inner } = wrapInner(ch, 'split-char');
      el.appendChild(outer);
      targets.push(inner);
    });
  }

  // Screen readers would otherwise read the text one fragment at a time.
  el.setAttribute('aria-label', source);
  Array.from(el.children).forEach((c) => c.setAttribute('aria-hidden', 'true'));

  return {
    targets,
    revert: () => {
      el.innerHTML = original;
      el.removeAttribute('aria-label');
    },
  };
}
