'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from '@/lib/gsap';
import { lockScroll, scrollTo, unlockScroll } from '@/lib/smooth';
import { usePrecisePointer, useReducedMotion } from '@/lib/hooks';
import { FOOTER, NAV, SITE } from '@/lib/content';
import s from './Menu.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function Menu({ open, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const precise = usePrecisePointer();
  const reduced = useReducedMotion();

  /* -------------------------------------------------- open / close ------- */

  useEffect(() => {
    if (!root.current) return;

    const ctx = gsap.context(() => {
      const accent = root.current!.querySelector(`.${s.panelAccent}`);
      const base = root.current!.querySelector(`.${s.panelBase}`);
      const labels = gsap.utils.toArray<HTMLElement>(`.${s.label}`);
      const indices = gsap.utils.toArray<HTMLElement>(`.${s.index}`);
      const rows = gsap.utils.toArray<HTMLElement>(`.${s.row}`);
      const asideCols = gsap.utils.toArray<HTMLElement>(`.${s.col}`);

      gsap.set([labels, indices], { yPercent: 115 });
      gsap.set(asideCols, { opacity: 0, y: 20 });
      gsap.set(rows, { scaleX: 0, transformOrigin: 'left center' });

      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: 'power4.inOut' } })
        // Curtain: accent first, base a beat behind. The overlap is what
        // makes it read as one gesture with weight rather than two wipes.
        .to(accent, { clipPath: 'inset(0% 0 0 0)', duration: 0.72 })
        .to(base, { clipPath: 'inset(0% 0 0 0)', duration: 0.78 }, 0.14)
        .to(accent, { clipPath: 'inset(0 0 100% 0)', duration: 0.6 }, 0.52)
        // Rules draw in before the words land on them.
        .to(rows, { scaleX: 1, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, 0.5)
        .to(
          labels,
          { yPercent: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out' },
          0.58,
        )
        .to(
          indices,
          { yPercent: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' },
          0.62,
        )
        .to(
          asideCols,
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' },
          0.8,
        );

      if (reduced) tl.current.timeScale(4);
    }, root);

    return () => {
      ctx.revert();
      tl.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    if (!tl.current) return;

    document.documentElement.dataset.menu = open ? 'open' : 'closed';

    // The page recedes behind the curtain — transform and opacity only, so it
    // stays cheap on a document this tall.
    const page = document.getElementById('main');

    if (open) {
      lockScroll();
      tl.current.timeScale(1).play();
      gsap.to(page, {
        scale: 0.97,
        opacity: 0.5,
        duration: 1.1,
        ease: 'power4.inOut',
        transformOrigin: 'center top',
      });
      return () => unlockScroll();
    }

    gsap.to(page, { scale: 1, opacity: 1, duration: 0.8, ease: 'power4.inOut' });

    // Closing runs faster than opening — reversing at 1:1 feels sluggish once
    // you have already seen the reveal.
    if (tl.current.progress() > 0) tl.current.timeScale(1.7).reverse();
  }, [open]);

  // Escape closes; focus goes to the first link on open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const first = root.current?.querySelector<HTMLElement>(`.${s.link}`);
    const id = window.setTimeout(() => first?.focus(), 700);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(id);
    };
  }, [open, onClose]);

  /* -------------------------------------------------- hover preview ------ */

  useEffect(() => {
    if (!precise || reduced || !preview.current) return;

    const ctx = gsap.context(() => {
      const box = preview.current!;
      const imgs = gsap.utils.toArray<HTMLElement>(`.${s.previewImg}`);

      const xTo = gsap.quickTo(box, 'x', { duration: 0.9, ease: 'power3' });
      const yTo = gsap.quickTo(box, 'y', { duration: 0.9, ease: 'power3' });

      const onMove = (e: PointerEvent) => {
        xTo(e.clientX);
        yTo(e.clientY);
      };
      window.addEventListener('pointermove', onMove, { passive: true });

      const links = gsap.utils.toArray<HTMLElement>(`.${s.link}`);
      const handlers: Array<[HTMLElement, string, EventListener]> = [];

      links.forEach((link, i) => {
        const enter = () => {
          gsap.to(box, { opacity: 1, duration: 0.4, overwrite: true });
          gsap.to(imgs, { opacity: 0, duration: 0.3, overwrite: true });
          gsap.fromTo(
            imgs[i],
            { opacity: 0, scale: 1.16, clipPath: 'inset(100% 0 0 0)' },
            {
              opacity: 1,
              scale: 1,
              clipPath: 'inset(0% 0 0 0)',
              duration: 1,
              ease: 'expo.out',
              overwrite: true,
            },
          );
        };
        const leave = () => {
          gsap.to(box, { opacity: 0, duration: 0.35, overwrite: true });
        };
        link.addEventListener('pointerenter', enter);
        link.addEventListener('pointerleave', leave);
        handlers.push([link, 'pointerenter', enter], [link, 'pointerleave', leave]);
      });

      return () => {
        window.removeEventListener('pointermove', onMove);
        handlers.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
      };
    }, root);

    return () => ctx.revert();
  }, [precise, reduced]);

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    onClose();
    // Let the curtain start lifting before the page moves underneath it.
    window.setTimeout(() => scrollTo(href), 620);
  };

  return (
    <div
      className={s.overlay}
      ref={root}
      id="menu-overlay"
      data-open={open}
      aria-hidden={!open}
    >
      <div className={`${s.panel} ${s.panelAccent}`} aria-hidden="true" />
      <div className={`${s.panel} ${s.panelBase}`} aria-hidden="true" />

      <div className={`${s.inner} u-shell`}>
        <nav className={s.list} aria-label="Menu">
          {NAV.map((n) => (
            <div className={s.row} key={n.href}>
              <a
                className={s.link}
                href={n.href}
                onClick={(e) => go(e, n.href)}
                tabIndex={open ? 0 : -1}
                data-cursor="link"
              >
                <span className="u-mask">
                  <span className={s.index}>{n.index}</span>
                </span>
                <span className="u-mask">
                  <span className={s.label}>{n.label}</span>
                </span>
                <span className={s.arrow} aria-hidden="true">
                  ↗
                </span>
              </a>
            </div>
          ))}
        </nav>

        <div className={s.aside}>
          {FOOTER.offices.map((o) => (
            <div className={s.col} key={o.city}>
              <span className="u-label">{o.city}</span>
              <span className={s.colBody}>
                {o.line1}
                <br />
                {o.line2}
              </span>
            </div>
          ))}

          <div className={s.col}>
            <span className="u-label">Follow</span>
            <div className={s.socials}>
              {FOOTER.socials.map((x) => (
                <a className={s.social} key={x} href="#" tabIndex={open ? 0 : -1}>
                  {x}
                </a>
              ))}
            </div>
          </div>

          <div className={s.col}>
            <span className="u-label">{SITE.year}</span>
            <span className={s.colBody}>{SITE.tagline}</span>
          </div>
        </div>
      </div>

      <div className={s.preview} ref={preview} aria-hidden="true">
        {NAV.map((n) => (
          <Image
            className={s.previewImg}
            key={n.href}
            src={n.preview}
            alt=""
            width={440}
            height={550}
            sizes="22rem"
          />
        ))}
      </div>
    </div>
  );
}
