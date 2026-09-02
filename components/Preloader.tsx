'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { introDone } from '@/lib/bus';
import { lockScroll, unlockScroll } from '@/lib/smooth';
import { scramble } from '@/lib/scramble';
import { useReducedMotion } from '@/lib/hooks';
import { SITE } from '@/lib/content';
import s from './Preloader.module.css';

/** Per-tab flag: the loader is an introduction, not a toll booth. */
const SEEN = 'vm:seen';

const alreadySeen = () => {
  try {
    return sessionStorage.getItem(SEEN) === '1';
  } catch {
    // Private mode, blocked storage — treat as a first visit.
    return false;
  }
};

const markSeen = () => {
  try {
    sessionStorage.setItem(SEEN, '1');
  } catch {
    /* nothing to do */
  }
};

/**
 * The first moment of the site.
 *
 * It exists to buy the fonts and the first images time to land — a hero that
 * reflows its headline after paint undoes the whole impression — and to make
 * that wait feel authored. It is deliberately short, and it only runs once per
 * tab: on a second visit the hero should just be there.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Reload lands mid-page otherwise, and the loader would lift onto a
    // section that never got its entrance.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    lockScroll();

    const ctx = gsap.context(() => {
      if (reduced || alreadySeen()) {
        setDone(true);
        gsap.set(root.current, { autoAlpha: 0 });
        unlockScroll();
        introDone();
        return;
      }
      markSeen();

      const state = { v: 0 };
      const tl = gsap.timeline();

      tl.to(`.${s.glow}`, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0)
        .to(
          state,
          {
            v: 100,
            duration: 1.45,
            // Not linear: a counter that hesitates and then rushes reads as
            // something actually loading.
            ease: 'power2.inOut',
            onUpdate: () => {
              if (count.current) {
                count.current.textContent = String(Math.round(state.v)).padStart(3, '0');
              }
            },
          },
          0,
        )
        .to(`.${s.barFill}`, { scaleX: 1, duration: 1.45, ease: 'power2.inOut' }, 0);

      if (word.current) tl.add(scramble(word.current, { duration: 1.15 }), 0.2);

      // Exit: the loader lifts as a plate and the counter leaves ahead of it.
      tl.to(`.${s.inner}`, {
        yPercent: -110,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.inOut',
      })
        .to(
          root.current,
          {
            clipPath: 'inset(0 0 100% 0)',
            duration: 1.05,
            ease: 'power4.inOut',
            onStart: () => {
              unlockScroll();
              introDone();
            },
            onComplete: () => setDone(true),
          },
          '-=0.55',
        );
    }, root);

    return () => {
      ctx.revert();
      unlockScroll();
    };
  }, [reduced]);

  if (done) return null;

  return (
    <div
      className={s.root}
      ref={root}
      data-done={done}
      style={{ clipPath: 'inset(0 0 0% 0)' }}
      aria-hidden="true"
      data-preloader
    >
      <div className={s.glow} />
      <div className="u-shell">
        <span className={`${s.label} u-label u-label--accent`}>
          Loading experience
        </span>

        <div className={s.inner}>
          <span className={s.word} ref={word} data-text={SITE.name}>
            {SITE.name}
          </span>
          <span className={s.count}>
            <span ref={count}>000</span>
            <sup>%</sup>
          </span>
        </div>

        <div className={s.bar}>
          <span className={s.barFill} />
        </div>
      </div>
    </div>
  );
}
