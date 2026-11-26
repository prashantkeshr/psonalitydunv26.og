import { useState } from 'react';
import { ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';

/** Five quick choices that add up to a Style DNA card, like the profile the
 *  app builds (fits, colours, occasions, budget). */
type Look = 'classic' | 'minimal' | 'smart' | 'traditional' | 'sporty';
const LOOKS: { id: Look; name: string; img: string }[] = [
  { id: 'classic', name: 'Classic', img: '/looks/classic_1.jpg' },
  { id: 'minimal', name: 'Minimal', img: '/looks/minimal_1.jpg' },
  { id: 'smart', name: 'Smart casual', img: '/looks/smart_2.jpg' },
  { id: 'traditional', name: 'Traditional', img: '/looks/traditional_1.jpg' },
  { id: 'sporty', name: 'Sporty', img: '/looks/sporty_1.jpg' },
];
const FITS = { relaxed: 'Relaxed', tailored: 'Tailored', mixed: 'A bit of both' } as const;
const PALETTES = {
  neutrals: { name: 'Soft neutrals', colors: ['#EDE6DA', '#C8B79E', '#8C7B6B', '#3F3A36'] },
  earth: { name: 'Earth tones', colors: ['#B5543A', '#C99A3E', '#6B6B2E', '#5A3A28'] },
  bold: { name: 'Bold & bright', colors: ['#E2674F', '#2F6FDB', '#E8B931', '#1F9D74'] },
  dark: { name: 'Monochrome dark', colors: ['#111214', '#2B2D33', '#5B5F68', '#D9DCE1'] },
} as const;
const OCCASIONS = { work: 'Work', casual: 'Everyday', events: 'Events & festivals', active: 'Active days' } as const;
const BUDGETS = { quality: 'Fewer, better pieces', value: 'Value and variety', mix: 'A smart mix' } as const;

type Answers = {
  look?: Look;
  fit?: keyof typeof FITS;
  palette?: keyof typeof PALETTES;
  occasion?: keyof typeof OCCASIONS;
  budget?: keyof typeof BUDGETS;
};

const PIECES: Record<Look, string[]> = {
  classic: ['Navy blazer', 'Crisp white shirt', 'Dark straight trousers', 'Leather loafers'],
  minimal: ['Neutral overcoat', 'Plain knit', 'Wide-leg trousers', 'Clean white sneakers'],
  smart: ['Solid overshirt', 'Chinos', 'Polo or fine tee', 'Suede boots'],
  traditional: ['Kurta or silk saree', 'Nehru jacket', 'Juttis or kolhapuris', 'One statement piece of jewellery'],
  sporty: ['Technical jacket', 'Tapered joggers', 'Breathable tees', 'Running shoes that double for the street'],
};
const FIT_TIP: Record<keyof typeof FITS, string> = {
  relaxed: 'Keep one element structured — a collar, a crease, a clean shoe — so relaxed never reads as sloppy.',
  tailored: 'Shoulders that end at your shoulder bone and a hem that just touches your shoe do most of the work.',
  mixed: 'Pair one roomy piece with one fitted piece: relaxed trousers with a neat top, or the reverse.',
};
const BUDGET_TIP: Record<keyof typeof BUDGETS, string> = {
  quality: 'Spend on shoes, outerwear and tailoring; let the app track cost per wear.',
  value: 'Build around neutrals so every new piece works with five you own.',
  mix: 'Invest in what you wear weekly, save on trend pieces.',
};

export default function StyleQuiz() {
  const [a, setA] = useState<Answers>({});
  const step = !a.look ? 0 : !a.fit ? 1 : !a.palette ? 2 : !a.occasion ? 3 : !a.budget ? 4 : 5;
  const set = (patch: Answers) => setA((x) => ({ ...x, ...patch }));
  const back = () => {
    const keys: (keyof Answers)[] = ['look', 'fit', 'palette', 'occasion', 'budget'];
    const k = keys[step - 1];
    if (k) setA((x) => ({ ...x, [k]: undefined }));
  };
  const opt = 'rounded-2xl border border-line bg-white/[0.02] px-4 py-3.5 text-left text-sm transition hover:border-white/30 hover:bg-white/[0.05]';

  const questions = [
    'Which look feels most like you?',
    'How do you like clothes to fit?',
    'Which colours do you reach for?',
    'What do you dress for most?',
    'How do you like to shop?',
  ];

  return (
    <div className="glass overflow-hidden p-6 sm:p-8" data-reveal>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Style DNA · {step < 5 ? `${step + 1} of 5` : 'your result'}</p>
        {step > 0 && (
          <button onClick={step === 5 ? () => setA({}) : back} className="chip !py-1.5 hover:!text-white">
            {step === 5 ? <RotateCcw size={13} /> : <ArrowLeft size={13} />} {step === 5 ? 'Start again' : 'Back'}
          </button>
        )}
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(step / 5) * 100}%`, background: 'var(--iris)' }} />
      </div>

      {step < 5 && <h3 className="h-display mt-6 text-2xl">{questions[step]}</h3>}

      {step === 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {LOOKS.map((l) => (
            <button key={l.id} onClick={() => set({ look: l.id })} className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-line">
              <img src={l.img} alt={`${l.name} look`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-sm font-medium">{l.name}</span>
            </button>
          ))}
        </div>
      )}
      {step === 1 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(Object.keys(FITS) as (keyof typeof FITS)[]).map((k) => (
            <button key={k} className={opt} onClick={() => set({ fit: k })}>{FITS[k]}</button>
          ))}
        </div>
      )}
      {step === 2 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(Object.keys(PALETTES) as (keyof typeof PALETTES)[]).map((k) => (
            <button key={k} className={`${opt} flex items-center justify-between gap-3`} onClick={() => set({ palette: k })}>
              {PALETTES[k].name}
              <span className="flex">
                {PALETTES[k].colors.map((c) => (
                  <span key={c} className="-ml-1.5 h-6 w-6 rounded-full border-2 border-ink first:ml-0" style={{ background: c }} />
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(Object.keys(OCCASIONS) as (keyof typeof OCCASIONS)[]).map((k) => (
            <button key={k} className={opt} onClick={() => set({ occasion: k })}>{OCCASIONS[k]}</button>
          ))}
        </div>
      )}
      {step === 4 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(Object.keys(BUDGETS) as (keyof typeof BUDGETS)[]).map((k) => (
            <button key={k} className={opt} onClick={() => set({ budget: k })}>{BUDGETS[k]}</button>
          ))}
        </div>
      )}

      {step === 5 && a.look && a.fit && a.palette && a.occasion && a.budget && (
        <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]">
          <img src={LOOKS.find((l) => l.id === a.look)!.img} alt="" className="aspect-[3/4] w-full rounded-2xl border border-line object-cover" />
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-teal">
              <Sparkles size={14} /> Your Style DNA
            </p>
            <h3 className="h-display mt-2 text-3xl">
              {a.fit === 'tailored' ? 'Tailored' : a.fit === 'relaxed' ? 'Relaxed' : 'Balanced'} {LOOKS.find((l) => l.id === a.look)!.name}
            </h3>
            <p className="mt-1 text-sm text-mist">
              Dressing mostly for {OCCASIONS[a.occasion].toLowerCase()} · {BUDGETS[a.budget].toLowerCase()}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {PALETTES[a.palette].colors.map((c) => (
                <span key={c} className="h-8 w-8 rounded-full border border-white/15" style={{ background: c }} title={c} />
              ))}
              <span className="ml-1 text-xs text-mist">{PALETTES[a.palette].name}</span>
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.18em] text-mist">Your key pieces</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PIECES[a.look].map((p) => (
                <span key={p} className="chip !text-white/85">{p}</span>
              ))}
            </div>
            <p className="mt-5 text-sm text-white/85">{FIT_TIP[a.fit]}</p>
            <p className="mt-2 text-sm text-mist">{BUDGET_TIP[a.budget]}</p>
          </div>
        </div>
      )}
    </div>
  );
}
