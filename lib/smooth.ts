'use client';

import type Lenis from 'lenis';

/**
 * Module-level handle on the Lenis instance.
 *
 * The menu, the preloader and the anchor links all need to drive or freeze
 * scrolling, and threading a ref through the tree for that would mean making
 * half the page a client component for no other reason.
 */
let instance: Lenis | null = null;
let locks = 0;

export const setLenis = (l: Lenis | null) => {
  instance = l;
  locks = 0;
};

export const getLenis = () => instance;

/**
 * Reference-counted so two overlapping consumers (menu open during the
 * preloader, say) can't unlock each other prematurely.
 */
export function lockScroll() {
  locks += 1;
  if (locks === 1) {
    instance?.stop();
    document.body.dataset.locked = 'true';
  }
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    instance?.start();
    delete document.body.dataset.locked;
  }
}

export function scrollTo(target: string | number, offset = 0) {
  if (instance) {
    instance.scrollTo(target, { offset, duration: 1.6 });
    return;
  }
  // Reduced-motion / no-Lenis path.
  const el = typeof target === 'string' ? document.querySelector(target) : null;
  if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
  else if (typeof target === 'number') window.scrollTo(0, target + offset);
}
