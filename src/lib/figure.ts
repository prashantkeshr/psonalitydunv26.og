/**
 * The app's own figure engine (lib/features/exercise/figure/ and
 * lib/domain/entities/motion.dart), ported for the web: keyframed poses,
 * eased interpolation, forward kinematics and held equipment.
 */
import motionsJson from '../data/motions.json';

type Pair = [number, number];
export type BodyPose = { torso: number; head: number; ua: Pair; fa: Pair; th: Pair; sh: Pair; lift: number; x: number };
type Frame = { pose: BodyPose; ms: number; hold: number };
export type Motion = { id: string; view: 'side' | 'front'; frames: Frame[]; held?: string; prop?: string; cycleMs: number };

type RawFrame = Record<string, number | number[] | undefined>;
type RawMotion = { view: string; ms?: number; held?: string; prop?: string; frames: RawFrame[] };

const pair = (v: unknown, fallback: Pair): Pair =>
  v === undefined ? fallback : typeof v === 'number' ? [v, v] : [(v as number[])[0], (v as number[])[1]];

function parsePose(j: RawFrame): BodyPose {
  const ua = pair(j.ua, [0, 0]);
  const th = pair(j.th, [0, 0]);
  return {
    torso: (j.t as number) ?? 0,
    head: (j.h as number) ?? 0,
    ua,
    fa: pair(j.fa, ua),
    th,
    sh: pair(j.sh, th),
    lift: (j.y as number) ?? 0,
    x: (j.x as number) ?? 0,
  };
}

const cache = new Map<string, Motion>();
export function getMotion(id: string): Motion | null {
  if (cache.has(id)) return cache.get(id)!;
  const raw = (motionsJson as Record<string, RawMotion>)[id];
  if (!raw) return null;
  const def = raw.ms ?? 900;
  const frames = raw.frames.map((f) => ({ pose: parsePose(f), ms: (f.ms as number) ?? def, hold: (f.hold as number) ?? 0 }));
  const m: Motion = {
    id,
    view: raw.view === 'front' ? 'front' : 'side',
    frames,
    held: raw.held,
    prop: raw.prop,
    cycleMs: frames.reduce((s, f) => s + f.ms + f.hold, 0),
  };
  cache.set(id, m);
  return m;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPair = (a: Pair, b: Pair, t: number): Pair => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export function poseAt(m: Motion, elapsed: number): BodyPose {
  if (m.frames.length === 1 || m.cycleMs === 0) return m.frames[0].pose;
  let t = elapsed % m.cycleMs;
  for (let i = 0; i < m.frames.length; i++) {
    const f = m.frames[i];
    if (t < f.hold) return f.pose;
    t -= f.hold;
    if (t < f.ms) {
      const a = f.pose;
      const b = m.frames[(i + 1) % m.frames.length].pose;
      const k = ease(t / f.ms);
      return {
        torso: lerp(a.torso, b.torso, k),
        head: lerp(a.head, b.head, k),
        ua: lerpPair(a.ua, b.ua, k),
        fa: lerpPair(a.fa, b.fa, k),
        th: lerpPair(a.th, b.th, k),
        sh: lerpPair(a.sh, b.sh, k),
        lift: lerp(a.lift, b.lift, k),
        x: lerp(a.x, b.x, k),
      };
    }
    t -= f.ms;
  }
  return m.frames[0].pose;
}

// ------------------------------------------------------------ skeleton

const B = {
  head: 0.062, neck: 0.035, torso: 0.3, upperArm: 0.155, forearm: 0.15, thigh: 0.235, shin: 0.235, foot: 0.065,
  shoulderHalf: 0.095, hipHalf: 0.06, limb: 0.05, lowerLimb: 0.042, torsoWidth: 0.1,
};

type V = { x: number; y: number };
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k });
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
const len = (a: V) => Math.hypot(a.x, a.y);
const unit = (a: V): V => (len(a) === 0 ? { x: 0, y: 1 } : mul(a, 1 / len(a)));
const rad = (d: number) => (d * Math.PI) / 180;
const limbDir = (deg: number, side = 1): V => ({ x: side * Math.sin(rad(deg)), y: -Math.cos(rad(deg)) });
const upDir = (deg: number): V => ({ x: Math.sin(rad(deg)), y: Math.cos(rad(deg)) });

export type Skeleton = {
  hip: V; hips: [V, V]; shoulders: [V, V]; neckBase: V; headCenter: V; headDir: V;
  elbows: [V, V]; hands: [V, V]; knees: [V, V]; ankles: [V, V]; toes: [V, V] | null;
};

function points(s: Skeleton): V[] {
  const out = [s.hip, s.neckBase, add(s.headCenter, { x: 0, y: B.head }), sub(s.headCenter, { x: 0, y: B.head })];
  for (const p of [s.shoulders, s.hips, s.elbows, s.hands, s.knees, s.ankles, s.toes]) if (p) out.push(p[0], p[1]);
  return out;
}

export function skeleton(p: BodyPose, view: Motion['view']): Skeleton {
  const front = view === 'front';
  const hip = { x: 0, y: 0 };
  const up = upDir(p.torso);
  const neckBase = mul(up, B.torso);
  const across = { x: up.y, y: -up.x };
  const shoulders: [V, V] = front ? [add(neckBase, mul(across, B.shoulderHalf)), sub(neckBase, mul(across, B.shoulderHalf))] : [neckBase, neckBase];
  const hips: [V, V] = front ? [mul(across, B.hipHalf), mul(across, -B.hipHalf)] : [hip, hip];
  const headDir = upDir(p.torso + p.head);
  const headCenter = add(neckBase, mul(headDir, B.neck + B.head));
  const s1 = front ? -1 : 1;
  const elbows: [V, V] = [add(shoulders[0], mul(limbDir(p.ua[0]), B.upperArm)), add(shoulders[1], mul(limbDir(p.ua[1], s1), B.upperArm))];
  const hands: [V, V] = [add(elbows[0], mul(limbDir(p.fa[0]), B.forearm)), add(elbows[1], mul(limbDir(p.fa[1], s1), B.forearm))];
  const knees: [V, V] = [add(hips[0], mul(limbDir(p.th[0]), B.thigh)), add(hips[1], mul(limbDir(p.th[1], s1), B.thigh))];
  const ankles: [V, V] = [add(knees[0], mul(limbDir(p.sh[0]), B.shin)), add(knees[1], mul(limbDir(p.sh[1], s1), B.shin))];
  const toes: [V, V] | null = front
    ? null
    : [add(ankles[0], mul(limbDir(p.sh[0] + 90), B.foot)), add(ankles[1], mul(limbDir(p.sh[1] + 90), B.foot))];
  const raw: Skeleton = { hip, hips, shoulders, neckBase, headCenter, headDir, elbows, hands, knees, ankles, toes };
  const lowest = Math.min(...points(raw).map((o) => o.y));
  const d = { x: p.x, y: -lowest + B.limb / 2 + p.lift };
  const sh = (v: V) => add(v, d);
  const shp = (v: [V, V]): [V, V] => [sh(v[0]), sh(v[1])];
  return {
    hip: sh(hip), hips: shp(hips), shoulders: shp(shoulders), neckBase: sh(neckBase), headCenter: sh(headCenter), headDir,
    elbows: shp(elbows), hands: shp(hands), knees: shp(knees), ankles: shp(ankles), toes: toes ? shp(toes) : null,
  };
}

function heldLine(s: Skeleton, held?: string): [V, V] | null {
  if (held === 'stick') {
    const d = unit(sub(s.hands[0], s.elbows[0]));
    return [sub(s.hands[0], mul(d, 0.12)), add(s.hands[0], mul(d, 0.62))];
  }
  if (held === 'club') {
    const d = unit(sub(s.hands[0], s.elbows[0]));
    return [sub(s.hands[0], mul(d, 0.03)), add(s.hands[0], mul(d, 0.3))];
  }
  if (held === 'staff') {
    let d = sub(s.hands[0], s.hands[1]);
    d = len(d) < 0.04 ? unit(sub(s.hands[0], s.elbows[0])) : unit(d);
    return [sub(s.hands[1], mul(d, 0.38)), add(s.hands[0], mul(d, 0.38))];
  }
  return null;
}

/** World box holding every frame, so the figure doesn't jump while moving. */
export function bounds(m: Motion) {
  let x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const n = Math.max(12, m.frames.length * 8);
  for (let i = 0; i < n; i++) {
    const s = skeleton(poseAt(m, (m.cycleMs * i) / n), m.view);
    const held = heldLine(s, m.held);
    for (const p of [...points(s), ...(held ?? [])]) {
      x0 = Math.min(x0, p.x - B.limb);
      x1 = Math.max(x1, p.x + B.limb);
      y1 = Math.max(y1, p.y + B.limb);
    }
  }
  const cx = (x0 + x1) / 2;
  x0 = Math.min(x0, cx - 0.25);
  x1 = Math.max(x1, cx + 0.25);
  y1 = Math.max(y1, 0.6);
  return { x0, x1, y0: 0, y1 };
}

export type FigureStyle = { a: string; b: string; c: string; glow: string; far: number };
export const IRIS: FigureStyle = { a: '#29D8F2', b: '#7C5CFF', c: '#E14BD7', glow: 'rgba(124,92,255,0.75)', far: 0.38 };

/** Paints one pose, fitted into a w × h canvas (CSS pixels × dpr). */
export function paint(ctx: CanvasRenderingContext2D, m: Motion, pose: BodyPose, box: ReturnType<typeof bounds>, w: number, h: number, st: FigureStyle = IRIS) {
  const s = skeleton(pose, m.view);
  const pad = 0.1;
  const bw = box.x1 - box.x0;
  const bh = box.y1 - box.y0;
  const longest = Math.max(bw, bh);
  const L = box.x0 - longest * pad;
  const W = bw + 2 * longest * pad;
  const H = bh + 2 * longest * pad;
  const B0 = box.y0 - longest * pad;
  const scale = Math.min(w / W, h / H);
  const dx = (w - W * scale) / 2;
  const dy = (h - H * scale) / 2;
  const map = (p: V): [number, number] => [dx + (p.x - L) * scale, h - dy - (p.y - B0) * scale];

  ctx.clearRect(0, 0, w, h);
  const floorY = map({ x: 0, y: 0 })[1];
  const fg = ctx.createLinearGradient(dx, 0, w - dx, 0);
  fg.addColorStop(0, 'rgba(124,92,255,0)');
  fg.addColorStop(0.5, 'rgba(124,92,255,0.55)');
  fg.addColorStop(1, 'rgba(124,92,255,0)');
  ctx.strokeStyle = fg;
  ctx.lineWidth = Math.max(1, scale * 0.005);
  ctx.beginPath();
  ctx.moveTo(dx, floorY);
  ctx.lineTo(w - dx, floorY);
  ctx.stroke();
  const shadowW = scale * 0.32 * (1 - Math.min(0.6, Math.max(0, pose.lift * 2)));
  ctx.fillStyle = 'rgba(124,92,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(map(s.hip)[0], floorY, shadowW / 2, scale * 0.014, 0, 0, Math.PI * 2);
  ctx.fill();

  const top = map({ x: 0, y: 1.05 })[1];
  const grad = ctx.createLinearGradient(0, top, 0, floorY);
  grad.addColorStop(0, st.a);
  grad.addColorStop(0.5, st.b);
  grad.addColorStop(1, st.c);

  const line = (a: V, b: V, width: number, alpha = 1) => {
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width * scale;
    ctx.beginPath();
    ctx.moveTo(...map(a));
    ctx.lineTo(...map(b));
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  const limb = (a: V, b: V, c: V, alpha: number, d?: V) => {
    line(a, b, B.limb, alpha);
    line(b, c, B.lowerLimb, alpha);
    if (d) line(c, d, B.lowerLimb * 0.8, alpha);
  };
  const dot = (p: V, r: number, alpha = 1) => {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(...map(p), r * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grad;
  ctx.fillStyle = grad;
  ctx.shadowColor = st.glow;
  ctx.shadowBlur = scale * 0.04;

  const held = heldLine(s, m.held);
  const equipment = () => {
    if (!held) return;
    ctx.save();
    ctx.strokeStyle = '#E8D9B0';
    ctx.shadowColor = 'rgba(232,217,176,0.6)';
    line(held[0], held[1], m.held === 'club' ? B.limb * 1.1 : B.lowerLimb * 0.55);
    ctx.restore();
  };
  const head = () => {
    const [cx, cy] = map(s.headCenter);
    ctx.beginPath();
    ctx.arc(cx, cy, B.head * scale, 0, Math.PI * 2);
    ctx.fill();
    if (m.view === 'side') {
      const fwd = { x: s.headDir.y, y: -s.headDir.x };
      const sf = { x: fwd.x, y: -fwd.y };
      const r = B.head * scale;
      const tip = [cx + sf.x * r * 1.28, cy + sf.y * r * 1.28];
      const up = { x: -sf.y * r * 0.32, y: sf.x * r * 0.32 };
      ctx.beginPath();
      ctx.moveTo(cx + sf.x * r * 0.8 + up.x, cy + sf.y * r * 0.8 + up.y);
      ctx.lineTo(tip[0], tip[1]);
      ctx.lineTo(cx + sf.x * r * 0.8 - up.x, cy + sf.y * r * 0.8 - up.y);
      ctx.closePath();
      ctx.fill();
    }
  };
  const torso = () => {
    if (m.view === 'front') {
      ctx.lineWidth = B.limb * scale;
      ctx.beginPath();
      ctx.moveTo(...map(s.shoulders[0]));
      ctx.lineTo(...map(s.shoulders[1]));
      ctx.lineTo(...map(s.hips[1]));
      ctx.lineTo(...map(s.hips[0]));
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    } else {
      line(s.hip, s.neckBase, B.torsoWidth);
    }
    line(s.neckBase, s.headCenter, B.lowerLimb);
  };

  const t = s.toes;
  if (m.view === 'side') {
    limb(s.shoulders[1], s.elbows[1], s.hands[1], st.far);
    dot(s.hands[1], B.lowerLimb * 0.62, st.far);
    limb(s.hips[1], s.knees[1], s.ankles[1], st.far, t?.[1]);
    torso();
    head();
    limb(s.hips[0], s.knees[0], s.ankles[0], 1, t?.[0]);
    equipment();
    limb(s.shoulders[0], s.elbows[0], s.hands[0], 1);
    dot(s.hands[0], B.lowerLimb * 0.62);
  } else {
    limb(s.hips[0], s.knees[0], s.ankles[0], 1);
    limb(s.hips[1], s.knees[1], s.ankles[1], 1);
    torso();
    limb(s.shoulders[0], s.elbows[0], s.hands[0], 1);
    limb(s.shoulders[1], s.elbows[1], s.hands[1], 1);
    equipment();
    dot(s.hands[0], B.lowerLimb * 0.62);
    dot(s.hands[1], B.lowerLimb * 0.62);
    head();
  }
  ctx.shadowBlur = 0;
}
