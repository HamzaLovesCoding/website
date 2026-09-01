'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import { JOURNAL } from '@/lib/content';
import s from './Journal.module.css';

export default function Journal() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!root.current || reduced) return;
    const ctx = gsap.context(() => {
      gsap.from(`.${s.row}`, {
        yPercent: 30,
        opacity: 0,
        duration: 1.1,
        stagger: 0.09,
        ease: 'expo.out',
        scrollTrigger: { trigger: `.${s.list}`, start: 'top 85%' },
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section className={s.section} ref={root} id="journal" data-ambient="0.4">
      <div className="u-shell">
        <div className="u-head">
          <h2 className="u-title">
            From the <em>journal</em>
          </h2>
          <span className="u-label">[LABEL] Notes & opinions</span>
        </div>

        <div className={s.list}>
          {JOURNAL.map((j) => (
            <a className={s.row} key={j.index} href="#journal" data-cursor="link">
              <span className={s.index}>{j.index}</span>
              <h3 className={s.title}>{j.title}</h3>
              <span className={s.side}>
                <span className="u-label">{j.cat}</span>
                <span className="u-label">{j.date}</span>
              </span>
              <span className={s.arrow} aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
