/**
 * Assembles `preview/index.html` — a single self-contained file of the site,
 * for publishing somewhere a Node server can't run.
 *
 * It is a static export, not a second codebase: the stylesheet, the GLSL and
 * the copy are all read out of the real source here at build time, so the only
 * thing written twice is the motion orchestration in `preview/app.js`.
 *
 *   node scripts/build-preview.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

/* ------------------------------------------------------------------ css -- */

/**
 * CSS Modules scope class names by hashing them at build time. Nothing does
 * that here, so each module's own classes are namespaced by hand instead —
 * `.title` in Work.module.css becomes `.work-title`.
 */
function scopeModule(css, prefix) {
  // Collect names from selector positions only. Scanning the whole file would
  // also pick up things like the `.png` in a url().
  let selectors = css;
  let prev;
  do {
    prev = selectors;
    selectors = selectors.replace(/\{[^{}]*\}/g, '{}');
  } while (selectors !== prev);

  const classes = new Set();
  for (const m of selectors.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
    // `u-` classes are the shared globals and must stay unscoped.
    if (!m[1].startsWith('u-')) classes.add(m[1]);
  }

  let out = css;
  for (const name of [...classes].sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(`\\.${name}(?![\\w-])`, 'g'), `.${prefix}-${name}`);
  }

  // Keyframe names are global too, so two modules animating `drift` would
  // collide.
  const frames = new Set();
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) frames.add(m[1]);
  for (const name of frames) {
    out = out
      .replace(new RegExp(`(@keyframes\\s+)${name}(?![\\w-])`, 'g'), `$1${prefix}-${name}`)
      .replace(new RegExp(`(animation\\s*:[^;]*?\\b)${name}(?![\\w-])`, 'g'), `$1${prefix}-${name}`);
  }

  return out;
}

const modules = readdirSync(join(ROOT, 'components'))
  .filter((f) => f.endsWith('.module.css'))
  .sort();

const fonts = inlineFonts();

const css = [
  fonts.css,
  read('styles', 'globals.css'),
  ...modules.map((f) =>
    `\n/* ===== ${f} ===== */\n` +
    scopeModule(read('components', f), f.replace('.module.css', '').toLowerCase()),
  ),
].join('\n');

/* ----------------------------------------------------------------- fonts -- */

/**
 * next/font self-hosts its faces into .next/static/media at build time, so the
 * exact same files the app serves can be inlined here — no CDN, no network at
 * view time. Only the basic-latin subsets are kept; the extended ranges would
 * roughly triple the weight for glyphs this copy never uses.
 */
function inlineFonts() {
  const dir = join(ROOT, '.next', 'static');
  const css = readdirSync(join(dir, 'chunks'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => read('.next', 'static', 'chunks', f))
    .join('\n');

  const faces = [...css.matchAll(/@font-face\{[^}]*\}/g)].map((m) => m[0]);
  const latin = faces.filter((f) => /unicode-range:U\+\?\?/.test(f));

  if (!latin.length) {
    throw new Error('no inlined font faces found — run `next build` first');
  }

  const seen = new Set();
  const out = [];
  for (const face of latin) {
    const file = face.match(/url\(\.\.\/media\/([^)]+)\)/)?.[1];
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const buf = readFileSync(join(dir, 'media', file));
    out.push(
      face.replace(
        /url\(\.\.\/media\/[^)]+\)/,
        `url(data:font/woff2;base64,${buf.toString('base64')})`,
      ),
    );
  }

  // globals.css reads these; next/font would normally supply them.
  out.push(`:root{--font-serif:'Instrument Serif';--font-grotesk:'Inter Tight';--font-code:'JetBrains Mono'}`);
  return { css: out.join('\n'), count: seen.size };
}

/* --------------------------------------------------------------- shaders -- */

/** Pulls the GLSL out of the exported template literals in lib/shaders. */
function glsl(file, name) {
  const src = read('lib', 'shaders', file);
  const m = src.match(new RegExp(`export const ${name} = /\\* glsl \\*/ \`([\\s\\S]*?)\`;`));
  if (!m) throw new Error(`could not extract ${name} from ${file}`);
  return m[1];
}

const shaders = {
  heroVert: glsl('hero.ts', 'heroVert'),
  heroFrag: glsl('hero.ts', 'heroFrag'),
  galleryVert: glsl('gallery.ts', 'galleryVert'),
  galleryFrag: glsl('gallery.ts', 'galleryFrag'),
};

/* --------------------------------------------------------------- content -- */

/**
 * Loads lib/content.ts as data.
 *
 * Transpiled with the real compiler rather than regex-stripped: type
 * assertions and `satisfies` clauses are trivially easy to get wrong by hand,
 * and getting them wrong silently corrupts the copy.
 */
async function loadContent() {
  const out = mkdtempSync(join(tmpdir(), 'vm-content-'));
  try {
    execFileSync(
      'npx',
      ['tsc', 'lib/content.ts', '--ignoreConfig', '--outDir', out,
       '--target', 'es2020', '--module', 'esnext', '--skipLibCheck'],
      { cwd: ROOT, stdio: 'pipe' },
    );
    const mod = await import(pathToFileURL(join(out, 'content.js')).href);
    // Drop the type-only exports, which transpile away to nothing.
    return Object.fromEntries(
      Object.entries(mod).filter(([, v]) => v !== undefined),
    );
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

/* ----------------------------------------------------------------- media -- */

/* Every asset has to be inlined: an artifact is one file, and its CSP blocks
   images from anywhere else. Sized for screen, not for print. */
const MEDIA = [
  ...[1, 2, 3, 4, 5, 6].map((i) => [`work-0${i}`, 1280, 72]),
  ...[1, 2, 3, 4].map((i) => [`gallery-0${i}`, 900, 72]),
  ...[1, 2, 3, 4].map((i) => [`svc-0${i}`, 440, 70]),
  ['plate-wide', 1440, 70],
  ['displacement', 512, 70],
];

async function loadMedia() {
  const out = {};
  let bytes = 0;
  for (const [name, width, quality] of MEDIA) {
    const buf = await sharp(join(ROOT, 'public', 'media', `${name}.jpg`))
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    bytes += buf.length;
    out[`/media/${name}.jpg`] = `data:image/jpeg;base64,${buf.toString('base64')}`;
  }
  const grain = readFileSync(join(ROOT, 'public', 'media', 'grain.png'));
  bytes += grain.length;
  out['/media/grain.png'] = `data:image/png;base64,${grain.toString('base64')}`;
  return { out, bytes };
}

/* ------------------------------------------------------------------ main -- */

const content = await loadContent();
const { out: media, bytes } = await loadMedia();

const libs = [
  'node_modules/gsap/dist/gsap.min.js',
  'node_modules/gsap/dist/ScrollTrigger.min.js',
  'node_modules/lenis/dist/lenis.min.js',
].map((p) => readFileSync(join(ROOT, p), 'utf8')).join('\n;\n');

const app = read('preview', 'app.js');
const body = read('preview', 'body.html');

// The stylesheet references media by path; rewrite those to the inlined data.
let styles = css;
for (const [path, uri] of Object.entries(media)) {
  styles = styles.split(`url('${path}')`).join(`url('${uri}')`);
}

const html = `<title>${content.SITE.name}</title>
<style>
${styles}
</style>

${body}

<script>
${libs}
</script>
<script>
window.VM = {
  content: ${JSON.stringify(content)},
  media: ${JSON.stringify(media)},
  shaders: ${JSON.stringify(shaders)}
};
</script>
<script>
${app}
</script>
`;

writeFileSync(join(ROOT, 'preview', 'index.html'), html);

const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
console.log(`preview/index.html  ${kb(Buffer.byteLength(html))}`);
console.log(`  css ${kb(styles.length)}   libs ${kb(libs.length)}   app ${kb(app.length)}`);
console.log(`  media ${kb(bytes)} raw   fonts ${fonts.count} faces`);
