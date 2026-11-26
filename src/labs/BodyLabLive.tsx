import { useCallback, useEffect, useRef, useState } from 'react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { Camera, CameraOff, Loader2, PersonStanding, Play, Repeat, RotateCcw, ShieldCheck, Volume2, VolumeX, Ruler } from 'lucide-react';
import { Brackets, LiveDot } from '../components/ui';
import { cameraErrorText, loadPose, openCamera } from '../lib/vision';
import { useNetworkMeter } from '../lib/netMeter';
import {
  BODY_ISSUE_TEXT, CUE_TEXT, J, METRIC_NAME, PostureCapture, SquatCounter, demoPose, postureNote, readPosture, silhouette,
  type BodyIssue, type LM, type PostureResult,
} from '../lib/bodyEngine';

type Phase = 'idle' | 'loading' | 'live' | 'demo' | 'error';
type Mode = 'posture' | 'squat';

/** MediaPipe's 33-point body connections. */
const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32], [15, 17], [15, 19], [15, 21], [17, 19], [16, 18], [16, 20],
  [16, 22], [18, 20], [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
];

/** Says a short line with a voice built into the device (never an online
 *  voice, so nothing leaves the device). */
function speakLocal(text: string) {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices().filter((v) => v.localService);
  const voice = voices.find((v) => v.lang.startsWith('en')) ?? voices[0];
  if (!voice) return;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.rate = 1.05;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function drawSkeleton(ctx: CanvasRenderingContext2D, lm: LM[], w: number, h: number, mode: Mode, knee: number | null) {
  const s = Math.max(1, w / 700);
  const P = (i: number) => [lm[i].x * w, lm[i].y * h] as const;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#29D8F2');
  g.addColorStop(0.55, '#7C5CFF');
  g.addColorStop(1, '#E14BD7');
  ctx.lineCap = 'round';
  ctx.strokeStyle = g;
  ctx.lineWidth = 3.2 * s;
  ctx.shadowColor = 'rgba(124,92,255,0.9)';
  ctx.shadowBlur = 12 * s;
  ctx.beginPath();
  // Neck: shoulder midpoint to the nose.
  if ((lm[0].visibility ?? 1) >= 0.4) {
    ctx.moveTo(((lm[11].x + lm[12].x) / 2) * w, ((lm[11].y + lm[12].y) / 2) * h);
    ctx.lineTo(...P(0));
  }
  for (const [a, b] of BONES) {
    if ((lm[a].visibility ?? 1) < 0.4 || (lm[b].visibility ?? 1) < 0.4) continue;
    ctx.moveTo(...P(a));
    ctx.lineTo(...P(b));
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  for (let i = 0; i < 33; i++) {
    if ((lm[i].visibility ?? 1) < 0.4) continue;
    const [x, y] = P(i);
    ctx.fillStyle = 'rgba(6,7,10,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8CEBFA';
    ctx.lineWidth = 1.8 * s;
    ctx.stroke();
  }

  ctx.font = `${13 * s}px "JetBrains Mono", monospace`;
  if (mode === 'posture') {
    // Level guides across the shoulders and hips.
    for (const [a, b] of [[J.lSh, J.rSh], [J.lHip, J.rHip]] as const) {
      const [x1, y1] = P(a);
      const [x2, y2] = P(b);
      const ang = Math.abs((Math.atan2(Math.abs(y1 - y2), Math.abs(x1 - x2)) * 180) / Math.PI);
      ctx.setLineDash([6 * s, 6 * s]);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.2 * s;
      const yMid = (y1 + y2) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.min(x1, x2) - 40 * s, yMid);
      ctx.lineTo(Math.max(x1, x2) + 40 * s, yMid);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(`${ang.toFixed(1)}°`, Math.max(x1, x2) + 46 * s, yMid + 4 * s);
    }
  }
  if (mode === 'squat' && knee !== null) {
    const side = (lm[J.lKn].visibility ?? 1) >= (lm[J.rKn].visibility ?? 1) ? J.lKn : J.rKn;
    const [x, y] = P(side);
    ctx.strokeStyle = knee <= 105 ? '#29D8F2' : 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(x, y, 26 * s, 0, (Math.PI * 2 * Math.max(0, 180 - knee)) / 180);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.round(knee)}°`, x + 32 * s, y + 5 * s);
  }
}

export default function BodyLabLive() {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const model = useRef<PoseLandmarker | null>(null);
  const posture = useRef(new PostureCapture());
  const squats = useRef(new SquatCounter());
  const raf = useRef(0);
  const timer = useRef(0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('posture');
  const [voice, setVoice] = useState(true);
  const [hud, setHud] = useState({ fps: 0, found: false, issue: 'none' as BodyIssue | 'none', progress: 0 });
  const [result, setResult] = useState<PostureResult | null>(null);
  const [reps, setReps] = useState(0);
  const [knee, setKnee] = useState<number | null>(null);
  const [cue, setCue] = useState<string | null>(null);
  const uploads = useNetworkMeter(phase === 'live' || phase === 'demo');

  const live = useRef({ mode, voice });
  live.current = { mode, voice };

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }, []);
  useEffect(() => stop, [stop]);

  const resetReadings = () => {
    posture.current.reset();
    squats.current.reset();
    setResult(null);
    setReps(0);
    setKnee(null);
    setCue(null);
  };

  /** Shared per-frame work for the camera and the demo. */
  const process = (img: LM[] | null, world: LM[] | null, w: number, h: number, t: number) => {
    const c = canvas.current!;
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    let issue: BodyIssue | 'none' = 'none';
    if (img) {
      const f = readPosture(img, w, h);
      issue = f.issue ?? 'none';
      if (!posture.current.complete) {
        posture.current.add(f);
        if (posture.current.complete) setResult(posture.current.result());
      }
    }
    if (live.current.mode === 'squat') {
      const done = squats.current.update(img, world, t);
      if (done) {
        setReps(squats.current.reps);
        if (live.current.voice) speakLocal(String(squats.current.reps));
      }
    }
    if (img) drawSkeleton(ctx, img, w, h, live.current.mode, live.current.mode === 'squat' ? squats.current.knee : null);
    return issue;
  };

  const start = async () => {
    setError('');
    resetReadings();
    setPhase('loading');
    try {
      const [s, m] = await Promise.all([openCamera('user'), loadPose()]);
      model.current = m;
      stream.current = s;
      const v = video.current!;
      v.srcObject = s;
      await v.play();
      setPhase('live');
      let last = performance.now();
      let fps = 0;
      let lastHud = 0;
      let lastTs = -1;
      const frame = () => {
        raf.current = requestAnimationFrame(frame);
        if (v.readyState < 2 || v.currentTime === lastTs) return;
        lastTs = v.currentTime;
        const t = performance.now();
        const res = m.detectForVideo(v, t);
        const img = (res.landmarks?.[0] as LM[] | undefined) ?? null;
        const world = (res.worldLandmarks?.[0] as LM[] | undefined) ?? null;
        const issue = process(img, world, v.videoWidth, v.videoHeight, t);
        const now = performance.now();
        fps = fps * 0.9 + (1000 / Math.max(1, now - last)) * 0.1;
        last = now;
        if (now - lastHud > 180) {
          lastHud = now;
          setHud({ fps: Math.round(fps), found: !!img, issue, progress: posture.current.progress });
          setKnee(squats.current.knee);
          setCue(squats.current.currentCue(now));
        }
      };
      frame();
    } catch (e) {
      stop();
      const key = (e as Error).message;
      setError(cameraErrorText[key] ?? 'The body model could not load. Check your connection and try again.');
      setPhase('error');
    }
  };

  /** A figure squatting side-on, run through the same counter. */
  const demo = () => {
    stop();
    resetReadings();
    setMode('squat');
    live.current.mode = 'squat';
    setPhase('demo');
    const t0 = performance.now();
    // A timer (not animation frames) so the demo also runs in background tabs.
    timer.current = window.setInterval(() => {
      const t = performance.now();
      const phaseT = ((t - t0) / 2200) % 1;
      const depth = (1 - Math.cos(phaseT * Math.PI * 2)) / 2;
      const { img, world } = demoPose(depth);
      process(img, world, 720, 900, t);
      setKnee(squats.current.knee);
      setCue(squats.current.currentCue(t));
      setHud({ fps: 30, found: true, issue: 'none', progress: posture.current.progress });
    }, 33);
  };

  const running = phase === 'live' || phase === 'demo';
  const sil = result?.shoulderToHip ? silhouette(result.shoulderToHip) : null;

  return (
    <div className="grid gap-4">
      <Brackets className="glass relative aspect-[4/5] overflow-hidden rounded-[28px] sm:aspect-[4/4.4]">
        <div className={`absolute inset-0 ${phase === 'live' ? '-scale-x-100' : ''}`}>
          <video ref={video} playsInline muted className={`absolute inset-0 h-full w-full object-cover ${phase === 'live' ? '' : 'hidden'}`} />
          {phase === 'demo' && <div className="grid-bg absolute inset-0" />}
          <canvas ref={canvas} className={`absolute inset-0 h-full w-full ${phase === 'demo' ? 'object-contain' : 'object-cover'}`} />
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
                <PersonStanding size={42} strokeWidth={1.1} className="text-white/80" />
              )}
            </div>
            <div className="relative">
              <p className="font-display text-xl font-semibold">
                {phase === 'loading' ? 'Loading the body model on your device…' : phase === 'error' ? 'Camera unavailable' : 'Body scan'}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-mist">
                {phase === 'error' ? error : 'Prop your phone up, step back about two metres, and let the skeleton find you. Nothing is recorded or sent.'}
              </p>
            </div>
            {phase !== 'loading' && (
              <div className="relative flex flex-wrap justify-center gap-2">
                <button className="btn btn-iris" onClick={start}>
                  <Camera size={17} strokeWidth={1.6} /> Start body scan
                </button>
                <button className="btn btn-ghost" onClick={demo}>
                  <Play size={17} strokeWidth={1.6} /> No camera? Watch the demo
                </button>
              </div>
            )}
          </div>
        )}

        {running && (
          <>
            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]">
              <span className="chip !bg-ink/70 !py-1"><LiveDot /> {phase === 'live' ? 'Live · on-device' : 'Demo'}</span>
              {phase === 'live' && <span className="chip !bg-ink/70 !py-1">{hud.fps} fps</span>}
              <span className="chip !bg-ink/70 !py-1">{hud.found ? '33 points' : 'Searching'}</span>
            </div>
            <div className="absolute right-4 top-4">
              <span className="chip !border-teal/40 !bg-ink/70 !py-1 font-mono text-[10px] uppercase tracking-[0.14em] !text-teal" title="Uploads, beacons, sockets or calls to other sites since the scan started">
                <ShieldCheck size={12} /> {uploads} uploads
              </span>
            </div>
            {mode === 'squat' ? (
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 rounded-2xl border border-line bg-ink/75 px-5 py-4 backdrop-blur">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">Squats</p>
                  <p className="h-display text-5xl tabular-nums leading-none">{reps}</p>
                </div>
                <p className="text-right text-sm text-white/85">{cue ? CUE_TEXT[cue as keyof typeof CUE_TEXT] : knee !== null ? `Knee ${Math.round(knee)}°` : ''}</p>
              </div>
            ) : (
              <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl border border-line bg-ink/75 px-4 py-3 backdrop-blur">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${hud.progress * 100}%`, background: 'var(--iris)' }} />
                </div>
                <p className="w-56 text-right text-xs text-white/85">
                  {result ? 'Posture check complete' : hud.found && hud.issue === 'none' ? `Stand tall and still… ${Math.round(hud.progress * 100)}%` : BODY_ISSUE_TEXT[hud.issue]}
                </p>
              </div>
            )}
          </>
        )}
      </Brackets>

      {running && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {([['posture', 'Posture', PersonStanding], ['squat', 'Squat counter', Repeat]] as const).map(([m, label, Icon]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={phase === 'demo' && m === 'posture'}
                className={`chip !px-4 !py-2 disabled:opacity-40 ${mode === m ? '!border-white/40 !bg-white/10 !text-white' : 'hover:!text-white'}`}
              >
                <Icon size={14} strokeWidth={1.6} /> {label}
              </button>
            ))}
            {mode === 'squat' && (
              <button onClick={() => setVoice((v) => !v)} className="chip !px-3 !py-2 hover:!text-white" title="Count reps out loud with your device's own voice">
                {voice ? <Volume2 size={14} strokeWidth={1.6} /> : <VolumeX size={14} strokeWidth={1.6} />} {voice ? 'Voice on' : 'Voice off'}
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={resetReadings} className="chip !px-3 !py-2 hover:!text-white">
                <RotateCcw size={14} strokeWidth={1.6} /> Reset
              </button>
              <button onClick={() => { stop(); setPhase('idle'); }} className="chip !px-3 !py-2 hover:!text-white">
                <CameraOff size={14} strokeWidth={1.6} /> Stop
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass p-5">
              <p className="eyebrow">Posture</p>
              {result ? (
                <ul className="mt-3 grid gap-2">
                  {result.metrics.map((r) => (
                    <li key={r.metric} className="flex items-center justify-between gap-3 text-sm">
                      <span>
                        {METRIC_NAME[r.metric]}
                        <span className="block text-xs text-mist">{postureNote(r.metric, r.band)}</span>
                      </span>
                      <span className={`font-mono tabular-nums ${r.band === 'aligned' ? 'text-teal' : r.band === 'slight' ? 'text-white' : 'text-ember'}`}>
                        {r.degrees.toFixed(1)}°
                      </span>
                    </li>
                  ))}
                  <li className="text-xs text-mist">{result.view === 'front' ? 'Front view.' : 'Side view.'} Turn side-on to check head position.</li>
                </ul>
              ) : (
                <p className="mt-3 text-sm text-mist">
                  {phase === 'demo' ? 'Start the camera to check your own posture.' : 'Stand naturally, arms relaxed, facing the camera — or side-on.'}
                </p>
              )}
            </div>
            <div className="glass p-5">
              <p className="eyebrow">Proportions</p>
              {sil ? (
                <>
                  <p className="mt-3 flex items-center gap-2 font-display text-xl font-semibold">
                    <Ruler size={18} strokeWidth={1.5} className="text-teal" /> {sil.name}
                  </p>
                  <p className="mt-1 text-sm text-mist">{sil.tip}</p>
                  <p className="mt-2 text-xs text-mist">Approximate, from joint positions — for style guidance only.</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-mist">Face the camera to read your shoulder-to-hip balance.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
