'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from '@/lib/gsap';
import { HINGE, PROGRAM } from '@/lib/content';
import Em from './Em';
import { useReducedMotion } from '@/lib/hooks';
import s from './Expand.module.css';

/**
 * The hinge between the studio statement and the work.
 *
 * A framed plate opens to full bleed while the word behind it slides away,
 * so one section becomes the next rather than ending and being followed.
 */
export default function Expand() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!root.current) return;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(`.${s.frame}`, { clipPath: 'inset(0% 0% 0% 0% round 0px)' });
        gsap.set([`.${s.caption}`, `.${s.tick}`], { opacity: 1 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      });

      tl.fromTo(
        `.${s.frame}`,
        { clipPath: 'inset(30% 34% 30% 34% round 6px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 },
        0,
      )
        // Counter-zoom: the image settles as the frame opens, so the plate
        // reads as revealed rather than stretched.
        .fromTo(
          `.${s.frameMedia}`,
          { scale: 1.45 },
          { scale: 1, ease: 'power2.inOut', duration: 1 },
          0,
        )
        .fromTo(
          `.${s.word}`,
          { yPercent: 18, scale: 1.06 },
          { yPercent: -32, scale: 1, ease: 'none', duration: 1 },
          0,
        )
        .fromTo(
          `.${s.wordSub}`,
          { opacity: 1, y: 0 },
          { opacity: 0, y: -40, ease: 'none', duration: 0.35 },
          0,
        )
        .fromTo(
          [`.${s.caption}`, `.${s.tick}`],
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 },
          0.62,
        );
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section className={s.section} ref={root} data-ambient="0.5">
      <div className={s.sticky}>
        <h2 className={s.word}>{HINGE.word}</h2>

        <div className={s.wordSub} aria-hidden="true">
          <span className="u-label">{HINGE.labelLeft}</span>
          <span className="u-label">{HINGE.labelRight}</span>
        </div>

        <div className={s.frame}>
          <Image
            className={s.frameMedia}
            src={PROGRAM.items[0].image}
            alt=""
            fill
            sizes="100vw"
            quality={84}
            priority={false}
          />
          <div className={s.frameVeil} aria-hidden="true" />
        </div>

        <div className={s.caption}>
          <p className={s.captionTitle}>
            <Em phrase={HINGE.caption} />
          </p>
          <span className="u-label">{HINGE.labelLeft}</span>
        </div>

        <div className={s.tick}>
          <span className="u-label u-label--accent">{HINGE.tick}</span>
        </div>
      </div>
    </section>
  );
}
