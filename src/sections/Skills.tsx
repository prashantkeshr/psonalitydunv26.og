import { useState } from 'react';
import { MapPin, ShieldAlert, Target, Swords, Globe2, Landmark } from 'lucide-react';
import disciplines from '../data/disciplines.json';
import { SectionHead } from '../components/ui';
import Figure from '../components/Figure';

type Discipline = (typeof disciplines)[number];
const fighting = disciplines.filter((d) => d.family !== 'mindbody');

/** Each discipline gets its own colour from the app's hue. */
const tint = (hue: number, a = 1) => `hsla(${hue}, 85%, 60%, ${a})`;

function Card({ d, active, onPick }: { d: Discipline; active: boolean; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      onMouseEnter={onPick}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-300 ${
        active ? 'border-white/30 bg-white/[0.07]' : 'border-line bg-white/[0.02] hover:border-white/20'
      }`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-40 blur-2xl transition duration-500 group-hover:opacity-80"
        style={{ background: tint(d.hue) }}
      />
      <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: tint(d.hue) }}>
        {d.family === 'indian' ? 'Indian' : 'World'}
      </p>
      <p className="relative mt-2 font-display text-[15px] font-semibold leading-snug">{d.name}</p>
      <p className="relative mt-1 flex items-center gap-1 text-xs text-mist">
        <MapPin size={12} strokeWidth={1.6} /> {d.region}
      </p>
    </button>
  );
}

export default function Skills() {
  const [filter, setFilter] = useState<'all' | 'indian' | 'world'>('all');
  const [pick, setPick] = useState<Discipline>(fighting.find((d) => d.id === 'kalaripayattu') ?? fighting[0]);
  const list = fighting.filter((d) => filter === 'all' || d.family === filter);

  return (
    <section id="skills" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,122,69,0.12),transparent_60%)]" />
      <div className="page relative">
        <SectionHead
          eyebrow="The fighting skills arena"
          title={
            <>
              13 fighting arts. <span className="iris-text">One app.</span>
            </>
          }
          intro="From Boxing and Muay Thai to eight Indian martial traditions — Kalaripayattu, Silambam, Gatka and more. Stances, footwork, shadow drills and conditioning, each demonstrated move by move, built for safe solo practice."
        />

        <div className="mt-10 flex flex-wrap gap-2" data-reveal>
          {(
            [
              ['all', 'All 13', Swords],
              ['indian', 'Indian heritage · 8', Landmark],
              ['world', 'World · 5', Globe2],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`chip !px-4 !py-2 transition ${filter === k ? '!border-white/40 !text-white' : 'hover:!text-white'}`}
            >
              <Icon size={14} strokeWidth={1.6} /> {label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-reveal>
            {list.map((d) => (
              <Card key={d.id} d={d} active={pick.id === d.id} onPick={() => setPick(d)} />
            ))}
          </div>

          {/* Details of the chosen art. */}
          <div className="glass relative overflow-hidden p-6 sm:p-8" data-reveal aria-live="polite">
            <div
              className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full opacity-30 blur-3xl transition-colors duration-700"
              style={{ background: tint(pick.hue) }}
            />
            <div className="relative -mx-2 -mt-2 mb-4 h-56 overflow-hidden rounded-2xl border border-line bg-ink/60 sm:h-64">
              <div className="grid-bg absolute inset-0 opacity-70" />
              {pick.motion && <Figure key={pick.id} motion={pick.motion} label={`${pick.name} demonstration`} className="relative" />}
              <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.18em] text-mist">Solo drill · demonstrated</span>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: tint(pick.hue) }}>
              {pick.region}
            </p>
            <h3 className="h-display mt-2 text-3xl">{pick.name}</h3>
            <p className="mt-4 text-[15px] text-white/85">{pick.about}</p>
            <div className="mt-6 flex items-start gap-3">
              <Target size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-teal" />
              <p className="text-sm text-mist">
                <span className="text-white">Trains: </span>
                {pick.trains}
              </p>
            </div>
            <ul className="mt-5 grid gap-2">
              {pick.tips.map((t) => (
                <li key={t} className="rounded-xl border border-line bg-white/[0.02] px-4 py-3 text-sm text-white/80">
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-start gap-2 text-xs text-mist">
              <ShieldAlert size={15} strokeWidth={1.6} className="mt-0.5 shrink-0 text-ember" />
              {pick.safety}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
