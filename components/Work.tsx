'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from '@/lib/gsap';
import { split } from '@/lib/split';
import { usePrecisePointer, useReducedMotion } from '@/lib/hooks';
import { PROGRAM } from '@/lib/content';
import Em from './Em';
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
          const dim = card.querySelector<HTMLElement>(`.${s.dim}`);
          const isLast = i === cards.length - 1;

          // Parallax inside the frame — the plate drifts slower than the card
          // it sits in, which is what gives the deck its depth. The scrub lag
          // lets it trail the scroll slightly instead of tracking it exactly.
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
                  scrub: 1,
                },
              },
            );
          }

          // Each card recedes as the next is dealt over it.
          //
          // Three things make the handoff feel like motion rather than a
          // scroll readout: it is eased rather than linear, the scrub lag
          // gives it weight, and it settles a little before the incoming card
          // has finished covering it, so the card is at rest when it goes.
          if (!isLast && inner) {
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: cards[i + 1],
                  start: 'top 98%',
                  end: 'top 4%',
                  scrub: 1.1,
                },
              })
              .to(
                inner,
                { scale: 0.9, yPercent: -2.5, duration: 1, ease: 'power2.inOut' },
                0,
              )
              .to(dim, { opacity: 0.45, duration: 1, ease: 'power1.in' }, 0);
          }
        });

        // Content arrives as the card settles. Triggered off the elements
        // themselves rather than the card box, which is now taller than the
        // viewport — a card's top crosses the screen long before its contents
        // are anywhere near visible.
        cards.forEach((card) => {
          const title = card.querySelector<HTMLElement>(`.${s.title}`);
          const rule = card.querySelector<HTMLElement>(`.${s.rule}`);
          const detail = card.querySelectorAll<HTMLElement>(`.${s.blurb}, .${s.tag}`);
          if (!title) return;

          const { targets, revert } = split(title, 'lines');
          reverts.push(revert);

          gsap.set(targets, { yPercent: 110 });
          gsap.set(detail, { opacity: 0, y: 14 });
          gsap.set(rule, { scaleX: 0 });

          gsap
            .timeline({
              scrollTrigger: { trigger: title, start: 'top 92%' },
              defaults: { ease: 'expo.out' },
            })
            .to(targets, { yPercent: 0, duration: 1.3, stagger: 0.1 })
            .to(rule, { scaleX: 1, duration: 1.4, ease: 'power3.out' }, 0.1)
            .to(detail, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.3);
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
    <section className={s.section} ref={root} id="what" data-ambient="0.28">
      <div className={`${s.head} u-shell u-head`}>
        <h2 className="u-title">
          <Em phrase={PROGRAM.title} />
        </h2>
        <span className="u-label">{PROGRAM.meta}</span>
      </div>

      <div className={`${s.list} u-shell`}>
        {PROGRAM.items.map((p) => (
          <article className={s.card} key={p.index}>
            <div className={s.inner}>
              <div className={s.mediaWrap}>
                <Image
                  className={s.media}
                  src={p.image}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(max-width: 1200px) 100vw, 1600px"
                  quality={80}
                />
              </div>
              <div className={s.veil} aria-hidden="true" />
              <div className={s.dim} aria-hidden="true" />

              <div className={s.content}>
                <div className={s.topRow}>
                  <span className={s.index}>{p.index}</span>
                  <span className="u-label">{p.kicker}</span>
                </div>

                <div>
                  <span className={s.rule} aria-hidden="true" />
                  <div className={s.bottomRow}>
                    <div className={s.headline}>
                      <h3 className={`${s.title} u-display`}>{p.title}</h3>
                      <p className={s.blurb}>{p.blurb}</p>
                    </div>
                    <span className={`${s.tag} u-label`}>{p.tag}</span>
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
