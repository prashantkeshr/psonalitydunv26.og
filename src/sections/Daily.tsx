import { Utensils, Flame, Dumbbell, Timer, CheckCircle2, Circle, Droplets, Sunrise, Moon, TrendingUp, Leaf, Wind } from 'lucide-react';
import meals from '../data/meals.json';
import { SectionHead } from '../components/ui';

/** A sample vegetarian Indian day from the app's own dishes. */
const SAMPLE_DAY = (['breakfast', 'lunch', 'snack', 'dinner'] as const).map(
  (slot) =>
    meals.find((m) => m.slot === slot && m.diet === 'vegetarian' && /indian/i.test(m.cuisine ?? '')) ??
    meals.find((m) => m.slot === slot)!,
);
const dayKcal = SAMPLE_DAY.reduce((s, m) => s + m.kcal, 0);
const dayProtein = SAMPLE_DAY.reduce((s, m) => s + m.protein, 0);

export function Food() {
  return (
    <section id="food" className="relative py-24 sm:py-32">
      <div className="page grid items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
        <SectionHead
          eyebrow="Food, made for your day"
          title={
            <>
              What should I eat? <span className="iris-text">Sorted.</span>
            </>
          }
          intro={`${meals.length} dishes from 13 cuisines — poha to pho — matched to your region, your diet and your goal. Vegetarian, vegan, egg or non-veg, every plate comes with calories and protein, and a swap when you want something else.`}
        />
        <div className="glass p-6 sm:p-8" data-reveal>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-lg font-semibold">A sample day · Vegetarian · Indian</p>
            <span className="chip">
              <Flame size={13} strokeWidth={1.6} className="text-ember" /> {dayKcal} kcal · {dayProtein} g protein
            </span>
          </div>
          <ul className="mt-6 grid gap-3">
            {SAMPLE_DAY.map((m) => (
              <li key={m.id} className="flex items-center gap-4 rounded-2xl border border-line bg-white/[0.02] p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.04]">
                  <Utensils size={18} strokeWidth={1.5} className="text-teal" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{m.slot}</p>
                  <p className="truncate text-[15px] font-medium">{m.name}</p>
                </div>
                <div className="text-right text-xs text-mist">
                  <p className="text-white">{m.kcal} kcal</p>
                  <p>{m.protein} g protein</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-mist">Interactive meal planner with swaps arrives in a later build.</p>
        </div>
      </div>
    </section>
  );
}

const TIMELINE = [
  { t: '06:30', label: 'Glass of water', icon: Droplets, done: true },
  { t: '07:00', label: 'Sun salutation · 5 rounds', icon: Sunrise, done: true },
  { t: '08:30', label: 'Breakfast · Vegetable poha', icon: Utensils, done: true },
  { t: '11:00', label: 'Posture check', icon: CheckCircle2, done: false, next: true },
  { t: '18:00', label: 'Lower body session · 3 × 12', icon: Dumbbell, done: false },
  { t: '22:30', label: 'Wind down · sleep by 23:00', icon: Moon, done: false },
];

export function YourDay() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="page">
        <SectionHead
          center
          eyebrow="Your day, planned"
          title={
            <>
              A plan that <span className="iris-text">moves with you.</span>
            </>
          }
          intro="Water, meals, workouts, posture breaks and sleep — one timeline, in time order, with what's next always on top. Swipe to tick it off. Watch the ring fill."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {/* Daily timeline */}
          <div className="glass p-6 lg:col-span-1" data-reveal>
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold">Today</p>
              <div className="relative h-14 w-14">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="url(#ring)" strokeWidth="3" strokeLinecap="round" strokeDasharray="97.4" strokeDashoffset="48.7" />
                  <defs>
                    <linearGradient id="ring" x1="0" x2="1">
                      <stop offset="0" stopColor="#E14BD7" />
                      <stop offset="1" stopColor="#29D8F2" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 grid place-items-center text-xs font-semibold">50%</span>
              </div>
            </div>
            <ul className="mt-5 grid gap-2">
              {TIMELINE.map(({ t, label, icon: Icon, done, next }) => (
                <li
                  key={t}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                    next ? 'border border-teal/40 bg-teal/[0.07]' : 'border border-transparent'
                  }`}
                >
                  <span className="w-11 font-mono text-[11px] text-mist">{t}</span>
                  <Icon size={16} strokeWidth={1.5} className={done ? 'text-teal' : 'text-white/70'} />
                  <span className={`flex-1 ${done ? 'text-mist line-through' : ''}`}>{label}</span>
                  {done ? <CheckCircle2 size={16} className="text-teal" /> : <Circle size={16} className="text-white/25" />}
                </li>
              ))}
            </ul>
          </div>

          {/* Training that levels up */}
          <div className="glass p-6" data-reveal data-reveal-delay="0.05">
            <TrendingUp size={22} strokeWidth={1.5} className="text-teal" />
            <p className="mt-4 font-display text-lg font-semibold">Training that levels up with you</p>
            <p className="mt-2 text-sm text-mist">
              A day-by-day plan with real sets and reps, tuned to your goal, gender, time and equipment. Tell it how a
              session felt — it adjusts, then promotes you.
            </p>
            <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-[11px]">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div
                  key={i}
                  className={`rounded-lg py-2 ${[0, 2, 4].includes(i) ? 'bg-white/[0.07] text-white' : 'text-mist'} ${
                    i === 2 ? 'ring-1 ring-teal/60' : ''
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <ul className="mt-4 grid gap-2 text-sm">
              {[
                ['Bodyweight squat', '3 × 12'],
                ['Glute bridge', '3 × 15'],
                ['Reverse lunge', '3 × 10 each side'],
              ].map(([n, dose]) => (
                <li key={n} className="flex justify-between rounded-xl border border-line px-3 py-2.5">
                  <span>{n}</span>
                  <span className="font-mono text-xs text-teal">{dose}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Too easy', 'Just right', 'Too hard'].map((f) => (
                <span key={f} className="chip">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Exercise of the day */}
          <div className="glass p-6" data-reveal data-reveal-delay="0.1">
            <Dumbbell size={22} strokeWidth={1.5} className="text-teal" />
            <p className="mt-4 font-display text-lg font-semibold">Your exercise of the day</p>
            <p className="mt-2 text-sm text-mist">
              Picked for your focus area, demonstrated by a moving figure, with voice cues that count you down and call
              out every switch of side — offline.
            </p>
            <div className="mt-6 rounded-2xl border border-line bg-white/[0.02] p-5 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">Plank</p>
              <p className="mt-3 font-display text-5xl font-semibold tabular-nums">0:30</p>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-mist">
                <Timer size={13} strokeWidth={1.6} /> Hold · 3 rounds · rest 20 s
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-line px-3 py-2.5">
                <Leaf size={14} strokeWidth={1.5} className="text-teal" />
                <p className="mt-1.5 text-white">Yoga flows</p>
                <p className="text-mist">Sun, Balance, Evening calm</p>
              </div>
              <div className="rounded-xl border border-line px-3 py-2.5">
                <Wind size={14} strokeWidth={1.5} className="text-teal" />
                <p className="mt-1.5 text-white">Build your own</p>
                <p className="text-mist">Pick moves, reps, rest</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
