import { useCallback, useEffect, useRef, useState } from 'react';
import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import { Camera, CameraOff, ImageUp, Loader2, RotateCcw, ScanFace, Glasses, Palette, ShieldCheck, Gauge, Sun } from 'lucide-react';
import { Brackets, LiveDot } from '../components/ui';
import { cameraErrorText, faceConnections, loadFace, openCamera } from '../lib/vision';
import { useNetworkMeter } from '../lib/netMeter';
import {
  FaceCapture, FRAMES_FOR, SHAPE_INFO, headPose, readFrame, rankShapes,
  type FaceResult, type FrameIssue, type GlassesStyle, type HeadPose, type Pt,
} from '../lib/faceEngine';
import { FRAME_COLOURS, drawGlasses, drawMakeup, drawMesh, type FrameColour } from '../lib/faceDraw';
import makeup from '../data/makeup.json';

type Phase = 'idle' | 'loading' | 'live' | 'photo' | 'error';
type Mode = 'scan' | 'glasses' | 'makeup';

const ISSUE_TEXT: Record<FrameIssue | 'none' | 'noFace', string> = {
  none: 'Looking for your face…',
  noFace: 'No face found — try a clear, front-facing photo',
  tooFar: 'Come a little closer',
  tooClose: 'Move back a little',
  turned: 'Look straight at the camera',
  outOfFrame: 'Keep your whole face in view',
};

const STYLE_NAMES: Record<GlassesStyle, string> = {
  rectangular: 'Rectangular', round: 'Round', oval: 'Oval', aviator: 'Aviator',
  catEye: 'Cat-eye', browline: 'Browline', geometric: 'Geometric',
};
const ALL_STYLES = Object.keys(STYLE_NAMES) as GlassesStyle[];
const LIPS = [...makeup.neutral.lips, ...makeup.warm.lips, ...makeup.cool.lips];
const BLUSH = [...makeup.neutral.blush, ...makeup.warm.blush, ...makeup.cool.blush];

type Lighting = 'even' | 'dark' | 'bright' | 'side';

/** Light on the face: overall brightness and left/right difference. */
function readLight(src: CanvasImageSource, lm: Pt[], ctx: CanvasRenderingContext2D): Lighting {
  ctx.drawImage(src, 0, 0, 48, 27);
  const d = ctx.getImageData(0, 0, 48, 27).data;
  const xs = lm.map((q) => q.x);
  const ys = lm.map((q) => q.y);
  const x0 = Math.max(0, Math.floor(Math.min(...xs) * 48));
  const x1 = Math.min(47, Math.ceil(Math.max(...xs) * 48));
  const y0 = Math.max(0, Math.floor(Math.min(...ys) * 27));
  const y1 = Math.min(26, Math.ceil(Math.max(...ys) * 27));
  const mid = (x0 + x1) / 2;
  let l = 0, ln = 0, r = 0, rn = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * 48 + x) * 4;
      const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      if (x < mid) { l += lum; ln++; } else { r += lum; rn++; }
    }
  }
  const L = l / Math.max(1, ln);
  const R = r / Math.max(1, rn);
  const avg = (L + R) / 2;
  return avg < 60 ? 'dark' : avg > 205 ? 'bright' : Math.abs(L - R) > 38 ? 'side' : 'even';
}

function lightContext() {
  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 27;
  return c.getContext('2d', { willReadFrequently: true })!;
}
const LIGHT_TEXT: Record<Lighting, string> = {
  even: 'Even light — great',
  dark: 'A bit dark — face a window or lamp',
  bright: 'Very bright — step out of direct light',
  side: 'Light from one side — face the light',
};

export default function FaceLabLive() {
  const video = useRef<HTMLVideoElement>(null);
  const photoImg = useRef<HTMLImageElement | null>(null);
  const meshCanvas = useRef<HTMLCanvasElement>(null);
  const makeupCanvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const landmarker = useRef<FaceLandmarker | null>(null);
  const conns = useRef<Awaited<ReturnType<typeof faceConnections>> | null>(null);
  const capture = useRef(new FaceCapture());
  const raf = useRef(0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('scan');
  const [style, setStyle] = useState<GlassesStyle>('rectangular');
  const [colour, setColour] = useState<FrameColour>(FRAME_COLOURS[0]);
  const [lip, setLip] = useState<string | null>(LIPS[0].hex);
  const [blush, setBlush] = useState<string | null>(BLUSH[0].hex);
  const [hud, setHud] = useState({ fps: 0, ms: 0, found: false, issue: 'none' as FrameIssue | 'none' | 'noFace', progress: 0 });
  const [pose, setPose] = useState<HeadPose | null>(null);
  const [light, setLight] = useState<Lighting | null>(null);
  const [result, setResult] = useState<FaceResult | null>(null);
  const requests = useNetworkMeter(phase === 'live' || phase === 'photo');

  // Settings read inside the frame loop.
  const live = useRef({ mode, style, colour, lip, blush });
  live.current = { mode, style, colour, lip, blush };

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  /** Draws one set of landmarks onto both layers. */
  const paint = (lm: Pt[] | null, w: number, h: number, sweep: number | null) => {
    const mc = meshCanvas.current!;
    const kc = makeupCanvas.current!;
    for (const c of [mc, kc]) {
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
    }
    const m = mc.getContext('2d')!;
    const k = kc.getContext('2d')!;
    m.clearRect(0, 0, w, h);
    k.clearRect(0, 0, w, h);
    if (!lm) return;
    const s = live.current;
    if (s.mode === 'scan' && conns.current) drawMesh(m, lm, w, h, conns.current.tesselation, conns.current.contours, sweep);
    if (s.mode === 'glasses') drawGlasses(m, lm, w, h, s.style, s.colour);
    if (s.mode === 'makeup') drawMakeup(k, lm, w, h, s.lip, s.blush);
  };

  const ensureModel = async () => {
    const [lmk, c] = await Promise.all([loadFace(), faceConnections()]);
    landmarker.current = lmk;
    conns.current = c;
    return lmk;
  };

  const start = async () => {
    setError('');
    setResult(null);
    capture.current.reset();
    setPhase('loading');
    try {
      const [s, lmk] = await Promise.all([openCamera('user'), ensureModel()]);
      await lmk.setOptions({ runningMode: 'VIDEO' });
      stream.current = s;
      const v = video.current!;
      v.srcObject = s;
      await v.play();
      photoImg.current = null;
      setPhase('live');
      loop();
    } catch (e) {
      stop();
      const key = (e as Error).message;
      setError(cameraErrorText[key] ?? 'The face model could not load. Check your connection and try again.');
      setPhase('error');
    }
  };

  const loop = () => {
    const v = video.current!;
    const lmk = landmarker.current!;
    let last = performance.now();
    let fps = 0;
    let ms = 0;
    let n = 0;
    let lastHud = 0;
    let lastTs = -1;
    const lc = lightContext();

    const frame = () => {
      raf.current = requestAnimationFrame(frame);
      if (v.readyState < 2 || v.currentTime === lastTs) return;
      lastTs = v.currentTime;
      const w = v.videoWidth;
      const h = v.videoHeight;
      const t0 = performance.now();
      const res = lmk.detectForVideo(v, t0);
      const t1 = performance.now();
      ms = ms * 0.9 + (t1 - t0) * 0.1;
      fps = fps * 0.9 + (1000 / Math.max(1, t1 - last)) * 0.1;
      last = t1;
      n++;

      const lm = (res.faceLandmarks?.[0] as Pt[] | undefined) ?? null;
      let issue: FrameIssue | 'none' = 'none';
      let p: HeadPose | null = null;
      if (lm) {
        p = headPose(lm, w, h);
        const r = readFrame(lm, w, h, p);
        issue = r.issue ?? 'none';
        if (!capture.current.complete) {
          capture.current.add(r);
          if (capture.current.complete) setResult(capture.current.result());
        }
      }
      const scanning = !capture.current.complete;
      paint(lm, w, h, scanning && lm ? (Math.sin(t1 / 380) + 1) / 2 : null);

      // Light check, a few times a second.
      if (lm && n % 12 === 0) setLight(readLight(v, lm, lc));

      if (t1 - lastHud > 180) {
        lastHud = t1;
        setHud({ fps: Math.round(fps), ms: Math.round(ms), found: !!lm, issue, progress: capture.current.progress });
        setPose(p);
      }
    };
    frame();
  };

  const rescan = () => {
    capture.current.reset();
    setResult(null);
  };

  const fromPhoto = async (file: File) => {
    stop();
    setError('');
    setResult(null);
    setPhase('loading');
    try {
      const lmk = await ensureModel();
      await lmk.setOptions({ runningMode: 'IMAGE' });
      const img = new Image();
      await new Promise<void>((ok, fail) => {
        img.onload = () => ok();
        img.onerror = () => fail(new Error('image'));
        img.src = URL.createObjectURL(file);
      });
      photoImg.current = img;
      const res = lmk.detect(img);
      const lm = (res.faceLandmarks?.[0] as Pt[] | undefined) ?? null;
      setPhase('photo');
      {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        paint(lm, w, h, null);
        if (!lm) {
          setHud((x) => ({ ...x, found: false, issue: 'noFace' }));
          return;
        }
        const p = headPose(lm, w, h);
        setPose(p);
        setLight(readLight(img, lm, lightContext()));
        const r = readFrame(lm, w, h, { yaw: 0, pitch: 0, roll: p.roll });
        setHud({ fps: 0, ms: 0, found: true, issue: r.issue ?? 'none', progress: 1 });
        if (r.ratios) {
          const ranked = rankShapes(r.ratios);
          setResult({
            shape: ranked[0][0],
            alsoLike: ranked[1][1] - ranked[0][1] < 0.8 ? ranked[1][0] : null,
            ratios: r.ratios,
            balance: r.balance ?? {},
            eyeSpacing: r.eyeSpacing ?? null,
            mouthToEyes: r.mouthToEyes ?? null,
          });
        }
      }
    } catch {
      setError('That photo could not be read. Try a clear, front-facing photo.');
      setPhase('error');
    }
  };

  // Repaint a photo when the try-on settings change.
  useEffect(() => {
    if (phase !== 'photo' || !photoImg.current || !landmarker.current) return;
    const img = photoImg.current;
    const res = landmarker.current.detect(img);
    paint((res.faceLandmarks?.[0] as Pt[] | undefined) ?? null, img.naturalWidth, img.naturalHeight, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, style, colour, lip, blush, phase]);

  const running = phase === 'live' || phase === 'photo';
  const suits = result ? FRAMES_FOR[result.shape] : [];

  return (
    <div className="grid gap-4">
      <Brackets className="glass relative aspect-[4/5] overflow-hidden rounded-[28px] sm:aspect-[4/3.6]">
        {/* Camera or photo, mirrored like a mirror, with the overlays on top. */}
        <div className={`absolute inset-0 ${phase === "photo" ? "" : "-scale-x-100"}`}>
          <video ref={video} playsInline muted className={`absolute inset-0 h-full w-full object-cover ${phase === 'live' ? '' : 'hidden'}`} />
          {phase === 'photo' && photoImg.current && (
            <img src={photoImg.current.src} alt="Your photo" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <canvas ref={makeupCanvas} className="absolute inset-0 h-full w-full object-cover mix-blend-multiply" />
          <canvas ref={meshCanvas} className="absolute inset-0 h-full w-full object-cover" />
        </div>

        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
            <div className="grid-bg absolute inset-0 opacity-60" />
            <div className="relative grid h-24 w-24 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
              {phase === 'loading' ? (
                <Loader2 size={40} strokeWidth={1.2} className="animate-spin text-teal" />
              ) : phase === 'error' ? (
                <CameraOff size={40} strokeWidth={1.2} className="text-white/80" />
              ) : (
                <ScanFace size={42} strokeWidth={1.1} className="text-white/80" />
              )}
            </div>
            <div className="relative">
              <p className="font-display text-xl font-semibold">
                {phase === 'loading' ? 'Loading the face model on your device…' : phase === 'error' ? 'Camera unavailable' : 'Face scan'}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-mist">
                {phase === 'error'
                  ? error
                  : 'Your camera stays on your device. Frames are read in memory and never stored or sent.'}
              </p>
            </div>
            {phase !== 'loading' && (
              <div className="relative flex flex-wrap justify-center gap-2">
                <button className="btn btn-iris" onClick={start}>
                  <Camera size={17} strokeWidth={1.6} /> Start face scan
                </button>
                <label className="btn btn-ghost cursor-pointer">
                  <ImageUp size={17} strokeWidth={1.6} /> Use a photo
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && fromPhoto(e.target.files[0])} />
                </label>
              </div>
            )}
          </div>
        )}

        {/* HUD */}
        {running && (
          <>
            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]">
              <span className="chip !bg-ink/70 !py-1"><LiveDot /> {phase === 'live' ? 'Live · on-device' : 'Photo · on-device'}</span>
              {phase === 'live' && <span className="chip !bg-ink/70 !py-1">{hud.fps} fps · {hud.ms} ms</span>}
              <span className="chip !bg-ink/70 !py-1">{hud.found ? '478 points' : 'No face'}</span>
            </div>
            <div className="absolute right-4 top-4">
              <span className="chip !border-teal/40 !bg-ink/70 !py-1 font-mono text-[10px] uppercase tracking-[0.14em] !text-teal" title="Uploads, beacons, sockets or calls to other sites since the scan started">
                <ShieldCheck size={12} /> {requests} uploads
              </span>
            </div>
            {mode === 'scan' && (
              <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl border border-line bg-ink/75 px-4 py-3 backdrop-blur">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${hud.progress * 100}%`, background: 'var(--iris)' }} />
                </div>
                <p className="w-48 text-right text-xs text-white/85">
                  {result ? 'Reading complete' : hud.found && hud.issue === 'none' ? `Hold still… ${Math.round(hud.progress * 100)}%` : ISSUE_TEXT[hud.issue]}
                </p>
              </div>
            )}
          </>
        )}
      </Brackets>

      {running && (
        <>
          {/* Modes and controls */}
          <div className="flex flex-wrap items-center gap-2">
            {([['scan', 'Scan', ScanFace], ['glasses', 'Glasses', Glasses], ['makeup', 'Lips & blush', Palette]] as const).map(([m, label, Icon]) => (
              <button key={m} onClick={() => setMode(m)} className={`chip !px-4 !py-2 ${mode === m ? '!border-white/40 !bg-white/10 !text-white' : 'hover:!text-white'}`}>
                <Icon size={14} strokeWidth={1.6} /> {label}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              {phase === 'live' && (
                <button onClick={rescan} className="chip !px-3 !py-2 hover:!text-white" title="Scan again">
                  <RotateCcw size={14} strokeWidth={1.6} /> Rescan
                </button>
              )}
              <button onClick={() => { stop(); setPhase('idle'); }} className="chip !px-3 !py-2 hover:!text-white">
                <CameraOff size={14} strokeWidth={1.6} /> Stop
              </button>
            </div>
          </div>

          {mode === 'glasses' && (
            <div className="glass p-4">
              <div className="flex flex-wrap gap-2">
                {ALL_STYLES.map((s) => (
                  <button key={s} onClick={() => setStyle(s)} className={`chip !px-3 !py-1.5 ${style === s ? '!border-teal/60 !text-white' : 'hover:!text-white'}`}>
                    {STYLE_NAMES[s]}
                    {suits.includes(s) && <span className="text-teal">· suits you</span>}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {FRAME_COLOURS.map((c) => (
                  <button key={c.id} onClick={() => setColour(c)} className={`chip !py-1.5 ${colour.id === c.id ? '!border-white/40 !text-white' : ''}`}>
                    <span className="h-3 w-3 rounded-full border border-white/30" style={{ background: c.stroke }} /> {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'makeup' && (
            <div className="glass grid gap-3 p-4">
              <Swatches label="Lips" items={LIPS} value={lip} onChange={setLip} />
              <Swatches label="Blush" items={BLUSH} value={blush} onChange={setBlush} />
            </div>
          )}

          {/* Readings */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass p-5">
              <p className="eyebrow">Face shape</p>
              {result ? (
                <>
                  <p className="h-display mt-3 text-3xl">
                    {SHAPE_INFO[result.shape].name}
                    {result.alsoLike && <span className="ml-2 text-base font-normal text-mist">· close to {SHAPE_INFO[result.alsoLike].name.toLowerCase()}</span>}
                  </p>
                  <p className="mt-2 text-sm text-mist">{SHAPE_INFO[result.shape].about}</p>
                  <p className="mt-3 text-xs text-mist">
                    Frames that suit you: <span className="text-white">{suits.map((s) => STYLE_NAMES[s]).join(', ')}</span>
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-mist">Hold still and look straight ahead — the reading settles in a few seconds.</p>
              )}
            </div>
            <div className="glass p-5">
              <p className="eyebrow">Balance & proportions</p>
              {result && Object.keys(result.balance).length ? (
                <>
                  <div className="mt-3 grid gap-2">
                    {(['eyes', 'cheeks', 'jaw', 'mouth'] as const).map((k) =>
                      result.balance[k] === undefined ? null : (
                        <Bar key={k} label={k[0].toUpperCase() + k.slice(1)} value={result.balance[k]!} />
                      ),
                    )}
                  </div>
                  <p className="mt-3 text-xs text-mist">
                    Left–right balance; most faces measure 90–98%. It describes, it never ranks.
                    {result.eyeSpacing && ` Eye spacing is ${Math.round(result.eyeSpacing * 100)}% of cheek width.`}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-mist">Measured only while you face the camera straight on.</p>
              )}
            </div>
            <div className="glass p-5">
              <p className="eyebrow">Head angle</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {(['yaw', 'pitch', 'roll'] as const).map((k) => (
                  <div key={k} className="rounded-xl border border-line py-2.5">
                    <p className="font-display text-xl font-semibold tabular-nums">{pose ? `${Math.round(pose[k])}°` : '—'}</p>
                    <p className="text-[11px] uppercase tracking-wider text-mist">{k === 'yaw' ? 'Turn' : k === 'pitch' ? 'Tilt' : 'Roll'}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass p-5">
              <p className="eyebrow">Capture quality</p>
              <p className="mt-3 flex items-center gap-2 text-sm">
                <Sun size={16} strokeWidth={1.5} className="text-teal" /> {light ? LIGHT_TEXT[light] : 'Checking light…'}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <Gauge size={16} strokeWidth={1.5} className="text-teal" />
                {phase === 'live' ? `${hud.fps} frames a second on this device` : 'Read from your photo'}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <ShieldCheck size={16} strokeWidth={1.5} className="text-teal" /> {requests} uploads since you started
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 text-mist">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, (value - 0.8) / 0.2) * 100}%`, background: 'var(--iris)' }} />
      </div>
      <span className="w-10 text-right tabular-nums">{Math.round(value * 100)}%</span>
    </div>
  );
}

function Swatches({ label, items, value, onChange }: { label: string; items: { id: string; name: string; hex: string }[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-12 text-xs text-mist">{label}</span>
      <button onClick={() => onChange(null)} className={`chip !py-1 ${value === null ? '!border-white/40 !text-white' : ''}`}>None</button>
      {items.map((s) => (
        <button key={s.id} onClick={() => onChange(s.hex)} title={s.name} aria-label={s.name}
          className={`h-7 w-7 rounded-full border-2 transition ${value === s.hex ? 'scale-110 border-white' : 'border-transparent'}`}
          style={{ background: s.hex }} />
      ))}
    </div>
  );
}
