import type { GlassesStyle, Pt } from './faceEngine';
import { LIPS_INNER, LIPS_OUTER, L_IRIS, R_IRIS } from './faceEngine';

type Conn = { start: number; end: number };

/** The face mesh in the brand colours: a faint lattice, bright contours. */
export function drawMesh(
  ctx: CanvasRenderingContext2D,
  lm: Pt[],
  w: number,
  h: number,
  tess: Conn[],
  contours: Conn[],
  sweep: number | null,
) {
  const s = Math.max(1, w / 900);
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.8 * s;
  ctx.strokeStyle = 'rgba(140, 235, 250, 0.22)';
  ctx.beginPath();
  for (const { start, end } of tess) {
    ctx.moveTo(lm[start].x * w, lm[start].y * h);
    ctx.lineTo(lm[end].x * w, lm[end].y * h);
  }
  ctx.stroke();

  const ys = lm.map((p) => p.y * h);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, '#29D8F2');
  g.addColorStop(0.5, '#7C5CFF');
  g.addColorStop(1, '#E14BD7');
  ctx.strokeStyle = g;
  ctx.lineWidth = 1.8 * s;
  ctx.shadowColor = 'rgba(124, 92, 255, 0.8)';
  ctx.shadowBlur = 8 * s;
  ctx.beginPath();
  for (const { start, end } of contours) {
    ctx.moveTo(lm[start].x * w, lm[start].y * h);
    ctx.lineTo(lm[end].x * w, lm[end].y * h);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Landmark dots.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (let i = 0; i < lm.length; i += 3) {
    ctx.fillRect(lm[i].x * w - 0.8 * s, lm[i].y * h - 0.8 * s, 1.6 * s, 1.6 * s);
  }

  // The scan line sweeping the face while it measures.
  if (sweep !== null) {
    const xs = lm.map((p) => p.x * w);
    const left = Math.min(...xs) - 20 * s;
    const right = Math.max(...xs) + 20 * s;
    const y = top + (bottom - top) * sweep;
    const band = ctx.createLinearGradient(0, y - 40 * s, 0, y);
    band.addColorStop(0, 'rgba(41, 216, 242, 0)');
    band.addColorStop(1, 'rgba(41, 216, 242, 0.28)');
    ctx.fillStyle = band;
    ctx.fillRect(left, y - 40 * s, right - left, 40 * s);
    ctx.strokeStyle = 'rgba(140, 235, 250, 0.95)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
}

export const FRAME_COLOURS = [
  { id: 'black', name: 'Matte black', stroke: '#141416', lens: 'rgba(30,30,40,0.10)' },
  { id: 'tortoise', name: 'Tortoise', stroke: '#6B3A1E', lens: 'rgba(80,40,10,0.10)' },
  { id: 'gold', name: 'Gold', stroke: '#C9A24A', lens: 'rgba(120,90,20,0.08)' },
  { id: 'crystal', name: 'Crystal', stroke: 'rgba(235,240,255,0.75)', lens: 'rgba(255,255,255,0.06)' },
] as const;
export type FrameColour = (typeof FRAME_COLOURS)[number];

/** One lens outline, centred, for the lens on the face's right side (+x is
 *  the outer edge). The other lens is drawn mirrored. */
function lensPath(ctx: CanvasRenderingContext2D, style: GlassesStyle, lw: number, lh: number) {
  const x0 = -lw / 2;
  const x1 = lw / 2;
  const y0 = -lh / 2;
  const y1 = lh / 2;
  ctx.beginPath();
  switch (style) {
    case 'round': {
      const r = Math.min(lw, lh) / 2;
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      break;
    }
    case 'oval':
      ctx.ellipse(0, 0, lw / 2, lh / 2, 0, 0, Math.PI * 2);
      break;
    case 'aviator':
      // Teardrop: a straight brow line, deepest just inside the middle.
      ctx.moveTo(x0 + lw * 0.06, y0);
      ctx.lineTo(x1 - lw * 0.1, y0);
      ctx.bezierCurveTo(x1 + lw * 0.02, y0, x1 + lw * 0.04, y0 + lh * 0.35, x1 - lw * 0.08, y0 + lh * 0.7);
      ctx.bezierCurveTo(x1 - lw * 0.2, y1 + lh * 0.04, x0 + lw * 0.2, y1 + lh * 0.08, x0 + lw * 0.02, y0 + lh * 0.55);
      ctx.bezierCurveTo(x0 - lw * 0.04, y0 + lh * 0.35, x0 - lw * 0.02, y0, x0 + lw * 0.06, y0);
      break;
    case 'catEye':
      ctx.moveTo(x0, y0 + lh * 0.2);
      ctx.quadraticCurveTo(x0 + lw * 0.1, y0, x0 + lw * 0.4, y0 + lh * 0.02);
      ctx.lineTo(x1 + lw * 0.08, y0 - lh * 0.12);
      ctx.quadraticCurveTo(x1, y1 * 0.6, x1 - lw * 0.25, y1);
      ctx.quadraticCurveTo(x0 + lw * 0.05, y1 * 1.05, x0, y0 + lh * 0.2);
      break;
    case 'geometric':
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const px = Math.cos(a) * lw * 0.52;
        const py = Math.sin(a) * lh * 0.55;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    default:
      ctx.roundRect(x0, y0, lw, lh, lh * (style === 'browline' ? 0.3 : 0.18));
  }
}

const LENS_H: Record<GlassesStyle, number> = {
  rectangular: 0.56,
  round: 0.9,
  oval: 0.66,
  aviator: 0.8,
  catEye: 0.62,
  browline: 0.62,
  geometric: 0.78,
};

/** Draws frames that follow the eyes: position, size and tilt. */
export function drawGlasses(
  ctx: CanvasRenderingContext2D,
  lm: Pt[],
  w: number,
  h: number,
  style: GlassesStyle,
  colour: FrameColour,
) {
  const P = (i: number) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const a = P(L_IRIS);
  const b = P(R_IRIS);
  const eye = Math.hypot(b.x - a.x, b.y - a.y);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const lw = eye * 0.86;
  const lh = lw * LENS_H[style];
  const rim = Math.max(2, eye * (style === 'rectangular' || style === 'browline' ? 0.055 : 0.045));
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2 + eye * 0.03;

  // Temples run from the outer lens edges back toward the ears.
  const ears = [P(234), P(454)];
  ctx.save();
  ctx.strokeStyle = colour.stroke;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = rim * 0.7;
  for (const [side, ear] of [[-1, ears[0]], [1, ears[1]]] as const) {
    const ox = cx + Math.cos(angle) * (side * (eye / 2 + lw / 2)) - Math.sin(angle) * (-lh * 0.25);
    const oy = cy + Math.sin(angle) * (side * (eye / 2 + lw / 2)) + Math.cos(angle) * (-lh * 0.25);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ear.x, ear.y - eye * 0.12);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = rim * 1.5;
  ctx.shadowOffsetY = rim * 0.6;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate((side * eye) / 2, 0);
    ctx.scale(side, 1);
    lensPath(ctx, style, lw, lh);
    // Tinted glass with a soft reflection.
    ctx.fillStyle = colour.lens;
    ctx.fill();
    const shine = ctx.createLinearGradient(-lw / 2, -lh / 2, lw / 2, lh / 2);
    shine.addColorStop(0, 'rgba(255,255,255,0.16)');
    shine.addColorStop(0.35, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fill();
    ctx.strokeStyle = colour.stroke;
    ctx.lineWidth = rim;
    if (style === 'browline') {
      ctx.lineWidth = rim * 0.45;
      ctx.stroke();
      ctx.lineWidth = rim * 1.6;
      ctx.beginPath();
      ctx.moveTo(-lw / 2, -lh / 2 + rim * 0.4);
      ctx.lineTo(lw / 2, -lh / 2 + rim * 0.4);
      ctx.stroke();
    } else {
      ctx.stroke();
    }
    ctx.restore();
  }
  // Bridge.
  ctx.strokeStyle = colour.stroke;
  ctx.lineWidth = rim * 0.8;
  ctx.beginPath();
  const gap = eye / 2 - lw / 2;
  ctx.moveTo(-gap - 1, -lh * 0.18);
  ctx.quadraticCurveTo(0, -lh * 0.36, gap + 1, -lh * 0.18);
  ctx.stroke();
  ctx.restore();
}

/** Lip colour and blush, drawn on a layer blended with "multiply". */
export function drawMakeup(
  ctx: CanvasRenderingContext2D,
  lm: Pt[],
  w: number,
  h: number,
  lip: string | null,
  blush: string | null,
) {
  const P = (i: number) => [lm[i].x * w, lm[i].y * h] as const;
  const eye = Math.hypot((lm[R_IRIS].x - lm[L_IRIS].x) * w, (lm[R_IRIS].y - lm[L_IRIS].y) * h);
  if (blush) {
    for (const i of [50, 280]) {
      const [x, y] = P(i);
      const g = ctx.createRadialGradient(x, y, 0, x, y, eye * 0.42);
      g.addColorStop(0, hexA(blush, 0.42));
      g.addColorStop(1, hexA(blush, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - eye, y - eye, eye * 2, eye * 2);
    }
  }
  if (lip) {
    ctx.save();
    ctx.filter = `blur(${Math.max(1, eye / 90)}px)`;
    ctx.beginPath();
    LIPS_OUTER.forEach((i, k) => (k ? ctx.lineTo(...P(i)) : ctx.moveTo(...P(i))));
    ctx.closePath();
    LIPS_INNER.forEach((i, k) => (k ? ctx.lineTo(...P(i)) : ctx.moveTo(...P(i))));
    ctx.closePath();
    ctx.fillStyle = hexA(lip, 0.62);
    ctx.fill('evenodd');
    ctx.restore();
  }
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
