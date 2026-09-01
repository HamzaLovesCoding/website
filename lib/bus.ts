'use client';

/**
 * One-shot signal for "the loader is finished, sections may play their
 * entrance". A DOM event rather than context so any component can listen
 * without the whole tree above it becoming client-side.
 */
const EVT = 'vm:intro';

export const introDone = () => {
  document.documentElement.dataset.intro = 'done';
  window.dispatchEvent(new Event(EVT));
};

const hasIntroed = () =>
  typeof document !== 'undefined' &&
  document.documentElement.dataset.intro === 'done';

/** Runs `cb` once — immediately if the intro already finished. */
export function onIntro(cb: () => void) {
  if (hasIntroed()) {
    cb();
    return () => {};
  }
  const handler = () => cb();
  window.addEventListener(EVT, handler, { once: true });
  return () => window.removeEventListener(EVT, handler);
}
