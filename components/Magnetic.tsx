'use client';

import { cloneElement, useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { usePrecisePointer, useReducedMotion } from '@/lib/hooks';

type Props = {
  children: React.ReactElement<{ ref?: React.Ref<HTMLElement> }>;
  /** How far the element travels toward the pointer, as a fraction of offset. */
  strength?: number;
  /** Activation area beyond the element's own box, in px. */
  radius?: number;
  /** Optional inner element that travels further — the classic label lead. */
  innerSelector?: string;
  innerStrength?: number;
};

/**
 * Pulls its child toward the pointer while the pointer is near it.
 *
 * Clones the child rather than wrapping it in a div so it can be dropped
 * around a button or link without disturbing the layout around it.
 */
export default function Magnetic({
  children,
  strength = 0.32,
  radius = 60,
  innerSelector,
  innerStrength = 0.55,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const precise = usePrecisePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !precise || reduced) return;

    const inner = innerSelector
      ? el.querySelector<HTMLElement>(innerSelector)
      : null;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.85, ease: 'elastic.out(1, 0.55)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.85, ease: 'elastic.out(1, 0.55)' });
    const ixTo = inner && gsap.quickTo(inner, 'x', { duration: 1, ease: 'elastic.out(1, 0.5)' });
    const iyTo = inner && gsap.quickTo(inner, 'y', { duration: 1, ease: 'elastic.out(1, 0.5)' });

    let inside = false;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      const near =
        Math.abs(dx) < r.width / 2 + radius && Math.abs(dy) < r.height / 2 + radius;

      if (near) {
        inside = true;
        xTo(dx * strength);
        yTo(dy * strength);
        ixTo?.(dx * strength * innerStrength);
        iyTo?.(dy * strength * innerStrength);
      } else if (inside) {
        // Only reset once on the way out, so we aren't tweening to 0 every
        // frame the pointer spends elsewhere on the page.
        inside = false;
        xTo(0);
        yTo(0);
        ixTo?.(0);
        iyTo?.(0);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.set([el, inner].filter(Boolean) as HTMLElement[], { x: 0, y: 0 });
    };
  }, [precise, reduced, strength, radius, innerSelector, innerStrength]);

  return cloneElement(children, { ref });
}
