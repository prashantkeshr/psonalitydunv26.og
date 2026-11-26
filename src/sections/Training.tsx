import { useMemo, useState } from 'react';
import { TrendingUp, Award } from 'lucide-react';
import exercises from '../data/exercises.json';

/**
 * A compact port of the app's training engine (training_engine.dart):
 * goal and focus pick the week's sessions, doses scale by level, and how a
 * session felt moves each exercise up or down a step until the level rises.
 */
type Kind = 'reps' | 'hold' | 'minutes';
const BASE: Record<string, [Kind, number, boolean?]> = {
  squat: ['reps', 10], push_up: ['reps', 8], incline_push_up: ['reps', 8], reverse_lunge: ['reps', 8, true],
  glute_bridge: ['reps', 12], calf_raise: ['reps', 15], wall_sit: ['hold', 25], plank: ['hold', 20],
  bird_dog: ['reps', 8, true], arm_raise: ['reps', 12], brisk_walk: ['minutes', 10], chin_tuck: ['reps', 10],
  wall_angels: ['reps', 10], shoulder_rolls: ['reps', 10], cat_cow: ['reps', 8], hamstring_stretch: ['hold', 25, true],
  child_pose: ['hold', 30], surya_namaskar: ['reps', 3], warrior_2: ['hold', 20, true], tree_pose: ['hold', 20, true],
  downward_dog: ['hold', 25], cobra: ['hold', 15], bridge_pose: ['hold', 20], forward_fold: ['hold', 25], low_lunge: ['hold', 20, true],
};
type Session = 'fullBody' | 'upper' | 'lower' | 'core' | 'cardio' | 'mobility' | 'yoga' | 'posture';
const SESSION_NAME: Record<Session, string> = {
  fullBody: 'Full body', upper: 'Upper body', lower: 'Lower body & glutes', core: 'Core', cardio: 'Cardio',
  mobility: 'Mobility', yoga: 'Yoga', posture: 'Posture',
};
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

function pool(t: Session, level: number): string[] {
  const push = level === 0 ? 'incline_push_up' : 'push_up';
  return {
    fullBody: ['squat', push, 'reverse_lunge', 'plank'],
    upper: [push, 'plank', 'arm_raise', 'wall_angels'],
    lower: ['squat', 'reverse_lunge', 'glute_bridge', 'wall_sit'],
    core: ['plank', 'bird_dog', 'glute_bridge', 'cat_cow'],
    cardio: ['brisk_walk', 'squat', 'calf_raise', 'arm_raise'],
    mobility: ['cat_cow', 'hamstring_stretch', 'shoulder_rolls', 'low_lunge'],
    yoga: ['surya_namaskar', 'warrior_2', 'tree_pose', 'cobra'],
    posture: ['chin_tuck', 'wall_angels', 'shoulder_rolls', 'bird_dog'],
  }[t];
}

const GOALS = {
  strength: 'Get stronger',
  weight: 'Lose weight',
  posture: 'Better posture',
  flex: 'Flexibility',
} as const;
type Goal = keyof typeof GOALS;
type Focus = 'upper' | 'lower' | 'balanced';

function sequence(goal: Goal, focus: Focus): Session[] {
  if (goal === 'strength')
    return focus === 'upper' ? ['upper', 'lower', 'core'] : focus === 'lower' ? ['lower', 'upper', 'core'] : ['fullBody', 'core', 'upper'];
  if (goal === 'weight') return ['fullBody', 'cardio', focus === 'upper' ? 'upper' : 'lower'];
  if (goal === 'posture') return ['posture', 'core', 'mobility'];
  return ['yoga', 'mobility', 'core'];
}

function dose(id: string, level: number, step: number) {
  const [kind, amount, sides] = BASE[id] ?? ['reps', 10];
  const scale = [1, 1.4, 1.8][level];
  const per = kind === 'reps' ? 2 : kind === 'hold' ? 5 : 2;
  const a = Math.max(kind === 'minutes' ? 2 : kind === 'hold' ? 10 : 4, Math.round(amount * scale) + per * step);
  const sets = kind === 'minutes' ? 1 : Math.min(5, Math.max(1, [2, 3, 4][level] + (step > 0 ? Math.floor(step / 3) : 0)));
  const unit = kind === 'reps' ? `${a} reps` : kind === 'hold' ? `${a} s` : `${a} min`;
  return kind === 'minutes' ? unit : `${sets} × ${unit}${sides ? ' each side' : ''}`;
}

const NAMES = Object.fromEntries(exercises.map((e) => [e.id, e.name]));
const name = (id: string) =>
  NAMES[id] ?? id.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TRAIN = [0, 2, 4];

export function TrainingCard() {
  const [goal, setGoal] = useState<Goal>('strength');
  const [gender, setGender] = useState<'woman' | 'man' | 'other'>('woman');
  const [level, setLevel] = useState(0);
  const [step, setStep] = useState(0);
  const [steady, setSteady] = useState(0);
  const [day, setDay] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const focus: Focus = gender === 'woman' ? 'lower' : gender === 'man' ? 'upper' : 'balanced';
  const week = useMemo(() => sequence(goal, focus), [goal, focus]);
  const session = week[day];
  const list = pool(session, level).slice(0, 3);

  /** Too easy: a step up. Just right twice in a row: a step up. Too hard:
   *  a step down. Four steps up promotes the level. */
  const feel = (f: 'easy' | 'right' | 'hard') => {
    let s = step;
    let k = steady;
    if (f === 'easy') { s++; k = 0; }
    else if (f === 'hard') { s = Math.max(0, s - 1); k = 0; }
    else if (++k >= 2) { s++; k = 0; }
    if (s >= 4 && level < 2) {
      setLevel(level + 1);
      setStep(0);
      setSteady(0);
      setNote(`Level up! You're now ${LEVELS[level + 1].toLowerCase()}.`);
      return;
    }
    setStep(s);
    setSteady(k);
    setNote(f === 'easy' ? 'Next time you get a few more reps.' : f === 'hard' ? 'Eased off a little for next time.' : k ? 'Steady — once more and it steps up.' : 'Stepped up for next time.');
  };

  const chip = (on: boolean) => `chip !px-2.5 !py-1 ${on ? '!border-white/40 !text-white' : 'hover:!text-white'}`;

  return (
    <div className="glass flex flex-col p-6" data-reveal data-reveal-delay="0.05">
      <div className="flex items-center gap-2">
        <TrendingUp size={20} strokeWidth={1.5} className="text-teal" />
        <p className="font-display text-lg font-semibold">Training that levels up</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(GOALS) as Goal[]).map((g) => (
          <button key={g} className={chip(goal === g)} onClick={() => { setGoal(g); setDay(0); }}>{GOALS[g]}</button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {(['woman', 'man', 'other'] as const).map((g) => (
          <button key={g} className={chip(gender === g)} onClick={() => setGender(g)}>
            {g === 'woman' ? 'Woman' : g === 'man' ? 'Man' : 'Prefer not to say'}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-mist">
        {LEVELS[level]} · 3 days a week · focus {focus === 'balanced' ? 'balanced' : focus === 'upper' ? 'upper body' : 'lower body & glutes'}
      </p>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px]">
        {DAYS.map((d, i) => {
          const t = TRAIN.indexOf(i);
          return (
            <button
              key={i}
              disabled={t < 0}
              onClick={() => setDay(t)}
              className={`rounded-lg py-2 transition ${t >= 0 ? 'bg-white/[0.07] text-white hover:bg-white/[0.12]' : 'text-mist'} ${t === day ? 'ring-1 ring-teal/70' : ''}`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-sm font-medium">{SESSION_NAME[session]} session</p>
      <ul className="mt-2 grid gap-2 text-sm">
        {list.map((id) => (
          <li key={id} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2.5">
            <span className="truncate">{name(id)}</span>
            <span className="shrink-0 font-mono text-xs text-teal transition-all">{dose(id, level, step)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-mist">After the session — how did it feel?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button className="chip !py-1.5 hover:!text-white" onClick={() => feel('easy')}>Too easy</button>
        <button className="chip !py-1.5 hover:!text-white" onClick={() => feel('right')}>Just right</button>
        <button className="chip !py-1.5 hover:!text-white" onClick={() => feel('hard')}>Too hard</button>
      </div>
      {note && (
        <p className={`mt-3 flex items-center gap-2 text-sm ${note.startsWith('Level') ? 'text-teal' : 'text-white/85'}`} aria-live="polite">
          {note.startsWith('Level') && <Award size={16} />} {note}
        </p>
      )}
    </div>
  );
}
