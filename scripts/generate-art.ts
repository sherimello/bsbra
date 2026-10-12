/**
 * Generates the abstract cover artwork in public/art used by the sample
 * content (yard covers, news covers, gallery albums): fine bathymetric
 * contour lines over a calm tinted ground, in the manner of a nautical chart.
 * Real photographs uploaded through the admin panel replace them.
 *
 *   npm run art
 *
 * Deterministic: the same seed always produces the same file.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1600;
const H = 1000;
const CELL = 8;
const OUT = join(process.cwd(), "public", "art");

// ---------------------------------------------------------------------------
// Seeded gradient noise + fBm
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed: number) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h: number, x: number, y: number) => {
    const a = (h & 7) * (Math.PI / 4);
    return Math.cos(a) * x + Math.sin(a) * y;
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x: number, y: number) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];
    const x1 = grad(aa, xf, yf) + u * (grad(ba, xf - 1, yf) - grad(aa, xf, yf));
    const x2 = grad(ab, xf, yf - 1) + u * (grad(bb, xf - 1, yf - 1) - grad(ab, xf, yf - 1));
    return x1 + v * (x2 - x1);
  };
}

function fbm(noise: (x: number, y: number) => number, x: number, y: number, octaves = 5) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return sum;
}

// ---------------------------------------------------------------------------
// Marching squares → joined polylines → simplified paths
// ---------------------------------------------------------------------------

type Pt = [number, number];

function contourSegments(field: Float64Array, cols: number, rows: number, level: number): [Pt, Pt][] {
  const segs: [Pt, Pt][] = [];
  const at = (i: number, j: number) => field[j * (cols + 1) + i];
  const lerp = (a: number, b: number) => (level - a) / (b - a);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const tl = at(i, j);
      const tr = at(i + 1, j);
      const br = at(i + 1, j + 1);
      const bl = at(i, j + 1);
      const idx = (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const x = i * CELL;
      const y = j * CELL;
      const top: Pt = [x + CELL * lerp(tl, tr), y];
      const right: Pt = [x + CELL, y + CELL * lerp(tr, br)];
      const bottom: Pt = [x + CELL * lerp(bl, br), y + CELL];
      const left: Pt = [x, y + CELL * lerp(tl, bl)];
      switch (idx) {
        case 1: case 14: segs.push([left, bottom]); break;
        case 2: case 13: segs.push([bottom, right]); break;
        case 3: case 12: segs.push([left, right]); break;
        case 4: case 11: segs.push([top, right]); break;
        case 6: case 9: segs.push([top, bottom]); break;
        case 7: case 8: segs.push([left, top]); break;
        case 5: segs.push([left, top], [bottom, right]); break;
        case 10: segs.push([top, right], [left, bottom]); break;
      }
    }
  }
  return segs;
}

function joinSegments(segs: [Pt, Pt][]): Pt[][] {
  const key = (p: Pt) => `${Math.round(p[0] * 100)},${Math.round(p[1] * 100)}`;
  const byPoint = new Map<string, number[]>();
  segs.forEach((s, i) => {
    for (const p of s) {
      const k = key(p);
      const list = byPoint.get(k);
      if (list) list.push(i);
      else byPoint.set(k, [i]);
    }
  });
  const used = new Uint8Array(segs.length);
  const lines: Pt[][] = [];
  const extend = (line: Pt[], forward: boolean) => {
    for (;;) {
      const end = forward ? line[line.length - 1] : line[0];
      const next = byPoint.get(key(end))?.find((i) => !used[i]);
      if (next === undefined) return;
      used[next] = 1;
      const [a, b] = segs[next];
      const other = key(a) === key(end) ? b : a;
      if (forward) line.push(other);
      else line.unshift(other);
    }
  };
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const line: Pt[] = [segs[i][0], segs[i][1]];
    extend(line, true);
    extend(line, false);
    lines.push(line);
  }
  return lines;
}

function simplify(points: Pt[], epsilon: number): Pt[] {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= epsilon) return [points[0], points[points.length - 1]];
  return [...simplify(points.slice(0, index + 1), epsilon).slice(0, -1), ...simplify(points.slice(index), epsilon)];
}

/** Chaikin corner cutting — rounds off the facets of the marching-squares grid. */
function smooth(points: Pt[], iterations = 2): Pt[] {
  let pts = points;
  for (let n = 0; n < iterations; n++) {
    if (pts.length < 3) return pts;
    const closed = pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
    const out: Pt[] = closed ? [] : [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    if (closed) out.push(out[0]);
    else out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

function toPath(lines: Pt[][]): string {
  let d = "";
  for (const raw of lines) {
    if (raw.length < 4) continue;
    const line = simplify(smooth(raw), 0.45);
    if (line.length < 2) continue;
    let [px, py] = [Math.round(line[0][0]), Math.round(line[0][1])];
    d += `M${px} ${py}`;
    let segment = "";
    for (let i = 1; i < line.length; i++) {
      const x = Math.round(line[i][0]);
      const y = Math.round(line[i][1]);
      const rx = x - px;
      const ry = y - py;
      if (rx === 0 && ry === 0) continue;
      segment += `${segment ? " " : "l"}${rx} ${ry}`;
      px = x;
      py = y;
    }
    d += segment;
  }
  return d;
}

// ---------------------------------------------------------------------------
// Compositions
// ---------------------------------------------------------------------------

interface Palette {
  ground: [string, string];
  line: string;
  minor: number;
  major: number;
  accent?: string;
}

const palettes = {
  mist: { ground: ["#f5f5f3", "#e8e8e5"], line: "#1d1d1f", minor: 0.13, major: 0.3 },
  sea: { ground: ["#eef3f5", "#dce6eb"], line: "#1f4a57", minor: 0.2, major: 0.42, accent: "#2f7fd8" },
  sand: { ground: ["#f5f1ea", "#e8e0d3"], line: "#5f4f37", minor: 0.17, major: 0.36 },
  sage: { ground: ["#eff3ef", "#dfe7e0"], line: "#2c5541", minor: 0.2, major: 0.4 },
  slate: { ground: ["#eff1f4", "#dfe3ea"], line: "#283750", minor: 0.17, major: 0.36 },
  ink: { ground: ["#1b1e22", "#0d0f12"], line: "#ffffff", minor: 0.13, major: 0.3, accent: "#6cb8ff" },
  dusk: { ground: ["#211d22", "#121013"], line: "#f2dccb", minor: 0.13, major: 0.32 },
} satisfies Record<string, Palette>;

interface Piece {
  name: string;
  seed: number;
  palette: keyof typeof palettes;
  /** Overall gradient direction (radians) — makes contours run like a shelf. */
  angle: number;
  /** Strength of that gradient relative to the noise. */
  slope: number;
  /** Noise frequency — lower is broader and calmer. */
  scale: number;
  /** Domain-warp strength. */
  warp: number;
  levels: number;
  /** Where the ground's light falls (0–1). */
  light: [number, number];
}

const pieces: Piece[] = [
  { name: "bathymetry", seed: 11, palette: "sea", angle: 0.35, slope: 2.2, scale: 1.5, warp: 0.8, levels: 38, light: [0.3, 0.2] },
  { name: "current", seed: 23, palette: "ink", angle: -0.2, slope: 2.0, scale: 1.6, warp: 0.9, levels: 36, light: [0.7, 0.3] },
  { name: "shoreline", seed: 37, palette: "sand", angle: 1.2, slope: 2.4, scale: 1.4, warp: 0.7, levels: 34, light: [0.2, 0.3] },
  { name: "harbour", seed: 41, palette: "slate", angle: 0.8, slope: 1.8, scale: 1.7, warp: 1.0, levels: 38, light: [0.6, 0.2] },
  { name: "estuary", seed: 53, palette: "sage", angle: -0.6, slope: 2.0, scale: 1.5, warp: 0.9, levels: 36, light: [0.35, 0.25] },
  { name: "tidal-flat", seed: 67, palette: "mist", angle: 0.1, slope: 2.8, scale: 1.3, warp: 0.6, levels: 32, light: [0.5, 0.15] },
  { name: "dusk", seed: 71, palette: "dusk", angle: 0.5, slope: 1.9, scale: 1.6, warp: 0.9, levels: 36, light: [0.75, 0.25] },
  { name: "meridian", seed: 83, palette: "mist", angle: -1.0, slope: 1.7, scale: 1.8, warp: 1.1, levels: 38, light: [0.3, 0.2] },
  { name: "monsoon", seed: 97, palette: "slate", angle: 1.6, slope: 2.3, scale: 1.4, warp: 0.8, levels: 34, light: [0.6, 0.3] },
  { name: "swell", seed: 101, palette: "sand", angle: -0.3, slope: 2.6, scale: 1.3, warp: 0.8, levels: 34, light: [0.4, 0.2] },
  { name: "drift", seed: 113, palette: "ink", angle: 1.0, slope: 2.1, scale: 1.5, warp: 0.8, levels: 34, light: [0.3, 0.3] },
  { name: "delta", seed: 127, palette: "sea", angle: -0.8, slope: 1.8, scale: 1.7, warp: 1.0, levels: 38, light: [0.65, 0.25] },
  { name: "lagoon", seed: 131, palette: "sage", angle: 0.6, slope: 2.4, scale: 1.4, warp: 0.8, levels: 34, light: [0.5, 0.2] },
  { name: "sandbar", seed: 149, palette: "sand", angle: 0.2, slope: 1.9, scale: 1.6, warp: 1.0, levels: 36, light: [0.7, 0.2] },
  { name: "ridge", seed: 157, palette: "slate", angle: -1.3, slope: 2.0, scale: 1.5, warp: 0.9, levels: 36, light: [0.35, 0.3] },
];

function render(piece: Piece): string {
  const pal: Palette = palettes[piece.palette];
  const noise = makeNoise(piece.seed);
  const warpNoise = makeNoise(piece.seed * 7 + 3);
  const cols = W / CELL;
  const rows = H / CELL;
  const field = new Float64Array((cols + 1) * (rows + 1));
  const cos = Math.cos(piece.angle);
  const sin = Math.sin(piece.angle);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const u = (i * CELL) / H;
      const v = (j * CELL) / H;
      const wx = fbm(warpNoise, u * piece.scale * 0.6 + 5.2, v * piece.scale * 0.6 + 1.3, 2);
      const wy = fbm(warpNoise, u * piece.scale * 0.6 + 1.7, v * piece.scale * 0.6 + 9.2, 2);
      const n = fbm(noise, u * piece.scale + piece.warp * wx, v * piece.scale + piece.warp * wy, 3);
      const shelf = (u * cos + v * sin) * 0.35 * piece.slope;
      const value = n + shelf;
      field[j * (cols + 1) + i] = value;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  const minor: string[] = [];
  const major: string[] = [];
  let accent = "";
  const accentLevel = Math.round(piece.levels * 0.55);
  for (let k = 1; k < piece.levels; k++) {
    const level = min + ((max - min) * k) / piece.levels;
    const d = toPath(joinSegments(contourSegments(field, cols, rows, level)));
    if (!d) continue;
    if (pal.accent && k === accentLevel) accent = d;
    else if (k % 5 === 0) major.push(d);
    else minor.push(d);
  }

  const [lx, ly] = piece.light;
  const stroke = `fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">`,
    `<defs><radialGradient id="g" cx="${lx}" cy="${ly}" r="1.1"><stop offset="0" stop-color="${pal.ground[0]}"/><stop offset="1" stop-color="${pal.ground[1]}"/></radialGradient></defs>`,
    `<rect width="${W}" height="${H}" fill="url(#g)"/>`,
    `<path d="${minor.join("")}" stroke="${pal.line}" stroke-opacity="${pal.minor}" stroke-width="0.75" ${stroke}/>`,
    `<path d="${major.join("")}" stroke="${pal.line}" stroke-opacity="${pal.major}" stroke-width="1" ${stroke}/>`,
    accent ? `<path d="${accent}" stroke="${pal.accent}" stroke-opacity="0.85" stroke-width="1.25" ${stroke}/>` : "",
    `</svg>\n`,
  ].join("");
}

mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
for (const piece of pieces) {
  if (only.length && !only.includes(piece.name)) continue;
  const svg = render(piece);
  writeFileSync(join(OUT, `${piece.name}.svg`), svg);
  console.log(`${piece.name}.svg`.padEnd(20), `${(svg.length / 1024).toFixed(0)} KB`);
}
