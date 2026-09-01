'use client';

import { gsap } from 'gsap';

const GLYPHS = '▚▞█▓▒░/\\<>=+*—ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Resolves `el` to its own text one character at a time, scrambling the
 * not-yet-resolved tail. Driven by a GSAP tween rather than setInterval so it
 * shares the ticker, respects timeScale, and can be killed with the timeline.
 *
 * @param stagger how far apart, in progress units, adjacent characters resolve.
 *                Higher = the wave of resolution is longer and looser.
 */
export function scramble(
  el: HTMLElement,
  { duration = 1.1, stagger = 0.55, text }: { duration?: number; stagger?: number; text?: string } = {},
) {
  const target = text ?? el.dataset.text ?? el.textContent ?? '';
  const chars = Array.from(target);
  el.dataset.text = target;

  // Reserve the final width up front, otherwise surrounding layout jitters
  // as glyphs of different widths cycle through.
  el.setAttribute('aria-label', target);

  const state = { p: 0 };

  return gsap.to(state, {
    p: 1,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      const p = state.p;
      el.textContent = chars
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          // Each character gets its own slice of the progress range.
          const start = (i / chars.length) * stagger;
          const local = (p - start) / (1 - stagger);
          if (local >= 1) return ch;
          if (local <= 0) return GLYPHS[(i * 7) % GLYPHS.length];
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');
    },
    onComplete: () => {
      el.textContent = target;
    },
  });
}

/**
 * Short, sharp corruption pass — for hover, where a full resolve would be
 * too slow to feel connected to the pointer.
 */
export function glitchOnce(el: HTMLElement, duration = 0.42) {
  const target = el.dataset.text ?? el.textContent ?? '';
  el.dataset.text = target;
  const chars = Array.from(target);
  const state = { p: 0 };

  return gsap.to(state, {
    p: 1,
    duration,
    ease: 'none',
    onUpdate: () => {
      const p = state.p;
      el.textContent = chars
        .map((ch) => {
          if (ch === ' ') return ' ';
          // Corruption peaks in the middle of the tween and clears by the end.
          const intensity = Math.sin(p * Math.PI) * 0.6;
          return Math.random() < intensity
            ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            : ch;
        })
        .join('');
    },
    onComplete: () => {
      el.textContent = target;
    },
  });
}
