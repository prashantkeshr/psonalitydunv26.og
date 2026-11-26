import { lazy, Suspense } from 'react';
import { ScanFace, PersonStanding, ShieldCheck } from 'lucide-react';
import { Magnetic, LiveDot } from '../components/ui';
import { scrollToId } from '../lib/motion';

const HeroFigure = lazy(() => import('../hero/HeroFigure'));

/** Small HUD readout floating beside the figure. */
function Readout({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className={`glass absolute hidden rounded-2xl px-4 py-3 md:block ${className}`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="top" className="noise relative overflow-hidden pt-16">
      {/* Ambient light and grid. */}
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-magenta/20 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 top-40 h-[560px] w-[560px] rounded-full bg-teal/15 blur-[150px]" />

      <div className="page relative grid min-h-[calc(100svh-4rem)] items-center gap-6 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-0">
        <div className="relative z-10 order-2 lg:order-1">
          <p className="chip" data-reveal>
            <LiveDot /> Live face &amp; body intelligence · on your device
          </p>
          <h1 className="h-display mt-6 text-[44px] leading-[1.02] sm:text-6xl lg:text-[76px]" data-reveal data-reveal-delay="0.05">
            Know your body.
            <br />
            <span className="iris-text">Shape your personality.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-mist sm:text-lg" data-reveal data-reveal-delay="0.1">
            Personality reads 478 points on your face and 33 on your body, live, and turns them into a training
            plan that levels up with you, food for your day, your style, and 13 fighting skills to master.
            Nothing leaves your phone.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3" data-reveal data-reveal-delay="0.15">
            <Magnetic>
              <button className="btn btn-iris" onClick={() => scrollToId('face')}>
                <ScanFace size={18} strokeWidth={1.6} /> Start face scan
              </button>
            </Magnetic>
            <Magnetic>
              <button className="btn btn-ghost" onClick={() => scrollToId('body')}>
                <PersonStanding size={18} strokeWidth={1.6} /> Start body scan
              </button>
            </Magnetic>
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-mist" data-reveal data-reveal-delay="0.2">
            <ShieldCheck size={15} strokeWidth={1.6} className="text-teal" />
            Scans run in your browser. Zero images uploaded — the page shows you the proof.
          </p>
        </div>

        <div className="relative order-1 h-[52svh] min-h-[380px] lg:order-2 lg:h-[86svh]">
          <Suspense fallback={null}>
            <HeroFigure />
          </Suspense>
          <Readout label="Face mesh" value="478 points" className="left-0 top-[14%]" />
          <Readout label="Body landmarks" value="33 points" className="right-0 top-[40%]" />
          <Readout label="Uploaded" value="0 bytes" className="bottom-[12%] left-[6%]" />
        </div>
      </div>

      {/* Scroll cue. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center lg:flex">
        <div className="h-10 w-6 rounded-full border border-white/20 p-1">
          <div className="h-3 w-full animate-scan rounded-full bg-white/50" />
        </div>
      </div>
    </section>
  );
}
