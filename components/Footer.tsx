'use client';

import { Fragment, useEffect, useMemo, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { scrollTo } from '@/lib/smooth';
import { damp } from '@/lib/math';
import { usePrecisePointer, useReducedMotion } from '@/lib/hooks';
import { FOOTER, SITE } from '@/lib/content';
import s from './Footer.module.css';

const LAYERS = [s.layerBase, s.layerAccent, s.layerHot];

export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const markWrap = useRef<HTMLDivElement>(null);
  const precise = usePrecisePointer();
  const reduced = useReducedMotion();

  const chars = useMemo(() => Array.from(SITE.wordmark), []);

  useEffect(() => {
    const wrap = markWrap.current;
    if (!wrap) return;

    const ctx = gsap.context(() => {
      // Entrance: the wordmark rises out of the fold as the page bottoms out.
      if (!reduced) {
        gsap.from(`.${s.layer}`, {
          yPercent: 42,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: wrap, start: 'top 95%' },
        });
      }

      const setMask = gsap.quickSetter(wrap, 'css') as (v: object) => void;

      if (!precise || reduced) {
        // No pointer to follow, so the light drifts on its own — the effect
        // still exists on touch, it just isn't driven by anyone.
        const drift = { x: 30, y: 50 };
        gsap.to(drift, {
          x: 70,
          duration: 9,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          onUpdate: () => setMask({ '--mx': `${drift.x}%`, '--my': `${drift.y}%` }),
        });
        return;
      }

      // Group the three copies of each character so one setter moves all of
      // them together and the layers can never drift out of registration.
      const groups = chars.map((_, i) =>
        gsap.utils.toArray<HTMLElement>(`[data-char="${i}"]`, wrap),
      );
      const setters = groups.map((g) => gsap.quickSetter(g, 'y', 'px'));
      const current = new Float32Array(chars.length);

      const pointer = { x: -9999, y: 0, inside: 0 };
      const mask = { x: 50, y: 50 };

      const onMove = (e: PointerEvent) => {
        const r = wrap.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        mask.x = (pointer.x / r.width) * 100;
        mask.y = (pointer.y / r.height) * 100;
      };
      const onEnter = () => (pointer.inside = 1);
      const onLeave = () => (pointer.inside = 0);

      wrap.addEventListener('pointermove', onMove);
      wrap.addEventListener('pointerenter', onEnter);
      wrap.addEventListener('pointerleave', onLeave);

      let lastMask = { x: -1, y: -1 };
      let lastT = performance.now();

      const tick = () => {
        const now = performance.now();
        const dt = Math.min((now - lastT) / 1000, 1 / 30);
        lastT = now;

        // Only touch the mask when it actually moved — writing custom
        // properties forces the mask to recompute every time.
        if (Math.abs(mask.x - lastMask.x) > 0.05 || Math.abs(mask.y - lastMask.y) > 0.05) {
          setMask({ '--mx': `${mask.x}%`, '--my': `${mask.y}%` });
          lastMask = { ...mask };
        }

        // Characters lift toward the pointer with a gaussian falloff, so the
        // wordmark bends around the light rather than reacting as a block.
        const first = groups[0]?.[0];
        if (!first) return;
        const wrapLeft = wrap.getBoundingClientRect().left;

        groups.forEach((g, i) => {
          const el = g[0];
          const r = el.getBoundingClientRect();
          const cx = r.left - wrapLeft + r.width / 2;
          const d = (pointer.x - cx) / 220;
          const target = pointer.inside ? -Math.exp(-d * d) * 26 : 0;
          current[i] = damp(current[i], target, 0.0015, dt);
          setters[i](current[i]);
        });
      };

      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        wrap.removeEventListener('pointermove', onMove);
        wrap.removeEventListener('pointerenter', onEnter);
        wrap.removeEventListener('pointerleave', onLeave);
      };
    }, root);

    return () => ctx.revert();
  }, [chars, precise, reduced]);

  return (
    <footer className={s.footer} ref={root} data-ambient="0.6">
      <div className={`${s.top} u-shell`}>
        {FOOTER.columns.map((c) => (
          <div className={s.col} key={c.label}>
            <span className="u-label">{c.label}</span>
            <span className={s.colBody}>
              {c.lines.map((line, i) => (
                <Fragment key={line}>
                  {i > 0 ? <br /> : null}
                  {line}
                </Fragment>
              ))}
            </span>
          </div>
        ))}

        <div className={s.col}>
          <span className="u-label">{FOOTER.followLabel}</span>
          <div className={s.stack}>
            {FOOTER.socials.map((x) => (
              <a className={s.item} key={x} href="#">
                {x}
              </a>
            ))}
          </div>
        </div>

        <div className={s.col}>
          <span className="u-label">{FOOTER.noteLabel}</span>
          <span className={s.colBody}>{FOOTER.note}</span>
          <a className={s.item} href="#">
            {FOOTER.noteCta} ↗
          </a>
        </div>
      </div>

      <div
        className={s.markWrap}
        ref={markWrap}
        data-cursor="view"
        data-cursor-label="Hello"
        style={{ '--mark-len': chars.length } as React.CSSProperties}
      >
        <div className={s.mark} aria-label={SITE.wordmark} role="img">
          {LAYERS.map((layer) => (
            <div className={`${s.layer} ${layer}`} key={layer} aria-hidden="true">
              {chars.map((c, i) => (
                <span className={s.char} key={`${c}-${i}`} data-char={i}>
                  {c === ' ' ? ' ' : c}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={`${s.bottom} u-shell`}>
        <span className="u-label">
          {SITE.name} — {SITE.school}
        </span>

        <span className="u-label">{SITE.year}</span>

        <button
          className={s.toTop}
          onClick={() => scrollTo('#top')}
          data-cursor="link"
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
