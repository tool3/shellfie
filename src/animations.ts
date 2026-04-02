export type AnimationType = 'particles' | 'border-pulse' | 'waves' | 'border-gradient' | 'border-shimmer' | 'aurora' | 'grid';

export function generateAnimation(
  animation: AnimationType,
  width: number,
  height: number,
  padding: number,
  borderRadius: number
): string {
  switch (animation) {
    case 'particles': return particlesAnimation(width, height);
    case 'border-pulse': return borderPulseAnimation(width, height, padding, borderRadius);
    case 'waves': return wavesAnimation(width, height);
    case 'border-gradient': return borderGradientAnimation(width, height, padding, borderRadius);
    case 'border-shimmer': return borderShimmerAnimation(width, height, padding, borderRadius);
    case 'aurora': return auroraAnimation(width, height, padding);
    case 'grid': return gridAnimation(width, height);
    default: return '';
  }
}

// Helper: compute approximate perimeter of a rounded rect
function roundedRectPerimeter(w: number, h: number, r: number): number {
  const clampedR = Math.min(r, w / 2, h / 2);
  return 2 * (w - 2 * clampedR) + 2 * (h - 2 * clampedR) + 2 * Math.PI * clampedR;
}

// ============================================================
// 1. PARTICLES — Floating luminous dots
// ============================================================
function particlesAnimation(w: number, h: number): string {
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const count = 24;
  const particles: string[] = [];

  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const r = 1 + rand() * 2.5;
    const dur = 10 + rand() * 18;
    const delay = rand() * dur;
    const opacity = 0.15 + rand() * 0.35;
    const drift = -30 + rand() * 60;
    const startY = h + r * 2;
    const endY = -r * 2;

    particles.push(`
      <circle cx="${x.toFixed(1)}" cy="${startY}" r="${r.toFixed(1)}" fill="rgba(255,255,255,${opacity.toFixed(2)})">
        <animate attributeName="cy" values="${startY};${endY}" dur="${dur.toFixed(1)}s" begin="-${delay.toFixed(1)}s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="${x.toFixed(1)};${(x + drift).toFixed(1)};${x.toFixed(1)}" dur="${dur.toFixed(1)}s" begin="-${delay.toFixed(1)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;${opacity.toFixed(2)};${opacity.toFixed(2)};0" keyTimes="0;0.1;0.9;1" dur="${dur.toFixed(1)}s" begin="-${delay.toFixed(1)}s" repeatCount="indefinite"/>
      </circle>`);
  }

  return particles.join('');
}

// ============================================================
// 2. BORDER PULSE — Ripples expanding outward from terminal border
// ============================================================
function borderPulseAnimation(w: number, h: number, p: number, r: number): string {
  const tx = p, ty = p, tw = w - 2 * p, th = h - 2 * p;
  const cr = Math.min(r, tw / 2, th / 2);
  const ringCount = 4;
  const dur = 4;
  const els: string[] = [];

  for (let i = 0; i < ringCount; i++) {
    const delay = (i / ringCount) * dur;
    const maxExpand = Math.min(p * 0.8, 40);
    els.push(`
      <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${cr}" fill="none"
            stroke="rgba(255,255,255,0.2)" stroke-width="1.5" opacity="0">
        <animate attributeName="x" values="${tx};${tx - maxExpand}" dur="${dur}s" begin="${delay.toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.2 0 0.4 1"/>
        <animate attributeName="y" values="${ty};${ty - maxExpand}" dur="${dur}s" begin="${delay.toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.2 0 0.4 1"/>
        <animate attributeName="width" values="${tw};${tw + maxExpand * 2}" dur="${dur}s" begin="${delay.toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.2 0 0.4 1"/>
        <animate attributeName="height" values="${th};${th + maxExpand * 2}" dur="${dur}s" begin="${delay.toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.2 0 0.4 1"/>
        <animate attributeName="rx" values="${cr};${cr + maxExpand * 0.3}" dur="${dur}s" begin="${delay.toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.2 0 0.4 1"/>
        <animate attributeName="opacity" values="0.25;0" dur="${dur}s" begin="${delay.toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.3 0 0.7 1"/>
        <animate attributeName="stroke-width" values="1.5;0.3" dur="${dur}s" begin="${delay.toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.3 0 0.7 1"/>
      </rect>`);
  }

  return els.join('');
}

// ============================================================
// 3. WAVES — Animated warped topographic lines (Resend-style)
// ============================================================
function wavesAnimation(w: number, h: number): string {
  const count = Math.max(20, Math.round(h / 12));
  const els: string[] = [];

  for (let i = 0; i < count; i++) {
    const baseY = (i / count) * h;
    const pts: string[] = [];
    for (let x = 0; x <= w; x += 4) {
      const warp = Math.sin(x * 0.008 + i * 0.3) * 12 + Math.sin(x * 0.015 + i * 0.5) * 8;
      pts.push(`${x},${(baseY + warp).toFixed(1)}`);
    }
    // Each line oscillates up/down with unique timing
    const amp = 4 + (i % 5) * 2;
    const dur = 6 + (i % 4) * 2;
    const delay = (i * 0.3) % dur;
    els.push(`
      <polyline points="${pts.join(' ')}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5">
        <animateTransform attributeName="transform" type="translate" values="0,${-amp};0,${amp};0,${-amp}" dur="${dur}s" begin="-${delay.toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
      </polyline>`);
  }

  return els.join('');
}

// ============================================================
// 4. BORDER GRADIENT — Rotating gradient stroke
// ============================================================
function borderGradientAnimation(w: number, h: number, p: number, r: number): string {
  const tx = p, ty = p, tw = w - 2 * p, th = h - 2 * p;
  const cr = Math.min(r, tw / 2, th / 2);
  const cx = tx + tw / 2, cy = ty + th / 2;
  const diag = Math.sqrt(tw * tw + th * th) / 2;

  return `
    <defs>
      <linearGradient id="bgAnim-bgrad" gradientUnits="userSpaceOnUse"
                       x1="${cx - diag}" y1="${cy}" x2="${cx + diag}" y2="${cy}">
        <stop offset="0%" stop-color="rgba(100,180,255,0.4)"/>
        <stop offset="25%" stop-color="rgba(200,100,255,0.3)"/>
        <stop offset="50%" stop-color="rgba(255,100,180,0.4)"/>
        <stop offset="75%" stop-color="rgba(100,255,200,0.3)"/>
        <stop offset="100%" stop-color="rgba(100,180,255,0.4)"/>
        <animateTransform attributeName="gradientTransform" type="rotate" values="0 ${cx} ${cy};360 ${cx} ${cy}" dur="6s" repeatCount="indefinite"/>
      </linearGradient>
    </defs>
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${cr}" fill="none"
          stroke="url(#bgAnim-bgrad)" stroke-width="2"/>
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${cr}" fill="none"
          stroke="url(#bgAnim-bgrad)" stroke-width="8" opacity="0.15"/>`;
}

// ============================================================
// 5. BORDER SHIMMER — Shimmering segment traveling around border
// ============================================================
function borderShimmerAnimation(w: number, h: number, p: number, r: number): string {
  const tx = p, ty = p, tw = w - 2 * p, th = h - 2 * p;
  const cr = Math.min(r, tw / 2, th / 2);
  const perim = roundedRectPerimeter(tw, th, cr);
  const segLen = perim * 0.3;

  return `
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${cr}" fill="none"
          stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${cr}" fill="none"
          stroke="rgba(255,255,255,0.06)" stroke-width="10"
          stroke-dasharray="${segLen.toFixed(0)} ${(perim - segLen).toFixed(0)}" stroke-linecap="round">
      <animate attributeName="stroke-opacity" values="0.03;0.1;0.03" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
      <animate attributeName="stroke-dashoffset" values="0;${(-perim).toFixed(0)}" dur="8s" repeatCount="indefinite" calcMode="linear"/>
    </rect>
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${cr}" fill="none"
          stroke="rgba(255,255,255,0.25)" stroke-width="2"
          stroke-dasharray="${(segLen * 0.5).toFixed(0)} ${(perim - segLen * 0.5).toFixed(0)}" stroke-linecap="round">
      <animate attributeName="stroke-opacity" values="0.1;0.35;0.1" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
      <animate attributeName="stroke-dashoffset" values="0;${(-perim).toFixed(0)}" dur="8s" repeatCount="indefinite" calcMode="linear"/>
    </rect>`;
}

// ============================================================
// 6. AURORA — Two large pastel gradient blobs rotating slowly
// ============================================================
function auroraAnimation(w: number, h: number, p: number): string {
  const cx = w / 2, cy = h / 2;
  const blobR = Math.max(w, h) * 0.4;

  return `
    <defs>
      <radialGradient id="bgAnim-aurora0">
        <stop offset="0%" stop-color="#7C9BF5" stop-opacity="0.25"/>
        <stop offset="60%" stop-color="#7C9BF5" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#7C9BF5" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="bgAnim-aurora1">
        <stop offset="0%" stop-color="#D4A0F5" stop-opacity="0.25"/>
        <stop offset="60%" stop-color="#D4A0F5" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#D4A0F5" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${blobR.toFixed(0)}" ry="${(blobR * 0.7).toFixed(0)}" fill="url(#bgAnim-aurora0)">
      <animateTransform attributeName="transform" type="rotate" values="0 ${cx} ${cy};360 ${cx} ${cy}" dur="30s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="${cx}" cy="${cy}" rx="${(blobR * 0.8).toFixed(0)}" ry="${(blobR * 0.6).toFixed(0)}" fill="url(#bgAnim-aurora1)">
      <animateTransform attributeName="transform" type="rotate" values="360 ${cx} ${cy};0 ${cx} ${cy}" dur="24s" repeatCount="indefinite"/>
    </ellipse>`;
}

// ============================================================
// 7. GRID — Drifting gridlines with brightness wave
// ============================================================
function gridAnimation(w: number, h: number): string {
  const sp = 48;
  return `
    <defs>
      <pattern id="bgAnim-grid" width="${sp}" height="${sp}" patternUnits="userSpaceOnUse">
        <path d="M${sp},0 V${sp} M0,${sp} H${sp}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.8"/>
        <animateTransform attributeName="patternTransform" type="translate" from="0,0" to="${sp},${sp}" dur="20s" repeatCount="indefinite"/>
      </pattern>
      <linearGradient id="bgAnim-grid-fade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="1"/>
        <stop offset="50%" stop-color="white" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="white" stop-opacity="1"/>
        <animateTransform attributeName="gradientTransform" type="translate" values="-1,-1;1,1;-1,-1" dur="8s" repeatCount="indefinite"/>
      </linearGradient>
      <mask id="bgAnim-grid-mask">
        <rect width="${w}" height="${h}" fill="url(#bgAnim-grid-fade)"/>
      </mask>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bgAnim-grid)" mask="url(#bgAnim-grid-mask)"/>`;
}
