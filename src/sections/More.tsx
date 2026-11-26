import {
  Scissors, Palette, Glasses, Shirt, CalendarDays, Sparkles, MessageSquareText, Lock, HardDriveDownload,
  Languages, LayoutGrid, Bell, Target, Trophy, Moon, Droplets, Scale, Fingerprint, Cpu, ShieldCheck, Smartphone,
  ArrowUpRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Counter, Phone, SectionHead } from '../components/ui';
import StyleQuiz from './StyleQuiz';
import CoachDemo from './CoachDemo';

export function Style() {
  const items: [LucideIcon, string, string][] = [
    [Scissors, '31 hairstyles', 'Drawn to your face shape, tried on live.'],
    [Palette, 'Makeup guide', 'Lip and blush shades, previewed on you.'],
    [Glasses, 'Glasses finder', '11 frame shapes, matched and tried on.'],
    [Shirt, 'Wardrobe', 'Cost per wear, gaps, and what you never wear.'],
    [CalendarDays, 'Outfit calendar', 'Plan looks for the week and every event.'],
    [Sparkles, 'Style DNA', 'Fits, budget and occasions that are yours.'],
  ];
  return (
    <section id="style" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(225,75,215,0.12),transparent_55%)]" />
      <div className="page relative grid items-center gap-14 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <SectionHead
            eyebrow="Style Studio"
            title={
              <>
                Try it on <span className="iris-text">before you live it.</span>
              </>
            }
            intro="Hair, makeup and glasses follow your face in real time. Your wardrobe, your budget and your calendar come together into a style that is unmistakably you."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {items.map(([Icon, t, b], i) => (
              <div key={t} className="glass glass-hover flex gap-4 p-5" data-reveal data-reveal-delay={String(i * 0.04)}>
                <Icon size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-magenta-soft" />
                <div>
                  <p className="font-display text-[15px] font-semibold">{t}</p>
                  <p className="mt-1 text-sm text-mist">{b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto grid w-full max-w-[420px] grid-cols-2 gap-4" data-reveal>
          <Phone src="/app/06_makeup.png" alt="Makeup try-on in the app" className="mt-12" />
          <Phone src="/app/03_style.png" alt="Style tab in the app" />
        </div>
      </div>
      <div className="page relative mt-16">
        <StyleQuiz />
      </div>
    </section>
  );
}

export function Coach() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="page grid items-center gap-12 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <CoachDemo />
        </div>
        <div className="order-1 lg:order-2">
          <SectionHead
            eyebrow="Your personal coach"
            title={
              <>
                Answers from <span className="iris-text">inside the app.</span>
              </>
            }
            intro="Ask about training, food, posture, skin or style. In the app, an on-device AI coach answers from Personality's own guides and links you straight to the right screen — private, and available even in airplane mode. Try a few real answers here."
          />
        </div>
      </div>
    </section>
  );
}

export function Everything() {
  const stats: [number, string, string][] = [
    [1526, '+', 'exercises'],
    [13, '', 'fighting arts'],
    [97, '', 'regional dishes'],
    [31, '', 'hairstyles'],
    [6, '', 'languages'],
    [8, '', 'home-screen widgets'],
  ];
  const features: [LucideIcon, string][] = [
    [Target, 'Goals & Blueprint'],
    [Bell, 'Habits & reminders'],
    [Droplets, 'Water tracking'],
    [Moon, 'Sleep insights'],
    [Scale, 'Weight journey'],
    [Trophy, 'Quests & badges'],
    [LayoutGrid, 'Home widgets'],
    [Languages, 'Hindi, Arabic & more'],
    [Fingerprint, 'App lock'],
    [HardDriveDownload, 'Encrypted backup'],
    [MessageSquareText, 'AI coach'],
    [Sparkles, 'Style DNA'],
  ];
  return (
    <section className="relative border-y border-line bg-ink-900/60 py-24 sm:py-28">
      <div className="page">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(([n, s, label], i) => (
            <div key={label} data-reveal data-reveal-delay={String(i * 0.05)}>
              <p className="h-display iris-text text-4xl sm:text-5xl">
                <Counter to={n} suffix={s} />
              </p>
              <p className="mt-2 text-sm text-mist">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-wrap gap-2.5" data-reveal>
          {features.map(([Icon, t]) => (
            <span key={t} className="chip !px-4 !py-2 !text-sm text-white/85">
              <Icon size={15} strokeWidth={1.5} className="text-teal" /> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Privacy() {
  const points: [LucideIcon, string, string][] = [
    [Cpu, 'Computed on your device', 'Face and body models run inside the app (and this page) — frames never leave memory.'],
    [ShieldCheck, 'Zero uploads', 'No account, no cloud, no cookies or analytics — on this site or in the app. The labs count anything sent while you scan.'],
    [Lock, 'Locked & encrypted', 'App lock with your fingerprint, and backups encrypted with a password only you know.'],
  ];
  return (
    <section id="privacy" className="relative py-24 sm:py-32">
      <div className="page">
        <SectionHead
          center
          eyebrow="Privacy you can verify"
          title={
            <>
              Your face is <span className="iris-text">yours.</span>
            </>
          }
          intro="Every scan on this page and in the app is processed on your own device. We don't just promise it — the live labs show you an upload counter that stays at zero."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {points.map(([Icon, t, b], i) => (
            <div key={t} className="glass p-7" data-reveal data-reveal-delay={String(i * 0.06)}>
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white/[0.03]">
                <Icon size={20} strokeWidth={1.5} className="text-teal" />
              </div>
              <p className="mt-5 font-display text-lg font-semibold">{t}</p>
              <p className="mt-2 text-sm text-mist">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AppTour() {
  const shots: [string, string][] = [
    ['/app/01_health.png', 'Health'],
    ['/app/02_analyze.png', 'Analyze'],
    ['/app/04_skills.png', 'Skills'],
    ['/app/05_pose.png', 'Pose tracking'],
    ['/app/03_style.png', 'Style'],
  ];
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="page">
        <SectionHead
          eyebrow="Inside the app"
          title={
            <>
              Health. Analyze. Style. <span className="iris-text">My Growth.</span>
            </>
          }
          intro="Five tabs, one personal operating system — designed to feel calm, fast and premium on any Android phone."
        />
      </div>
      <div className="mt-14 flex gap-5 overflow-x-auto px-4 pb-6 sm:px-8 [scrollbar-width:none]" data-reveal>
        {shots.map(([src, label]) => (
          <figure key={src} className="w-[220px] shrink-0 sm:w-[250px]">
            <Phone src={src} alt={`${label} screen`} />
            <figcaption className="mt-3 text-center text-sm text-mist">{label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function Download() {
  const faq: [string, string][] = [
    ['When can I get it?', 'Personality is coming soon to Android. iPhone follows later.'],
    ['Does it need the internet?', 'No. Everything runs on your phone. The internet is only used if you choose to download extra content packs.'],
    ['Are my photos uploaded?', 'Never. Face and body scans are processed on your device and are not stored unless you save a snapshot yourself.'],
    ['Is it for beginners?', 'Yes. Plans start where you are, every move is demonstrated, and the app adjusts as you get stronger.'],
    ['Is martial arts practice safe?', 'The app teaches solo practice — stances, footwork, shadow drills and conditioning — with safety notes. Partner and weapon work belongs with a qualified teacher.'],
  ];
  return (
    <section id="download" className="relative py-24 sm:py-32">
      <div className="page grid gap-14 lg:grid-cols-2">
        <div className="glass noise relative overflow-hidden p-8 sm:p-12" data-reveal>
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet/30 blur-[100px]" />
          <img src="/app/icon-512.png" alt="Personality app icon" className="relative h-20 w-20 rounded-2xl" />
          <h2 className="h-display relative mt-8 text-4xl sm:text-5xl">
            Coming soon <span className="iris-text">to Android.</span>
          </h2>
          <p className="relative mt-4 text-mist">
            Your body, your food, your style and your skills — read live and private, in one beautifully calm app.
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <span className="btn btn-iris cursor-default">
              <Smartphone size={17} strokeWidth={1.6} /> Coming soon on Google Play
            </span>
            <a className="btn btn-ghost" href="mailto:support@dhurta.org">
              Contact us <ArrowUpRight size={16} strokeWidth={1.6} />
            </a>
          </div>
        </div>
        <div>
          <p className="eyebrow" data-reveal>
            Questions
          </p>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {faq.map(([q, a]) => (
              <details key={q} className="group py-5" data-reveal>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[17px] font-medium">
                  {q}
                  <span className="text-xl text-mist transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-mist">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="page flex flex-col items-center justify-between gap-4 text-sm text-mist sm:flex-row">
        <div className="flex items-center gap-2.5">
          <img src="/app/icon-512.png" alt="" className="h-7 w-7 rounded-lg" />
          <span>Personality · by dhurta.Inc</span>
        </div>
        <div className="flex flex-wrap justify-center gap-5">
          <a href="/privacy/" className="hover:text-white">Privacy</a>
          <a href="/credits/" className="hover:text-white">Credits</a>
          <a href="mailto:support@dhurta.org" className="hover:text-white">
            support@dhurta.org
          </a>
          <span>© {new Date().getFullYear()} dhurta.Inc</span>
        </div>
      </div>
    </footer>
  );
}
