'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import { setLenis } from '@/lib/smooth';

/**
 * Lenis, driven by the GSAP ticker.
 *
 * Running both on their own rAF loops means ScrollTrigger can read a scroll
 * position Lenis is about to change in the same frame, which shows up as
 * jitter on pinned sections. One ticker, one update order, no jitter.
 */
export default function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';

    if (reduced) {
      // Native scrolling only; every ScrollTrigger still fires, they just
      // snap to their end state (see the [data-anim] override in globals).
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      // Long exponential tail — the weighted, slightly heavy feel.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native momentum on touch beats an emulated one; syncTouch fights it.
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
      autoRaf: false,
    });

    setLenis(lenis);
    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    // GSAP's lag smoothing would let Lenis and ScrollTrigger drift apart
    // after a long frame.
    gsap.ticker.lagSmoothing(0);

    // Fonts land after first paint and change every measured height.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      setLenis(null);
    };
  }, [reduced]);

  return null;
}
