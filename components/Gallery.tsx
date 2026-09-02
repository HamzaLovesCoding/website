'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { damp } from '@/lib/math';
import { usePrecisePointer, useReducedMotion } from '@/lib/hooks';
import { galleryFrag, galleryVert } from '@/lib/shaders/gallery';
import { INSIDE } from '@/lib/content';
import Em from './Em';
import s from './Gallery.module.css';

const HOLD = 5200; // ms a slide rests before advancing on its own

export default function Gallery() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [index, setIndex] = useState(0);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  const reduced = useReducedMotion();
  const precise = usePrecisePointer();

  // The renderer lives outside React state; `go` is the only bridge into it.
  const api = useRef<{ to: (i: number) => void } | null>(null);

  // Media-query hooks resolve after mount, so using them as effect deps would
  // tear down and rebuild the WebGL context on the first frame. They are read
  // through refs instead and the renderer is created exactly once.
  const preciseRef = useRef(precise);
  const reducedRef = useRef(reduced);
  preciseRef.current = precise;
  reducedRef.current = reduced;

  const go = useCallback((next: number) => {
    const i = (next + INSIDE.items.length) % INSIDE.items.length;
    setIndex(i);
    api.current?.to(i);
  }, []);

  /* Horizontal drag / swipe across the plate. A threshold rather than a
     1:1 scrub — the transition is a displacement dissolve, and dragging it
     back and forth mid-dissolve just looks broken. */
  const drag = useRef<{ x: number; active: boolean }>({ x: 0, active: false });

  const onDragStart = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, active: true };
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) < 64) return;
    drag.current.active = false;
    setIndex((i) => {
      const n = (i + (dx < 0 ? 1 : -1) + INSIDE.items.length) % INSIDE.items.length;
      api.current?.to(n);
      return n;
    });
  };

  const onDragEnd = (e: React.PointerEvent) => {
    // A press that never travelled is a click: advance.
    if (drag.current.active && Math.abs(e.clientX - drag.current.x) < 6) {
      setIndex((i) => {
        const n = (i + 1) % INSIDE.items.length;
        api.current?.to(n);
        return n;
      });
    }
    drag.current.active = false;
  };

  /* ------------------------------------------------------------ renderer -- */

  useEffect(() => {
    const el = stage.current;
    if (!el) return;

    let disposed = false;
    // Every resource is registered the moment it exists, so an unmount part
    // way through the async setup still tears down completely — an abandoned
    // canvas left in the DOM is what pushes the live one out of the frame.
    const teardown: Array<() => void> = [];

    (async () => {
      const THREE = await import('three');
      if (disposed) return;

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
      } catch {
        setWebgl(false);
        return;
      }
      teardown.push(() => {
        renderer.dispose();
        renderer.domElement.remove();
      });

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      el.appendChild(renderer.domElement);
      if (disposed) return;

      const scene = new THREE.Scene();
      // Depth range spans z=0 so the unit plane sitting at the origin is
      // actually inside the frustum.
      const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 1);

      const loader = new THREE.TextureLoader();
      const load = (src: string) =>
        new Promise<import('three').Texture>((res, rej) =>
          loader.load(src, res, undefined, rej),
        );

      let textures: import('three').Texture[];
      let disp: import('three').Texture;
      try {
        [textures, disp] = await Promise.all([
          Promise.all(INSIDE.items.map((g) => load(g.image))),
          load('/media/displacement.jpg'),
        ]);
      } catch {
        setWebgl(false);
        return;
      }
      if (disposed) return;
      teardown.push(() => {
        textures.forEach((t) => t.dispose());
        disp.dispose();
      });

      textures.forEach((t) => {
        t.minFilter = THREE.LinearFilter;
        t.generateMipmaps = false;
        t.colorSpace = THREE.SRGBColorSpace;
      });
      disp.wrapS = disp.wrapT = THREE.RepeatWrapping;

      // Texture.image is typed loosely because it can be an HTMLImageElement,
      // a canvas or ImageBitmap; all three carry width/height.
      const size = (t: import('three').Texture) => {
        const img = t.image as { width?: number; height?: number } | undefined;
        return new THREE.Vector2(img?.width ?? 1, img?.height ?? 1);
      };

      const uniforms = {
        uFrom: { value: textures[0] },
        uTo: { value: textures[1 % textures.length] },
        uDisp: { value: disp },
        uProgress: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uHover: { value: 0 },
        uIntensity: { value: 0.42 },
        uPlane: { value: new THREE.Vector2(1, 1) },
        uFromSize: { value: size(textures[0]) },
        uToSize: { value: size(textures[1 % textures.length]) },
      };

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShaderMaterial({
          vertexShader: galleryVert,
          fragmentShader: galleryFrag,
          uniforms,
          transparent: true,
        }),
      );
      scene.add(mesh);

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = el;
        renderer.setSize(w, h, false);
        uniforms.uPlane.value.set(w, h);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      teardown.push(() => ro.disconnect());

      // --- pointer ----------------------------------------------------------

      const target = { x: 0, y: 0, hover: 0 };
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        target.x = (e.clientX - r.left) / r.width - 0.5;
        target.y = 0.5 - (e.clientY - r.top) / r.height;
      };
      const onEnter = () => (target.hover = 1);
      const onLeave = () => (target.hover = 0);

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerenter', onEnter);
      el.addEventListener('pointerleave', onLeave);
      teardown.push(() => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerenter', onEnter);
        el.removeEventListener('pointerleave', onLeave);
      });

      // --- transition -------------------------------------------------------

      let current = 0;
      let tween: gsap.core.Tween | null = null;

      teardown.push(() => {
        tween?.kill();
        api.current = null;
      });

      api.current = {
        to: (next: number) => {
          if (next === current) return;
          tween?.kill();

          uniforms.uFrom.value = textures[current];
          uniforms.uFromSize.value.copy(size(textures[current]));
          uniforms.uTo.value = textures[next];
          uniforms.uToSize.value.copy(size(textures[next]));
          uniforms.uProgress.value = 0;

          current = next;
          tween = gsap.to(uniforms.uProgress, {
            value: 1,
            duration: reducedRef.current ? 0.35 : 1.25,
            ease: 'power2.inOut',
          });
        },
      };

      // --- loop -------------------------------------------------------------

      let visible = true;
      const io = new IntersectionObserver(
        ([e]) => (visible = e.isIntersecting),
        { threshold: 0 },
      );
      io.observe(el);
      teardown.push(() => io.disconnect());

      let raf = 0;
      let last = performance.now();
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        if (!visible) return;

        const m = uniforms.uMouse.value;
        const wants = preciseRef.current ? target : { x: 0, y: 0, hover: 0 };
        m.x = damp(m.x, wants.x, 0.008, dt);
        m.y = damp(m.y, wants.y, 0.008, dt);
        uniforms.uHover.value = damp(uniforms.uHover.value, wants.hover, 0.01, dt);

        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(frame);
      teardown.push(() => cancelAnimationFrame(raf));
      teardown.push(() => {
        mesh.geometry.dispose();
        (mesh.material as import('three').ShaderMaterial).dispose();
      });

      setWebgl(true);

      // Unmounted while the textures were in flight.
      if (disposed) teardown.forEach((fn) => fn());
    })();

    return () => {
      disposed = true;
      teardown.forEach((fn) => fn());
      teardown.length = 0;
    };
  }, []);

  /* ------------------------------------------------------------- autoplay - */

  useEffect(() => {
    if (reduced) return;
    const el = stage.current;
    let paused = false;
    const enter = () => (paused = true);
    const leave = () => (paused = false);
    el?.addEventListener('pointerenter', enter);
    el?.addEventListener('pointerleave', leave);

    const id = window.setInterval(() => {
      // Advancing under the pointer fights the visitor for control.
      if (!paused && document.visibilityState === 'visible') {
        setIndex((i) => {
          const n = (i + 1) % INSIDE.items.length;
          api.current?.to(n);
          return n;
        });
      }
    }, HOLD);

    return () => {
      window.clearInterval(id);
      el?.removeEventListener('pointerenter', enter);
      el?.removeEventListener('pointerleave', leave);
    };
  }, [reduced]);

  /* --------------------------------------------------------- title swap --- */

  useEffect(() => {
    if (!titleRef.current || reduced) return;
    const el = titleRef.current;
    gsap.fromTo(
      el,
      { yPercent: 40, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', overwrite: true },
    );
  }, [index, reduced]);

  useEffect(() => {
    gsap.to(`.${s.progressFill}`, {
      scaleX: (index + 1) / INSIDE.items.length,
      duration: 0.9,
      ease: 'expo.out',
    });
  }, [index]);

  const item = INSIDE.items[index];

  return (
    <section className={s.section} ref={root} id="inside" data-ambient="0.38">
      <div className="u-shell">
        <div className="u-head">
          <h2 className="u-title">
            <Em phrase={INSIDE.title} />
          </h2>
          <span className="u-label">{INSIDE.meta}</span>
        </div>

        <div className={s.grid}>
          <div className={s.col}>
            <h3 className={s.title} ref={titleRef}>
              {item.title}
            </h3>

            <div className={s.metaRow}>
              <span className={s.count}>
                {String(index + 1).padStart(2, '0')}
                <span className={s.countTotal}>
                  {' '}/ {String(INSIDE.items.length).padStart(2, '0')}
                </span>
              </span>
              <span className={s.progress}>
                <span className={s.progressFill} />
              </span>
            </div>

            <span className="u-label">{item.meta}</span>

            <div className={s.controls}>
              <button
                className={s.ctrl}
                onClick={() => go(index - 1)}
                aria-label="Previous project"
              >
                ←
              </button>
              <button
                className={s.ctrl}
                onClick={() => go(index + 1)}
                aria-label="Next project"
              >
                →
              </button>
            </div>

            <div className={s.dots} aria-hidden="true">
              {INSIDE.items.map((g, i) => (
                <span className={s.dot} key={g.title} data-on={i === index} />
              ))}
            </div>
          </div>

          <div
            className={s.stage}
            ref={stage}
            data-cursor="drag"
            data-cursor-label="Drag"
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={() => (drag.current.active = false)}
          >
            {webgl === false &&
              INSIDE.items.map((g, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  className={s.fallbackImg}
                  key={g.title}
                  src={g.image}
                  alt={g.title}
                  data-on={i === index}
                  loading="lazy"
                />
              ))}
            <span className={s.stageEdge} aria-hidden="true" />
            <span className={`${s.stageTag} u-label`}>{item.meta}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
