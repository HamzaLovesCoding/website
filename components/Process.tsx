'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import { PROCESS } from '@/lib/content';
import s from './Process.module.css';

/**
 * Vertical scroll converted into horizontal travel.
 *
 * The distance is measured from the rail rather than hard-coded, so adding a
 * card changes the pacing automatically instead of breaking the end position.
 */
export default function Process() {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const section = root.current;
    const track = rail.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      if (reduced) {
        // No pin, no translation — the rail just scrolls sideways by hand.
        gsap.set(section, { height: 'auto' });
        gsap.set(`.${s.sticky}`, { position: 'relative', height: 'auto' });
        gsap.set(track, { overflowX: 'auto' });
        return;
      }

      // Measured from the node captured above, not from the ref: ScrollTrigger
      // re-evaluates these on every refresh, including refreshes triggered
      // after this component has unmounted.
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });

      gsap.to(`.${s.barFill}`, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 0.4,
        },
      });

      // Cards drift slightly against the rail — a second, slower plane.
      gsap.utils.toArray<HTMLElement>(`.${s.card}`).forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 34 + i * 5 },
          {
            y: -20,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: () => `+=${distance()}`,
              scrub: 1.1,
            },
          },
        );
      });
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section className={s.section} ref={root} data-ambient="0.55">
      <div className={s.sticky}>
        <div className={s.rail} ref={rail}>
          <div className={s.lead}>
            <span className="u-label u-label--accent">[LABEL] How we work</span>
            <h2 className={s.leadTitle}>
              Five steps, <em>no</em> surprises.
            </h2>
            <p className={s.leadBody}>
              [DESCRIPTION] The same shape every time, whether it is a six-week
              sprint or a two-year platform.
            </p>
          </div>

          {PROCESS.map((p) => (
            <article className={s.card} key={p.index}>
              <span className={s.cardIndex}>{p.index}</span>
              <div>
                <h3 className={s.cardTitle}>{p.title}</h3>
                <p className={s.cardBody}>{p.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={s.progress} aria-hidden="true">
          <span className="u-label">01</span>
          <span className={s.bar}>
            <span className={s.barFill} />
          </span>
          <span className="u-label">{String(PROCESS.length).padStart(2, '0')}</span>
        </div>
      </div>
    </section>
  );
}
