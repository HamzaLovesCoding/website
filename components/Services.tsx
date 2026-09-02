'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from '@/lib/gsap';
import { split } from '@/lib/split';
import { usePrecisePointer, useReducedMotion } from '@/lib/hooks';
import { SERVICES } from '@/lib/content';
import Marquee from './Marquee';
import s from './Services.module.css';

/** How many ghost copies trail the pointer, and how far each one lags. */
const TRAIL = [
  { lag: 0.35, opacity: 1, scale: 1 },
  { lag: 0.62, opacity: 0.45, scale: 0.94 },
  { lag: 0.92, opacity: 0.2, scale: 0.88 },
];

export default function Services() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const precise = usePrecisePointer();
  const reduced = useReducedMotion();

  /* Entrance: titles rise as the list scrolls in. */
  useEffect(() => {
    if (!root.current || reduced) return;

    const ctx = gsap.context(() => {
      const reverts: Array<() => void> = [];

      gsap.utils.toArray<HTMLElement>(`.${s.title}`).forEach((title) => {
        const { targets, revert } = split(title, 'words');
        reverts.push(revert);
        gsap.set(targets, { yPercent: 110 });
        gsap.to(targets, {
          yPercent: 0,
          duration: 1.1,
          stagger: 0.05,
          ease: 'expo.out',
          scrollTrigger: { trigger: title, start: 'top 90%' },
        });
      });

      gsap.utils.toArray<HTMLElement>(`.${s.row}`).forEach((row, i) => {
        gsap.from(row, {
          opacity: 0,
          duration: 0.9,
          ease: 'power2.out',
          delay: i * 0.04,
          scrollTrigger: { trigger: row, start: 'top 92%' },
        });
      });

      return () => reverts.forEach((r) => r());
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  /* Hover: strip fades in, title shifts, the trail chases the pointer. */
  useEffect(() => {
    if (!root.current || !precise || reduced) return;

    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>(`.${s.row}`);
      const teardown: Array<() => void> = [];

      rows.forEach((row) => {
        const strip = row.querySelector<HTMLElement>(`.${s.strip}`);
        const title = row.querySelector<HTMLElement>(`.${s.title}`);
        const trails = gsap.utils.toArray<HTMLElement>(`.${s.trail}`, row);

        // One quickTo per ghost, each with its own duration — that spread is
        // the whole trailing effect.
        const movers = trails.map((t, i) =>
          gsap.quickTo(t, 'x', { duration: TRAIL[i].lag, ease: 'power3' }),
        );

        const onEnter = () => {
          gsap.to(strip, { opacity: 1, duration: 0.6, ease: 'power2.out' });
          gsap.to(title, { x: 18, duration: 0.9, ease: 'expo.out' });
          trails.forEach((t, i) =>
            gsap.to(t, {
              opacity: TRAIL[i].opacity,
              scale: TRAIL[i].scale,
              duration: 0.6,
              delay: i * 0.04,
              ease: 'expo.out',
            }),
          );
        };

        const onLeave = () => {
          gsap.to(strip, { opacity: 0, duration: 0.45 });
          gsap.to(title, { x: 0, duration: 0.9, ease: 'expo.out' });
          gsap.to(trails, { opacity: 0, scale: 0.8, duration: 0.4, stagger: 0.03 });
        };

        const onMove = (e: PointerEvent) => {
          const r = row.getBoundingClientRect();
          movers.forEach((m) => m(e.clientX - r.left));
        };

        row.addEventListener('pointerenter', onEnter);
        row.addEventListener('pointerleave', onLeave);
        row.addEventListener('pointermove', onMove);

        teardown.push(() => {
          row.removeEventListener('pointerenter', onEnter);
          row.removeEventListener('pointerleave', onLeave);
          row.removeEventListener('pointermove', onMove);
        });
      });

      return () => teardown.forEach((fn) => fn());
    }, root);

    return () => ctx.revert();
  }, [precise, reduced]);

  return (
    <section className={s.section} ref={root} id="services" data-ambient="0.3">
      <div className="u-shell">
        <div className="u-head">
          <h2 className="u-title">
            All the ways we <em>move</em> brands
          </h2>
          <span className="u-label">[LABEL] Capabilities</span>
        </div>

        <p className={s.intro}>
          [DESCRIPTION] Four practices, one team. Most projects use more than
          one — the handoffs are where the work usually goes wrong, so we
          removed them.
        </p>

        <div className={s.list}>
          {SERVICES.map((svc, i) => (
            <div
              className={s.row}
              key={svc.index}
              data-on={active === i}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
            >
              <div className={s.strip} aria-hidden="true">
                <Marquee duration={22} reactive={false} hardEdges>
                  {Array.from({ length: 4 }).map((_, k) => (
                    <span className={s.stripText} key={k}>
                      {svc.marquee}
                      <span className={s.star}>✳</span>
                    </span>
                  ))}
                </Marquee>
              </div>

              {TRAIL.map((t, k) => (
                <div className={s.trail} key={k} aria-hidden="true">
                  <Image
                    className={s.trailImg}
                    src={svc.image}
                    alt=""
                    width={360}
                    height={450}
                    sizes="11rem"
                  />
                </div>
              ))}

              <button className={s.trigger} type="button" data-cursor="link">
                <span className={s.index}>{svc.index}</span>
                <span className={`${s.title} u-display`}>{svc.title}</span>
                <span className={s.tags}>
                  {svc.tags.map((t) => (
                    <span className={s.tag} key={t}>
                      {t}
                    </span>
                  ))}
                </span>
                <span className={s.plus} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
