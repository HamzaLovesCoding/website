'use client';

import { Fragment, useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import { MANIFESTO } from '@/lib/content';
import s from './Manifesto.module.css';

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!root.current) return;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(`.${s.word}`, { color: 'var(--fg)' });
        return;
      }

      const words = gsap.utils.toArray<HTMLElement>(`.${s.word}`);

      // The headline resolves word by word against scroll. Scrubbed rather
      // than triggered, so the visitor is the one doing the revealing.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '58% top',
            scrub: 0.5,
          },
        })
        .fromTo(
          words,
          { color: 'rgba(244,241,236,0.14)', y: 8 },
          {
            color: 'rgba(244,241,236,1)',
            y: 0,
            duration: 1,
            stagger: 0.5,
            ease: 'none',
          },
        );

      // The plate behind moves at roughly half speed and slowly closes in.
      gsap.fromTo(
        `.${s.plate}`,
        { yPercent: -8, scale: 1.16 },
        {
          yPercent: 8,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        },
      );

      gsap.from(`.${s.body}`, {
        opacity: 0,
        y: 26,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: '38% center' },
      });

      // Stat counters. Tweening a proxy object and formatting in onUpdate
      // keeps the DOM write to one text node per frame.
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const raw = el.dataset.count ?? '';
        const num = parseFloat(raw);
        if (Number.isNaN(num)) return;
        const suffix = raw.replace(/^[\d.]+/, '');
        const proxy = { v: 0 };

        gsap.to(proxy, {
          v: num,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
          onUpdate: () => {
            el.textContent =
              (num % 1 ? proxy.v.toFixed(1) : Math.round(proxy.v).toString()) + suffix;
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section className={s.section} ref={root} id="studio" data-ambient="0.4">
      <div className={s.sticky}>
        <div className={s.plate} aria-hidden="true">
          <Image
            className={s.plateImg}
            src="/media/plate-wide.jpg"
            alt=""
            fill
            sizes="100vw"
            quality={82}
          />
        </div>
        <div className={s.plateVeil} aria-hidden="true" />

        <div className={`${s.inner} u-shell`}>
          <p className={`${s.label} u-label u-label--accent`}>{MANIFESTO.label}</p>

          <h2 className={s.heading}>
            {MANIFESTO.heading.split(' ').map((w, i) => (
              <span className={s.word} key={`${w}-${i}`}>
                {w}
                {i < MANIFESTO.heading.split(' ').length - 1 ? ' ' : ''}
              </span>
            ))}
          </h2>

          <p className={s.body}>{MANIFESTO.body}</p>

          <div className={`${s.stats}`}>
            {MANIFESTO.stats.map((st) => (
              <div className={s.stat} key={st.l}>
                <span className={s.statN} data-count={st.n}>
                  0
                </span>
                <span className="u-label">{st.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
