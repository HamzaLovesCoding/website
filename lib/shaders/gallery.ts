/**
 * Displacement transition + live pointer warp for the featured-work plate.
 *
 * Two textures are cross-dissolved, but instead of a straight fade each one
 * is dragged along a shared noise map in opposite directions — the pixels
 * appear to be pushed out of the way by the incoming frame. The same map
 * drives a much smaller, continuous warp around the pointer.
 */

export const galleryVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const galleryFrag = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform sampler2D uDisp;

  uniform float uProgress;   // 0..1 across the transition
  uniform vec2  uMouse;      // -0.5..0.5, plane space
  uniform float uHover;      // 0..1 pointer presence
  uniform float uIntensity;  // transition displacement strength
  uniform vec2  uPlane;      // plane aspect
  uniform vec2  uFromSize;   // source texture aspect
  uniform vec2  uToSize;

  /** object-fit: cover, in UV space. */
  vec2 coverUv(vec2 uv, vec2 plane, vec2 tex) {
    float planeA = plane.x / plane.y;
    float texA = tex.x / tex.y;
    vec2 scale = planeA > texA
      ? vec2(1.0, texA / planeA)
      : vec2(planeA / texA, 1.0);
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 uv = vUv;

    // Live pointer warp — a shallow dent that follows the cursor. Kept an
    // order of magnitude below the transition so the two never compete.
    vec2 toMouse = uv - (uMouse + 0.5);
    float dist = length(toMouse * vec2(uPlane.x / uPlane.y, 1.0));
    float ripple = exp(-dist * 4.5) * uHover;
    uv += normalize(toMouse + 1e-6) * ripple * 0.035;

    float disp = texture2D(uDisp, uv * 0.85).r;

    // Ease the transition here rather than on the JS side so the pixel
    // displacement and the mix stay locked together.
    float p = smoothstep(0.0, 1.0, uProgress);

    vec2 uvFrom = coverUv(uv, uPlane, uFromSize);
    vec2 uvTo = coverUv(uv, uPlane, uToSize);

    // The outgoing frame is pushed away, the incoming one arrives from the
    // opposite side of the same field.
    uvFrom += (disp - 0.5) * p * uIntensity * vec2(1.0, 0.7);
    uvTo -= (disp - 0.5) * (1.0 - p) * uIntensity * vec2(1.0, 0.7);

    // Chromatic split, scaled by how much displacement is happening. At rest
    // it is zero, so still frames stay clean.
    float ca = (p * (1.0 - p) * 0.02 + ripple * 0.006);

    vec4 from = vec4(
      texture2D(uFrom, uvFrom + vec2(ca, 0.0)).r,
      texture2D(uFrom, uvFrom).g,
      texture2D(uFrom, uvFrom - vec2(ca, 0.0)).b,
      1.0
    );
    vec4 to = vec4(
      texture2D(uTo, uvTo + vec2(ca, 0.0)).r,
      texture2D(uTo, uvTo).g,
      texture2D(uTo, uvTo - vec2(ca, 0.0)).b,
      1.0
    );

    vec4 col = mix(from, to, p);

    // Warm lift under the pointer, so the cursor reads as a light source
    // rather than only a distortion.
    col.rgb += vec3(0.35, 0.13, 0.04) * ripple * 0.5;

    gl_FragColor = col;
  }
`;
