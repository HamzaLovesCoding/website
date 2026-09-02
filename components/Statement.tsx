'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { scramble } from '@/lib/scramble';
import { split } from '@/lib/split';
import { useReducedMotion } from '@/lib/hooks';
import { STATEMENT } from '@/lib/content';
import s from './Statement.module.css';

/**
 * The loudest typographic moment on the page.
 *
 * Lines enter from alternating sides at different rates, and one line
 * resolves out of noise — the single deliberate glitch, spent here so the
 * effect stays an event rather than a texture.
 */
export default function Statement() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!root.current) return;

    const ctx = gsap.context(() => {
      if (reduced) return;

      const lines = gsap.utils.toArray<HTMLElement>(`.${s.line}`);
      const reverts: Array<() => void> = [];

      lines.forEach((line, i) => {
        const { targets, revert } = split(line, 'chars');
        reverts.push(revert);

        gsap.set(targets, { yPercent: 120, rotate: i % 2 ? -6 : 6 });

        gsap.to(targets, {
          yPercent: 0,
          rotate: 0,
          duration: 1.4,
          ease: 'expo.out',
          // Alternating direction gives the block its diagonal rhythm.
          stagger: { each: 0.022, from: i % 2 ? 'end' : 'start' },
          scrollTrigger: { trigger: line, start: 'top 88%' },
        });
      });

      // Lines drift apart horizontally as the section passes — the block
      // never sits still long enough to feel like a static banner.
      lines.forEach((line, i) => {
        gsap.fromTo(
          line,
          { xPercent: i % 2 ? 3 : -3 },
          {
            xPercent: i % 2 ? -3 : 3,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          },
        );
      });

      const glitch = root.current!.querySelector<HTMLElement>(`.${s.glitch}`);
      if (glitch) {
        ScrollTrigger.create({
          trigger: glitch,
          start: 'top 85%',
          once: true,
          onEnter: () => scramble(glitch, { duration: 1.8, stagger: 0.6 }),
        });
      }

      return () => reverts.forEach((r) => r());
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section className={s.section} ref={root} data-ambient="0.68">
      <div className={`${s.inner} u-shell`}>
        <p className={`${s.label} u-label u-label--accent`}>{STATEMENT.small}</p>

        <div className={s.lines}>
          {STATEMENT.lines.map((l) => (
            <span className={s.line} key={l}>
              {l}
            </span>
          ))}
        </div>

        <p className={s.glitch} data-text="[DESCRIPTION] Independent since 2016. Forty-one people across two studios, one shared standard for what counts as finished.">
          [DESCRIPTION] Independent since 2016. Forty-one people across two
          studios, one shared standard for what counts as finished.
        </p>
      </div>
    </section>
  );
}
