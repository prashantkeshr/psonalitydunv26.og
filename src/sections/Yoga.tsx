import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sunrise, Scale, Moon } from 'lucide-react';
import flows from '../data/yoga.json';
import Figure from '../components/Figure';
import { SectionHead } from '../components/ui';
import { prefersReducedMotion } from '../lib/motion';

const ICONS = { yoga_sun_flow: Sunrise, yoga_balance: Scale, yoga_evening_calm: Moon } as const;
const HOLD = 9000; // ms per pose: about one slow breath in and out, twice

/** A guided flow: the figure moves through each pose while a ring paces
 *  the breath (in for 4, out for 6). */
export default function Yoga() {
  const [flowId, setFlowId] = useState(flows[0].id);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(!prefersReducedMotion());
  const [breath, setBreath] = useState<'in' | 'out'>('in');
  const flow = flows.find((f) => f.id === flowId)!;
  const pose = flow.steps[step];

  useEffect(() => setStep(0), [flowId]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % flow.steps.length), HOLD);
    return () => clearTimeout(t);
  }, [playing, step, flow.steps.length]);

  // Breathing pace: 4 s in, 6 s out.
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setBreath((b) => (b === 'in' ? 'out' : 'in')), breath === 'in' ? 4000 : 6000);
    return () => clearTimeout(t);
  }, [playing, breath]);

  return (
    <section id="yoga" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(41,216,242,0.08),transparent_60%)]" />
      <div className="page relative">
        <SectionHead
          center
          eyebrow="Yoga & mindfulness"
          title={
            <>
              Breathe. Flow. <span className="iris-text">Balance.</span>
            </>
          }
          intro="Three guided flows rooted in India's oldest practice — from Surya Namaskar at sunrise to an evening wind-down. Every pose is demonstrated, with a calm breathing pace to follow."
        />

        <div className="mt-10 flex flex-wrap justify-center gap-2" data-reveal>
          {flows.map((f) => {
            const Icon = ICONS[f.id as keyof typeof ICONS] ?? Sunrise;
            return (
              <button
                key={f.id}
                onClick={() => setFlowId(f.id)}
                className={`chip !px-4 !py-2 ${flowId === f.id ? '!border-white/40 !bg-white/10 !text-white' : 'hover:!text-white'}`}
              >
                <Icon size={14} strokeWidth={1.6} /> {f.title}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-[1.2fr_1fr]" data-reveal>
          <div className="glass relative min-h-[380px] overflow-hidden sm:min-h-[440px]">
            <div className="grid-bg absolute inset-0 opacity-60" />
            {/* Breathing ring behind the figure. */}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div
                className="rounded-full border border-teal/30 bg-teal/[0.04]"
                style={{
                  width: breath === 'in' ? '74%' : '46%',
                  aspectRatio: '1',
                  transition: `width ${breath === 'in' ? 4 : 6}s ease-in-out`,
                }}
              />
            </div>
            <div className="absolute inset-0 p-6">
              {pose.motion && <Figure key={`${flowId}-${step}`} motion={pose.motion} speed={0.7} label={pose.name} />}
            </div>
            <div className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
              Pose {step + 1} of {flow.steps.length}
            </div>
            <div className="absolute right-5 top-5 font-mono text-[11px] uppercase tracking-[0.2em] text-teal">
              {playing ? (breath === 'in' ? 'Breathe in' : 'Breathe out') : 'Paused'}
            </div>
          </div>

          <div className="glass flex flex-col p-6 sm:p-8">
            <p className="eyebrow">{flow.title}</p>
            <h3 className="h-display mt-3 text-3xl">{pose.name}</h3>
            <p className="mt-3 text-sm text-mist">{flow.summary}</p>
            <ol className="mt-6 grid gap-1.5">
              {flow.steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => setStep(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                      i === step ? 'bg-white/[0.07] text-white' : 'text-mist hover:text-white'
                    }`}
                  >
                    <span className="w-5 font-mono text-[11px] text-mist">{String(i + 1).padStart(2, '0')}</span>
                    {s.name}
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-auto flex items-center gap-2 pt-6">
              <button className="chip !p-2.5 hover:!text-white" onClick={() => setStep((s) => (s - 1 + flow.steps.length) % flow.steps.length)} aria-label="Previous pose">
                <ChevronLeft size={16} />
              </button>
              <button className="btn btn-iris !px-5 !py-2.5" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause' : 'Play flow'}
              </button>
              <button className="chip !p-2.5 hover:!text-white" onClick={() => setStep((s) => (s + 1) % flow.steps.length)} aria-label="Next pose">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
