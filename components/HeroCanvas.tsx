'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from '@/lib/gsap';
import { damp } from '@/lib/math';
import { useReducedMotion } from '@/lib/hooks';
import { heroFrag, heroVert } from '@/lib/shaders/hero';
import s from './Hero.module.css';

type Props = {
  /** Fires with `false` if WebGL never came up, so the hero can fall back. */
  onReady?: (ok: boolean) => void;
};

/**
 * Fullscreen-quad renderer for the hero shader.
 *
 * Three.js is imported dynamically: it is by far the heaviest thing on the
 * page and nothing above the fold needs it to paint.
 */
export default function HeroCanvas({ onReady }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const reduced = useReducedMotion();

  // Resolved after mount, so it must not be an effect dependency — rebuilding
  // the context on the first frame would leave an orphaned canvas behind.
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useEffect(() => {
    const el = holder.current;
    if (!el) return;

    let disposed = false;
    // Resources register their own teardown as they are created, so an
    // unmount mid-setup cannot strand a canvas in the DOM.
    const teardown: Array<() => void> = [];

    (async () => {
      const THREE = await import('three');
      if (disposed || !el) return;

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false, // nothing here has a geometric edge to alias
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,
        });
      } catch {
        setFailed(true);
        onReady?.(false);
        return;
      }

      const mobile = window.matchMedia('(max-width: 900px)').matches;
      // A fullscreen fBm shader is fill-rate bound, so resolution is the one
      // dial that actually matters. 1.6 is the point where more DPR stops
      // being visible on this content.
      const maxDpr = mobile ? 1.25 : 1.6;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setClearColor(0x0a0a0a, 1);
      el.appendChild(renderer.domElement);
      teardown.push(() => {
        renderer.dispose();
        renderer.domElement.remove();
      });

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        uRes: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uScroll: { value: 0 },
        uIntro: { value: 0 },
        uOctaves: { value: mobile ? 3 : 4 },
      };

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
          vertexShader: heroVert,
          fragmentShader: heroFrag,
          uniforms,
          depthTest: false,
          depthWrite: false,
        }),
      );
      scene.add(mesh);

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = el;
        renderer.setSize(w, h, false);
        uniforms.uRes.value.set(
          w * renderer.getPixelRatio(),
          h * renderer.getPixelRatio(),
        );
      };
      resize();

      const ro = new ResizeObserver(resize);
      ro.observe(el);
      teardown.push(() => ro.disconnect());

      // --- input ------------------------------------------------------------

      const pointer = { x: 0.5, y: 0.5 };
      const onMove = (e: PointerEvent) => {
        pointer.x = e.clientX / window.innerWidth;
        pointer.y = e.clientY / window.innerHeight;
      };
      if (!mobile) {
        window.addEventListener('pointermove', onMove, { passive: true });
        teardown.push(() => window.removeEventListener('pointermove', onMove));
      }

      let scroll = 0;
      const st = ScrollTrigger.create({
        trigger: el.parentElement ?? el,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          scroll = self.progress;
        },
      });
      teardown.push(() => st.kill());

      // Don't burn a GPU on a canvas nobody is looking at.
      let visible = true;
      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { threshold: 0 },
      );
      io.observe(el);
      teardown.push(() => io.disconnect());

      // --- loop -------------------------------------------------------------

      let raf = 0;
      let last = performance.now();
      const start = last;

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;

        if (!visible) return;

        uniforms.uTime.value = (now - start) / 1000;
        uniforms.uScroll.value = damp(uniforms.uScroll.value, scroll, 0.001, dt);
        uniforms.uIntro.value = damp(uniforms.uIntro.value, 1, 0.02, dt);

        const m = uniforms.uMouse.value;
        // Heavy smoothing. The raw pointer makes the form feel attached to
        // the mouse; this makes it feel like it noticed.
        m.x = damp(m.x, pointer.x, 0.02, dt);
        m.y = damp(m.y, pointer.y, 0.02, dt);

        renderer.render(scene, camera);
      };

      if (reducedRef.current) {
        // One frame, fully revealed, no loop.
        uniforms.uIntro.value = 1;
        uniforms.uTime.value = 12;
        renderer.render(scene, camera);
      } else {
        raf = requestAnimationFrame(frame);
      }
      teardown.push(() => cancelAnimationFrame(raf));
      teardown.push(() => {
        mesh.geometry.dispose();
        (mesh.material as import('three').ShaderMaterial).dispose();
      });

      onReady?.(true);

      // Losing the context (tab backgrounded on a low-memory device, driver
      // reset) is silent otherwise — the canvas just goes black.
      const onLost = (e: Event) => {
        e.preventDefault();
        cancelAnimationFrame(raf);
        setFailed(true);
      };
      renderer.domElement.addEventListener('webglcontextlost', onLost);
      teardown.push(() =>
        renderer.domElement.removeEventListener('webglcontextlost', onLost),
      );

      if (disposed) teardown.forEach((fn) => fn());
    })();

    return () => {
      disposed = true;
      teardown.forEach((fn) => fn());
      teardown.length = 0;
    };
  }, [onReady]);

  return (
    <div className={s.canvas} ref={holder} aria-hidden="true" data-failed={failed} />
  );
}
