'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap, EASE } from '@/lib/gsap';
import { onIntro } from '@/lib/bus';
import { useReducedMotion } from '@/lib/hooks';
import { CLIENTS, HERO } from '@/lib/content';
import HeroCanvas from './HeroCanvas';
import Marquee from './Marquee';
import s from './Hero.module.css';

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const reduced = useReducedMotion();

  const handleReady = useCallback((ok: boolean) => setWebgl(ok), []);

  useEffect(() => {
    if (!root.current) return;

    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>('[data-hero-line]');
      const rise = gsap.utils.toArray<HTMLElement>('[data-hero-rise]');

      if (reduced) {
        gsap.set([lines, rise], { clearProps: 'all', opacity: 1, y: 0 });
      } else {
        gsap.set(lines, { yPercent: 118, rotate: 2.5 });
        gsap.set(rise, { opacity: 0, y: 18 });

        // Entrance waits on the loader so the two don't overlap.
        onIntro(() => {
          const tl = gsap.timeline({ defaults: { ease: EASE.out } });

          tl.to(lines, {
            yPercent: 0,
            rotate: 0,
            duration: 1.5,
            stagger: 0.11,
          })
            .to(
              rise,
              { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 },
              '-=1.05',
            );
        });
      }

      // Exit: the headline leaves faster than the canvas behind it, which is
      // what creates the sense of depth between the two planes.
      if (!reduced) {
        gsap.to('[data-hero-parallax]', {
          yPercent: -46,
          opacity: 0,
          filter: 'blur(7px)',
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        });

        gsap.to(`.${s.clients}`, {
          yPercent: -140,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '65% top',
            scrub: 0.6,
          },
        });
      }
    }, root);

    // ctx.revert() already kills the triggers this section created; a global
    // refresh here would also re-resolve every other section's triggers
    // against a scope that is mid-teardown.
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section className={s.hero} ref={root} data-ambient="0.8" id="top">
      {webgl === false ? (
        <div className={s.fallback} aria-hidden="true" />
      ) : (
        <HeroCanvas onReady={handleReady} />
      )}

      <div className={`${s.inner} u-shell`} data-hero-parallax>
        <p className={`${s.eyebrow} u-label`} data-hero-rise>
          {HERO.eyebrow}
        </p>

        <h1 className={`${s.headline} u-display`}>
          {HERO.headline.map((line, i) => (
            <span className="u-mask" key={i}>
              <span style={{ display: 'block' }} data-hero-line>
                {line.text}
                <em>{line.em}</em>
                {line.tail}
              </span>
            </span>
          ))}
        </h1>

        <div className={s.foot}>
          <div className={s.meta}>
            {HERO.meta.map((m) => (
              <div className={s.metaItem} key={m.k} data-hero-rise>
                <span className="u-label">{m.k}</span>
                <span className={s.metaValue}>{m.v}</span>
              </div>
            ))}
          </div>

          <div className={s.cue} data-hero-rise>
            <span className={s.cueLine} aria-hidden="true" />
            <span className="u-label">{HERO.scroll}</span>
          </div>
        </div>
      </div>

      <div className={s.clients}>
        <Marquee duration={44}>
          {CLIENTS.map((c) => (
            <span className={s.client} key={c}>
              {c}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
