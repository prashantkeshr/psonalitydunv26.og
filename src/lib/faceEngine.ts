/**
 * Face reading, ported from the app's face engine (lib/domain/services/
 * face_engine.dart) so the web and the app agree: three outline ratios,
 * six reference shapes, left/right balance and two feature proportions.
 * Never a score of attractiveness.
 */

export type Pt = { x: number; y: number; z: number };
export type FaceShape = 'oval' | 'round' | 'square' | 'oblong' | 'heart' | 'diamond';

/** MediaPipe face-oval landmarks, in order around the face. */
export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];
export const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
export const LIPS_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];
export const L_IRIS = 468;
export const R_IRIS = 473;

export const SHAPE_INFO: Record<FaceShape, { name: string; about: string }> = {
  oval: { name: 'Oval', about: 'Gently longer than wide, with a softly rounded jaw. Most frames and cuts suit you.' },
  round: { name: 'Round', about: 'Width and length are close, with soft curves. Angular frames and height on top add definition.' },
  square: { name: 'Square', about: 'A strong, wide jaw that matches your forehead. Rounder frames soften the angles.' },
  oblong: { name: 'Oblong', about: 'Noticeably longer than wide, with straight sides. Deeper frames and width at the sides balance length.' },
  heart: { name: 'Heart', about: 'A wider forehead tapering to a narrower jaw. Light, rounded frames balance the brow.' },
  diamond: { name: 'Diamond', about: 'Cheekbones are the widest point, with a narrower brow and jaw. Cat-eye and oval frames lift the cheekbones.' },
};

/** Reference proportions (length/cheek, forehead/cheek, jaw/cheek). */
const PROTOTYPES: Record<FaceShape, [number, number, number]> = {
  oblong: [1.45, 0.9, 0.84],
  oval: [1.3, 0.88, 0.78],
  round: [1.08, 0.9, 0.86],
  square: [1.12, 0.95, 0.93],
  heart: [1.27, 0.97, 0.7],
  diamond: [1.27, 0.78, 0.74],
};

/** Frame shapes that suit each face shape (from the app's glasses fit). */
export const FRAMES_FOR: Record<FaceShape, GlassesStyle[]> = {
  oval: ['rectangular', 'aviator', 'geometric', 'browline'],
  round: ['rectangular', 'browline', 'geometric'],
  square: ['round', 'oval', 'aviator', 'catEye'],
  oblong: ['aviator', 'round'],
  heart: ['aviator', 'oval', 'round'],
  diamond: ['catEye', 'oval', 'browline'],
};
export type GlassesStyle = 'rectangular' | 'round' | 'aviator' | 'catEye' | 'browline' | 'oval' | 'geometric';

export const MAX_YAW = 10;
export const MAX_ROLL = 8;
export const MAX_PITCH = 12;
const MAX_YAW_BALANCE = 5;

const deg = (r: number) => (r * 180) / Math.PI;

function crossings(pts: [number, number][], y: number): [number, number] | null {
  let lo: number | null = null;
  let hi: number | null = null;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    if ((y1 <= y && y2 >= y) || (y2 <= y && y1 >= y)) {
      const x = y1 === y2 ? x1 : x1 + ((y - y1) / (y2 - y1)) * (x2 - x1);
      lo = lo === null ? x : Math.min(lo, x);
      hi = hi === null ? x : Math.max(hi, x);
    }
  }
  return lo === null || hi === null ? null : [lo, hi];
}

const balanceOf = (l: number, r: number) => {
  l = Math.abs(l);
  r = Math.abs(r);
  return l + r <= 0 ? 1 : 1 - Math.abs(l - r) / (l + r);
};

export type HeadPose = { yaw: number; pitch: number; roll: number };

/** Head angle from the landmarks' depth (degrees; 0 = facing the camera). */
export function headPose(lm: Pt[], w: number, h: number): HeadPose {
  const L = lm[234];
  const R = lm[454];
  const T = lm[10];
  const B = lm[152];
  const yaw = deg(Math.atan2((R.z - L.z) * w, (R.x - L.x) * w));
  const pitch = deg(Math.atan2((B.z - T.z) * w, (B.y - T.y) * h));
  const eL = lm[33];
  const eR = lm[263];
  const roll = deg(Math.atan2((eR.y - eL.y) * h, (eR.x - eL.x) * w));
  return { yaw, pitch, roll };
}

export type FrameIssue = 'tooFar' | 'tooClose' | 'turned' | 'outOfFrame';

export type FrameReading = {
  issue: FrameIssue | null;
  ratios?: [number, number, number];
  balance?: Partial<Record<'eyes' | 'cheeks' | 'jaw' | 'mouth', number>>;
  eyeSpacing?: number;
  mouthToEyes?: number;
};

/** Reads one video frame (landmarks normalised 0–1; w × h in pixels). */
export function readFrame(lm: Pt[], w: number, h: number, pose: HeadPose): FrameReading {
  const outline = FACE_OVAL.map((i) => [lm[i].x * w, lm[i].y * h] as [number, number]);
  const ys = outline.map((p) => p[1]);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const boxH = (bottom - top) / h;
  if (outline.some(([x, y]) => x < 0 || y < 0 || x > w || y > h)) return { issue: 'outOfFrame' };
  if (boxH < 0.25) return { issue: 'tooFar' };
  if (boxH > 0.85) return { issue: 'tooClose' };
  if (Math.abs(pose.yaw) > MAX_YAW || Math.abs(pose.roll) > MAX_ROLL || Math.abs(pose.pitch) > MAX_PITCH) {
    return { issue: 'turned' };
  }
  const length = bottom - top;
  const widthAt = (f: number) => {
    const c = crossings(outline, top + f * length);
    return c ? c[1] - c[0] : null;
  };
  let cheek = 0;
  for (let f = 0.25; f <= 0.55 + 1e-9; f += 0.05) cheek = Math.max(cheek, widthAt(f) ?? 0);
  const forehead = widthAt(0.12);
  const jaw = widthAt(0.8);
  if (cheek <= 0 || forehead === null || jaw === null) return { issue: 'outOfFrame' };

  const out: FrameReading = { issue: null, ratios: [length / cheek, forehead / cheek, jaw / cheek] };
  if (Math.abs(pose.yaw) <= MAX_YAW_BALANCE) {
    const le = lm[L_IRIS].x * w;
    const re = lm[R_IRIS].x * w;
    const nose = lm[2].x * w;
    const mid = ((le + re) / 2 + nose) / 2;
    const bal: FrameReading['balance'] = {
      eyes: balanceOf(mid - Math.min(le, re), Math.max(le, re) - mid),
    };
    for (const [k, at] of [['cheeks', 0.4], ['jaw', 0.8]] as const) {
      const c = crossings(outline, top + at * length);
      if (c) bal[k] = balanceOf(mid - c[0], c[1] - mid);
    }
    const lipsX = LIPS_OUTER.map((i) => lm[i].x * w);
    const lo = Math.min(...lipsX);
    const hi = Math.max(...lipsX);
    bal.mouth = balanceOf(mid - lo, hi - mid);
    out.balance = bal;
    const eyeDist = Math.abs(re - le);
    out.eyeSpacing = eyeDist / cheek;
    if (eyeDist > 0) out.mouthToEyes = (hi - lo) / eyeDist;
  }
  return out;
}

export function rankShapes([lw, fc, jc]: [number, number, number]): [FaceShape, number][] {
  return (Object.entries(PROTOTYPES) as [FaceShape, [number, number, number]][])
    .map(([s, [a, b, c]]) => [s, Math.hypot((lw - a) / 0.1, (fc - b) / 0.05, (jc - c) / 0.05)] as [FaceShape, number])
    .sort((x, y) => x[1] - y[1]);
}

const median = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export type FaceResult = {
  shape: FaceShape;
  alsoLike: FaceShape | null;
  ratios: [number, number, number];
  balance: Partial<Record<'eyes' | 'cheeks' | 'jaw' | 'mouth', number>>;
  eyeSpacing: number | null;
  mouthToEyes: number | null;
};

/** Collects good frames for one scan and settles on medians. */
export class FaceCapture {
  readonly target = 36;
  private frames: FrameReading[] = [];

  get progress() {
    return Math.min(1, this.frames.length / this.target);
  }
  get complete() {
    return this.frames.length >= this.target;
  }
  add(r: FrameReading) {
    if (!r.issue && r.ratios && !this.complete) this.frames.push(r);
  }
  reset() {
    this.frames = [];
  }

  result(): FaceResult | null {
    if (this.frames.length < 12) return null;
    const ratios = [0, 1, 2].map((i) => median(this.frames.map((f) => f.ratios![i]))) as [number, number, number];
    const ranked = rankShapes(ratios);
    const margin = ranked[1][1] - ranked[0][1];
    const balance: FaceResult['balance'] = {};
    for (const k of ['eyes', 'cheeks', 'jaw', 'mouth'] as const) {
      const v = this.frames.map((f) => f.balance?.[k]).filter((x): x is number => x !== undefined);
      if (v.length >= 3) balance[k] = median(v);
    }
    const pick = (k: 'eyeSpacing' | 'mouthToEyes') => {
      const v = this.frames.map((f) => f[k]).filter((x): x is number => x !== undefined);
      return v.length >= 3 ? median(v) : null;
    };
    return {
      shape: ranked[0][0],
      alsoLike: margin < 0.8 ? ranked[1][0] : null,
      ratios,
      balance,
      eyeSpacing: pick('eyeSpacing'),
      mouthToEyes: pick('mouthToEyes'),
    };
  }
}
