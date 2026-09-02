/**
 * Procedurally generates the placeholder media for the site.
 * Everything is math -> raw RGB buffer -> sharp, so the repo carries no
 * third-party imagery and every asset sits in the brand palette.
 *
 *   node scripts/generate-media.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'public', 'media');
mkdirSync(OUT, { recursive: true });

/* ---------------------------------------------------------------- noise -- */

const mulberry = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Classic value-noise lattice with quintic smoothing. */
function makeNoise(seed) {
  const size = 256;
  const mask = size - 1;
  const rand = mulberry(seed);
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();

  const at = (x, y) => grid[(y & mask) * size + (x & mask)];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = fade(x - xi);
    const yf = fade(y - yi);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return (a + (b - a) * xf) + ((c + (d - c) * xf) - (a + (b - a) * xf)) * yf;
  };
}

function makeFbm(seed, octaves = 5, lacunarity = 2.0, gain = 0.5) {
  const n = makeNoise(seed);
  return (x, y) => {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * n(x * freq, y * freq);
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm;
  };
}

/** Ridged variant — gives the hard specular edges that read as metal. */
function makeRidge(seed, octaves = 5) {
  const n = makeNoise(seed);
  return (x, y) => {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      const v = 1 - Math.abs(n(x * freq, y * freq) * 2 - 1);
      sum += amp * v * v;
      norm += amp;
      amp *= 0.5;
      freq *= 2.05;
    }
    return sum / norm;
  };
}

/* ---------------------------------------------------------------- color -- */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

const hex = (h) => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

/** Ramps are sampled in linear light so the mid-tones don't go muddy. */
function ramp(stops) {
  const parsed = stops.map(([pos, color]) => [pos, hex(color).map((c) => c * c)]);
  return (t) => {
    t = clamp01(t);
    let i = 0;
    while (i < parsed.length - 2 && t > parsed[i + 1][0]) i++;
    const [p0, c0] = parsed[i];
    const [p1, c1] = parsed[i + 1];
    const k = smoothstep(p0, p1, t);
    return [
      Math.sqrt(mix(c0[0], c1[0], k)),
      Math.sqrt(mix(c0[1], c1[1], k)),
      Math.sqrt(mix(c0[2], c1[2], k)),
    ];
  };
}

const PALETTE = {
  ember: ramp([
    [0.0, '#000000'], [0.42, '#0a0403'], [0.62, '#25100a'],
    [0.78, '#5e1c0a'], [0.88, '#b8300c'], [0.95, '#f0561b'], [1.0, '#ff9a5e'],
  ]),
  gold: ramp([
    [0.0, '#060504'], [0.3, '#2e2010'], [0.55, '#8a6224'],
    [0.72, '#dcb45c'], [0.88, '#f7dfa4'], [1.0, '#fff4d8'],
  ]),
  ash: ramp([
    [0.0, '#050505'], [0.35, '#151516'], [0.6, '#3a3a3d'],
    [0.82, '#8c8c92'], [0.94, '#cfcfd4'], [1.0, '#f2f2f5'],
  ]),
  spectrum: ramp([
    [0.0, '#030308'], [0.5, '#0c0812'], [0.72, '#241028'],
    [0.85, '#6b1f38'], [0.93, '#c03a1c'], [0.975, '#e8701f'], [1.0, '#ffb96b'],
  ]),
  ink: ramp([
    [0.0, '#000000'], [0.48, '#08080a'], [0.72, '#17100a'],
    [0.87, '#5c2109'], [0.96, '#c2400e'], [1.0, '#f5834a'],
  ]),
};

/* ------------------------------------------------------------- renderer -- */

/**
 * @param {object} o
 * @param {(u:number,v:number,ctx:object)=>number} o.field  0..1 luminance field
 */
async function render({
  name, w, h, field, palette, seed = 1,
  grain = 0.035, vignette = 0.72, quality = 84,
  gamma = 2.0, gain = 1.0, lift = 0.0,
}) {
  const buf = Buffer.allocUnsafe(w * h * 3);
  const ramper = PALETTE[palette];
  const rand = mulberry(seed * 7919);
  const ctx = { w, h, aspect: w / h };

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      let t = field(u, v, ctx);

      // Crush the low end, then roll the highlights off filmically. A straight
      // multiply clips the ramp's top stop into flat posterised shapes; the
      // exponential curve keeps the hot cores reading as light instead.
      t = 1 - Math.exp(-Math.pow(clamp01(t), gamma) * gain * 1.85);
      t = clamp01(t + lift);

      // Radial falloff keeps the composition centred and the edges cinematic.
      const dx = (u - 0.5) * 2 * ctx.aspect;
      const dy = (v - 0.5) * 2;
      const r = Math.sqrt(dx * dx + dy * dy) / Math.sqrt(1 + ctx.aspect * ctx.aspect);
      t *= mix(1, 1 - smoothstep(0.25, 1.05, r), vignette);

      let [R, G, B] = ramper(t);

      // Fine grain, applied post-ramp so the blacks stay alive.
      const g = (rand() - 0.5) * grain;
      const i = (y * w + x) * 3;
      buf[i] = clamp01(R + g) * 255;
      buf[i + 1] = clamp01(G + g) * 255;
      buf[i + 2] = clamp01(B + g) * 255;
    }
  }

  await sharp(buf, { raw: { width: w, height: h, channels: 3 } })
    .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(join(OUT, `${name}.jpg`));

  process.stdout.write(`  ${name}.jpg  ${w}x${h}\n`);
}

/* ---------------------------------------------------------------- looks -- */

/** Slow-rolling smoke / plasma — the house look. */
const smoke = (seed, scale = 2.6, warp = 1.5) => {
  const a = makeFbm(seed, 6);
  const b = makeFbm(seed + 101, 5);
  const c = makeFbm(seed + 202, 4);
  return (u, v, { aspect }) => {
    const x = u * scale * aspect;
    const y = v * scale;
    const qx = a(x, y);
    const qy = b(x + 3.1, y + 1.7);
    const rx = a(x + warp * qx + 1.2, y + warp * qy + 5.4);
    const f = c(x + warp * rx, y + warp * rx * 0.7);
    return clamp01(f * 1.25 + rx * 0.35 - 0.12);
  };
};

/** Liquid-metal ribbons: ridged noise sheared into flowing bands. */
const ribbons = (seed, scale = 3.0, shear = 2.2) => {
  const r = makeRidge(seed, 5);
  const w = makeFbm(seed + 55, 4);
  return (u, v, { aspect }) => {
    const wob = w(u * 2 * aspect, v * 2) - 0.5;
    const x = (u * aspect + wob * 0.55) * scale;
    const y = (v + u * 0.35 * shear * 0.1) * scale * 0.55;
    const band = r(x * 0.6, y * 2.4);
    const spec = Math.pow(band, 2.2);
    return clamp01(spec * 1.15 + wob * 0.25 + 0.08);
  };
};

/** Soft bloom orb — a single light source dissolving into black. */
const orb = (seed, cx = 0.5, cy = 0.5, radius = 0.34) => {
  const n = makeFbm(seed, 5);
  return (u, v, { aspect }) => {
    const dx = (u - cx) * aspect;
    const dy = v - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    const turb = (n(u * 3.4 * aspect, v * 3.4) - 0.5) * 0.22;
    const core = 1 - smoothstep(0, radius * (1 + turb * 3.2), d);
    const halo = 1 - smoothstep(0, radius * 3.4, d);
    return clamp01(Math.pow(core, 2.1) * 0.9 + Math.pow(halo, 3.0) * 0.55 + turb * 0.2);
  };
};

/** Fine architectural striations — reads as brushed surface / long exposure. */
const striate = (seed, freq = 130, tilt = 0.35) => {
  const n = makeFbm(seed, 5);
  const m = makeFbm(seed + 9, 3);
  return (u, v, { aspect }) => {
    const drift = (n(u * 1.6 * aspect, v * 1.6) - 0.5) * 0.5;
    const s = Math.sin((v + u * tilt + drift * 0.9) * freq) * 0.5 + 0.5;
    const env = m(u * 2.2 * aspect, v * 2.2);
    return clamp01(Math.pow(s, 3.5) * env * 1.7 + env * 0.35 - 0.05);
  };
};

/**
 * A shaft of light through haze.
 *
 * The source sits above the frame: a beam whose apex is visible reads as a
 * cone drawn on the page rather than light coming from somewhere.
 */
const beam = (seed, cx = 0.34, tilt = 0.26, spread = 0.30) => {
  const haze = makeFbm(seed, 5);
  const dust = makeFbm(seed + 23, 4);
  const wob = makeFbm(seed + 71, 3);
  return (u, v, { aspect }) => {
    const t = v + 0.22;                          // source above the top edge
    const drift = (wob(v * 2.4, 3.3) - 0.5) * 0.12;
    const axis = cx + t * tilt + drift;
    const half = 0.02 + t * spread;
    const d = (Math.abs(u - axis) * aspect) / half;
    const core = Math.exp(-d * d * 1.15);
    const atten = Math.pow(1 - clamp01(v) * 0.7, 0.8);
    // Heavy haze breakup — a clean-edged cone looks drawn, not lit.
    const h = 0.5 + haze(u * 3.0 * aspect, v * 1.9 + t * 1.4) * 1.0;
    const grain = dust(u * 6.5 * aspect, v * 6.5) * 0.4;
    return clamp01(core * atten * h + core * grain * 0.6);
  };
};

/**
 * Warped lattice with lit intersections.
 *
 * Two things stop it reading as wallpaper: the grid recedes in perspective,
 * and only part of it carries any charge.
 */
const lattice = (seed, cells = 10) => {
  const warp = makeFbm(seed, 4);
  const life = makeFbm(seed + 41, 3);
  const pool = makeFbm(seed + 97, 3);
  return (u, v, { aspect }) => {
    // Perspective: the grid compresses toward the top of the frame.
    const depth = 0.35 + v * 1.5;
    const wx = (warp(u * 1.4 * aspect, v * 1.4) - 0.5) * 0.18;
    const wy = (warp(u * 1.4 * aspect + 4.2, v * 1.4 + 1.7) - 0.5) * 0.18;
    const gx = (u * aspect + wx) * cells;
    const gy = (v + wy) * cells / depth;
    const fx = gx - Math.round(gx);
    const fy = gy - Math.round(gy);
    const line = Math.max(Math.exp(-fx * fx * 300), Math.exp(-fy * fy * 300));
    const node = Math.exp(-(fx * fx + fy * fy) * 170);
    const energy = life(gx * 0.3, gy * 0.3);
    // Only a couple of regions are actually lit.
    const charged = clamp01(pool(u * 1.3 * aspect, v * 1.3) * 2.0 - 0.35);
    return clamp01((line * 0.7 * energy + node * 2.2 * Math.pow(energy, 1.8)) * charged);
  };
};

/**
 * A few enormous warped arcs sweeping through the frame.
 *
 * The centre sits well outside the picture — concentric rings around a visible
 * centre read as a target, not as a surface.
 */
const rings = (seed, count = 2.1, cx = -0.35, cy = 1.35) => {
  const warp = makeFbm(seed, 5);
  const fine = makeFbm(seed + 63, 4);
  return (u, v, { aspect }) => {
    const dx = (u - cx) * aspect;
    const dy = v - cy;
    const w = (warp(u * 1.5 * aspect, v * 1.5) - 0.5) * 0.55;
    const r = Math.sqrt(dx * dx + dy * dy) + w;
    const band = Math.sin(r * count * Math.PI * 2) * 0.5 + 0.5;
    const detail = 0.55 + fine(u * 4.5 * aspect, v * 4.5) * 0.9;
    const env = 1 - smoothstep(0.3, 2.1, r);
    return clamp01(Math.pow(band, 2.6) * env * detail * 1.8 + env * 0.1);
  };
};

/** Long silky flow lines following a warped field. */
const streams = (seed, freq = 44) => {
  const flow = makeFbm(seed, 5);
  const env = makeFbm(seed + 7, 3);
  return (u, v, { aspect }) => {
    const f = flow(u * 1.25 * aspect, v * 1.25);
    const g = flow(u * 2.5 * aspect + 3.1, v * 2.5 + 8.2);
    const s = Math.sin((v + f * 0.95 + g * 0.3) * freq) * 0.5 + 0.5;
    const e = env(u * 1.8 * aspect, v * 1.8);
    return clamp01(Math.pow(s, 4.2) * e * 2.1 + e * 0.16);
  };
};

/**
 * A fan of light rising from below the frame — attention, pointed somewhere.
 * Keeping the vanishing point off-picture avoids the starburst-clipart read,
 * and the per-spoke gain makes it a lit fan rather than a printed one.
 */
const converge = (seed, cx = 0.46, cy = 1.28, spokes = 30) => {
  const warp = makeFbm(seed, 4);
  const gainField = makeFbm(seed + 29, 3);
  return (u, v, { aspect }) => {
    const dx = (u - cx) * aspect;
    const dy = v - cy;
    const r = Math.sqrt(dx * dx + dy * dy);
    const a = Math.atan2(dy, dx);
    const w = (warp(u * 2.0 * aspect, v * 2.0) - 0.5) * 0.8;
    // Integer spoke count keeps sin() continuous across the ±pi seam.
    const s = Math.sin(a * spokes + w * 2.5) * 0.5 + 0.5;
    // Individual spokes carry very different amounts of light.
    const gain = Math.pow(gainField(Math.cos(a) * 2.2 + 7, Math.sin(a) * 2.2 + 7), 1.6);
    const env = (1 - smoothstep(0.35, 1.6, r)) * clamp01(0.25 + v * 1.3);
    return clamp01(Math.pow(s, 2.4) * env * gain * 3.2 + env * 0.1);
  };
};

/** Radial energy burst. Sampled on the unit direction rather than the angle,
    which would leave a seam where atan2 wraps. */
const sparks = (seed, cx = 0.68, cy = 0.3) => {
  const n = makeRidge(seed, 5);
  const f = makeFbm(seed + 13, 4);
  const drag = makeFbm(seed + 53, 4);
  return (u, v, { aspect }) => {
    // Warp the sampling point before going polar, so the burst is lopsided
    // rather than radially symmetric.
    const sx = u + (drag(u * 1.5 * aspect, v * 1.5) - 0.5) * 1.05;
    const sy = v + (drag(u * 1.5 * aspect + 5.5, v * 1.5 + 2.2) - 0.5) * 1.05;
    const dx = (sx - cx) * aspect;
    const dy = (sy - cy) * 2.3;    // squashed hard, so it smears rather than radiates
    const r = Math.sqrt(dx * dx + dy * dy) + 1e-4;
    const ux = dx / r;
    const uy = dy / r;
    const streak = n(ux * 2.2 + 5, uy * 2.2 + 5);
    const fine = n(ux * 5.6 + 11, uy * 5.6 + 11 + f(u * 2, v * 2) * 0.6);
    const env = Math.exp(-r * r * 1.7);   // wide enough to fill the frame
    return clamp01((Math.pow(streak, 2.2) * 0.8 + fine * 0.4) * env * 2.3 + env * 0.14);
  };
};

/** Domain-warped mesh gradient — the loud, saturated card. */
const mesh = (seed, scale = 1.8) => {
  const a = makeFbm(seed, 4);
  const b = makeFbm(seed + 31, 4);
  return (u, v, { aspect }) => {
    const x = u * scale * aspect;
    const y = v * scale;
    const wx = a(x, y) - 0.5;
    const wy = b(x + 2.3, y + 4.1) - 0.5;
    const f = a(x + wx * 3.2, y + wy * 3.2);
    return clamp01(f * 1.35 + 0.1);
  };
};

/* ----------------------------------------------------------------- main -- */

/* One look per programme card, so no two read as the same picture:
   a stage beam, a technical lattice, growth rings, flow lines, converging
   spokes, and an energy burst. */
const WORK = [
  { look: beam(7, 0.36, 0.24), palette: 'ember', gamma: 1.7, gain: 1.25 },
  { look: lattice(13, 10), palette: 'ash', gamma: 1.5, gain: 1.35 },
  { look: rings(21, 2.1), palette: 'gold', gamma: 1.9, gain: 1.0 },
  { look: streams(29, 34), palette: 'ink', gamma: 1.8, gain: 1.1 },
  { look: smoke(37, 1.9, 2.6), palette: 'spectrum', gamma: 3.5, gain: 1.1 },
  { look: sparks(41, 0.38, 0.44), palette: 'ember', gamma: 1.9, gain: 1.25 },
];

const GALLERY = [
  { look: smoke(53, 2.0, 1.9), palette: 'ember', gamma: 3.2, gain: 1.3 },
  { look: ribbons(59, 2.6), palette: 'gold', gamma: 2.3, gain: 1.05 },
  { look: mesh(67, 1.6), palette: 'spectrum', gamma: 2.7, gain: 1.2 },
  { look: striate(71, 120, 0.3), palette: 'ash', gamma: 2.4, gain: 1.0 },
];

console.log('generating media…');

for (let i = 0; i < WORK.length; i++) {
  await render({
    name: `work-0${i + 1}`, w: 1600, h: 1000, seed: i + 1,
    field: WORK[i].look, palette: WORK[i].palette,
    gamma: WORK[i].gamma, gain: WORK[i].gain,
  });
}

for (let i = 0; i < GALLERY.length; i++) {
  await render({
    name: `gallery-0${i + 1}`, w: 1200, h: 1500, seed: 40 + i,
    field: GALLERY[i].look, palette: GALLERY[i].palette,
    gamma: GALLERY[i].gamma, gain: GALLERY[i].gain,
  });
}

// Service row previews + menu previews — small, they only ever render at ~300px.
for (let i = 0; i < 4; i++) {
  await render({
    name: `svc-0${i + 1}`, w: 720, h: 900, seed: 80 + i, quality: 80,
    field: [smoke(83, 2.2, 1.6), ribbons(89, 2.8), mesh(97, 1.9), orb(103, 0.5, 0.42, 0.28)][i],
    palette: ['ember', 'gold', 'spectrum', 'ink'][i],
    gamma: [2.9, 2.2, 2.6, 1.6][i], gain: [1.2, 1.0, 1.15, 1.0][i],
  });
}

// Full-bleed atmospheric plate used for the pinned expansion transition.
await render({
  name: 'plate-wide', w: 2000, h: 1200, seed: 111, vignette: 0.78,
  field: smoke(111, 2.0, 2.3), palette: 'ink', gamma: 2.6, gain: 1.35,
});

// Grayscale displacement map for the WebGL gallery distortion.
{
  const w = 1024, h = 1024;
  const f = makeFbm(211, 5);
  const g = makeRidge(217, 4);
  const buf = Buffer.allocUnsafe(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const a = f(u * 3.2, v * 3.2);
      const b = g(u * 2.1 + a, v * 2.1 + a);
      buf[y * w + x] = clamp01(a * 0.55 + b * 0.6) * 255;
    }
  }
  await sharp(buf, { raw: { width: w, height: h, channels: 1 } })
    .jpeg({ quality: 88 })
    .toFile(join(OUT, 'displacement.jpg'));
  process.stdout.write('  displacement.jpg 1024x1024\n');
}

// Tiling grain plate for the global film-grain overlay.
{
  const s = 160;
  const rand = mulberry(999);
  const buf = Buffer.allocUnsafe(s * s * 4);
  for (let i = 0; i < s * s; i++) {
    const n = rand();
    const v = n > 0.5 ? 255 : 0;
    buf[i * 4] = v; buf[i * 4 + 1] = v; buf[i * 4 + 2] = v;
    buf[i * 4 + 3] = Math.floor(Math.abs(n - 0.5) * 2 * 90);
  }
  await sharp(buf, { raw: { width: s, height: s, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, 'grain.png'));
  process.stdout.write('  grain.png 160x160\n');
}

console.log('done.');
