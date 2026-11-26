/**
 * Body reading, ported from the app (posture_engine.dart and
 * exercise_tracker.dart): posture in degrees with neutral wording, a squat
 * counter with hysteresis and form cues, and shoulder-to-hip balance for
 * style. Describes, never scores.
 */

export type LM = { x: number; y: number; z: number; visibility?: number };

export const J = {
  nose: 0, lEye: 2, rEye: 5, lEar: 7, rEar: 8, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16,
  lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28,
} as const;

const MIN_VIS = 0.6;
const deg = (r: number) => (r * 180) / Math.PI;

export type View = 'front' | 'side';
export type Metric = 'shoulderLevel' | 'hipLevel' | 'headTilt' | 'torsoLean' | 'headForward';
export type Band = 'aligned' | 'slight' | 'noticeable';

const BANDS: Record<Metric, [number, number]> = {
  headTilt: [3, 7],
  shoulderLevel: [2, 5],
  hipLevel: [2, 5],
  torsoLean: [3, 7],
  headForward: [15, 25],
};
export const bandOf = (m: Metric, d: number): Band => (d < BANDS[m][0] ? 'aligned' : d < BANDS[m][1] ? 'slight' : 'noticeable');

export const METRIC_NAME: Record<Metric, string> = {
  shoulderLevel: 'Shoulder level',
  hipLevel: 'Hip level',
  headTilt: 'Head tilt',
  torsoLean: 'Torso lean',
  headForward: 'Head forward',
};

export type BodyIssue = 'outOfFrame' | 'tooFar' | 'tooClose' | 'unclearView' | 'lowVisibility';
export const BODY_ISSUE_TEXT: Record<BodyIssue | 'none', string> = {
  none: 'Step back so your whole body is in view',
  outOfFrame: 'Keep your head, shoulders and hips in view',
  tooFar: 'Come a little closer',
  tooClose: 'Step back a little',
  unclearView: 'Face the camera, or turn fully side-on',
  lowVisibility: 'Find better light so your body is clear',
};

export type PostureFrame = {
  issue: BodyIssue | null;
  view: View | null;
  samples: Partial<Record<Metric, number>>;
  shoulderToHip?: number;
};

/** One frame's posture, from image landmarks (0–1) and the image size. */
export function readPosture(lm: LM[], w: number, h: number): PostureFrame {
  const P = (i: number) => ({ x: lm[i].x * w, y: lm[i].y * h, v: lm[i].visibility ?? 1 });
  const ls = P(J.lSh), rs = P(J.rSh), lh = P(J.lHip), rh = P(J.rHip);
  for (const i of [J.lSh, J.rSh, J.lHip, J.rHip, J.nose]) {
    const p = lm[i];
    if (p.x < 0.02 || p.x > 0.98 || p.y < 0.02 || p.y > 0.98) return { issue: 'outOfFrame', view: null, samples: {} };
  }
  const midS = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
  const midH = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
  const torso = Math.hypot(midS.x - midH.x, midS.y - midH.y);
  if (torso < 1) return { issue: 'outOfFrame', view: null, samples: {} };
  if (torso / h < 0.12) return { issue: 'tooFar', view: null, samples: {} };
  if (torso / h > 0.6) return { issue: 'tooClose', view: null, samples: {} };

  const ratio = Math.abs(ls.x - rs.x) / torso;
  const view: View | null = ratio > 0.45 ? 'front' : ratio < 0.25 ? 'side' : null;
  if (!view) return { issue: 'unclearView', view: null, samples: {} };

  const samples: PostureFrame['samples'] = {};
  const level = (a: { x: number; y: number }, b: { x: number; y: number }) => deg(Math.atan2(Math.abs(a.y - b.y), Math.abs(a.x - b.x)));

  if (view === 'front') {
    if ([ls, rs, lh, rh].some((p) => p.v < MIN_VIS)) return { issue: 'lowVisibility', view, samples: {} };
    samples.shoulderLevel = level(ls, rs);
    samples.hipLevel = level(lh, rh);
    let le = P(J.lEar), re = P(J.rEar);
    if (le.v < MIN_VIS || re.v < MIN_VIS) {
      le = P(J.lEye);
      re = P(J.rEye);
    }
    if (le.v >= MIN_VIS && re.v >= MIN_VIS) samples.headTilt = level(le, re);
    samples.torsoLean = deg(Math.atan2(Math.abs(midS.x - midH.x), Math.abs(midH.y - midS.y)));
    return {
      issue: null,
      view,
      samples,
      shoulderToHip: Math.abs(ls.x - rs.x) / Math.max(1, Math.abs(lh.x - rh.x)),
    };
  }

  // Side-on: use the side facing the camera.
  const leftFacing = ls.v + lh.v >= rs.v + rh.v;
  const sh = leftFacing ? ls : rs;
  const hip = leftFacing ? lh : rh;
  const ear = P(leftFacing ? J.lEar : J.rEar);
  const nose = P(J.nose);
  if (sh.v < MIN_VIS || hip.v < MIN_VIS || ear.v < MIN_VIS) return { issue: 'lowVisibility', view, samples: {} };
  const facing = Math.sign(nose.x - ear.x) || 1;
  const dx = (ear.x - sh.x) * facing;
  samples.headForward = deg(Math.atan2(Math.max(0, dx), Math.abs(sh.y - ear.y)));
  samples.torsoLean = deg(Math.atan2(Math.abs((sh.x - hip.x) * facing), Math.abs(hip.y - sh.y)));
  return { issue: null, view, samples };
}

const median = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export type PostureResult = {
  view: View;
  metrics: { metric: Metric; degrees: number; band: Band }[];
  shoulderToHip: number | null;
};

/** Collects steady frames for one posture check. */
export class PostureCapture {
  readonly target = 30;
  private frames: PostureFrame[] = [];
  get progress() {
    return Math.min(1, this.frames.length / this.target);
  }
  get complete() {
    return this.frames.length >= this.target;
  }
  reset() {
    this.frames = [];
  }
  add(f: PostureFrame) {
    if (!f.issue && f.view && !this.complete) this.frames.push(f);
  }
  result(): PostureResult | null {
    if (this.frames.length < 6) return null;
    const views = { front: 0, side: 0 };
    this.frames.forEach((f) => views[f.view!]++);
    const view: View = views.front >= views.side ? 'front' : 'side';
    const frames = this.frames.filter((f) => f.view === view);
    const order: Metric[] = view === 'front' ? ['shoulderLevel', 'hipLevel', 'headTilt', 'torsoLean'] : ['headForward', 'torsoLean'];
    const metrics = order.flatMap((m) => {
      const v = frames.map((f) => f.samples[m]).filter((x): x is number => x !== undefined);
      if (v.length < 3) return [];
      const d = median(v);
      return [{ metric: m, degrees: d, band: bandOf(m, d) }];
    });
    const sh = frames.map((f) => f.shoulderToHip).filter((x): x is number => x !== undefined);
    return { view, metrics, shoulderToHip: sh.length >= 3 ? median(sh) : null };
  }
}

/** Neutral wording for a posture reading. */
export function postureNote(m: Metric, band: Band): string {
  if (band === 'aligned') return 'Well aligned';
  const more = band === 'noticeable';
  switch (m) {
    case 'shoulderLevel':
      return more ? 'One shoulder sits noticeably higher' : 'One shoulder sits slightly higher';
    case 'hipLevel':
      return more ? 'Hips are noticeably uneven' : 'Hips are slightly uneven';
    case 'headTilt':
      return more ? 'Head tilts to one side' : 'A slight head tilt';
    case 'torsoLean':
      return more ? 'Torso leans noticeably' : 'A slight lean';
    case 'headForward':
      return more ? 'Head sits well forward of the shoulders' : 'Head sits a little forward';
  }
}

/** Shoulder-to-hip balance for style (joint widths, so approximate). */
export function silhouette(r: number): { name: string; tip: string } {
  if (r > 1.55)
    return { name: 'Broader shoulders', tip: 'Straight and tapered cuts keep the line clean; add volume below the waist for balance.' };
  if (r < 1.3)
    return { name: 'Fuller hips', tip: 'Structured shoulders and lighter tops balance a fuller lower half.' };
  return { name: 'Balanced', tip: 'Shoulders and hips are in proportion — most cuts and fits work for you.' };
}

// ----------------------------------------------------------------- squats

export type Cue = 'goLower' | 'kneesOverToes' | 'chestUp' | 'goodForm' | 'stepIntoView';
export const CUE_TEXT: Record<Cue, string> = {
  goLower: 'Go a little lower',
  kneesOverToes: 'Push your knees out over your toes',
  chestUp: 'Keep your chest up',
  goodForm: 'Good rep',
  stepIntoView: 'Step back so your legs are in view',
};

function angle3(a: LM, b: LM, c: LM) {
  const v1 = [a.x - b.x, a.y - b.y, a.z - b.z];
  const v2 = [c.x - b.x, c.y - b.y, c.z - b.z];
  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  const n = Math.hypot(...v1) * Math.hypot(...v2);
  return n ? deg(Math.acos(Math.max(-1, Math.min(1, dot / n)))) : 180;
}

/** Counts squats from the knee angle, like the app's tracker. Uses 3D
 *  world landmarks, so it works facing the camera or side-on. */
export class SquatCounter {
  reps = 0;
  knee = 180;
  private smooth: number | null = null;
  private down = false;
  private lowest: number | null = null;
  private lastRep = -Infinity;
  private cue: Cue | null = null;
  private cueUntil = 0;

  reset() {
    Object.assign(this, { reps: 0, knee: 180, smooth: null, down: false, lowest: null, lastRep: -Infinity, cue: null, cueUntil: 0 });
  }
  private say(c: Cue, t: number) {
    this.cue = c;
    this.cueUntil = t + 2000;
  }
  currentCue(t: number): Cue | null {
    return t < this.cueUntil ? this.cue : null;
  }

  /** One frame. `img` are image landmarks (for form checks), `world` are
   *  the 3D landmarks. Returns true when a rep completes. */
  update(img: LM[] | null, world: LM[] | null, t: number): boolean {
    if (!img || !world) {
      this.say('stepIntoView', t);
      return false;
    }
    const vis = (i: number) => (img[i].visibility ?? 1) >= 0.5;
    const angles: number[] = [];
    if (vis(J.lHip) && vis(J.lKn) && vis(J.lAn)) angles.push(angle3(world[J.lHip], world[J.lKn], world[J.lAn]));
    if (vis(J.rHip) && vis(J.rKn) && vis(J.rAn)) angles.push(angle3(world[J.rHip], world[J.rKn], world[J.rAn]));
    if (!angles.length) {
      this.say('stepIntoView', t);
      return false;
    }
    const raw = angles.reduce((a, b) => a + b, 0) / angles.length;
    this.smooth = this.smooth === null ? raw : this.smooth * 0.5 + raw * 0.5;
    const k = (this.knee = this.smooth);

    if (k < 125) {
      const kneeGap = Math.abs(img[J.lKn].x - img[J.rKn].x);
      const ankleGap = Math.abs(img[J.lAn].x - img[J.rAn].x);
      // Only meaningful facing the camera (side-on, the knees overlap).
      if (ankleGap > 0.04 && kneeGap < ankleGap * 0.7) this.say('kneesOverToes', t);
      const sh = world[J.lSh];
      const hip = world[J.lHip];
      const lean = deg(Math.atan2(Math.hypot(sh.x - hip.x, sh.z - hip.z), Math.abs(hip.y - sh.y)));
      if (lean > 50) this.say('chestUp', t);
    }

    this.lowest = this.lowest === null ? k : Math.min(this.lowest, k);
    if (!this.down && k <= 105) {
      this.down = true;
    } else if (this.down && k >= 155) {
      this.down = false;
      this.lowest = null;
      if (t - this.lastRep >= 600) {
        this.lastRep = t;
        this.reps++;
        if (!this.currentCue(t)) this.say('goodForm', t);
        return true;
      }
    } else if (!this.down && k >= 155 && this.lowest !== null) {
      // Went part of the way and came back up.
      if (this.lowest <= 140 && this.lowest > 105) this.say('goLower', t);
      this.lowest = null;
    }
    return false;
  }
}

// ------------------------------------------------------------- demo body

/** A synthetic person squatting side-on, for visitors without a camera.
 *  `s` is squat depth 0 (standing) … 1 (deep). Feeds the same pipeline. */
export function demoPose(s: number): { img: LM[]; world: LM[] } {
  const r = (d: number) => (d * Math.PI) / 180;
  const shin = r(32 * s);
  const thigh = r(86 * s);
  const trunk = r(36 * s);
  const L1 = 0.17, L2 = 0.17, T = 0.22;
  const A = { x: 0.46, y: 0.76 };
  const K = { x: A.x + L1 * Math.sin(shin), y: A.y - L1 * Math.cos(shin) };
  const H = { x: K.x - L2 * Math.sin(thigh), y: K.y - L2 * Math.cos(thigh) };
  const S = { x: H.x + T * Math.sin(trunk), y: H.y - T * Math.cos(trunk) };
  const reach = 0.16 * s;
  const El = { x: S.x + 0.05 + reach * 0.5, y: S.y + 0.1 - 0.08 * s };
  const Wr = { x: S.x + 0.07 + reach, y: S.y + 0.19 - 0.17 * s };
  const head = { x: S.x + 0.02, y: S.y - 0.075 };
  const pts: { x: number; y: number }[] = Array.from({ length: 33 }, () => ({ ...head }));
  const set = (i: number, p: { x: number; y: number }, dx = 0) => (pts[i] = { x: p.x + dx, y: p.y });
  set(0, { x: head.x + 0.035, y: head.y });
  for (const i of [1, 2, 3]) set(i, { x: head.x + 0.025, y: head.y - 0.012 });
  for (const i of [4, 5, 6]) set(i, { x: head.x + 0.027, y: head.y - 0.012 });
  set(7, { x: head.x - 0.012, y: head.y - 0.005 });
  set(8, { x: head.x - 0.01, y: head.y - 0.005 });
  set(9, { x: head.x + 0.03, y: head.y + 0.02 });
  set(10, { x: head.x + 0.03, y: head.y + 0.02 });
  set(11, S, -0.004); set(12, S, 0.004);
  set(13, El); set(14, El, 0.004);
  set(15, Wr); set(16, Wr, 0.004);
  for (const i of [17, 19, 21]) set(i, { x: Wr.x + 0.02, y: Wr.y + 0.01 });
  for (const i of [18, 20, 22]) set(i, { x: Wr.x + 0.022, y: Wr.y + 0.01 });
  set(23, H, -0.004); set(24, H, 0.004);
  set(25, K, -0.004); set(26, K, 0.004);
  set(27, A, -0.004); set(28, A, 0.004);
  set(29, { x: A.x - 0.03, y: A.y + 0.015 }); set(30, { x: A.x - 0.028, y: A.y + 0.015 });
  set(31, { x: A.x + 0.07, y: A.y + 0.02 }); set(32, { x: A.x + 0.072, y: A.y + 0.02 });
  // Side-on: the near side is clearly visible, the far side less so.
  const img = pts.map((p, i) => ({ x: p.x, y: p.y, z: 0, visibility: i % 2 === 1 || i === 0 ? 0.99 : 0.8 }));
  const world = pts.map((p, i) => ({ x: p.x, y: p.y, z: i % 2 ? -0.05 : 0.05 }));
  return { img, world };
}
