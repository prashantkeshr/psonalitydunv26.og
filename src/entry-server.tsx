import { renderToString } from 'react-dom/server';
import App from './App';
import { PageView } from './site/pages';
import { buildRoutes, type Route } from './site/routes';
import { exercises, meals, qa, skills, TOPIC, POSTURE, CATEGORY, CUISINE, DIET, tx } from './site/content';
import { SHAPE_INFO, FRAMES_FOR } from './lib/faceEngine';
import { SHAPES } from './site/content';

export { buildRoutes };

/** The page's HTML, for crawlers and the first paint. */
export function render(route: Route): string {
  return renderToString(route.page.kind === 'home' ? <App /> : <PageView route={route} />);
}

/** Plain-text knowledge for llms-full.txt. */
export function knowledge(): string {
  const out: string[] = [];
  out.push('# Personality — full guide content\n');
  out.push('## Fighting skills\n');
  for (const s of skills) {
    out.push(`### ${s.name.en} (${s.region?.en})\n${s.about?.en}\nTrains: ${s.trains?.en}\nTips:\n${s.tips.map((t) => `- ${t.en}`).join('\n')}\nSafety: ${s.safety?.en}\nPage: https://personality.dhurta.org/skills/${s.id.replace(/_/g, '-')}/\n`);
  }
  out.push('## Exercises\n');
  for (const e of exercises) {
    out.push(`### ${e.name.en} — ${tx(CATEGORY[e.category], 'en')}\n${e.summary?.en}\nSteps:\n${e.steps.en.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}\nDose: ${e.dose?.en}\nSafety: ${e.safety?.en}\nPage: https://personality.dhurta.org/exercises/${e.id.replace(/_/g, '-')}/\n`);
  }
  out.push('## Posture\n');
  for (const [k, v] of Object.entries(POSTURE)) {
    out.push(`### ${v.name}\n${v.what}\nMeasured: ${v.measure}\nPage: https://personality.dhurta.org/posture/${k.replace(/([A-Z])/g, '-$1').toLowerCase()}/\n`);
  }
  out.push('## Face shapes\n');
  for (const s of SHAPES) {
    out.push(`### ${SHAPE_INFO[s].name}\n${SHAPE_INFO[s].about}\nFrames that suit: ${FRAMES_FOR[s].join(', ')}\nPage: https://personality.dhurta.org/face-shapes/${s}/\n`);
  }
  out.push('## Style and grooming answers\n');
  for (const [topic, meta] of Object.entries(TOPIC)) {
    out.push(`### ${meta.title.en}\n`);
    for (const x of qa.filter((q) => q.topic === topic)) out.push(`Q: ${x.q.en}\nA: ${x.a.en}\n`);
  }
  out.push('## Meals (per portion)\n');
  for (const m of meals) {
    out.push(`- ${m.name.en} — ${CUISINE[m.cuisine ?? 'global']}, ${DIET[m.diet]}, ${m.slot}; ${m.portion?.en}: ${m.kcal} kcal, ${m.protein} g protein, ${m.carbs} g carbs, ${m.fat} g fat.`);
  }
  return out.join('\n');
}
