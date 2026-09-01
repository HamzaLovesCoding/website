'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import s from './Atmosphere.module.css';

/**
 * The page-wide lighting: three slow-drifting warm masses behind everything,
 * plus the film grain over everything.
 *
 * Intensity is a single CSS custom property. Any section can pull the light
 * toward it by carrying `data-ambient="0.9"` — no wiring, no context.
 */
export default function Atmosphere() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!root.current) return;

    const ctx = gsap.context(() => {
      const blobs = gsap.utils.toArray<HTMLElement>(`.${s.blob}`);

      if (!reduced) {
        // Each mass drifts on its own long, prime-ish cycle so the composite
        // never visibly loops.
        const paths = [
          { x: 14, y: -9, t: 27 },
          { x: -18, y: 12, t: 34 },
          { x: 10, y: 15, t: 41 },
        ];

        blobs.forEach((b, i) => {
          const p = paths[i % paths.length];
          gsap.to(b, {
            xPercent: p.x,
            yPercent: p.y,
            duration: p.t,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
          gsap.to(b, {
            scale: 1.18,
            duration: p.t * 0.62,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        });

        // Parallax: the light sinks slower than the page, so it reads as
        // sitting well behind the content plane.
        ScrollTrigger.create({
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          onUpdate: (self) => {
            gsap.set(root.current, { yPercent: -18 * self.progress });
          },
        });
      }

      // Per-section intensity. Queried off the document directly: inside a
      // gsap.context an unscoped selector resolves against the context's own
      // element, which here is the light layer — it contains no sections.
      document.querySelectorAll<HTMLElement>('[data-ambient]').forEach((section) => {
        const to = parseFloat(section.dataset.ambient ?? '0.5');
        ScrollTrigger.create({
          trigger: section,
          start: 'top 70%',
          end: 'bottom 30%',
          onToggle: (self) => {
            root.current?.style.setProperty(
              '--ambient',
              String(self.isActive ? to : 0.42),
            );
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <>
      <div className={s.ambient} ref={root} aria-hidden="true">
        <div className={`${s.blob} ${s.blobA}`} />
        <div className={`${s.blob} ${s.blobB}`} />
        <div className={`${s.blob} ${s.blobC}`} />
      </div>
      <div className={s.vignette} aria-hidden="true" />
      <div className={s.grain} aria-hidden="true" />
    </>
  );
}
