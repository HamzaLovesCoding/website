'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from '@/lib/gsap';
import { split } from '@/lib/split';
import { usePrecisePointer, useReducedMotion } from '@/lib/hooks';
import { PROJECTS } from '@/lib/content';
import s from './Work.module.css';

export default function Work() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const precise = usePrecisePointer();

  useEffect(() => {
    if (!root.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(`.${s.card}`);
      // split() rewrites the DOM, so its undo has to be held and called on
      // cleanup — gsap.context only reverts what GSAP itself touched.
      const reverts: Array<() => void> = [];

      if (!reduced) {
        cards.forEach((card, i) => {
          const inner = card.querySelector<HTMLElement>(`.${s.inner}`);
          const media = card.querySelector<HTMLElement>(`.${s.media}`);
          const isLast = i === cards.length - 1;

          // Parallax inside the frame — the plate drifts slower than the card
          // it sits in, which is what gives the deck its depth.
          if (media) {
            gsap.fromTo(
              media,
              { yPercent: -8 },
              {
                yPercent: 8,
                ease: 'none',
                scrollTrigger: {
                  trigger: card,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          }

          // Each card recedes as the next one arrives over it.
          if (!isLast && inner) {
            gsap.to(inner, {
              scale: 0.9,
              filter: 'brightness(0.42) saturate(0.7)',
              ease: 'none',
              scrollTrigger: {
                trigger: cards[i + 1],
                start: 'top bottom',
                end: 'top top',
                scrub: 0.4,
              },
            });
          }
        });

        // Titles arrive line by line as their card comes to rest.
        cards.forEach((card) => {
          const title = card.querySelector<HTMLElement>(`.${s.title}`);
          if (!title) return;
          const { targets, revert } = split(title, 'lines');
          reverts.push(revert);
          gsap.set(targets, { yPercent: 110 });
          gsap.to(targets, {
            yPercent: 0,
            duration: 1.2,
            stagger: 0.08,
            ease: 'expo.out',
            scrollTrigger: { trigger: card, start: 'top 55%' },
          });
        });
      }

      // Pointer tilt. Rotation is tiny on purpose: enough to feel like the
      // card has a surface, not enough to become a novelty.
      if (precise && !reduced) {
        cards.forEach((card) => {
          const inner = card.querySelector<HTMLElement>(`.${s.inner}`);
          const media = card.querySelector<HTMLElement>(`.${s.media}`);
          if (!inner) return;

          const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.9, ease: 'power3' });
          const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.9, ease: 'power3' });

          const onMove = (e: PointerEvent) => {
            const r = inner.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            rx(-py * 4);
            ry(px * 5);
          };
          const onEnter = () => {
            gsap.set(inner, { transformPerspective: 1400 });
            gsap.to(media, { scale: 1.06, duration: 1.1, ease: 'expo.out' });
          };
          const onLeave = () => {
            rx(0);
            ry(0);
            gsap.to(media, { scale: 1, duration: 1.1, ease: 'expo.out' });
          };

          inner.addEventListener('pointermove', onMove);
          inner.addEventListener('pointerenter', onEnter);
          inner.addEventListener('pointerleave', onLeave);
        });
      }

      return () => reverts.forEach((r) => r());
    }, root);

    return () => ctx.revert();
  }, [reduced, precise]);

  return (
    <section className={s.section} ref={root} id="work" data-ambient="0.45">
      <div className={`${s.head} u-shell u-head`}>
        <h2 className="u-title">
          Selected <em>work</em>
        </h2>
        <span className="u-label">
          [LABEL] {PROJECTS.length} projects — index
        </span>
      </div>

      <div className={`${s.list} u-shell`}>
        {PROJECTS.map((p) => (
          <article className={s.card} key={p.index}>
            <div className={s.inner}>
              <div className={s.mediaWrap}>
                <Image
                  className={s.media}
                  src={p.image}
                  alt={`${p.title} — ${p.discipline}`}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1600px"
                  quality={80}
                />
              </div>
              <div className={s.veil} aria-hidden="true" />

              <a
                className={s.link}
                href="#work"
                aria-label={`View ${p.title}`}
                data-cursor="view"
                data-cursor-label="View"
              />

              <div className={s.content}>
                <div className={s.topRow}>
                  <span className={s.index}>{p.index}</span>
                  <span className="u-label">{p.client}</span>
                </div>

                <div>
                  <span className={s.rule} aria-hidden="true" />
                  <div className={s.bottomRow}>
                    <h3 className={`${s.title} u-display`}>{p.title}</h3>
                    <div className={s.meta}>
                      <span className={s.metaLine}>{p.discipline}</span>
                      <span className="u-label">{p.year}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
