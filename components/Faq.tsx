'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import { FAQ } from '@/lib/content';
import Em from './Em';
import s from './Faq.module.css';

export default function Faq() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!root.current || reduced) return;
    const ctx = gsap.context(() => {
      gsap.from(`.${s.row}`, {
        yPercent: 22,
        opacity: 0,
        duration: 1.1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: `.${s.list}`, start: 'top 85%' },
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section className={s.section} ref={root} id="faq" data-ambient="0.24">
      <div className="u-shell">
        <div className="u-head">
          <h2 className="u-title">
            <Em phrase={FAQ.title} />
          </h2>
          <span className="u-label">{FAQ.label}</span>
        </div>

        <dl className={s.list}>
          {FAQ.items.map((item) => (
            <div className={s.row} key={item.index}>
              <span className={s.index} aria-hidden="true">
                {item.index}
              </span>
              <dt className={s.question}>{item.q}</dt>
              <dd className={s.answer}>{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
