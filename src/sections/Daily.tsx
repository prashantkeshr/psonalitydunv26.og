import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Utensils, Flame, Dumbbell, CheckCircle2, Circle, Droplets, Sunrise, Moon, TrendingUp, Shuffle, Beef,
  Play, Pause, RotateCcw, Sparkles, Armchair, SkipForward,
} from 'lucide-react';
import meals from '../data/meals.json';
import exercises from '../data/exercises.json';
import { SectionHead } from '../components/ui';
import Figure from '../components/Figure';
import { TrainingCard } from './Training';

// ------------------------------------------------------------------ food

type Meal = (typeof meals)[number];
const SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
type Diet = 'vegan' | 'vegetarian' | 'egg' | 'nonveg';
const DIET_LABEL: Record<Diet, string> = { vegan: 'Vegan', vegetarian: 'Vegetarian', egg: 'Egg', nonveg: 'Non-veg' };
/** Each diet allows itself and everything stricter. */
const ALLOWS: Record<Diet, string[]> = {
  vegan: ['vegan'],
  vegetarian: ['vegan', 'vegetarian'],
  egg: ['vegan', 'vegetarian', 'egg'],
  nonveg: ['vegan', 'vegetarian', 'egg', 'nonveg'],
};
const REGIONS: { id: string; label: string; cuisines: string[] }[] = [
  { id: 'north', label: 'North Indian', cuisines: ['northIndian', 'indian'] },
  { id: 'south', label: 'South Indian', cuisines: ['southIndian', 'indian'] },
  { id: 'east', label: 'East Indian', cuisines: ['eastIndian', 'indian'] },
  { id: 'west', label: 'West Indian', cuisines: ['westIndian', 'indian'] },
  { id: 'med', label: 'Mediterranean', cuisines: ['mediterranean', 'middleEastern'] },
  { id: 'asia', label: 'Asian', cuisines: ['eastAsian', 'southeastAsian'] },
  { id: 'west2', label: 'Western', cuisines: ['western', 'latin'] },
  { id: 'africa', label: 'African', cuisines: ['african'] },
];
const GOALS = [
  { id: 'lose', label: 'Lose weight', kcal: 1700 },
  { id: 'keep', label: 'Stay balanced', kcal: 2100 },
  { id: 'gain', label: 'Build muscle', kcal: 2600 },
] as const;

/** Meals that fit, best matches first: the region's own dishes, then
 *  global ones. */
function candidates(slot: string, diet: Diet, region: string[], goal: (typeof GOALS)[number]['id']): Meal[] {
  const ok = meals.filter((m) => m.slot === slot && ALLOWS[diet].includes(m.diet));
  const score = (m: Meal) =>
    (region.indexOf(m.cuisine ?? '') >= 0 ? 10 - region.indexOf(m.cuisine ?? '') : m.cuisine === 'global' ? 2 : 0) +
    (goal === 'gain' ? m.protein / 10 : goal === 'lose' ? -m.kcal / 300 + m.protein / 15 : 0);
  return ok.sort((a, b) => score(b) - score(a));
}

export function Food() {
  const [diet, setDiet] = useState<Diet>('vegetarian');
  const [regionId, setRegionId] = useState('north');
  const [goal, setGoal] = useState<(typeof GOALS)[number]['id']>('keep');
  const [picks, setPicks] = useState<Record<string, number>>({});
  const region = REGIONS.find((r) => r.id === regionId)!.cuisines;

  useEffect(() => setPicks({}), [diet, regionId, goal]);

  const day = SLOTS.map((slot) => {
    const list = candidates(slot, diet, region, goal);
    const i = picks[slot] ?? 0;
    return { slot, meal: list.length ? list[i % list.length] : null, count: list.length };
  });
  const kcal = day.reduce((s, d) => s + (d.meal?.kcal ?? 0), 0);
  const protein = day.reduce((s, d) => s + (d.meal?.protein ?? 0), 0);
  const target = GOALS.find((g) => g.id === goal)!.kcal;

  const chip = (active: boolean) => `chip !px-3 !py-1.5 ${active ? '!border-white/40 !bg-white/10 !text-white' : 'hover:!text-white'}`;

  return (
    <section id="food" className="relative py-24 sm:py-32">
      <div className="page grid items-start gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <SectionHead
            eyebrow="Food, made for your day"
            title={
              <>
                What should I eat? <span className="iris-text">Sorted.</span>
              </>
            }
            intro={`${meals.length} dishes from 13 cuisines — poha to pho — matched to your region, your diet and your goal. Pick yours and build a day; swap any plate you don't fancy.`}
          />
          <div className="mt-8 grid gap-4" data-reveal>
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-mist">Diet</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DIET_LABEL) as Diet[]).map((d) => (
                  <button key={d} className={chip(diet === d)} onClick={() => setDiet(d)}>
                    {DIET_LABEL[d]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-mist">Your food</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((r) => (
                  <button key={r.id} className={chip(regionId === r.id)} onClick={() => setRegionId(r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-mist">Goal</p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button key={g.id} className={chip(goal === g.id)} onClick={() => setGoal(g.id)}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-6 sm:p-8" data-reveal>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-lg font-semibold">Your sample day</p>
            <div className="flex gap-2">
              <span className="chip"><Flame size={13} strokeWidth={1.6} className="text-ember" /> {kcal} kcal</span>
              <span className="chip"><Beef size={13} strokeWidth={1.6} className="text-teal" /> {protein} g protein</span>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" title={`About ${target} kcal is a typical day for this goal`}>
            <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, (kcal / target) * 100)}%`, background: 'var(--iris)' }} />
          </div>
          <p className="mt-1.5 text-[11px] text-mist">
            Meals cover {Math.round((kcal / target) * 100)}% of a typical {target} kcal day — the app tunes this to your body and activity.
          </p>
          <ul className="mt-5 grid gap-3">
            {day.map(({ slot, meal, count }) => (
              <li key={slot} className="flex items-center gap-4 rounded-2xl border border-line bg-white/[0.02] p-4 transition hover:border-white/20">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.04]">
                  <Utensils size={18} strokeWidth={1.5} className="text-teal" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{slot}</p>
                  <p className="truncate text-[15px] font-medium">{meal?.name ?? 'No match — try another diet'}</p>
                  {meal && <p className="text-xs text-mist">{meal.portion} · {meal.kcal} kcal · {meal.protein} g protein</p>}
                </div>
                {count > 1 && (
                  <button
                    className="chip !p-2 hover:!text-white"
                    onClick={() => setPicks((p) => ({ ...p, [slot]: (p[slot] ?? 0) + 1 }))}
                    aria-label={`Swap ${slot}`}
                    title="Swap"
                  >
                    <Shuffle size={15} strokeWidth={1.6} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------- timeline

type Task = { id: string; t: string; label: string; icon: LucideIcon; state: 'open' | 'done' | 'skipped' };
const START: Task[] = [
  { id: 'water', t: '06:30', label: 'Glass of water', icon: Droplets, state: 'done' },
  { id: 'sun', t: '07:00', label: 'Sun salutation · 5 rounds', icon: Sunrise, state: 'done' },
  { id: 'bfast', t: '08:30', label: 'Breakfast · Vegetable poha', icon: Utensils, state: 'open' },
  { id: 'posture', t: '11:00', label: 'Posture check', icon: Armchair, state: 'open' },
  { id: 'workout', t: '18:00', label: 'Lower body session · 3 × 12', icon: Dumbbell, state: 'open' },
  { id: 'sleep', t: '22:30', label: 'Wind down · sleep by 23:00', icon: Moon, state: 'open' },
];

/** One row: tap the circle, or swipe right for done and left to skip. */
function TaskRow({ task, next, onChange }: { task: Task; next: boolean; onChange: (s: Task['state']) => void }) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const Icon = task.icon;
  const end = () => {
    if (dx > 70) onChange(task.state === 'done' ? 'open' : 'done');
    else if (dx < -70) onChange(task.state === 'skipped' ? 'open' : 'skipped');
    start.current = null;
    setDx(0);
  };
  return (
    <li className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 flex items-center justify-between px-4 text-xs">
        <span className={`text-teal transition ${dx > 20 ? 'opacity-100' : 'opacity-0'}`}>Done</span>
        <span className={`text-mist transition ${dx < -20 ? 'opacity-100' : 'opacity-0'}`}>Skip today</span>
      </div>
      <div
        className={`relative flex touch-pan-y select-none items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
          next ? 'border-teal/40 bg-[#0d1a1f]' : 'border-transparent bg-ink-900'
        } ${start.current === null ? 'transition-transform duration-300' : ''}`}
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={(e) => {
          start.current = e.clientX;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => start.current !== null && setDx(Math.max(-120, Math.min(120, e.clientX - start.current)))}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <span className="w-11 font-mono text-[11px] text-mist">{task.t}</span>
        <Icon size={16} strokeWidth={1.5} className={task.state === 'done' ? 'text-teal' : 'text-white/70'} />
        <span className={`flex-1 ${task.state !== 'open' ? 'text-mist line-through' : ''}`}>{task.label}</span>
        <button
          onClick={() => onChange(task.state === 'done' ? 'open' : 'done')}
          aria-label={task.state === 'done' ? `Undo ${task.label}` : `Mark ${task.label} done`}
          className="p-1"
        >
          {task.state === 'done' ? (
            <CheckCircle2 size={18} className="text-teal" />
          ) : task.state === 'skipped' ? (
            <SkipForward size={16} className="text-white/40" />
          ) : (
            <Circle size={18} className="text-white/30" />
          )}
        </button>
      </div>
    </li>
  );
}

function Timeline() {
  const [tasks, setTasks] = useState(START);
  const counted = tasks.filter((t) => t.state !== 'skipped');
  const done = counted.filter((t) => t.state === 'done').length;
  const pct = counted.length ? done / counted.length : 0;
  const next = tasks.find((t) => t.state === 'open');
  return (
    <div className="glass p-6" data-reveal>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-semibold">Today</p>
          <p className="text-xs text-mist">Tap a circle, or swipe a task</p>
        </div>
        <div className="relative h-14 w-14">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" stroke="url(#ring)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - pct)} style={{ transition: 'stroke-dashoffset 0.7s ease' }}
            />
            <defs>
              <linearGradient id="ring" x1="0" x2="1">
                <stop offset="0" stopColor="#E14BD7" />
                <stop offset="1" stopColor="#29D8F2" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 grid place-items-center text-xs font-semibold">{Math.round(pct * 100)}%</span>
        </div>
      </div>
      {pct === 1 && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-teal/30 bg-teal/[0.07] px-3 py-2 text-sm">
          <Sparkles size={16} className="text-teal" /> Day complete! Everything on today's plan is done.
        </p>
      )}
      <ul className="mt-4 grid gap-1.5">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} next={t === next} onChange={(s) => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, state: s } : x)))} />
        ))}
      </ul>
      <button onClick={() => setTasks(START)} className="mt-3 flex items-center gap-1.5 text-xs text-mist hover:text-white">
        <RotateCcw size={12} /> Reset the day
      </button>
    </div>
  );
}

// ------------------------------------------------------ exercise of the day

type Ex = (typeof exercises)[number];
const FOCUS: { id: string; label: string; cats: string[] }[] = [
  { id: 'strength', label: 'Strength', cats: ['strength', 'core'] },
  { id: 'posture', label: 'Posture', cats: ['upperBack', 'shoulder', 'lowerBack'] },
  { id: 'flex', label: 'Flexibility', cats: ['stretching', 'yoga'] },
  { id: 'energy', label: 'Energy', cats: ['cardio', 'strength'] },
];
const holdSeconds = (dose?: string | null) => {
  const m = dose?.match(/(\d+)\s*(s\b|sec|seconds)/i);
  return m ? Number(m[1]) : null;
};

function ExerciseOfDay() {
  const [focus, setFocus] = useState(FOCUS[0].id);
  const [n, setN] = useState(0);
  const list = useMemo(() => exercises.filter((e) => FOCUS.find((f) => f.id === focus)!.cats.includes(e.category)), [focus]);
  const ex: Ex = list[n % list.length];
  const total = holdSeconds(ex.dose) ?? 40;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setLeft(total);
    setRunning(false);
  }, [ex.id, total]);
  useEffect(() => {
    if (!running) return;
    if (left <= 0) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [running, left]);

  return (
    <div className="glass flex flex-col p-6" data-reveal data-reveal-delay="0.1">
      <div className="flex items-center gap-2">
        <Dumbbell size={20} strokeWidth={1.5} className="text-teal" />
        <p className="font-display text-lg font-semibold">Exercise of the day</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {FOCUS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setFocus(f.id); setN(0); }}
            className={`chip !px-2.5 !py-1 ${focus === f.id ? '!border-white/40 !text-white' : 'hover:!text-white'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="relative mt-4 h-48 overflow-hidden rounded-2xl border border-line bg-ink/60">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <Figure key={ex.id} motion={ex.motion} label={ex.name} className="relative" />
      </div>
      <p className="mt-4 font-display text-[17px] font-semibold">{ex.name}</p>
      <p className="text-sm text-mist">{ex.summary} {ex.dose && <span className="text-white/80">· {ex.dose}</span>}</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="relative grid h-14 w-14 place-items-center">
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#29D8F2" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - left / total)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <span className="font-mono text-sm tabular-nums">{left}</span>
        </div>
        <button className="btn btn-iris !px-4 !py-2" onClick={() => (left <= 0 ? (setLeft(total), setRunning(true)) : setRunning((r) => !r))}>
          {running ? <Pause size={15} /> : <Play size={15} />} {running ? 'Pause' : left <= 0 ? 'Again' : 'Try it now'}
        </button>
        <button className="chip !p-2 hover:!text-white" onClick={() => setN((x) => x + 1)} aria-label="Another exercise" title="Another exercise">
          <Shuffle size={15} />
        </button>
      </div>
      {left <= 0 && <p className="mt-3 text-sm text-teal">Nice work — that's how every session in the app feels.</p>}
    </div>
  );
}

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
          intro="Water, meals, workouts, posture breaks and sleep — one timeline, with what's next always on top. Try it: swipe a task, tick it off, and watch the ring fill."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          <Timeline />
          <TrainingCard />
          <ExerciseOfDay />
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-mist">
          <TrendingUp size={14} className="text-teal" /> Everything here runs in your browser — nothing is saved or sent.
        </p>
      </div>
    </section>
  );
}
