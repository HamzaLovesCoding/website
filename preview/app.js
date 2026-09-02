/**
 * Static export of the site's motion, for the single-file preview.
 *
 * The stylesheet, the GLSL and the copy are injected from the real source by
 * scripts/build-preview.mjs. What is written twice — and only here — is the
 * orchestration that lives in the React components, rewritten against the DOM
 * directly. Two differences from the app, both deliberate:
 *
 *   - raw WebGL instead of Three.js, because both surfaces are a single quad
 *     with a fragment shader and Three would be 400KB of inlined base64;
 *   - no framework, so the render below is one pass of template strings.
 */
(() => {
  const { content: C, media: M, shaders: SH } = window.VM;

  const media = (path) => M[path] || path;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const precise = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ==================================================================== *
   * Render                                                               *
   * ==================================================================== */

  const marquee = (cls, items, dur) => `
    <div class="marquee-root ${cls}" aria-hidden="true" data-marquee data-dur="${dur}">
      <div class="marquee-track">
        ${[0, 1].map(() => `<div class="marquee-group">${items}</div>`).join('')}
      </div>
    </div>`;

  const mask = (inner, attr = '') =>
    `<span class="u-mask"><span style="display:block" ${attr}>${inner}</span></span>`;

  document.getElementById('vm-root').innerHTML = `
  <!-- ambient ------------------------------------------------------------->
  <div class="atmosphere-ambient" aria-hidden="true" data-ambient-layer>
    <div class="atmosphere-blob atmosphere-blobA"></div>
    <div class="atmosphere-blob atmosphere-blobB"></div>
    <div class="atmosphere-blob atmosphere-blobC"></div>
  </div>
  <div class="atmosphere-vignette" aria-hidden="true"></div>
  <div class="atmosphere-grain" aria-hidden="true"></div>

  <!-- cursor -------------------------------------------------------------->
  <div class="cursor-root" aria-hidden="true" data-cursor-root>
    <div class="cursor-glow"></div>
    <div class="cursor-ring"><div class="cursor-disc"></div><span class="cursor-label"></span></div>
    <div class="cursor-dot"></div>
  </div>

  <!-- preloader ----------------------------------------------------------->
  <div class="preloader-root" data-preloader style="clip-path:inset(0 0 0% 0)" aria-hidden="true">
    <div class="preloader-glow"></div>
    <div class="u-shell">
      <span class="preloader-label u-label u-label--accent">Loading experience</span>
      <div class="preloader-inner">
        <span class="preloader-word" data-text="${C.SITE.name}">${C.SITE.name}</span>
        <span class="preloader-count"><span data-count-out>000</span><sup>%</sup></span>
      </div>
      <div class="preloader-bar"><span class="preloader-barFill"></span></div>
    </div>
  </div>

  <!-- header -------------------------------------------------------------->
  <header class="header-header u-shell" data-header data-open="false">
    <a class="header-mark" href="#top" data-jump="#top">
      <span data-glitch>${C.SITE.name}</span><sup>&reg;</sup>
    </a>
    <nav class="header-nav" aria-label="Primary">
      ${C.NAV.slice(0, 4).map((n) =>
        `<a class="header-link" href="${n.href}" data-jump="${n.href}">${n.label}</a>`).join('')}
    </nav>
    <div class="header-right">
      <a class="header-cta" href="#contact" data-jump="#contact" data-cursor="link" data-magnetic="0.28" data-magnetic-inner=".header-ctaLabel">
        <span class="header-dot"></span><span class="header-ctaLabel">${C.CTA.button}</span>
      </a>
      <button class="header-burger" data-menu-toggle aria-label="Open menu" aria-expanded="false" data-cursor="link" data-magnetic="0.4" data-magnetic-radius="30">
        <span class="header-burgerBars" data-burger><span></span><span></span></span>
      </button>
    </div>
  </header>

  <!-- menu ---------------------------------------------------------------->
  <div class="menu-overlay" id="menu-overlay" data-menu data-open="false" aria-hidden="true">
    <div class="menu-panel menu-panelAccent"></div>
    <div class="menu-panel menu-panelBase"></div>
    <div class="menu-inner u-shell">
      <nav class="menu-list" aria-label="Menu">
        ${C.NAV.map((n) => `
          <div class="menu-row">
            <a class="menu-link" href="${n.href}" data-jump="${n.href}" data-menu-link data-cursor="link" tabindex="-1">
              <span class="u-mask"><span class="menu-index">${n.index}</span></span>
              <span class="u-mask"><span class="menu-label">${n.label}</span></span>
              <span class="menu-arrow">&#8599;</span>
            </a>
          </div>`).join('')}
      </nav>
      <div class="menu-aside">
        ${C.FOOTER.offices.map((o) => `
          <div class="menu-col">
            <span class="u-label">${o.city}</span>
            <span class="menu-colBody">${o.line1}<br>${o.line2}</span>
          </div>`).join('')}
        <div class="menu-col">
          <span class="u-label">Follow</span>
          <div class="menu-socials">
            ${C.FOOTER.socials.map((x) => `<a class="menu-social" href="#" tabindex="-1">${x}</a>`).join('')}
          </div>
        </div>
        <div class="menu-col">
          <span class="u-label">${C.SITE.year}</span>
          <span class="menu-colBody">${C.SITE.tagline}</span>
        </div>
      </div>
    </div>
    <div class="menu-preview" data-menu-preview aria-hidden="true">
      ${C.NAV.map((n) => `<img class="menu-previewImg" src="${media(n.preview)}" alt="">`).join('')}
    </div>
  </div>

  <main id="main">
    <!-- hero -------------------------------------------------------------->
    <section class="hero-hero" id="top" data-ambient="0.8">
      <div class="hero-canvas" data-hero-canvas aria-hidden="true"></div>
      <div class="hero-inner u-shell" data-hero-parallax>
        <p class="hero-eyebrow u-label" data-hero-rise>${C.HERO.eyebrow}</p>
        <h1 class="hero-headline u-display">
          ${C.HERO.headline.map((l) =>
            mask(`${l.text}<em>${l.em}</em>${l.tail}`, 'data-hero-line')).join('')}
        </h1>
        <div class="hero-foot">
          <div class="hero-meta">
            ${C.HERO.meta.map((m) => `
              <div class="hero-metaItem" data-hero-rise>
                <span class="u-label">${m.k}</span>
                <span class="hero-metaValue">${m.v}</span>
              </div>`).join('')}
          </div>
          <div class="hero-cue" data-hero-rise>
            <span class="hero-cueLine"></span><span class="u-label">${C.HERO.scroll}</span>
          </div>
        </div>
      </div>
      <div class="hero-clients">
        ${marquee('', C.CLIENTS.map((c) => `<span class="hero-client">${c}</span>`).join(''), 44)}
      </div>
    </section>

    <!-- manifesto --------------------------------------------------------->
    <section class="manifesto-section" id="studio" data-ambient="0.4">
      <div class="manifesto-sticky">
        <div class="manifesto-plate" aria-hidden="true">
          <img class="manifesto-plateImg" src="${media('/media/plate-wide.jpg')}" alt="">
        </div>
        <div class="manifesto-plateVeil" aria-hidden="true"></div>
        <div class="manifesto-inner u-shell">
          <p class="manifesto-label u-label u-label--accent">${C.MANIFESTO.label}</p>
          <h2 class="manifesto-heading">
            ${C.MANIFESTO.heading.split(' ').map((w) =>
              `<span class="manifesto-word">${w}</span>`).join(' ')}
          </h2>
          <p class="manifesto-body">${C.MANIFESTO.body}</p>
          <div class="manifesto-stats">
            ${C.MANIFESTO.stats.map((s) => `
              <div class="manifesto-stat">
                <span class="manifesto-statN" data-count="${s.n}">0</span>
                <span class="u-label">${s.l}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- expand ------------------------------------------------------------>
    <section class="expand-section" data-ambient="0.5">
      <div class="expand-sticky">
        <h2 class="expand-word">Work</h2>
        <div class="expand-wordSub" aria-hidden="true">
          <span class="u-label">[LABEL] Selected output</span>
          <span class="u-label">2024 &mdash; 2026</span>
        </div>
        <div class="expand-frame">
          <img class="expand-frameMedia" src="${media('/media/work-01.jpg')}" alt="">
          <div class="expand-frameVeil" aria-hidden="true"></div>
        </div>
        <div class="expand-caption">
          <p class="expand-captionTitle">[PROJECT] Six years of work <em>for</em> people who ship.</p>
          <span class="u-label">[LABEL] Scroll for the index</span>
        </div>
        <div class="expand-tick"><span class="u-label u-label--accent">01 / 06</span></div>
      </div>
    </section>

    <!-- work -------------------------------------------------------------->
    <section class="work-section" id="work" data-ambient="0.28">
      <div class="work-head u-shell u-head">
        <h2 class="u-title">Selected <em>work</em></h2>
        <span class="u-label">[LABEL] ${C.PROJECTS.length} projects &mdash; index</span>
      </div>
      <div class="work-list u-shell">
        ${C.PROJECTS.map((p) => `
          <article class="work-card">
            <div class="work-inner">
              <div class="work-mediaWrap">
                <img class="work-media" src="${media(p.image)}" alt="${p.title}">
              </div>
              <div class="work-veil" aria-hidden="true"></div>
              <a class="work-link" href="#work" aria-label="View ${p.title}" data-cursor="view" data-cursor-label="View"></a>
              <div class="work-content">
                <div class="work-topRow">
                  <span class="work-index">${p.index}</span>
                  <span class="u-label">${p.client}</span>
                </div>
                <div>
                  <span class="work-rule"></span>
                  <div class="work-bottomRow">
                    <h3 class="work-title u-display">${p.title}</h3>
                    <div class="work-meta">
                      <span class="work-metaLine">${p.discipline}</span>
                      <span class="u-label">${p.year}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>`).join('')}
      </div>
    </section>

    <!-- gallery ----------------------------------------------------------->
    <section class="gallery-section" data-ambient="0.38">
      <div class="u-shell">
        <div class="u-head">
          <h2 class="u-title">Featured <em>work</em></h2>
          <span class="u-label">[LABEL] Drag or hover to distort</span>
        </div>
        <div class="gallery-grid">
          <div class="gallery-col">
            <h3 class="gallery-title" data-gallery-title>${C.GALLERY[0].title}</h3>
            <div class="gallery-metaRow">
              <span class="gallery-count"><span data-gallery-n>01</span><span class="gallery-countTotal"> / 0${C.GALLERY.length}</span></span>
              <span class="gallery-progress"><span class="gallery-progressFill"></span></span>
            </div>
            <span class="u-label" data-gallery-meta>${C.GALLERY[0].meta}</span>
            <div class="gallery-controls">
              <button class="gallery-ctrl" data-gallery-prev aria-label="Previous project">&larr;</button>
              <button class="gallery-ctrl" data-gallery-next aria-label="Next project">&rarr;</button>
            </div>
            <div class="gallery-dots" aria-hidden="true">
              ${C.GALLERY.map((g, i) => `<span class="gallery-dot" data-on="${i === 0}"></span>`).join('')}
            </div>
          </div>
          <div class="gallery-stage" data-gallery-stage data-cursor="drag" data-cursor-label="Drag">
            <span class="gallery-stageEdge" aria-hidden="true"></span>
            <span class="gallery-stageTag u-label" data-gallery-tag>${C.GALLERY[0].meta}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- services ---------------------------------------------------------->
    <section class="services-section" id="services" data-ambient="0.3">
      <div class="u-shell">
        <div class="u-head">
          <h2 class="u-title">All the ways we <em>move</em> brands</h2>
          <span class="u-label">[LABEL] Capabilities</span>
        </div>
        <p class="services-intro">[DESCRIPTION] Four practices, one team. Most projects use more than one &mdash; the handoffs are where the work usually goes wrong, so we removed them.</p>
        <div class="services-list">
          ${C.SERVICES.map((sv) => `
            <div class="services-row" data-service-row data-on="false">
              <div class="services-strip" aria-hidden="true">
                ${marquee('', Array.from({ length: 4 }).map(() =>
                  `<span class="services-stripText">${sv.marquee}<span class="services-star">&#10035;</span></span>`).join(''), 22)}
              </div>
              ${[0, 1, 2].map(() => `
                <div class="services-trail" aria-hidden="true">
                  <img class="services-trailImg" src="${media(sv.image)}" alt="">
                </div>`).join('')}
              <button class="services-trigger" type="button" data-cursor="link">
                <span class="services-index">${sv.index}</span>
                <span class="services-title u-display">${sv.title}</span>
                <span class="services-tags">${sv.tags.map((t) => `<span class="services-tag">${t}</span>`).join('')}</span>
                <span class="services-plus" aria-hidden="true"></span>
              </button>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- process ----------------------------------------------------------->
    <section class="process-section" data-ambient="0.36">
      <div class="process-sticky">
        <div class="process-rail" data-rail>
          <div class="process-lead">
            <span class="u-label u-label--accent">[LABEL] How we work</span>
            <h2 class="process-leadTitle">Five steps, <em>no</em> surprises.</h2>
            <p class="process-leadBody">[DESCRIPTION] The same shape every time, whether it is a six-week sprint or a two-year platform.</p>
          </div>
          ${C.PROCESS.map((p) => `
            <article class="process-card">
              <span class="process-cardIndex">${p.index}</span>
              <div>
                <h3 class="process-cardTitle">${p.title}</h3>
                <p class="process-cardBody">${p.body}</p>
              </div>
            </article>`).join('')}
        </div>
        <div class="process-progress" aria-hidden="true">
          <span class="u-label">01</span>
          <span class="process-bar"><span class="process-barFill"></span></span>
          <span class="u-label">0${C.PROCESS.length}</span>
        </div>
      </div>
    </section>

    <!-- statement --------------------------------------------------------->
    <section class="statement-section" data-ambient="0.68">
      <div class="statement-inner u-shell">
        <p class="statement-label u-label u-label--accent">${C.STATEMENT.small}</p>
        <div class="statement-lines">
          ${C.STATEMENT.lines.map((l) => `<span class="statement-line">${l}</span>`).join('')}
        </div>
        <p class="statement-glitch" data-text="[DESCRIPTION] Independent since 2016. Forty-one people across two studios, one shared standard for what counts as finished.">[DESCRIPTION] Independent since 2016. Forty-one people across two studios, one shared standard for what counts as finished.</p>
      </div>
    </section>

    <!-- journal ----------------------------------------------------------->
    <section class="journal-section" id="journal" data-ambient="0.24">
      <div class="u-shell">
        <div class="u-head">
          <h2 class="u-title">From the <em>journal</em></h2>
          <span class="u-label">[LABEL] Notes &amp; opinions</span>
        </div>
        <div class="journal-list">
          ${C.JOURNAL.map((j) => `
            <a class="journal-row" href="#journal" data-cursor="link">
              <span class="journal-index">${j.index}</span>
              <h3 class="journal-title">${j.title}</h3>
              <span class="journal-side">
                <span class="u-label">${j.cat}</span><span class="u-label">${j.date}</span>
              </span>
              <span class="journal-arrow">&#8599;</span>
            </a>`).join('')}
        </div>
      </div>
    </section>

    <!-- cta --------------------------------------------------------------->
    <section class="cta-section" id="contact" data-ambient="1">
      <div class="cta-glow" aria-hidden="true"></div>
      <div class="cta-inner u-shell">
        <h2 class="cta-headline">
          ${mask(`<span class="cta-dim">${C.CTA.headline.lead} </span><em>${C.CTA.headline.em}</em>${C.CTA.headline.tail}`, 'data-cta-line')}
          ${mask(`${C.CTA.second.lead} <em>${C.CTA.second.em}</em> ${C.CTA.second.tail}`, 'data-cta-line')}
        </h2>
        <div class="cta-foot">
          <p class="cta-note">${C.CTA.note}</p>
          <a class="cta-button" href="mailto:hello@example.com" data-cursor="link" data-magnetic="0.4" data-magnetic-radius="90" data-magnetic-inner=".cta-buttonLabel">
            <span class="cta-buttonLabel">${C.CTA.button}</span>
            <span class="cta-buttonArrow">&#8599;</span>
          </a>
        </div>
      </div>
    </section>
  </main>

  <!-- footer -------------------------------------------------------------->
  <footer class="footer-footer" data-ambient="0.6">
    <div class="footer-top u-shell">
      ${C.FOOTER.offices.map((o) => `
        <div class="footer-col">
          <span class="u-label">${o.city}</span>
          <span class="footer-colBody">${o.line1}<br>${o.line2}</span>
        </div>`).join('')}
      <div class="footer-col">
        <span class="u-label">Follow</span>
        <div class="footer-stack">
          ${C.FOOTER.socials.map((x) => `<a class="footer-item" href="#">${x}</a>`).join('')}
        </div>
      </div>
      <div class="footer-col">
        <span class="u-label">Newsletter</span>
        <span class="footer-colBody">[DESCRIPTION] One email a quarter. Work, notes, nothing else.</span>
        <a class="footer-item" href="mailto:hello@example.com">Subscribe &#8599;</a>
      </div>
    </div>

    <div class="footer-markWrap" data-mark data-cursor="view" data-cursor-label="Hello">
      <div class="footer-mark" role="img" aria-label="${C.SITE.wordmark}">
        ${['footer-layerBase', 'footer-layerAccent', 'footer-layerHot'].map((layer) => `
          <div class="footer-layer ${layer}" aria-hidden="true">
            ${Array.from(C.SITE.wordmark).map((ch, i) =>
              `<span class="footer-char" data-char="${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}
          </div>`).join('')}
      </div>
    </div>

    <div class="footer-bottom u-shell">
      <span class="u-label">${C.SITE.year} ${C.SITE.name} &mdash; ${C.SITE.tagline}</span>
      <div class="footer-legal">
        ${C.FOOTER.legal.map((l) => `<a class="footer-item u-label" href="#">${l}</a>`).join('')}
      </div>
      <button class="footer-toTop" data-jump="#top" data-cursor="link">Back to top &uarr;</button>
    </div>
  </footer>`;

  window.__vmRendered = true;
})();

/* ====================================================================== *
 * Motion                                                                 *
 * ====================================================================== */
(() => {
  const { content: C, media: M, shaders: SH } = window.VM;
  const media = (p) => M[p] || p;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const precise = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobile = window.matchMedia('(max-width: 900px)').matches;

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'expo.out', duration: 1.1 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const damp = (a, b, smoothing, dt) => a + (b - a) * (1 - Math.pow(smoothing, dt * 60));

  /* ---------------------------------------------------------- smooth --- */

  let lenis = null;
  if (!reduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  let locks = 0;
  const lock = () => { if (++locks === 1) lenis?.stop(); };
  const unlock = () => { if (--locks <= 0) { locks = 0; lenis?.start(); } };
  const goTo = (sel) => {
    if (lenis) lenis.scrollTo(sel, { duration: 1.6 });
    else $(sel)?.scrollIntoView();
  };

  $$('[data-jump]').forEach((el) =>
    el.addEventListener('click', (e) => { e.preventDefault(); goTo(el.dataset.jump); }));

  /* ------------------------------------------------------------ text --- */

  /** Masked line/word/char split — the same DOM shape the app builds. */
  function split(el, mode) {
    const source = el.textContent || '';
    const targets = [];
    const wrap = (text, block) => {
      const outer = document.createElement('span');
      outer.style.cssText =
        'display:' + (block ? 'block' : 'inline-block') +
        ';overflow:hidden;padding-bottom:.14em;margin-bottom:-.14em;vertical-align:top';
      const inner = document.createElement('span');
      inner.style.cssText = 'display:' + (block ? 'block' : 'inline-block') + ';will-change:transform';
      inner.textContent = text;
      outer.appendChild(inner);
      targets.push(inner);
      return outer;
    };

    if (mode === 'lines') {
      const words = source.split(/\s+/).filter(Boolean);
      el.textContent = '';
      const probes = words.map((w) => {
        const s = document.createElement('span');
        s.style.display = 'inline-block';
        s.textContent = w;
        el.appendChild(s);
        el.appendChild(document.createTextNode(' '));
        return s;
      });
      const lines = [];
      let lastTop = null;
      probes.forEach((p, i) => {
        const top = Math.round(p.offsetTop);
        if (lastTop === null || Math.abs(top - lastTop) > 2) { lines.push([]); lastTop = top; }
        lines[lines.length - 1].push(words[i]);
      });
      el.textContent = '';
      lines.forEach((l) => el.appendChild(wrap(l.join(' '), true)));
    } else if (mode === 'words') {
      el.textContent = '';
      source.split(/(\s+)/).forEach((chunk) => {
        if (!chunk.trim()) el.appendChild(document.createTextNode(chunk));
        else el.appendChild(wrap(chunk, false));
      });
    } else {
      el.textContent = '';
      Array.from(source).forEach((ch) => {
        if (ch === ' ') el.appendChild(document.createTextNode(' '));
        else el.appendChild(wrap(ch, false));
      });
    }

    el.setAttribute('aria-label', source);
    Array.from(el.children).forEach((c) => c.setAttribute && c.setAttribute('aria-hidden', 'true'));
    return targets;
  }

  const GLYPHS = '▚▞█▓▒░/\\<>=+*—ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  function scramble(el, { duration = 1.1, stagger = 0.55 } = {}) {
    const target = el.dataset.text || el.textContent || '';
    const chars = Array.from(target);
    el.setAttribute('aria-label', target);
    const state = { p: 0 };
    return gsap.to(state, {
      p: 1, duration, ease: 'power2.inOut',
      onUpdate: () => {
        el.textContent = chars.map((ch, i) => {
          if (ch === ' ') return ' ';
          const local = (state.p - (i / chars.length) * stagger) / (1 - stagger);
          if (local >= 1) return ch;
          if (local <= 0) return GLYPHS[(i * 7) % GLYPHS.length];
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }).join('');
      },
      onComplete: () => { el.textContent = target; },
    });
  }

  function glitchOnce(el, duration = 0.42) {
    const target = el.dataset.text || el.textContent || '';
    el.dataset.text = target;
    const chars = Array.from(target);
    const state = { p: 0 };
    return gsap.to(state, {
      p: 1, duration, ease: 'none',
      onUpdate: () => {
        const intensity = Math.sin(state.p * Math.PI) * 0.6;
        el.textContent = chars.map((ch) => (ch === ' ' ? ' '
          : Math.random() < intensity ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : ch)).join('');
      },
      onComplete: () => { el.textContent = target; },
    });
  }

  /* ----------------------------------------------------------- webgl --- */

  /**
   * Minimal single-quad renderer.
   *
   * Both surfaces in this design are one quad with a fragment shader, so the
   * Three.js scene graph would be dead weight — but the GLSL is the app's
   * verbatim, which means supplying the two attributes and two matrices that
   * Three would otherwise prepend.
   */
  function quad(holder, { vert, frag, uniforms = {}, textures = {} }) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, depth: false, stencil: false });
    if (!gl) return null;
    holder.appendChild(canvas);

    const PRELUDE =
      'attribute vec3 position;\nattribute vec2 uv;\n' +
      'uniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\n';

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, PRELUDE + vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return null;
    }
    gl.useProgram(prog);

    // Clip-space quad: identity matrices then map position straight through,
    // which is what both vertex shaders expect.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0, 0,   1, -1, 0, 1, 0,
      -1,  1, 0, 0, 1,   1,  1, 0, 1, 1,
    ]), gl.STATIC_DRAW);

    const stride = 5 * 4;
    const aPos = gl.getAttribLocation(prog, 'position');
    const aUv = gl.getAttribLocation(prog, 'uv');
    if (aPos >= 0) { gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0); }
    if (aUv >= 0) { gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, stride, 3 * 4); }

    const I = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
    for (const name of ['projectionMatrix', 'modelViewMatrix']) {
      const loc = gl.getUniformLocation(prog, name);
      if (loc) gl.uniformMatrix4fv(loc, false, I);
    }

    const locs = {};
    const loc = (n) => (n in locs ? locs[n] : (locs[n] = gl.getUniformLocation(prog, n)));

    const set = (name, value) => {
      const l = loc(name);
      if (!l) return;
      if (typeof value === 'number') gl.uniform1f(l, value);
      else if (value.length === 2) gl.uniform2f(l, value[0], value[1]);
    };

    // --- textures ---------------------------------------------------------
    const units = {};
    let unit = 0;
    const makeTexture = (image) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      // Non power-of-two sources need clamping and no mipmaps in WebGL1.
      const pot = (n) => (n & (n - 1)) === 0;
      const repeat = pot(image.width) && pot(image.height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return { tex, width: image.width, height: image.height };
    };

    const bind = (name, entry) => {
      const l = loc(name);
      if (!l || !entry) return;
      const u = units[name] ?? (units[name] = unit++);
      gl.activeTexture(gl.TEXTURE0 + u);
      gl.bindTexture(gl.TEXTURE_2D, entry.tex);
      gl.uniform1i(l, u);
    };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6);
      const w = Math.max(1, Math.round(holder.clientWidth * dpr));
      const h = Math.max(1, Math.round(holder.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      return [w, h];
    };

    return {
      gl, canvas, set, bind, makeTexture, size,
      draw: () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4),
    };
  }

  const loadImage = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

  /* ------------------------------------------------------- hero canvas --- */

  const heroHolder = $('[data-hero-canvas]');
  const hero = heroHolder && quad(heroHolder, { vert: SH.heroVert, frag: SH.heroFrag });

  if (hero) {
    const u = { time: 0, mouse: [0.5, 0.5], scroll: 0, intro: 0 };
    const pointer = { x: 0.5, y: 0.5 };
    let target = 0;

    if (!mobile) {
      window.addEventListener('pointermove', (e) => {
        pointer.x = e.clientX / window.innerWidth;
        pointer.y = e.clientY / window.innerHeight;
      }, { passive: true });
    }

    ScrollTrigger.create({
      trigger: $('.hero-hero'), start: 'top top', end: 'bottom top',
      onUpdate: (self) => { target = self.progress; },
    });

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
      .observe(heroHolder);

    const start = performance.now();
    let last = start;

    const frame = (now) => {
      requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!visible) return;

      const [w, h] = hero.size();
      u.time = (now - start) / 1000;
      u.scroll = damp(u.scroll, target, 0.001, dt);
      u.intro = damp(u.intro, 1, 0.02, dt);
      u.mouse[0] = damp(u.mouse[0], pointer.x, 0.02, dt);
      u.mouse[1] = damp(u.mouse[1], pointer.y, 0.02, dt);

      hero.set('uRes', [w, h]);
      hero.set('uTime', u.time);
      hero.set('uMouse', u.mouse);
      hero.set('uScroll', u.scroll);
      hero.set('uIntro', u.intro);
      hero.set('uOctaves', mobile ? 3 : 4);
      hero.draw();
    };

    if (reduced) {
      const [w, h] = hero.size();
      hero.set('uRes', [w, h]); hero.set('uTime', 12); hero.set('uMouse', [0.5, 0.5]);
      hero.set('uScroll', 0); hero.set('uIntro', 1); hero.set('uOctaves', 4);
      hero.draw();
    } else {
      requestAnimationFrame(frame);
    }
  } else if (heroHolder) {
    // No WebGL — the hero keeps its composition, just without the motion.
    const fallback = document.createElement('div');
    fallback.className = 'hero-fallback';
    heroHolder.replaceWith(fallback);
  }

  /* ----------------------------------------------------------- gallery --- */

  const stage = $('[data-gallery-stage]');
  if (stage) {
    const g = quad(stage, { vert: SH.galleryVert, frag: SH.galleryFrag });
    let index = 0;

    const paint = () => {
      $('[data-gallery-title]').textContent = C.GALLERY[index].title;
      $('[data-gallery-meta]').textContent = C.GALLERY[index].meta;
      $('[data-gallery-tag]').textContent = C.GALLERY[index].meta;
      $('[data-gallery-n]').textContent = String(index + 1).padStart(2, '0');
      $$('.gallery-dot').forEach((d, i) => d.dataset.on = String(i === index));
      gsap.to('.gallery-progressFill', {
        scaleX: (index + 1) / C.GALLERY.length, duration: 0.9, ease: 'expo.out',
      });
      if (!reduced) {
        gsap.fromTo('[data-gallery-title]',
          { yPercent: 40, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', overwrite: true });
      }
    };

    if (g) {
      (async () => {
        const imgs = await Promise.all(C.GALLERY.map((x) => loadImage(media(x.image))));
        const disp = await loadImage(media('/media/displacement.jpg'));
        const texes = imgs.map((i) => g.makeTexture(i));
        const dispTex = g.makeTexture(disp);

        const u = { progress: 1, mouse: [0, 0], hover: 0 };
        const wants = { x: 0, y: 0, hover: 0 };
        let from = 0, to = 0, tween = null;

        const advance = (next) => {
          next = (next + C.GALLERY.length) % C.GALLERY.length;
          if (next === to) return;
          tween?.kill();
          from = to; to = next; index = next;
          u.progress = 0;
          tween = gsap.to(u, { progress: 1, duration: reduced ? 0.35 : 1.25, ease: 'power2.inOut' });
          paint();
        };

        $('[data-gallery-next]').addEventListener('click', () => advance(to + 1));
        $('[data-gallery-prev]').addEventListener('click', () => advance(to - 1));

        stage.addEventListener('pointermove', (e) => {
          const r = stage.getBoundingClientRect();
          wants.x = (e.clientX - r.left) / r.width - 0.5;
          wants.y = 0.5 - (e.clientY - r.top) / r.height;
        });
        stage.addEventListener('pointerenter', () => { wants.hover = 1; });
        stage.addEventListener('pointerleave', () => { wants.hover = 0; });

        // Drag / swipe, threshold based — scrubbing a dissolve back and forth
        // just looks broken.
        let drag = null;
        stage.addEventListener('pointerdown', (e) => { drag = e.clientX; });
        stage.addEventListener('pointermove', (e) => {
          if (drag === null) return;
          const dx = e.clientX - drag;
          if (Math.abs(dx) < 64) return;
          drag = null;
          advance(to + (dx < 0 ? 1 : -1));
        });
        stage.addEventListener('pointerup', (e) => {
          if (drag !== null && Math.abs(e.clientX - drag) < 6) advance(to + 1);
          drag = null;
        });

        let paused = false;
        stage.addEventListener('pointerenter', () => { paused = true; });
        stage.addEventListener('pointerleave', () => { paused = false; });
        if (!reduced) {
          setInterval(() => {
            if (!paused && document.visibilityState === 'visible') advance(to + 1);
          }, 5200);
        }

        let visible = true;
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);

        let last = performance.now();
        const frame = (now) => {
          requestAnimationFrame(frame);
          const dt = Math.min((now - last) / 1000, 1 / 30);
          last = now;
          if (!visible) return;

          const [w, h] = g.size();
          const live = precise ? wants : { x: 0, y: 0, hover: 0 };
          u.mouse[0] = damp(u.mouse[0], live.x, 0.008, dt);
          u.mouse[1] = damp(u.mouse[1], live.y, 0.008, dt);
          u.hover = damp(u.hover, live.hover, 0.01, dt);

          g.bind('uFrom', texes[from]);
          g.bind('uTo', texes[to]);
          g.bind('uDisp', dispTex);
          g.set('uProgress', u.progress);
          g.set('uMouse', u.mouse);
          g.set('uHover', u.hover);
          g.set('uIntensity', 0.42);
          g.set('uPlane', [w, h]);
          g.set('uFromSize', [texes[from].width, texes[from].height]);
          g.set('uToSize', [texes[to].width, texes[to].height]);
          g.draw();
        };
        requestAnimationFrame(frame);
      })();
    } else {
      // Cross-fade fallback, same crop and rhythm.
      C.GALLERY.forEach((x, i) => {
        const im = document.createElement('img');
        im.className = 'gallery-fallbackImg';
        im.src = media(x.image);
        im.dataset.on = String(i === 0);
        stage.prepend(im);
      });
      const advance = (n) => {
        index = (n + C.GALLERY.length) % C.GALLERY.length;
        $$('.gallery-fallbackImg').forEach((el, i) => el.dataset.on = String(i === index));
        paint();
      };
      $('[data-gallery-next]').addEventListener('click', () => advance(index + 1));
      $('[data-gallery-prev]').addEventListener('click', () => advance(index - 1));
    }
  }

  /* ------------------------------------------------------------ cursor --- */

  if (precise) {
    const root = $('[data-cursor-root]');
    const ring = $('.cursor-ring'), dot = $('.cursor-dot');
    const disc = $('.cursor-disc'), glow = $('.cursor-glow'), label = $('.cursor-label');

    const q = (el, d) => ({
      x: gsap.quickTo(el, 'x', { duration: d, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: d, ease: 'power3' }),
    });
    const qd = q(dot, 0.12), qr = q(ring, 0.42), qg = q(glow, 1.1);
    let shown = false;

    window.addEventListener('pointermove', (e) => {
      if (!shown) { shown = true; gsap.to(root, { opacity: 1, duration: 0.4 }); }
      qd.x(e.clientX); qd.y(e.clientY);
      qr.x(e.clientX); qr.y(e.clientY);
      qg.x(e.clientX); qg.y(e.clientY);
    }, { passive: true });

    const setState = (state, text) => {
      const active = state === 'view' || state === 'drag';
      if (text) label.textContent = text;
      gsap.to(disc, { scale: active ? 1 : 0, duration: 0.5, ease: 'expo.out' });
      gsap.to(ring, {
        scale: active ? 1.85 : state === 'link' ? 1.5 : 1,
        borderColor: active || state === 'link' ? 'rgba(244,241,236,0)' : 'rgba(244,241,236,0.55)',
        duration: 0.5, ease: 'expo.out',
      });
      gsap.to(dot, { scale: state === 'link' ? 2.4 : active ? 0 : 1, duration: 0.4, ease: 'expo.out' });
      gsap.to(label, { opacity: active ? 1 : 0, duration: active ? 0.35 : 0.15, delay: active ? 0.08 : 0 });
    };

    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest?.('[data-cursor], a, button');
      if (!t) return setState(null);
      setState(t.dataset.cursor || 'link', t.dataset.cursorLabel);
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      gsap.to(root, { opacity: 0, duration: 0.3 });
      shown = false;
    });
  } else {
    $('[data-cursor-root]')?.remove();
  }

  /* ---------------------------------------------------------- magnetic --- */

  if (precise && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic);
      const radius = parseFloat(el.dataset.magneticRadius || '60');
      const inner = el.dataset.magneticInner ? $(el.dataset.magneticInner, el) : null;
      const xTo = gsap.quickTo(el, 'x', { duration: 0.85, ease: 'elastic.out(1, 0.55)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.85, ease: 'elastic.out(1, 0.55)' });
      const ix = inner && gsap.quickTo(inner, 'x', { duration: 1, ease: 'elastic.out(1, 0.5)' });
      const iy = inner && gsap.quickTo(inner, 'y', { duration: 1, ease: 'elastic.out(1, 0.5)' });
      let inside = false;

      window.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const near = Math.abs(dx) < r.width / 2 + radius && Math.abs(dy) < r.height / 2 + radius;
        if (near) {
          inside = true;
          xTo(dx * strength); yTo(dy * strength);
          ix?.(dx * strength * 0.55); iy?.(dy * strength * 0.55);
        } else if (inside) {
          inside = false;
          xTo(0); yTo(0); ix?.(0); iy?.(0);
        }
      }, { passive: true });
    });
  }

  /* ---------------------------------------------------------- marquees --- */

  if (!reduced) {
    $$('[data-marquee]').forEach((root) => {
      const track = $('.marquee-track', root);
      const tween = gsap.to(track, {
        xPercent: -50, duration: parseFloat(root.dataset.dur), ease: 'none', repeat: -1,
      });
      ScrollTrigger.create({
        trigger: root, start: 'top bottom', end: 'bottom top',
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-3.2, 3.2, self.getVelocity() / 420);
          gsap.to(tween, {
            timeScale: 1 + Math.abs(v) * (v > 0 ? 1 : -0.55),
            duration: 0.35, overwrite: true,
            onComplete: () => gsap.to(tween, { timeScale: 1, duration: 1.4, ease: 'power2.out' }),
          });
        },
      });
    });
  }

  /* -------------------------------------------------------- atmosphere --- */

  const ambient = $('[data-ambient-layer]');
  if (!reduced) {
    const paths = [{ x: 14, y: -9, t: 27 }, { x: -18, y: 12, t: 34 }, { x: 10, y: 15, t: 41 }];
    $$('.atmosphere-blob').forEach((b, i) => {
      const p = paths[i % paths.length];
      gsap.to(b, { xPercent: p.x, yPercent: p.y, duration: p.t, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to(b, { scale: 1.18, duration: p.t * 0.62, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });
    ScrollTrigger.create({
      trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.2,
      onUpdate: (self) => gsap.set(ambient, { yPercent: -18 * self.progress }),
    });
  }
  $$('[data-ambient]').forEach((section) => {
    const to = parseFloat(section.dataset.ambient);
    ScrollTrigger.create({
      trigger: section, start: 'top 70%', end: 'bottom 30%',
      onToggle: (self) => ambient?.style.setProperty('--ambient', String(self.isActive ? to : 0.28)),
    });
  });

  /* --------------------------------------------------------- preloader --- */

  const loader = $('[data-preloader]');
  const seen = (() => { try { return sessionStorage.getItem('vm:seen') === '1'; } catch { return false; } })();

  const startPage = () => {
    document.documentElement.dataset.intro = 'done';
    window.dispatchEvent(new Event('vm:intro'));
  };

  lock();
  if (reduced || seen) {
    gsap.set(loader, { autoAlpha: 0 });
    unlock(); startPage();
  } else {
    try { sessionStorage.setItem('vm:seen', '1'); } catch {}
    const state = { v: 0 };
    const out = $('[data-count-out]');
    const tl = gsap.timeline();
    tl.to('.preloader-glow', { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0)
      .to(state, {
        v: 100, duration: 1.45, ease: 'power2.inOut',
        onUpdate: () => { out.textContent = String(Math.round(state.v)).padStart(3, '0'); },
      }, 0)
      .to('.preloader-barFill', { scaleX: 1, duration: 1.45, ease: 'power2.inOut' }, 0)
      .add(scramble($('.preloader-word'), { duration: 1.15 }), 0.2)
      .to('.preloader-inner', { yPercent: -110, opacity: 0, duration: 0.8, ease: 'power3.inOut' })
      .to(loader, {
        clipPath: 'inset(0 0 100% 0)', duration: 1.05, ease: 'power4.inOut',
        onStart: () => { unlock(); startPage(); },
        onComplete: () => loader.remove(),
      }, '-=0.55');
  }

  const onIntro = (fn) => {
    if (document.documentElement.dataset.intro === 'done') fn();
    else window.addEventListener('vm:intro', fn, { once: true });
  };

  /* ------------------------------------------------------------ header --- */

  const header = $('[data-header]');
  if (!reduced) {
    gsap.set(header, { yPercent: -110, opacity: 0 });
    onIntro(() => gsap.to(header, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out' }));
  }

  let headerHidden = false;
  ScrollTrigger.create({
    start: 'top -80', end: 'max',
    onUpdate: (self) => {
      if (document.documentElement.dataset.menu === 'open') return;
      const down = self.direction === 1;
      if (down === headerHidden) return;
      headerHidden = down;
      gsap.to(header, {
        yPercent: down ? -130 : 0, duration: reduced ? 0 : 0.65,
        ease: 'power3.out', overwrite: true,
      });
    },
  });

  if (!reduced) {
    const markGlitch = $('[data-glitch]');
    $('.header-mark').addEventListener('pointerenter', () => glitchOnce(markGlitch, 0.4));
  }

  /* -------------------------------------------------------------- menu --- */

  const overlay = $('[data-menu]');
  const toggle = $('[data-menu-toggle]');
  const bars = $$('[data-burger] span');

  {
    const labels = $$('.menu-label'), indices = $$('.menu-index');
    const rows = $$('.menu-row'), cols = $$('.menu-col', overlay);
    gsap.set([...labels, ...indices], { yPercent: 115 });
    gsap.set(cols, { opacity: 0, y: 20 });
    gsap.set(rows, { scaleX: 0, transformOrigin: 'left center' });

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power4.inOut' } })
      .to('.menu-panelAccent', { clipPath: 'inset(0% 0 0 0)', duration: 0.72 })
      .to('.menu-panelBase', { clipPath: 'inset(0% 0 0 0)', duration: 0.78 }, 0.14)
      .to('.menu-panelAccent', { clipPath: 'inset(0 0 100% 0)', duration: 0.6 }, 0.52)
      .to(rows, { scaleX: 1, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, 0.5)
      .to(labels, { yPercent: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out' }, 0.58)
      .to(indices, { yPercent: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.62)
      .to(cols, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.8);
    if (reduced) tl.timeScale(4);

    let open = false;
    const setOpen = (next) => {
      if (next === open) return;
      open = next;
      overlay.dataset.open = String(open);
      overlay.setAttribute('aria-hidden', String(!open));
      header.dataset.open = String(open);
      document.documentElement.dataset.menu = open ? 'open' : 'closed';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      $$('[data-menu-link]').forEach((a) => a.tabIndex = open ? 0 : -1);

      const page = $('#main');
      if (open) {
        lock();
        tl.timeScale(1).play();
        gsap.to(page, { scale: 0.97, opacity: 0.5, duration: 1.1, ease: 'power4.inOut', transformOrigin: 'center top' });
      } else {
        unlock();
        if (tl.progress() > 0) tl.timeScale(1.7).reverse();
        gsap.to(page, { scale: 1, opacity: 1, duration: 0.8, ease: 'power4.inOut' });
      }

      const d = reduced ? 0 : 0.5;
      gsap.to(bars[0], { y: open ? 4.5 : 0, rotate: open ? 45 : 0, duration: d, ease: 'power4.inOut' });
      gsap.to(bars[1], {
        y: open ? -4.5 : 0, rotate: open ? -45 : 0, width: open ? '100%' : '62%',
        duration: d, ease: 'power4.inOut', delay: reduced ? 0 : 0.04,
      });
    };

    toggle.addEventListener('click', () => setOpen(!open));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    $$('[data-menu-link]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
      setTimeout(() => goTo(a.dataset.jump), 620);
    }));

    // Preview plate trailing the pointer across the links.
    if (precise && !reduced) {
      const box = $('[data-menu-preview]');
      const imgs = $$('.menu-previewImg');
      const xTo = gsap.quickTo(box, 'x', { duration: 0.9, ease: 'power3' });
      const yTo = gsap.quickTo(box, 'y', { duration: 0.9, ease: 'power3' });
      window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });

      $$('.menu-link').forEach((link, i) => {
        link.addEventListener('pointerenter', () => {
          gsap.to(box, { opacity: 1, duration: 0.4, overwrite: true });
          gsap.to(imgs, { opacity: 0, duration: 0.3, overwrite: true });
          gsap.fromTo(imgs[i],
            { opacity: 0, scale: 1.16, clipPath: 'inset(100% 0 0 0)' },
            { opacity: 1, scale: 1, clipPath: 'inset(0% 0 0 0)', duration: 1, ease: 'expo.out', overwrite: true });
        });
        link.addEventListener('pointerleave', () =>
          gsap.to(box, { opacity: 0, duration: 0.35, overwrite: true }));
      });
    }
  }

  /* --------------------------------------------------------------- hero --- */

  {
    const lines = $$('[data-hero-line]'), rise = $$('[data-hero-rise]');
    if (!reduced) {
      gsap.set(lines, { yPercent: 118, rotate: 2.5 });
      gsap.set(rise, { opacity: 0, y: 18 });
      onIntro(() => {
        gsap.timeline({ defaults: { ease: 'expo.out' } })
          .to(lines, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.11 })
          .to(rise, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, '-=1.05');
      });

      gsap.to('[data-hero-parallax]', {
        yPercent: -46, opacity: 0, filter: 'blur(7px)', ease: 'none',
        scrollTrigger: { trigger: '.hero-hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
      gsap.to('.hero-clients', {
        yPercent: -140, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero-hero', start: 'top top', end: '65% top', scrub: 0.6 },
      });
    }
  }

  /* ---------------------------------------------------------- manifesto --- */

  if (!reduced) {
    gsap.timeline({
      scrollTrigger: { trigger: '.manifesto-section', start: 'top top', end: '58% top', scrub: 0.5 },
    }).fromTo('.manifesto-word',
      { color: 'rgba(244,241,236,0.14)', y: 8 },
      { color: 'rgba(244,241,236,1)', y: 0, duration: 1, stagger: 0.5, ease: 'none' });

    gsap.fromTo('.manifesto-plate', { yPercent: -8, scale: 1.16 }, {
      yPercent: 8, scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.manifesto-section', start: 'top bottom', end: 'bottom top', scrub: 1 },
    });

    gsap.from('.manifesto-body', {
      opacity: 0, y: 26, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.manifesto-section', start: '38% center' },
    });
  } else {
    gsap.set('.manifesto-word', { color: 'var(--fg)' });
  }

  $$('[data-count]').forEach((el) => {
    const raw = el.dataset.count;
    const num = parseFloat(raw);
    if (Number.isNaN(num)) return;
    const suffix = raw.replace(/^[\d.]+/, '');
    const proxy = { v: 0 };
    gsap.to(proxy, {
      v: num, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: () => {
        el.textContent = (num % 1 ? proxy.v.toFixed(1) : Math.round(proxy.v)) + suffix;
      },
    });
  });

  /* ------------------------------------------------------------- expand --- */

  if (!reduced) {
    gsap.timeline({
      scrollTrigger: { trigger: '.expand-section', start: 'top top', end: 'bottom bottom', scrub: 0.6 },
    })
      .fromTo('.expand-frame',
        { clipPath: 'inset(30% 34% 30% 34% round 6px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo('.expand-frameMedia', { scale: 1.45 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo('.expand-word', { yPercent: 18, scale: 1.06 }, { yPercent: -32, scale: 1, ease: 'none', duration: 1 }, 0)
      .fromTo('.expand-wordSub', { opacity: 1, y: 0 }, { opacity: 0, y: -40, ease: 'none', duration: 0.35 }, 0)
      .fromTo(['.expand-caption', '.expand-tick'], { opacity: 0, y: 24 },
        { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 }, 0.62);
  } else {
    gsap.set('.expand-frame', { clipPath: 'inset(0% 0% 0% 0% round 0px)' });
    gsap.set(['.expand-caption', '.expand-tick'], { opacity: 1 });
  }

  /* --------------------------------------------------------------- work --- */

  {
    const cards = $$('.work-card');
    if (!reduced) {
      cards.forEach((card, i) => {
        const inner = $('.work-inner', card);
        const mediaEl = $('.work-media', card);

        gsap.fromTo(mediaEl, { yPercent: -8 }, {
          yPercent: 8, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
        });

        if (i < cards.length - 1) {
          gsap.to(inner, {
            scale: 0.9, filter: 'brightness(0.42) saturate(0.7)', ease: 'none',
            scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: 0.4 },
          });
        }

        const title = $('.work-title', card);
        const targets = split(title, 'lines');
        gsap.set(targets, { yPercent: 110 });
        gsap.to(targets, {
          yPercent: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out',
          scrollTrigger: { trigger: card, start: 'top 55%' },
        });
      });

      if (precise) {
        cards.forEach((card) => {
          const inner = $('.work-inner', card), mediaEl = $('.work-media', card);
          const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.9, ease: 'power3' });
          const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.9, ease: 'power3' });
          inner.addEventListener('pointermove', (e) => {
            const r = inner.getBoundingClientRect();
            rx(-((e.clientY - r.top) / r.height - 0.5) * 4);
            ry(((e.clientX - r.left) / r.width - 0.5) * 5);
          });
          inner.addEventListener('pointerenter', () => {
            gsap.set(inner, { transformPerspective: 1400 });
            gsap.to(mediaEl, { scale: 1.06, duration: 1.1, ease: 'expo.out' });
          });
          inner.addEventListener('pointerleave', () => {
            rx(0); ry(0);
            gsap.to(mediaEl, { scale: 1, duration: 1.1, ease: 'expo.out' });
          });
        });
      }
    }
  }

  /* ----------------------------------------------------------- services --- */

  {
    const TRAIL = [{ lag: 0.35, opacity: 1, scale: 1 },
                   { lag: 0.62, opacity: 0.45, scale: 0.94 },
                   { lag: 0.92, opacity: 0.2, scale: 0.88 }];

    if (!reduced) {
      $$('.services-title').forEach((title) => {
        const targets = split(title, 'words');
        gsap.set(targets, { yPercent: 110 });
        gsap.to(targets, {
          yPercent: 0, duration: 1.1, stagger: 0.05, ease: 'expo.out',
          scrollTrigger: { trigger: title, start: 'top 90%' },
        });
      });
      $$('.services-row').forEach((row, i) => {
        gsap.from(row, {
          opacity: 0, duration: 0.9, ease: 'power2.out', delay: i * 0.04,
          scrollTrigger: { trigger: row, start: 'top 92%' },
        });
      });
    }

    $$('[data-service-row]').forEach((row) => {
      const strip = $('.services-strip', row);
      const title = $('.services-title', row);
      const trails = $$('.services-trail', row);
      const movers = trails.map((t, i) =>
        gsap.quickTo(t, 'x', { duration: TRAIL[i].lag, ease: 'power3' }));

      const on = () => {
        row.dataset.on = 'true';
        if (!precise || reduced) return;
        gsap.to(strip, { opacity: 1, duration: 0.6, ease: 'power2.out' });
        gsap.to(title, { x: 18, duration: 0.9, ease: 'expo.out' });
        trails.forEach((t, i) => gsap.to(t, {
          opacity: TRAIL[i].opacity, scale: TRAIL[i].scale,
          duration: 0.6, delay: i * 0.04, ease: 'expo.out',
        }));
      };
      const off = () => {
        row.dataset.on = 'false';
        if (!precise || reduced) return;
        gsap.to(strip, { opacity: 0, duration: 0.45 });
        gsap.to(title, { x: 0, duration: 0.9, ease: 'expo.out' });
        gsap.to(trails, { opacity: 0, scale: 0.8, duration: 0.4, stagger: 0.03 });
      };

      row.addEventListener('pointerenter', on);
      row.addEventListener('pointerleave', off);
      row.addEventListener('pointermove', (e) => {
        if (!precise) return;
        const r = row.getBoundingClientRect();
        movers.forEach((m) => m(e.clientX - r.left));
      });
    });
  }

  /* ------------------------------------------------------------ process --- */

  {
    const section = $('.process-section');
    const rail = $('[data-rail]');
    const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth);

    if (reduced) {
      section.style.height = 'auto';
      $('.process-sticky').style.cssText += ';position:relative;height:auto';
      rail.style.overflowX = 'auto';
    } else {
      const sizeSection = () => { section.style.height = `${distance() + window.innerHeight}px`; };
      sizeSection();
      ScrollTrigger.addEventListener('refreshInit', sizeSection);

      gsap.to(rail, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => `+=${distance()}`,
          scrub: 0.7, invalidateOnRefresh: true,
        },
      });
      gsap.to('.process-barFill', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: 0.4 },
      });
      $$('.process-card').forEach((card, i) => {
        gsap.fromTo(card, { y: 34 + i * 5 }, {
          y: -20, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: 1.1 },
        });
      });
    }
  }

  /* ---------------------------------------------------------- statement --- */

  if (!reduced) {
    const lines = $$('.statement-line');
    lines.forEach((line, i) => {
      const targets = split(line, 'chars');
      gsap.set(targets, { yPercent: 120, rotate: i % 2 ? -6 : 6 });
      gsap.to(targets, {
        yPercent: 0, rotate: 0, duration: 1.4, ease: 'expo.out',
        stagger: { each: 0.022, from: i % 2 ? 'end' : 'start' },
        scrollTrigger: { trigger: line, start: 'top 88%' },
      });
      gsap.fromTo(line, { xPercent: i % 2 ? 3 : -3 }, {
        xPercent: i % 2 ? -3 : 3, ease: 'none',
        scrollTrigger: { trigger: '.statement-section', start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
    });

    ScrollTrigger.create({
      trigger: '.statement-glitch', start: 'top 85%', once: true,
      onEnter: () => scramble($('.statement-glitch'), { duration: 1.8, stagger: 0.6 }),
    });
  }

  /* ------------------------------------------------------------ journal --- */

  if (!reduced) {
    gsap.from('.journal-row', {
      yPercent: 30, opacity: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out',
      scrollTrigger: { trigger: '.journal-list', start: 'top 85%' },
    });
  }

  /* ---------------------------------------------------------------- cta --- */

  if (!reduced) {
    $$('[data-cta-line]').forEach((line, i) => {
      const targets = split(line, 'words');
      gsap.set(targets, { yPercent: 115 });
      gsap.to(targets, {
        yPercent: 0, duration: 1.3, stagger: 0.05, ease: 'expo.out', delay: i * 0.06,
        scrollTrigger: { trigger: '.cta-section', start: 'top 72%' },
      });
    });
    gsap.from('.cta-foot', {
      opacity: 0, y: 30, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.cta-foot', start: 'top 92%' },
    });
    gsap.fromTo('.cta-glow', { scale: 0.72, opacity: 0.35 }, {
      scale: 1.06, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '.cta-section', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
    });
  }

  /* ------------------------------------------------------------- footer --- */

  {
    const wrap = $('[data-mark]');
    if (!reduced) {
      gsap.from('.footer-layer', {
        yPercent: 42, duration: 1.6, ease: 'expo.out',
        scrollTrigger: { trigger: wrap, start: 'top 95%' },
      });
    }

    const setMask = (x, y) => {
      wrap.style.setProperty('--mx', `${x}%`);
      wrap.style.setProperty('--my', `${y}%`);
    };

    if (!precise || reduced) {
      const drift = { x: 30, y: 50 };
      gsap.to(drift, {
        x: 70, duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true,
        onUpdate: () => setMask(drift.x, drift.y),
      });
    } else {
      const groups = Array.from(C.SITE.wordmark).map((_, i) => $$(`[data-char="${i}"]`, wrap));
      const setters = groups.map((g) => gsap.quickSetter(g, 'y', 'px'));
      const current = new Float32Array(groups.length);
      const pointer = { x: -9999, inside: 0 };
      const mask = { x: 50, y: 50 };
      let lastMask = { x: -1, y: -1 };
      let lastT = performance.now();

      wrap.addEventListener('pointermove', (e) => {
        const r = wrap.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        mask.x = (pointer.x / r.width) * 100;
        mask.y = ((e.clientY - r.top) / r.height) * 100;
      });
      wrap.addEventListener('pointerenter', () => { pointer.inside = 1; });
      wrap.addEventListener('pointerleave', () => { pointer.inside = 0; });

      gsap.ticker.add(() => {
        const now = performance.now();
        const dt = Math.min((now - lastT) / 1000, 1 / 30);
        lastT = now;

        // Custom properties force the mask to recompute, so only write on move.
        if (Math.abs(mask.x - lastMask.x) > 0.05 || Math.abs(mask.y - lastMask.y) > 0.05) {
          setMask(mask.x, mask.y);
          lastMask = { x: mask.x, y: mask.y };
        }

        const wrapLeft = wrap.getBoundingClientRect().left;
        groups.forEach((g, i) => {
          const r = g[0].getBoundingClientRect();
          const d = (pointer.x - (r.left - wrapLeft + r.width / 2)) / 220;
          const target = pointer.inside ? -Math.exp(-d * d) * 26 : 0;
          current[i] = damp(current[i], target, 0.0015, dt);
          setters[i](current[i]);
        });
      });
    }
  }

  // Fonts land after first paint and change every measured height.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
