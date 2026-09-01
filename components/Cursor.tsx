'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { usePrecisePointer, useReducedMotion } from '@/lib/hooks';
import s from './Cursor.module.css';

/**
 * Custom cursor with named states.
 *
 * Elements opt in declaratively — `data-cursor="view"` plus an optional
 * `data-cursor-label` — and the listener is delegated from the document, so
 * nodes mounted later (menu links, gallery slides) work without registration.
 */
export default function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  const precise = usePrecisePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!precise) return;

    const ctx = gsap.context(() => {
      // Three followers at different speeds is what sells the depth: the dot
      // is on the pointer, the ring lags slightly, the glow drifts far behind.
      const q = (el: Element | null, speed: number) => ({
        x: gsap.quickTo(el, 'x', { duration: speed, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: speed, ease: 'power3' }),
      });

      const qDot = q(dot.current, reduced ? 0 : 0.12);
      const qRing = q(ring.current, reduced ? 0 : 0.42);
      const qGlow = q(glow.current, reduced ? 0 : 1.1);

      let shown = false;

      const onMove = (e: PointerEvent) => {
        if (!shown) {
          shown = true;
          gsap.to(root.current, { opacity: 1, duration: 0.4 });
        }
        qDot.x(e.clientX); qDot.y(e.clientY);
        qRing.x(e.clientX); qRing.y(e.clientY);
        qGlow.x(e.clientX); qGlow.y(e.clientY);
      };

      const setState = (state: string | null, text?: string) => {
        const active = state === 'view' || state === 'drag';
        if (text && label.current) label.current.textContent = text;

        gsap.to(disc.current, {
          scale: active ? 1 : 0,
          duration: 0.5,
          ease: 'expo.out',
        });
        gsap.to(ring.current, {
          scale: active ? 1.85 : state === 'link' ? 1.5 : 1,
          borderColor:
            active || state === 'link'
              ? 'rgba(244,241,236,0)'
              : 'rgba(244,241,236,0.55)',
          duration: 0.5,
          ease: 'expo.out',
        });
        gsap.to(dot.current, {
          scale: state === 'link' ? 2.4 : active ? 0 : 1,
          duration: 0.4,
          ease: 'expo.out',
        });
        gsap.to(label.current, {
          opacity: active ? 1 : 0,
          duration: active ? 0.35 : 0.15,
          delay: active ? 0.08 : 0,
        });
      };

      // Delegation: walk up from the event target to the nearest opt-in.
      const onOver = (e: PointerEvent) => {
        const target = (e.target as HTMLElement | null)?.closest?.(
          '[data-cursor], a, button',
        ) as HTMLElement | null;

        if (!target) return setState(null);

        const explicit = target.dataset.cursor;
        if (explicit) return setState(explicit, target.dataset.cursorLabel);
        // Bare links and buttons get the light-touch state.
        setState('link');
      };

      const onLeave = () => {
        gsap.to(root.current, { opacity: 0, duration: 0.3 });
        shown = false;
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerover', onOver, { passive: true });
      document.addEventListener('pointerleave', onLeave);

      return () => {
        window.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerover', onOver);
        document.removeEventListener('pointerleave', onLeave);
      };
    });

    return () => ctx.revert();
  }, [precise, reduced]);

  if (!precise) return null;

  return (
    <div className={s.root} ref={root} aria-hidden="true">
      <div className={s.glow} ref={glow} />
      <div className={s.ring} ref={ring}>
        <div className={s.disc} ref={disc} />
        <span className={s.label} ref={label} />
      </div>
      <div className={s.dot} ref={dot} />
    </div>
  );
}
