import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowUpRight, Camera, ChevronRight, Clock, Flame, Mail, MapPin, Search, ShieldAlert, Target,
  Beef, Wheat, Droplet, Code2, Handshake, Newspaper, LifeBuoy, Cpu, Download,
} from 'lucide-react';
import Nav from '../components/Nav';
import SiteFooter from '../components/SiteFooter';
import Figure from '../components/Figure';
import { Phone } from '../components/ui';
import {
  CATEGORY, CUISINE, DIET, POSTURE, SHAPES, TOPIC, exercises, fightingSkills, meals, qa, skills, tx, yogaFlows,
  type Exercise, type Lang, type Meal, type Shape, type Skill,
} from './content';
import { exercisePath, mealPath, posturePath, skillPath, yogaPath, type Route } from './routes';
import { FRAMES_FOR, SHAPE_INFO } from '../lib/faceEngine';
import { makeupShapes } from './content';

const UI = {
  tryLive: { en: 'Try it live', hi: 'लाइव आज़माएँ' },
  steps: { en: 'How to do it', hi: 'कैसे करें' },
  dose: { en: 'Sets & reps', hi: 'सेट और रेप्स' },
  safety: { en: 'Safety', hi: 'सुरक्षा' },
  related: { en: 'Related', hi: 'संबंधित' },
  trains: { en: 'What it trains', hi: 'यह क्या मज़बूत करता है' },
  tips: { en: 'Practice tips', hi: 'अभ्यास के सुझाव' },
  region: { en: 'Region', hi: 'क्षेत्र' },
  more: { en: 'More fighting skills', hi: 'और युद्ध कलाएँ' },
  level: { en: 'Level', hi: 'स्तर' },
  beginner: { en: 'Beginner', hi: 'शुरुआती' },
  inApp: {
    en: 'In the Personality app this is demonstrated move by move, with voice cues, a camera that counts your reps, and a plan that steps up as you get stronger.',
    hi: 'Personality ऐप में यह हर चरण के साथ दिखाया जाता है — आवाज़ संकेत, रेप गिनने वाला कैमरा और आपकी ताक़त के साथ बढ़ने वाला प्लान।',
  },
} as const;
const u = (k: keyof typeof UI, lang: Lang) => UI[k][lang];

// ------------------------------------------------------------- shell

function Crumbs({ route }: { route: Route }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-mist">
      <ol className="flex flex-wrap items-center gap-1">
        {route.crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="opacity-60" />}
            {i === route.crumbs.length - 1 ? <span className="text-white/80">{c.name}</span> : <a href={c.path} className="hover:text-white">{c.name}</a>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Shell({ route, eyebrow, h1, lead, children, aside }: { route: Route; eyebrow: string; h1: ReactNode; lead?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <>
      <Nav alt={route.alt} altLabel={route.lang === 'en' ? 'हिन्दी' : 'English'} />
      <main lang={route.lang === 'hi' ? 'hi' : undefined}>
        <header className="noise relative overflow-hidden pb-10 pt-28 sm:pt-32">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-70" />
          <div className="pointer-events-none absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-magenta/15 blur-[130px]" />
          <div className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-teal/10 blur-[130px]" />
          <div className={`page relative ${aside ? 'grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]' : ''}`}>
            <div>
              <Crumbs route={route} />
              <p className="eyebrow mt-6">{eyebrow}</p>
              <h1 className="h-display mt-4 text-[34px] leading-[1.06] sm:text-5xl">{h1}</h1>
              {lead && <div className="mt-5 max-w-2xl text-base text-mist sm:text-lg">{lead}</div>}
            </div>
            {aside}
          </div>
        </header>
        <div className="page pb-24">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

function Card({ href, title, meta, children }: { href: string; title: string; meta?: string; children?: ReactNode }) {
  return (
    <a href={href} className="glass glass-hover group block p-5">
      {meta && <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{meta}</p>}
      <p className="mt-1.5 flex items-start justify-between gap-2 font-display text-[16px] font-semibold leading-snug">
        {title} <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-mist transition group-hover:text-teal" />
      </p>
      {children && <div className="mt-1.5 text-sm text-mist">{children}</div>}
    </a>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="h-display text-2xl sm:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function FigureBox({ motion, label }: { motion: string | null | undefined; label: string }) {
  if (!motion) return null;
  return (
    <div className="glass relative h-72 overflow-hidden sm:h-80">
      <div className="grid-bg absolute inset-0 opacity-70" />
      <Figure motion={motion} label={label} className="relative" />
      <span className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.18em] text-mist">Demonstrated</span>
    </div>
  );
}

function TryLive({ lang, href, text }: { lang: Lang; href: string; text: string }) {
  return (
    <div className="glass mt-14 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
      <div>
        <p className="font-display text-xl font-semibold">{u('tryLive', lang)}</p>
        <p className="mt-1 max-w-xl text-sm text-mist">{text}</p>
      </div>
      <a href={href} className="btn btn-iris shrink-0">
        <Camera size={17} strokeWidth={1.6} /> {u('tryLive', lang)}
      </a>
    </div>
  );
}

// ------------------------------------------------------------ skills

function SkillsHub({ route }: { route: Route }) {
  const lang = route.lang;
  const groups: [string, Skill[]][] = [
    [lang === 'en' ? 'Indian martial heritage' : 'भारतीय युद्ध परंपरा', fightingSkills.filter((s) => s.family === 'indian')],
    [lang === 'en' ? 'World fighting arts' : 'विश्व की युद्ध कलाएँ', fightingSkills.filter((s) => s.family === 'world')],
    [lang === 'en' ? 'Mind and body' : 'मन और शरीर', skills.filter((s) => s.family === 'mindbody')],
  ];
  return (
    <Shell
      route={route}
      eyebrow={lang === 'en' ? 'Fighting skills' : 'युद्ध कलाएँ'}
      h1={lang === 'en' ? <>13 fighting arts, <span className="iris-text">practised safely at home.</span></> : <>13 युद्ध कलाएँ, <span className="iris-text">घर पर सुरक्षित अभ्यास।</span></>}
      lead={lang === 'en'
        ? 'Eight Indian martial traditions and five world styles — each with its history, what it trains, practice tips and a demonstrated solo drill. Partner and weapon work belongs with a qualified teacher.'
        : 'आठ भारतीय युद्ध परंपराएँ और पाँच विश्व शैलियाँ — हर एक का इतिहास, यह क्या सिखाती है, अभ्यास सुझाव और एकल अभ्यास का प्रदर्शन।'}
    >
      {groups.map(([title, list]) => (
        <Section key={title} title={title}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => (
              <Card key={s.id} href={skillPath(s, lang)} title={tx(s.name, lang)} meta={tx(s.region, lang)}>
                {tx(s.trains, lang)}
              </Card>
            ))}
          </div>
        </Section>
      ))}
    </Shell>
  );
}

function SkillPage({ route, skill: s }: { route: Route; skill: Skill }) {
  const lang = route.lang;
  const name = tx(s.name, lang);
  const others = fightingSkills.filter((x) => x.id !== s.id && x.family === s.family).slice(0, 6);
  return (
    <Shell
      route={route}
      eyebrow={`${tx(s.region, lang)} · ${s.family === 'indian' ? (lang === 'en' ? 'Indian martial art' : 'भारतीय युद्ध कला') : s.family === 'mindbody' ? (lang === 'en' ? 'Mind & body' : 'मन और शरीर') : lang === 'en' ? 'World fighting art' : 'विश्व युद्ध कला'}`}
      h1={name}
      lead={<p>{tx(s.about, lang)}</p>}
      aside={<FigureBox motion={s.motion} label={`${name} drill`} />}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Section title={u('trains', lang)}>
            <p className="flex items-start gap-3 text-white/85">
              <Target size={20} className="mt-0.5 shrink-0 text-teal" /> {tx(s.trains, lang)}
            </p>
          </Section>
          <Section title={u('tips', lang)}>
            <ol className="grid gap-3">
              {s.tips.map((t, i) => (
                <li key={i} className="glass flex gap-4 p-4 text-white/85">
                  <span className="font-mono text-sm text-teal">{String(i + 1).padStart(2, '0')}</span>
                  {tx(t, lang)}
                </li>
              ))}
            </ol>
          </Section>
        </div>
        <div>
          <Section title={u('safety', lang)}>
            <p className="glass flex items-start gap-3 p-5 text-sm text-white/85">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-ember" /> {tx(s.safety, lang)}
            </p>
          </Section>
          <Section title={u('region', lang)}>
            <p className="flex items-center gap-2 text-white/85">
              <MapPin size={18} className="text-teal" /> {tx(s.region, lang)}
            </p>
          </Section>
        </div>
      </div>
      <TryLive lang={lang} href="/#skills" text={u('inApp', lang)} />
      {others.length > 0 && (
        <Section title={u('more', lang)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((x) => (
              <Card key={x.id} href={skillPath(x, lang)} title={tx(x.name, lang)} meta={tx(x.region, lang)} />
            ))}
          </div>
        </Section>
      )}
    </Shell>
  );
}

// --------------------------------------------------------- exercises

function ExercisesHub({ route }: { route: Route }) {
  const lang = route.lang;
  const cats = [...new Set(exercises.map((e) => e.category))];
  return (
    <Shell
      route={route}
      eyebrow={lang === 'en' ? 'Exercise library' : 'व्यायाम संग्रह'}
      h1={lang === 'en' ? <>Every move, <span className="iris-text">shown step by step.</span></> : <>हर व्यायाम, <span className="iris-text">चरण-दर-चरण।</span></>}
      lead={lang === 'en' ? 'No equipment needed. Each exercise has an animated demonstration, clear steps, a starting dose and safety notes.' : 'कोई उपकरण नहीं चाहिए। हर व्यायाम के साथ एनिमेटेड प्रदर्शन, साफ़ चरण, शुरुआती मात्रा और सुरक्षा नोट।'}
    >
      {cats.map((c) => (
        <Section key={c} title={tx(CATEGORY[c], lang)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.filter((e) => e.category === c).map((e) => (
              <Card key={e.id} href={exercisePath(e.id, lang)} title={tx(e.name, lang)} meta={tx(e.dose, lang)}>
                {tx(e.summary, lang)}
              </Card>
            ))}
          </div>
        </Section>
      ))}
    </Shell>
  );
}

function ExercisePage({ route, ex: e }: { route: Route; ex: Exercise }) {
  const lang = route.lang;
  const name = tx(e.name, lang);
  const related = exercises.filter((x) => x.id !== e.id && x.category === e.category).slice(0, 6);
  const flows = yogaFlows.filter((f) => f.steps.some((s) => s.id === e.id));
  return (
    <Shell
      route={route}
      eyebrow={`${tx(CATEGORY[e.category], lang)} · ${u('beginner', lang)}`}
      h1={name}
      lead={<p>{tx(e.summary, lang)}</p>}
      aside={<FigureBox motion={e.motion} label={`${name} demonstration`} />}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Section title={u('steps', lang)}>
          <ol className="grid gap-3">
            {e.steps[lang].map((t: string, i: number) => (
              <li key={i} className="glass flex gap-4 p-4 text-white/85">
                <span className="font-mono text-sm text-teal">{String(i + 1).padStart(2, '0')}</span>
                {t}
              </li>
            ))}
          </ol>
        </Section>
        <div>
          <Section title={u('dose', lang)}>
            <p className="glass flex items-center gap-3 p-5 text-white/85">
              <Clock size={18} className="text-teal" /> {tx(e.dose, lang)}
            </p>
          </Section>
          <Section title={u('safety', lang)}>
            <p className="glass flex items-start gap-3 p-5 text-sm text-white/85">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-ember" /> {tx(e.safety, lang)}
            </p>
          </Section>
          {lang === 'en' && e.targets.length > 0 && (
            <Section title="Helps with">
              <div className="flex flex-wrap gap-2">
                {e.targets.map((t) => (
                  <a key={t} href={posturePath(t)} className="chip !px-3 !py-1.5 hover:!text-white">{POSTURE[t]?.name ?? t}</a>
                ))}
              </div>
            </Section>
          )}
          {lang === 'en' && flows.length > 0 && (
            <Section title="Part of these flows">
              <div className="flex flex-wrap gap-2">
                {flows.map((f) => (
                  <a key={f.id} href={yogaPath(f.id)} className="chip !px-3 !py-1.5 hover:!text-white">{f.title}</a>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
      <TryLive lang={lang} href="/#body" text={u('inApp', lang)} />
      {related.length > 0 && (
        <Section title={u('related', lang)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((x) => (
              <Card key={x.id} href={exercisePath(x.id, lang)} title={tx(x.name, lang)} meta={tx(x.dose, lang)}>{tx(x.summary, lang)}</Card>
            ))}
          </div>
        </Section>
      )}
    </Shell>
  );
}

// -------------------------------------------------------------- yoga

function YogaHub({ route }: { route: Route }) {
  const poses = exercises.filter((e) => e.category === 'yoga' || e.category === 'stretching');
  return (
    <Shell route={route} eyebrow="Yoga" h1={<>Breathe. Flow. <span className="iris-text">Balance.</span></>}
      lead="Three guided flows rooted in India's oldest practice, plus every pose on its own page with steps and a demonstration.">
      <Section title="Guided flows">
        <div className="grid gap-4 md:grid-cols-3">
          {yogaFlows.map((f) => (
            <Card key={f.id} href={yogaPath(f.id)} title={f.title} meta={`${f.steps.length} poses`}>{f.summary}</Card>
          ))}
        </div>
      </Section>
      <Section title="Poses and stretches">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {poses.map((e) => (
            <Card key={e.id} href={exercisePath(e.id)} title={e.name.en} meta={e.dose?.en}>{e.summary?.en}</Card>
          ))}
        </div>
      </Section>
      <TryLive lang="en" href="/#yoga" text="Play any flow on the home page — the figure moves through each pose while a ring paces your breath." />
    </Shell>
  );
}

function YogaFlowPage({ route, flowId }: { route: Route; flowId: string }) {
  const f = yogaFlows.find((x) => x.id === flowId)!;
  const byId = Object.fromEntries(exercises.map((e) => [e.id, e]));
  return (
    <Shell route={route} eyebrow={`Yoga flow · ${f.steps.length} poses`} h1={f.title} lead={<p>{f.summary}</p>}>
      <ol className="mt-6 grid gap-5">
        {f.steps.map((s, i) => {
          const e = byId[s.id];
          return (
            <li key={s.id} className="glass grid items-center gap-5 p-5 sm:grid-cols-[200px_1fr]">
              <div className="relative h-44 overflow-hidden rounded-2xl border border-line bg-ink/60">
                {s.motion && <Figure motion={s.motion} label={s.name} />}
              </div>
              <div>
                <p className="font-mono text-xs text-teal">{String(i + 1).padStart(2, '0')}</p>
                <h2 className="h-display mt-1 text-xl"><a href={exercisePath(s.id)} className="hover:underline">{s.name}</a></h2>
                {e && <p className="mt-2 text-sm text-mist">{e.summary?.en} {e.dose?.en && <span className="text-white/80">· {e.dose.en}</span>}</p>}
                {e && <ul className="mt-3 grid gap-1 text-sm text-white/80">{e.steps.en.map((t: string) => <li key={t}>— {t}</li>)}</ul>}
              </div>
            </li>
          );
        })}
      </ol>
      <TryLive lang="en" href="/#yoga" text="Play this flow with a breathing guide on the home page." />
    </Shell>
  );
}

// -------------------------------------------------------------- food

const share = (m: Meal) => {
  const p = m.protein * 4, c = m.carbs * 4, f = m.fat * 9, t = p + c + f || 1;
  return [p / t, c / t, f / t];
};

function FoodHub({ route }: { route: Route }) {
  const [q, setQ] = useState('');
  const cuisines = [...new Set(meals.map((m) => m.cuisine ?? 'global'))];
  const shown = meals.filter((m) => !q || m.name.en.toLowerCase().includes(q.toLowerCase()));
  return (
    <Shell route={route} eyebrow="Food" h1={<>Meal ideas with <span className="iris-text">real numbers.</span></>}
      lead={`${meals.length} dishes from 13 cuisines, each with calories, protein, carbs and fat per portion — vegan, vegetarian, egg and non-veg.`}>
      <label className="glass mt-2 flex max-w-md items-center gap-3 px-4 py-3">
        <Search size={18} className="text-mist" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes" className="w-full bg-transparent text-sm outline-none placeholder:text-mist" />
      </label>
      {cuisines.map((c) => {
        const list = shown.filter((m) => (m.cuisine ?? 'global') === c);
        if (!list.length) return null;
        return (
          <Section key={c} title={CUISINE[c] ?? c}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((m) => (
                <Card key={m.id} href={mealPath(m.id)} title={m.name.en} meta={`${DIET[m.diet]} · ${m.slot}`}>
                  {m.kcal} kcal · {m.protein} g protein
                </Card>
              ))}
            </div>
          </Section>
        );
      })}
      <TryLive lang="en" href="/#food" text="Build a whole day of meals for your diet, region and goal — and swap any plate." />
    </Shell>
  );
}

function MealPage({ route, meal: m }: { route: Route; meal: Meal }) {
  const [p, c, f] = share(m);
  const sameCuisine = meals.filter((x) => x.id !== m.id && x.cuisine === m.cuisine).slice(0, 6);
  const day = (['breakfast', 'lunch', 'snack', 'dinner'] as const).filter((s) => s !== m.slot).map((slot) =>
    meals.find((x) => x.slot === slot && x.diet === m.diet && x.cuisine === m.cuisine) ?? meals.find((x) => x.slot === slot && x.diet === m.diet),
  ).filter(Boolean) as Meal[];
  const traits = [
    m.protein >= 20 && 'high in protein',
    m.kcal <= 250 && 'light',
    m.kcal >= 500 && 'filling',
    (m.diet === 'vegan' || m.diet === 'vegetarian') && 'meat-free',
  ].filter(Boolean) as string[];
  return (
    <Shell
      route={route}
      eyebrow={`${CUISINE[m.cuisine ?? 'global'] ?? ''} · ${DIET[m.diet]} · ${m.slot}`}
      h1={m.name.en}
      lead={<p>{m.name.en} is a {DIET[m.diet].toLowerCase()} {m.slot}{traits.length ? ` that is ${traits.join(', ')}` : ''}: about {m.kcal} kcal and {m.protein} g of protein per {m.portion?.en ?? 'portion'}.</p>}
    >
      <div className="grid gap-4 sm:grid-cols-4">
        {([[Flame, 'Calories', `${m.kcal} kcal`], [Beef, 'Protein', `${m.protein} g`], [Wheat, 'Carbs', `${m.carbs} g`], [Droplet, 'Fat', `${m.fat} g`]] as const).map(([Icon, k, v]) => (
          <div key={k} className="glass p-5">
            <Icon size={18} className="text-teal" />
            <p className="mt-3 h-display text-2xl">{v}</p>
            <p className="text-sm text-mist">{k} · per {m.portion?.en ?? 'portion'}</p>
          </div>
        ))}
      </div>
      <Section title="Where the energy comes from">
        <div className="flex h-3 overflow-hidden rounded-full">
          <span style={{ width: `${p * 100}%`, background: '#29D8F2' }} />
          <span style={{ width: `${c * 100}%`, background: '#7C5CFF' }} />
          <span style={{ width: `${f * 100}%`, background: '#E14BD7' }} />
        </div>
        <p className="mt-3 text-sm text-mist">
          Protein {Math.round(p * 100)}% · Carbohydrate {Math.round(c * 100)}% · Fat {Math.round(f * 100)}% of calories.
        </p>
      </Section>
      {day.length > 0 && (
        <Section title="A day that pairs well">
          <div className="grid gap-4 sm:grid-cols-3">
            {day.map((x) => (
              <Card key={x.id} href={mealPath(x.id)} title={x.name.en} meta={x.slot}>{x.kcal} kcal · {x.protein} g protein</Card>
            ))}
          </div>
        </Section>
      )}
      <TryLive lang="en" href="/#food" text="Plan a full day around your diet and goal, and swap any dish you don't fancy." />
      {sameCuisine.length > 0 && (
        <Section title={`More ${CUISINE[m.cuisine ?? 'global'] ?? ''} dishes`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sameCuisine.map((x) => (
              <Card key={x.id} href={mealPath(x.id)} title={x.name.en} meta={`${DIET[x.diet]} · ${x.slot}`}>{x.kcal} kcal · {x.protein} g protein</Card>
            ))}
          </div>
        </Section>
      )}
      <p className="mt-10 text-xs text-mist">Values are typical estimates for the stated portion; home recipes vary.</p>
    </Shell>
  );
}

// ------------------------------------------------------- face shapes

const FRAME_NAME: Record<string, string> = { rectangular: 'Rectangular', round: 'Round', oval: 'Oval', aviator: 'Aviator', catEye: 'Cat-eye', browline: 'Browline', geometric: 'Geometric' };

function FaceHub({ route }: { route: Route }) {
  return (
    <Shell route={route} eyebrow="Face shapes" h1={<>Know your face shape. <span className="iris-text">Measured, not guessed.</span></>}
      lead="Face shape comes from three proportions — length to width, forehead to cheekbones and jaw to cheekbones. Find yours in seconds with the live face scan, then see what suits it.">
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SHAPES.map((s) => (
          <Card key={s} href={`/face-shapes/${s}/`} title={`${SHAPE_INFO[s].name} face`} meta={`Frames: ${FRAMES_FOR[s].map((f) => FRAME_NAME[f]).join(', ')}`}>
            {SHAPE_INFO[s].about}
          </Card>
        ))}
      </div>
      <TryLive lang="en" href="/#face" text="Scan your face live — 478 points, read on your device, nothing uploaded." />
    </Shell>
  );
}

function FacePage({ route, shape }: { route: Route; shape: Shape }) {
  const info = SHAPE_INFO[shape];
  const mk = makeupShapes[shape];
  return (
    <Shell route={route} eyebrow="Face shape" h1={`${info.name} face shape`} lead={<p>{info.about}</p>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Glasses that suit you">
          <div className="flex flex-wrap gap-2">
            {FRAMES_FOR[shape].map((f) => <span key={f} className="chip !px-4 !py-2 !text-white">{FRAME_NAME[f]}</span>)}
          </div>
          <p className="mt-4 text-sm text-mist">Choose frames about as wide as the widest part of your face, with the top line close to your brows. Try them on live in the face lab.</p>
        </Section>
        <Section title="Makeup placement">
          <ul className="grid gap-3 text-sm">
            {(['blush', 'contour', 'highlight'] as const).map((k) => (
              <li key={k} className="glass p-4 text-white/85"><span className="font-semibold capitalize text-white">{k}: </span>{mk[k].en}</li>
            ))}
          </ul>
        </Section>
      </div>
      <Section title="How it is measured">
        <p className="max-w-3xl text-white/80">
          The face outline is measured at several heights. Its length is compared with the cheekbone width, and the forehead and jaw widths with the cheekbones. Those three ratios are matched against six reference shapes — the closest wins, and if two are close, both are shown. It describes proportion only; it is never a score of attractiveness.
        </p>
      </Section>
      <TryLive lang="en" href="/#face" text="Find your face shape live, then try glasses and lip colours on yourself." />
      <Section title="Other face shapes">
        <div className="flex flex-wrap gap-2">
          {SHAPES.filter((s) => s !== shape).map((s) => <a key={s} href={`/face-shapes/${s}/`} className="chip !px-4 !py-2 hover:!text-white">{SHAPE_INFO[s].name}</a>)}
        </div>
      </Section>
    </Shell>
  );
}

// ----------------------------------------------------------- posture

function PostureHub({ route }: { route: Route }) {
  return (
    <Shell route={route} eyebrow="Posture" h1={<>Posture, <span className="iris-text">measured in degrees.</span></>}
      lead="The body scan reads your posture from 33 points — facing the camera or side-on — and describes it in neutral terms. Here is what each reading means, and what helps.">
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(POSTURE).map(([k, v]) => (
          <Card key={k} href={posturePath(k)} title={v.name} meta={`Aligned under ${v.bands[0]}°`}>{v.what.split('.')[0]}.</Card>
        ))}
      </div>
      <TryLive lang="en" href="/#body" text="Check your posture live in the body lab — measured on your device, nothing recorded." />
    </Shell>
  );
}

function PosturePage({ route, metric }: { route: Route; metric: string }) {
  const v = POSTURE[metric];
  const helps = exercises.filter((e) => e.targets.includes(metric));
  return (
    <Shell route={route} eyebrow="Posture guide" h1={v.name} lead={<p>{v.what}</p>}>
      <Section title="How it is measured">
        <p className="max-w-3xl text-white/80">{v.measure}</p>
        <div className="mt-5 grid max-w-xl grid-cols-3 gap-2 text-center text-sm">
          <div className="glass p-3"><p className="text-teal">Aligned</p><p className="text-mist">&lt; {v.bands[0]}°</p></div>
          <div className="glass p-3"><p>Slight</p><p className="text-mist">{v.bands[0]}–{v.bands[1]}°</p></div>
          <div className="glass p-3"><p className="text-ember">Noticeable</p><p className="text-mist">&gt; {v.bands[1]}°</p></div>
        </div>
      </Section>
      {helps.length > 0 && (
        <Section title="Exercises that help">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {helps.map((e) => <Card key={e.id} href={exercisePath(e.id)} title={e.name.en} meta={e.dose?.en}>{e.summary?.en}</Card>)}
          </div>
        </Section>
      )}
      <p className="mt-10 max-w-3xl text-xs text-mist">This is general wellness guidance, not a medical assessment. If you have pain, numbness or a condition that affects your spine, see a qualified professional.</p>
      <TryLive lang="en" href="/#body" text="Measure this live with the body scan, and re-check after a couple of weeks of practice." />
    </Shell>
  );
}

// ------------------------------------------------------------ guides

function GuidesHub({ route }: { route: Route }) {
  const lang = route.lang;
  const [q, setQ] = useState(() => (typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('q') ?? ''));
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const pool: [string, string, string][] = [
      ...qa.map((x) => [tx(x.q, lang), `${lang === 'hi' ? '/hi' : ''}/guides/${x.topic}/#${x.id}`, tx(TOPIC[x.topic].title, lang)] as [string, string, string]),
      ...exercises.map((e) => [tx(e.name, lang), exercisePath(e.id, lang), tx(CATEGORY[e.category], lang)] as [string, string, string]),
      ...skills.map((s) => [tx(s.name, lang), skillPath(s, lang), tx(s.region, lang)] as [string, string, string]),
      ...(lang === 'en' ? meals.map((m) => [m.name.en, mealPath(m.id), 'Food'] as [string, string, string]) : []),
      ...(lang === 'en' ? Object.entries(POSTURE).map(([k, v]) => [v.name, posturePath(k), 'Posture'] as [string, string, string]) : []),
    ];
    return pool.filter(([n]) => n.toLowerCase().includes(t)).slice(0, 20);
  }, [q, lang]);
  const hubs: [string, string, string][] = lang === 'en'
    ? [['/skills/', 'Fighting skills', '13 arts'], ['/exercises/', 'Exercises', `${exercises.length} moves`], ['/yoga/', 'Yoga', '3 flows'], ['/posture/', 'Posture', '6 guides'], ['/face-shapes/', 'Face shapes', '6 shapes'], ['/food/', 'Food', `${meals.length} dishes`]]
    : [['/hi/skills/', 'युद्ध कलाएँ', '13'], ['/hi/exercises/', 'व्यायाम', String(exercises.length)]];
  return (
    <Shell route={route} eyebrow={lang === 'en' ? 'Guides' : 'गाइड'} h1={lang === 'en' ? <>Answers, <span className="iris-text">without the noise.</span></> : <>जवाब, <span className="iris-text">बिना उलझन के।</span></>}
      lead={lang === 'en' ? 'Honest, practical guidance on grooming, style, training, posture and food — the same knowledge the Personality coach answers from.' : 'ग्रूमिंग, स्टाइल, व्यायाम और मुद्रा पर ईमानदार, व्यावहारिक जानकारी।'}>
      <label className="glass mt-2 flex max-w-xl items-center gap-3 px-4 py-3">
        <Search size={18} className="text-mist" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === 'en' ? 'Search guides, exercises, skills, meals' : 'खोजें'} className="w-full bg-transparent text-sm outline-none placeholder:text-mist" aria-label="Search" />
      </label>
      {hits.length > 0 && (
        <ul className="mt-4 grid max-w-xl gap-1">
          {hits.map(([n, href, meta]) => (
            <li key={href}><a href={href} className="flex justify-between gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/5"><span>{n}</span><span className="text-mist">{meta}</span></a></li>
          ))}
        </ul>
      )}
      <Section title={lang === 'en' ? 'Style & grooming' : 'स्टाइल और ग्रूमिंग'}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(TOPIC).map(([k, v]) => (
            <Card key={k} href={`${lang === 'hi' ? '/hi' : ''}/guides/${k}/`} title={tx(v.title, lang)} meta={`${qa.filter((x) => x.topic === k).length} ${lang === 'en' ? 'answers' : 'जवाब'}`}>{tx(v.intro, lang)}</Card>
          ))}
        </div>
      </Section>
      <Section title={lang === 'en' ? 'Training, body and food' : 'व्यायाम और शरीर'}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hubs.map(([href, t, meta]) => <Card key={href} href={href} title={t} meta={meta} />)}
        </div>
      </Section>
    </Shell>
  );
}

function GuidePage({ route, topic }: { route: Route; topic: string }) {
  const lang = route.lang;
  const meta = TOPIC[topic];
  const items = qa.filter((x) => x.topic === topic);
  return (
    <Shell route={route} eyebrow={lang === 'en' ? 'Guide' : 'गाइड'} h1={tx(meta.title, lang)} lead={<p>{tx(meta.intro, lang)}</p>}>
      <div className="mt-4 grid max-w-3xl gap-4">
        {items.map((x) => (
          <article key={x.id} id={x.id} className="glass scroll-mt-24 p-6">
            <h2 className="h-display text-xl">{tx(x.q, lang)}</h2>
            <p className="mt-3 text-white/85">{tx(x.a, lang)}</p>
          </article>
        ))}
      </div>
      {topic === 'glasses' && lang === 'en' && <TryLive lang="en" href="/#face" text="Try frames on your own face, live — the lab marks the shapes that suit you." />}
      <Section title={lang === 'en' ? 'More guides' : 'और गाइड'}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TOPIC).filter(([k]) => k !== topic).map(([k, v]) => (
            <a key={k} href={`${lang === 'hi' ? '/hi' : ''}/guides/${k}/`} className="chip !px-4 !py-2 hover:!text-white">{tx(v.title, lang)}</a>
          ))}
        </div>
      </Section>
    </Shell>
  );
}

// ----------------------------------------------------------- company

function AboutPage({ route }: { route: Route }) {
  const rows: [string, string][] = [
    ['Face reading', 'Google MediaPipe Face Landmarker finds 478 points on the face. Personality measures the outline at several heights and matches three proportions against six reference shapes. Balance compares each side with the midline, only while you face the camera straight on.'],
    ['Posture', 'MediaPipe Pose Landmarker finds 33 body points. Shoulder, hip and head lines are measured in degrees from level; side-on, the ear-to-shoulder angle shows head position. Readings settle on the median of about 30 steady frames.'],
    ['Rep counting', 'The knee angle is measured in 3D. A rep counts when it drops below 105° and rises back above 155°, no faster than one every 0.6 seconds, with cues if a squat stops short.'],
    ['Training', 'Plans follow your goal, days, time and focus. After each session you say how it felt; the plan steps each exercise up or down, and promotes your level once you have moved up four steps on average.'],
    ['Food', 'A library of 97 dishes from 13 cuisines with typical calories, protein, carbs and fat per portion, filtered by your diet and region.'],
  ];
  return (
    <Shell route={route} eyebrow="How it works" h1={<>Real technology, <span className="iris-text">honest limits.</span></>}
      lead="Everything Personality reads, it reads on your device. Here is exactly how — and what it cannot do.">
      <div className="mt-4 grid gap-4">
        {rows.map(([t, b]) => (
          <div key={t} className="glass grid gap-2 p-6 sm:grid-cols-[200px_1fr]">
            <p className="flex items-center gap-2 font-display font-semibold"><Cpu size={18} className="text-teal" /> {t}</p>
            <p className="text-white/80">{b}</p>
          </div>
        ))}
      </div>
      <Section title="What it does not do">
        <ul className="grid max-w-3xl gap-2 text-white/80">
          <li>— No beauty or attractiveness scores, and no celebrity look-alikes.</li>
          <li>— No medical diagnosis. Posture and body readings are general wellness guidance.</li>
          <li>— No uploads. Camera frames are processed in memory and discarded.</li>
          <li>— No accounts, ads, analytics or tracking — in the app or on this site.</li>
        </ul>
      </Section>
      <TryLive lang="en" href="/#face" text="See it for yourself — the labs show a live count of anything sent while you scan. It stays at zero." />
    </Shell>
  );
}

const TOPICS = [
  { id: 'api', icon: Code2, title: 'API & integrations', body: 'Bring on-device face reading, posture analysis, rep counting or the adaptive training engine into your product — fitness apps, gyms, eyewear, salons, telehealth and education. We are opening the engines to selected partners: tell us what you want to build.' },
  { id: 'partners', icon: Handshake, title: 'Partnerships', body: 'Gyms, yoga studios, martial-arts academies (including Kalaripayattu, Silambam and Gatka schools), schools and corporate wellness programmes.' },
  { id: 'press', icon: Newspaper, title: 'Press & media', body: 'Interviews, reviews and features. The press kit has logos, screenshots and facts.' },
  { id: 'support', icon: LifeBuoy, title: 'Support & feedback', body: 'Questions about the app or this site, privacy requests, ideas and bug reports.' },
] as const;

function ContactPage({ route }: { route: Route }) {
  const [topic, setTopic] = useState<(typeof TOPICS)[number]['id']>('api');
  const [f, setF] = useState({ name: '', org: '', email: '', size: '', msg: '' });
  const t = TOPICS.find((x) => x.id === topic)!;
  const mailto = `mailto:support@dhurta.org?subject=${encodeURIComponent(`[${t.title}] ${f.org || f.name || 'Enquiry'}`)}&body=${encodeURIComponent(
    `Topic: ${t.title}\nName: ${f.name}\nOrganisation: ${f.org}\nReply to: ${f.email}${topic === 'api' ? `\nProduct / users: ${f.size}` : ''}\n\n${f.msg}`,
  )}`;
  const field = 'w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm outline-none transition placeholder:text-mist focus:border-teal/60';
  return (
    <Shell route={route} eyebrow="Contact" h1={<>Let's build <span className="iris-text">something personal.</span></>}
      lead="API and integration access, partnerships, press or support — pick a topic and we'll get back to you.">
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-3">
          {TOPICS.map(({ id, icon: Icon, title, body }) => (
            <button key={id} onClick={() => setTopic(id)} className={`glass p-5 text-left transition ${topic === id ? '!border-teal/50 bg-white/[0.06]' : 'glass-hover'}`} aria-pressed={topic === id}>
              <p className="flex items-center gap-2 font-display font-semibold"><Icon size={18} className="text-teal" /> {title}</p>
              <p className="mt-1.5 text-sm text-mist">{body}</p>
            </button>
          ))}
        </div>
        <form className="glass grid content-start gap-3 p-6 sm:p-8" onSubmit={(e) => { e.preventDefault(); window.location.href = mailto; }}>
          <p className="font-display text-xl font-semibold">{t.title}</p>
          <p className="-mt-1 text-xs text-mist">This opens your email app with the details filled in — nothing is sent from this page.</p>
          <input className={field} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Your name" />
          <input className={field} placeholder="Organisation (optional)" value={f.org} onChange={(e) => setF({ ...f, org: e.target.value })} aria-label="Organisation" />
          <input className={field} type="email" placeholder="Email to reply to" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-label="Email" />
          {topic === 'api' && (
            <input className={field} placeholder="Your product and number of users (optional)" value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })} aria-label="Product and users" />
          )}
          <textarea className={`${field} min-h-[140px]`} placeholder={topic === 'api' ? 'Which engine (face, posture, reps, training) and how you would use it' : 'How can we help?'} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} aria-label="Message" />
          <button type="submit" className="btn btn-iris mt-2 w-fit"><Mail size={16} /> Write to us</button>
          <p className="text-xs text-mist">Or email <a href="mailto:support@dhurta.org" className="text-teal">support@dhurta.org</a> directly.</p>
        </form>
      </div>
      <Section title="What partners can integrate">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Face engine', 'Face shape, proportions, balance, head pose and live try-on anchors from 478 landmarks.'],
            ['Posture engine', 'Front and side posture in degrees with neutral wording bands.'],
            ['Rep & hold counter', 'Squats, arm raises, knee raises, planks and wall sits with form cues.'],
            ['Adaptive training', 'Day-wise plans by goal and focus that step up from session feedback.'],
          ].map(([a, b]) => (
            <div key={a} className="glass p-5"><p className="font-display font-semibold">{a}</p><p className="mt-1.5 text-sm text-mist">{b}</p></div>
          ))}
        </div>
        <p className="mt-4 text-sm text-mist">All engines run on the user's device — your users' images never reach our servers, or yours.</p>
      </Section>
    </Shell>
  );
}

function PressPage({ route }: { route: Route }) {
  const shots = ['01_health', '02_analyze', '03_style', '04_skills', '05_pose', '06_makeup'];
  return (
    <Shell route={route} eyebrow="Press kit" h1={<>Personality, <span className="iris-text">in brief.</span></>}
      lead="Everything you need to write about Personality. For interviews, write to support@dhurta.org.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Short description">
          <p className="text-white/85">Personality is a private, on-device app for your body, food, style and skills. It scans your face and full body live, builds a training plan that levels up with you, suggests meals for your region and diet, and teaches 13 fighting arts including Kalaripayattu, Silambam and Gatka — without uploading anything.</p>
        </Section>
        <Section title="Key facts">
          <ul className="grid gap-1.5 text-white/85">
            <li>— Maker: dhurta.Inc · Platform: Android (coming soon)</li>
            <li>— 478-point face mesh and 33-point body tracking, on device</li>
            <li>— 13 fighting arts, {exercises.length} guided exercises, 3 yoga flows</li>
            <li>— {meals.length} dishes from 13 cuisines with nutrition</li>
            <li>— 6 languages · no accounts, ads or tracking</li>
          </ul>
        </Section>
      </div>
      <Section title="Logo and graphics">
        <div className="flex flex-wrap gap-4">
          {[['/app/icon-512.png', 'App icon (512 px)'], ['/og.png', 'Feature graphic (1024 × 500)']].map(([src, label]) => (
            <a key={src} href={src} download className="glass glass-hover flex items-center gap-4 p-4">
              <img src={src} alt="" className="h-16 w-auto rounded-xl" loading="lazy" />
              <span className="text-sm">{label}<span className="mt-1 flex items-center gap-1 text-xs text-teal"><Download size={12} /> Download</span></span>
            </a>
          ))}
        </div>
      </Section>
      <Section title="Screenshots">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {shots.map((s) => (
            <a key={s} href={`/app/${s}.png`} download className="block"><Phone src={`/app/${s}.png`} alt={`Personality screenshot ${s}`} /></a>
          ))}
        </div>
      </Section>
    </Shell>
  );
}

// -------------------------------------------------------------- entry

export function PageView({ route }: { route: Route }) {
  const p = route.page;
  switch (p.kind) {
    case 'skillsHub': return <SkillsHub route={route} />;
    case 'skill': return <SkillPage route={route} skill={p.skill} />;
    case 'exercisesHub': return <ExercisesHub route={route} />;
    case 'exercise': return <ExercisePage route={route} ex={p.ex} />;
    case 'yogaHub': return <YogaHub route={route} />;
    case 'yogaFlow': return <YogaFlowPage route={route} flowId={p.flowId} />;
    case 'foodHub': return <FoodHub route={route} />;
    case 'meal': return <MealPage route={route} meal={p.meal} />;
    case 'faceHub': return <FaceHub route={route} />;
    case 'face': return <FacePage route={route} shape={p.shape} />;
    case 'postureHub': return <PostureHub route={route} />;
    case 'posture': return <PosturePage route={route} metric={p.metric} />;
    case 'guidesHub': return <GuidesHub route={route} />;
    case 'guide': return <GuidePage route={route} topic={p.topic} />;
    case 'about': return <AboutPage route={route} />;
    case 'contact': return <ContactPage route={route} />;
    case 'press': return <PressPage route={route} />;
    default: return null;
  }
}

