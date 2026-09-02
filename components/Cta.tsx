'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { split } from '@/lib/split';
import { useReducedMotion } from '@/lib/hooks';
import { JOIN } from '@/lib/content';
import Magnetic from './Magnetic';
import s from './Cta.module.css';

export default function Cta() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!root.current || reduced) return;

    const ctx = gsap.context(() => {
      const reverts: Array<() => void> = [];

      gsap.utils.toArray<HTMLElement>('[data-cta-line]').forEach((line, i) => {
        const { targets, revert } = split(line, 'words');
        reverts.push(revert);
        gsap.set(targets, { yPercent: 115 });
        gsap.to(targets, {
          yPercent: 0,
          duration: 1.3,
          stagger: 0.05,
          ease: 'expo.out',
          delay: i * 0.06,
          scrollTrigger: { trigger: root.current, start: 'top 72%' },
        });
      });

      gsap.from(`.${s.foot}`, {
        opacity: 0,
        y: 30,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: `.${s.foot}`, start: 'top 92%' },
      });

      // The glow swells as the section arrives and settles as it leaves.
      gsap.fromTo(
        `.${s.glow}`,
        { scale: 0.72, opacity: 0.35 },
        {
          scale: 1.06,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: 1,
          },
        },
      );

      return () => reverts.forEach((r) => r());
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section className={s.section} ref={root} id="join" data-ambient="1">
      <div className={s.glow} aria-hidden="true" />

      <div className={`${s.inner} u-shell`}>
        <h2 className={s.headline}>
          <span className="u-mask">
            <span style={{ display: 'block' }} data-cta-line>
              <span className={s.dim}>{JOIN.headline.lead} </span>
              <em>{JOIN.headline.em}</em>
              {JOIN.headline.tail}
            </span>
          </span>
          <span className="u-mask">
            <span style={{ display: 'block' }} data-cta-line>
              {JOIN.second.lead} <em>{JOIN.second.em}</em> {JOIN.second.tail}
            </span>
          </span>
        </h2>

        <div className={s.foot}>
          <p className={s.note}>{JOIN.note}</p>

          <Magnetic strength={0.4} radius={90} innerSelector={`.${s.buttonLabel}`}>
            <a
              className={s.button}
              href={`mailto:${JOIN.email}`}
              data-cursor="link"
            >
              <span className={s.buttonLabel}>{JOIN.button}</span>
              <span className={s.buttonArrow} aria-hidden="true">
                ↗
              </span>
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
