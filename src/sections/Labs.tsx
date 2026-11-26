import type { LucideIcon } from 'lucide-react';
import { ScanFace, PersonStanding, Glasses, Ruler, Compass, Activity, Shirt, Repeat, Camera } from 'lucide-react';
import { lazy, Suspense, type ReactNode } from 'react';
import { Brackets, LiveDot, SectionHead } from '../components/ui';

const FaceLabLive = lazy(() => import('../labs/FaceLabLive'));
const BodyLabLive = lazy(() => import('../labs/BodyLabLive'));

type Reading = { icon: LucideIcon; title: string; body: string };

function Lab({
  id,
  eyebrow,
  title,
  intro,
  readings,
  stageIcon: StageIcon,
  stageLabel,
  stage,
  flip = false,
}: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  intro: string;
  readings: Reading[];
  stageIcon: LucideIcon;
  stageLabel: string;
  /** The live lab; a placeholder stage is shown until it exists. */
  stage?: ReactNode;
  flip?: boolean;
}) {
  return (
    <section id={id} className="relative py-24 sm:py-32">
      <div className="page grid items-start gap-x-12 gap-y-8 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
        <div className={flip ? 'lg:col-start-2' : ''}>
          <SectionHead eyebrow={eyebrow} title={title} intro={intro} />
        </div>
        <div className={`order-3 lg:order-none ${flip ? 'lg:col-start-2' : ''}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            {readings.map(({ icon: Icon, title: t, body }, i) => (
              <div key={t} className="glass glass-hover p-5" data-reveal data-reveal-delay={String(i * 0.05)}>
                <Icon size={20} strokeWidth={1.5} className="text-teal" />
                <p className="mt-3 font-display text-[15px] font-semibold">{t}</p>
                <p className="mt-1 text-sm text-mist">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* The scanner stage: the live camera view lands here. */}
        <div data-reveal className={`order-2 lg:order-none lg:row-span-2 lg:row-start-1 ${flip ? 'lg:col-start-1' : 'lg:col-start-2'}`}>
          {stage ?? (
          <Brackets className="glass aspect-[4/5] overflow-hidden rounded-[28px] sm:aspect-[4/4.4]">
            <div className="grid-bg absolute inset-0 opacity-60" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
              <div className="h-1/2 animate-scan border-b border-teal/60 bg-gradient-to-b from-transparent to-teal/10" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
              <div className="grid h-24 w-24 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                <StageIcon size={42} strokeWidth={1.1} className="text-white/80" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold">{stageLabel}</p>
                <p className="mx-auto mt-2 max-w-xs text-sm text-mist">
                  Your camera stays on your device. Frames are read in memory and never stored or sent.
                </p>
              </div>
              <button className="btn btn-iris opacity-60" disabled>
                <Camera size={17} strokeWidth={1.6} /> Live scan — arriving in the next build
              </button>
            </div>
            <div className="absolute left-5 top-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
              <LiveDot /> On-device
            </div>
          </Brackets>
          )}
        </div>
      </div>
    </section>
  );
}

export function FaceLab() {
  return (
    <Lab
      id="face"
      eyebrow="Live Face Lab"
      title={
        <>
          478 points. <span className="iris-text">Read in real time.</span>
        </>
      }
      intro="Look into your camera and watch a full face mesh lock on. Personality measures shape and proportion — then tries frames on you, live. No beauty scores, ever: just honest, useful insight."
      readings={[
        { icon: ScanFace, title: 'Face shape', body: 'Oval, round, square, heart or long — from real proportions.' },
        { icon: Ruler, title: 'Proportions & balance', body: 'Facial thirds and left–right balance, explained simply.' },
        { icon: Compass, title: 'Head angle', body: 'Yaw, pitch and roll, so every scan is taken straight on.' },
        { icon: Glasses, title: 'Glasses try-on', body: 'Frames that suit your shape, following your face live.' },
      ]}
      stageIcon={ScanFace}
      stageLabel="Face scan"
      stage={
        <Suspense fallback={<div className="glass aspect-[4/3.6] rounded-[28px]" />}>
          <FaceLabLive />
        </Suspense>
      }
    />
  );
}

export function BodyLab() {
  return (
    <Lab
      id="body"
      flip
      eyebrow="Live Body Lab"
      title={
        <>
          Your posture, <span className="iris-text">decoded.</span>
        </>
      }
      intro="Step back and the 33-point skeleton tracks you head to toe. Check how you stand, see your proportions, and do a few squats — Personality counts every rep with you."
      readings={[
        { icon: PersonStanding, title: 'Posture check', body: 'Shoulder tilt, head forward and hip level, measured.' },
        { icon: Shirt, title: 'Body proportions', body: 'Shoulder-to-hip balance that guides your style silhouette.' },
        { icon: Repeat, title: 'Live rep counter', body: 'Squats counted from your movement, with form cues.' },
        { icon: Activity, title: 'Movement tracking', body: 'The same engine that coaches every workout in the app.' },
      ]}
      stageIcon={PersonStanding}
      stageLabel="Body scan"
      stage={
        <Suspense fallback={<div className="glass aspect-[4/4.4] rounded-[28px]" />}>
          <BodyLabLive />
        </Suspense>
      }
    />
  );
}
