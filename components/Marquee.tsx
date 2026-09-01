'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import s from './Marquee.module.css';

type Props = {
  children: React.ReactNode;
  /** Seconds for one full pass. Lower = faster. */
  duration?: number;
  reverse?: boolean;
  /** Scroll velocity bends the speed — the strip reacts to how you scroll. */
  reactive?: boolean;
  hardEdges?: boolean;
  className?: string;
};

export default function Marquee({
  children,
  duration = 34,
  reverse = false,
  reactive = true,
  hardEdges = false,
  className,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !track.current) return;

    const ctx = gsap.context(() => {
      // Two identical groups; translating the track by exactly -50% puts
      // group B where group A was, so the loop has no seam.
      const tween = gsap.to(track.current, {
        xPercent: reverse ? 50 : -50,
        duration,
        ease: 'none',
        repeat: -1,
        // Start the reversed variant already offset, otherwise it plays from
        // an empty half.
        startAt: reverse ? { xPercent: -50 } : undefined,
      });

      if (!reactive) return;

      // Scroll velocity is fed into timeScale and eased back to rest, so
      // fast scrolling drags the strip along with it.
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-3.2, 3.2, self.getVelocity() / 420);
          const dir = reverse ? -1 : 1;
          gsap.to(tween, {
            timeScale: 1 + Math.abs(v) * (Math.sign(v) === dir ? 1 : -0.55),
            duration: 0.35,
            overwrite: true,
            onComplete: () => {
              gsap.to(tween, { timeScale: 1, duration: 1.4, ease: 'power2.out' });
            },
          });
        },
      });

      return () => st.kill();
    }, root);

    return () => ctx.revert();
  }, [duration, reverse, reactive, reduced]);

  return (
    <div
      className={`${s.root} ${className ?? ''}`}
      ref={root}
      data-hard={hardEdges}
      aria-hidden="true"
    >
      <div className={s.track} ref={track}>
        <div className={s.group}>{children}</div>
        <div className={s.group}>{children}</div>
      </div>
    </div>
  );
}
