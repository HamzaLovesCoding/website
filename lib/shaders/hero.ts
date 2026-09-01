/**
 * Hero background: an abstract warm mass suspended in black.
 *
 * Built from domain-warped fBm rather than simulated fluid — at this scale
 * the two are indistinguishable and one of them runs on a phone. The form is
 * shaped by a soft radial mask so it reads as a lit object in space rather
 * than a full-frame texture.
 */

export const heroVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const heroFrag = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform vec2  uRes;
  uniform float uTime;
  uniform vec2  uMouse;     // smoothed, 0..1 viewport space
  uniform float uScroll;    // 0..1 across the hero's exit
  uniform float uIntro;     // 0..1 reveal on load
  uniform float uOctaves;   // 4.0 desktop, 3.0 mobile

  // --- noise ---------------------------------------------------------------

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    float norm = 0.0;
    // Loop bound must be constant in GLSL ES 1.0; uOctaves gates it instead.
    for (int i = 0; i < 5; i++) {
      if (float(i) >= uOctaves) break;
      sum += amp * vnoise(p);
      norm += amp;
      p *= 2.02;
      p += vec2(1.7, 9.2);
      amp *= 0.5;
    }
    return sum / max(norm, 0.0001);
  }

  // --- palette -------------------------------------------------------------

  // Sampled in linear light, returned in linear light. Same ramp as the
  // procedural stills, so the canvas and the imagery share a look.
  vec3 ember(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.004, 0.004, 0.004);
    vec3 c1 = vec3(0.055, 0.010, 0.004);
    vec3 c2 = vec3(0.320, 0.045, 0.012);
    vec3 c3 = vec3(0.880, 0.180, 0.035);
    vec3 c4 = vec3(1.000, 0.470, 0.180);
    vec3 c5 = vec3(1.000, 0.760, 0.520);

    // The deep-red band is deliberately wide: most of the mass should sit in
    // it, with orange reserved for where the light actually is.
    vec3 c = mix(c0, c1, smoothstep(0.00, 0.36, t));
    c = mix(c, c2, smoothstep(0.36, 0.68, t));
    c = mix(c, c3, smoothstep(0.68, 0.86, t));
    c = mix(c, c4, smoothstep(0.86, 0.95, t));
    c = mix(c, c5, smoothstep(0.95, 1.00, t));
    return c;
  }

  void main() {
    // Aspect-corrected, centred coordinates.
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

    float t = uTime * 0.055;

    // The mass sits right-of-centre on desktop and drifts on its own cycle,
    // leaving the left half clear for the headline.
    vec2 anchor = vec2(0.38 + sin(t * 0.8) * 0.05, 0.02 + cos(t * 0.62) * 0.05);
    anchor.x *= smoothstep(0.6, 1.4, uRes.x / uRes.y); // centre it when narrow

    // Cursor influence: a local attractor that dents the field. Deliberately
    // weak — it should register as "alive", not as a paint tool.
    vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.0;
    m.y = -m.y;
    float md = length(p - m);
    float pull = exp(-md * 2.4);

    vec2 q = (p - anchor) * 1.30;   // overall scale of the form
    q += (p - m) * pull * 0.22;

    // Scroll pushes the form up and stretches it — it dissipates as it leaves.
    q.y += uScroll * 0.55;
    q *= 1.0 + uScroll * 0.35;

    // Two rounds of domain warping. The second round is what turns smooth
    // noise into something that reads as billowing.
    vec2 w1 = vec2(
      fbm(q * 1.35 + vec2(0.0, t)),
      fbm(q * 1.35 + vec2(5.2, 1.3) - t * 0.85)
    );
    vec2 w2 = vec2(
      fbm(q * 1.55 + w1 * 1.9 + vec2(1.7, 9.2) + t * 0.6),
      fbm(q * 1.55 + w1 * 1.9 + vec2(8.3, 2.8) - t * 0.45)
    );
    float f = fbm(q * 1.15 + w2 * 2.1);

    // Radial envelope. Without it the noise tiles the whole frame and the
    // negative space the layout is built on disappears — the envelope is
    // what makes this a lit object rather than a background.
    float d = length(q * vec2(0.82, 1.0));
    float body = pow(1.0 - smoothstep(0.0, 0.92, d), 1.35);
    float halo = pow(1.0 - smoothstep(0.0, 1.6, d), 3.0);

    // Raising the field opens voids inside the mass. Smoke without holes in
    // it just reads as a gradient.
    float dens = pow(clamp(f, 0.0, 1.0), 1.55);

    // The core: where a dense part of the field lands near the centre of the
    // envelope it blows out into the hot nucleus the whole frame is lit by.
    float core = pow(dens * body, 2.8) * 2.4;

    float mass = dens * body * 2.35 + core + halo * 0.085;
    mass += pull * body * 0.09;                        // brighten under cursor
    mass *= uIntro;                                    // reveal on load
    mass *= 1.0 - uScroll * 0.6;                       // fade on exit

    // Filmic roll-off — same curve as the stills, so highlights never clip
    // into flat plates of colour.
    float lum = 1.0 - exp(-max(mass, 0.0) * 2.15);

    vec3 col = ember(lum);

    // Back to display space.
    col = pow(col, vec3(0.4545));

    // Page ground, so the canvas can be opaque and cheap.
    col += vec3(0.039);

    // Ordered-ish dither. Dark gradients across a 4K panel band badly in
    // 8-bit without it, and banding is the fastest way to look cheap.
    col += (hash21(gl_FragCoord.xy + uTime) - 0.5) / 255.0;

    gl_FragColor = vec4(col, 1.0);
  }
`;
