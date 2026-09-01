'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  // registerPlugin is idempotent, so this is safe under Fast Refresh.
  gsap.registerPlugin(ScrollTrigger);

  // One shared default so every tween in the project has the same "hand".
  gsap.defaults({ ease: 'expo.out', duration: 1.1 });

  // ScrollTrigger recalculates on resize; on mobile the URL bar collapsing
  // fires resize constantly and causes visible jumps mid-scroll.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** Custom eases — the motion signature of the site. */
export const EASE = {
  /** Long, weighted settle. Section reveals. */
  out: 'expo.out',
  /** Slow start, hard finish. Panels, curtains, the menu. */
  inOut: 'power4.inOut',
  /** Very slight overshoot — used sparingly on small UI. */
  soft: 'power2.out',
} as const;

export { gsap, ScrollTrigger };
