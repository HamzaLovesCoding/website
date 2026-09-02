'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { glitchOnce } from '@/lib/scramble';
import { onIntro } from '@/lib/bus';
import { scrollTo } from '@/lib/smooth';
import { useReducedMotion } from '@/lib/hooks';
import { JOIN, NAV, SITE } from '@/lib/content';
import Magnetic from './Magnetic';
import s from './Header.module.css';

type Props = {
  open: boolean;
  onToggle: () => void;
};

export default function Header({ open, onToggle }: Props) {
  const root = useRef<HTMLElement>(null);
  const mark = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!root.current) return;

    const ctx = gsap.context(() => {
      if (!reduced) {
        gsap.set(root.current, { yPercent: -110, opacity: 0 });
        onIntro(() => {
          gsap.to(root.current, {
            yPercent: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'expo.out',
          });
        });
      }

      // Hide on the way down, bring it back the moment the visitor scrolls
      // up — the header should never be something you have to scroll to find.
      // This runs under reduced motion too (instantly): a permanently fixed
      // bar overlapping the headings underneath it is worse than a cut.
      let hidden = false;
      ScrollTrigger.create({
        start: 'top -80',
        end: 'max',
        onUpdate: (self) => {
          if (document.documentElement.dataset.menu === 'open') return;
          const down = self.direction === 1;
          if (down === hidden) return;
          hidden = down;
          gsap.to(root.current, {
            yPercent: down ? -130 : 0,
            duration: reduced ? 0 : 0.65,
            ease: 'power3.out',
            overwrite: true,
          });
        },
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  // Bars morph into a cross. Written as a timeline rather than a CSS class
  // swap so the two bars can cross at slightly different times.
  useEffect(() => {
    const bars = root.current?.querySelectorAll<HTMLElement>('[data-burger] span');
    if (!bars || bars.length < 2) return;

    const d = reduced ? 0 : 0.5;
    gsap.to(bars[0], {
      y: open ? 4.5 : 0,
      rotate: open ? 45 : 0,
      duration: d,
      ease: 'power4.inOut',
    });
    gsap.to(bars[1], {
      y: open ? -4.5 : 0,
      rotate: open ? -45 : 0,
      width: open ? '100%' : '62%',
      duration: d,
      ease: 'power4.inOut',
      delay: reduced ? 0 : 0.04,
    });
  }, [open, reduced]);

  // The wordmark corrupts briefly on hover — one small nod to the glitch
  // language used at full scale further down the page.
  useEffect(() => {
    const el = mark.current;
    if (!el || reduced) return;
    const target = el.querySelector<HTMLElement>('[data-glitch]');
    if (!target) return;
    const onEnter = () => glitchOnce(target, 0.4);
    el.addEventListener('pointerenter', onEnter);
    return () => el.removeEventListener('pointerenter', onEnter);
  }, [reduced]);

  const jump = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    scrollTo(href);
  };

  return (
    <header
      className={`${s.header} u-shell`}
      ref={root}
      data-open={open}
    >
      <a
        className={s.mark}
        href="#top"
        ref={mark}
        onClick={(e) => jump(e, '#top')}
        aria-label={`${SITE.name} — home`}
      >
        <span data-glitch>{SITE.markLead}</span>
        <span className={s.markSup}>{SITE.markSup}</span>
      </a>

      <nav className={s.nav} aria-label="Primary">
        {NAV.slice(0, 4).map((n) => (
          <a
            className={s.link}
            key={n.href}
            href={n.href}
            onClick={(e) => jump(e, n.href)}
          >
            {n.label}
          </a>
        ))}
      </nav>

      <div className={s.right}>
        <Magnetic strength={0.28} innerSelector={`.${s.ctaLabel}`}>
          <a
            className={s.cta}
            href="#join"
            onClick={(e) => jump(e, '#join')}
            data-cursor="link"
          >
            <span className={s.dot} aria-hidden="true" />
            <span className={s.ctaLabel}>{JOIN.button}</span>
          </a>
        </Magnetic>

        <Magnetic strength={0.4} radius={30}>
          <button
            className={s.burger}
            onClick={onToggle}
            aria-expanded={open}
            aria-controls="menu-overlay"
            aria-label={open ? 'Close menu' : 'Open menu'}
            data-cursor="link"
          >
            <span className={s.burgerBars} aria-hidden="true" data-burger>
              <span />
              <span />
            </span>
          </button>
        </Magnetic>
      </div>
    </header>
  );
}
