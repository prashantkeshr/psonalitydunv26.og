/**
 * Every page on the site, with what search engines and AI assistants need:
 * title, description, canonical path, language pair, breadcrumbs and
 * structured data. Pure data — used by the prerenderer and the client.
 */
import {
  CATEGORY, CUISINE, DIET, HOME_FAQ, POSTURE, SHAPES, TOPIC, exercises, fightingSkills, meals, qa, site, skills, tx, yogaFlows,
  type Exercise, type Lang, type Meal, type Shape, type Skill,
} from './content';
import { FRAMES_FOR, SHAPE_INFO } from '../lib/faceEngine';

export type Crumb = { name: string; path: string };
export type Group = 'main' | 'skills' | 'exercises' | 'yoga' | 'food' | 'face' | 'posture' | 'guides' | 'company';

export type Page =
  | { kind: 'home' }
  | { kind: 'skillsHub' }
  | { kind: 'skill'; skill: Skill }
  | { kind: 'exercisesHub' }
  | { kind: 'exercise'; ex: Exercise }
  | { kind: 'yogaHub' }
  | { kind: 'yogaFlow'; flowId: string }
  | { kind: 'foodHub' }
  | { kind: 'meal'; meal: Meal }
  | { kind: 'faceHub' }
  | { kind: 'face'; shape: Shape }
  | { kind: 'postureHub' }
  | { kind: 'posture'; metric: string }
  | { kind: 'guidesHub' }
  | { kind: 'guide'; topic: string }
  | { kind: 'about' }
  | { kind: 'contact' }
  | { kind: 'press' };

export type Route = {
  path: string;
  lang: Lang;
  title: string;
  description: string;
  group: Group;
  page: Page;
  crumbs: Crumb[];
  /** Same page in the other language, for hreflang. */
  alt?: string;
  image?: string;
  jsonld: object[];
  priority: number;
};

const abs = (p: string) => `${site.origin}${p}`;
const clip = (s: string, n = 158) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);
const org = { '@type': 'Organization', name: site.org, email: site.email, url: site.origin, logo: abs('/app/icon-512.png') };

function breadcrumbLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
  };
}
function articleLd(r: { title: string; description: string; path: string; lang: Lang; image?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: r.title,
    description: r.description,
    inLanguage: r.lang === 'hi' ? 'hi-IN' : 'en',
    mainEntityOfPage: abs(r.path),
    image: abs(r.image ?? '/og.png'),
    author: org,
    publisher: org,
    datePublished: '2026-11-27',
    dateModified: '2026-11-27',
  };
}
const faqLd = (items: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
});

const L = {
  home: { en: 'Home', hi: 'होम' },
  skills: { en: 'Fighting skills', hi: 'युद्ध कलाएँ' },
  exercises: { en: 'Exercises', hi: 'व्यायाम' },
  guides: { en: 'Style & grooming guides', hi: 'स्टाइल और ग्रूमिंग गाइड' },
};
const hiPath = (p: string) => `/hi${p}`;

export function buildRoutes(): Route[] {
  const out: Route[] = [];
  const add = (r: Omit<Route, 'jsonld' | 'priority'> & { jsonld?: object[]; priority?: number }) => {
    out.push({ ...r, jsonld: [breadcrumbLd(r.crumbs), ...(r.jsonld ?? [])], priority: r.priority ?? 0.6 });
  };
  const home: Crumb = { name: 'Personality', path: '/' };

  // ------------------------------------------------------------- home
  out.push({
    path: '/',
    lang: 'en',
    title: 'Personality — live face & body scan, training, food, style and 13 fighting skills',
    description:
      'Personality reads 478 face points and 33 body points live on your device, then builds training that levels up, food for your day, your style, yoga and Indian martial arts. Nothing is uploaded.',
    group: 'main',
    page: { kind: 'home' },
    crumbs: [home],
    priority: 1,
    jsonld: [
      { '@context': 'https://schema.org', ...org, sameAs: [], contactPoint: [{ '@type': 'ContactPoint', email: site.email, contactType: 'customer support', availableLanguage: ['English', 'Hindi'] }] },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.name,
        url: site.origin,
        inLanguage: ['en', 'hi-IN'],
        potentialAction: { '@type': 'SearchAction', target: `${site.origin}/guides/?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: site.name,
        operatingSystem: 'Android',
        applicationCategory: 'HealthApplication',
        description:
          'On-device face and body scanning, training plans that level up, food suggestions, style studio, yoga and 13 fighting skills including Kalaripayattu, Silambam and Gatka.',
        url: site.origin,
        image: abs('/app/icon-512.png'),
        screenshot: ['01_health', '02_analyze', '03_style', '04_skills', '05_pose'].map((s) => abs(`/app/${s}.png`)),
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', availability: 'https://schema.org/PreOrder' },
        publisher: org,
      },
      faqLd(HOME_FAQ.map(([q, a]) => ({ q, a }))),
    ],
  });

  // ------------------------------------------------------------ skills
  for (const lang of ['en', 'hi'] as Lang[]) {
    const P = (p: string) => (lang === 'en' ? p : hiPath(p));
    const crumbs = [{ name: L.home[lang], path: '/' }];
    add({
      path: P('/skills/'),
      lang,
      title: lang === 'en' ? '13 fighting skills to practise at home — Indian martial arts, boxing, karate & more' : 'घर पर अभ्यास के लिए 13 युद्ध कलाएँ — कलारीपयट्टु, सिलंबम, गतका और अधिक',
      description:
        lang === 'en'
          ? 'Kalaripayattu, Silambam, Gatka, Kushti, Thang-ta, Lathi Khela, Mardani Khel, Musti Yuddha, boxing, karate, kung fu, Muay Thai and self-defence — solo drills with safety notes.'
          : 'कलारीपयट्टु, सिलंबम, गतका, कुश्ती, थांग-टा, लाठी खेला, मर्दानी खेल, मुष्टि युद्ध, बॉक्सिंग, कराटे, कुंग फू, मुए थाई और आत्मरक्षा — सुरक्षा नोट के साथ एकल अभ्यास।',
      group: 'skills',
      page: { kind: 'skillsHub' },
      crumbs: [...crumbs, { name: L.skills[lang], path: P('/skills/') }],
      alt: lang === 'en' ? hiPath('/skills/') : '/skills/',
      priority: 0.9,
    });
    for (const s of skills) {
      const name = tx(s.name, lang);
      const path = P(`/skills/${s.id.replace(/_/g, '-')}/`);
      const title =
        lang === 'en'
          ? `${name}: origins, what it trains and how to start at home`
          : `${name}: इतिहास, यह क्या सिखाता है और घर पर कैसे शुरू करें`;
      const description = clip(`${tx(s.about, lang)} ${tx(s.trains, lang)}`);
      add({
        path,
        lang,
        title,
        description,
        group: 'skills',
        page: { kind: 'skill', skill: s },
        crumbs: [...crumbs, { name: L.skills[lang], path: P('/skills/') }, { name, path }],
        alt: lang === 'en' ? hiPath(path) : path.replace(/^\/hi/, ''),
        jsonld: [
          articleLd({ title, description, path, lang }),
          faqLd([
            { q: lang === 'en' ? `What does ${name} train?` : `${name} से क्या मज़बूत होता है?`, a: tx(s.trains, lang) },
            { q: lang === 'en' ? `Is it safe to practise ${name} at home?` : `क्या घर पर ${name} का अभ्यास सुरक्षित है?`, a: tx(s.safety, lang) },
          ]),
        ],
        priority: 0.8,
      });
    }
  }

  // --------------------------------------------------------- exercises
  for (const lang of ['en', 'hi'] as Lang[]) {
    const P = (p: string) => (lang === 'en' ? p : hiPath(p));
    const crumbs = [{ name: L.home[lang], path: '/' }];
    add({
      path: P('/exercises/'),
      lang,
      title: lang === 'en' ? 'Home exercises with step-by-step guides — strength, posture, yoga and stretching' : 'घरेलू व्यायाम, चरण-दर-चरण — ताक़त, मुद्रा, योग और स्ट्रेचिंग',
      description:
        lang === 'en'
          ? `${exercises.length} bodyweight exercises with animated demonstrations, sets and reps, and safety notes — squats, planks, chin tucks, Surya Namaskar and more.`
          : `${exercises.length} बिना उपकरण वाले व्यायाम, एनिमेटेड प्रदर्शन, सेट-रेप्स और सुरक्षा नोट के साथ।`,
      group: 'exercises',
      page: { kind: 'exercisesHub' },
      crumbs: [...crumbs, { name: L.exercises[lang], path: P('/exercises/') }],
      alt: lang === 'en' ? hiPath('/exercises/') : '/exercises/',
      priority: 0.9,
    });
    for (const e of exercises) {
      const name = tx(e.name, lang);
      const path = P(`/exercises/${e.id.replace(/_/g, '-')}/`);
      const title = lang === 'en' ? `${name}: how to do it, sets, reps and benefits` : `${name}: कैसे करें, सेट, रेप्स और फ़ायदे`;
      const description = clip(`${tx(e.summary, lang)} ${e.steps[lang].join(' ')}`);
      add({
        path,
        lang,
        title,
        description,
        group: 'exercises',
        page: { kind: 'exercise', ex: e },
        crumbs: [...crumbs, { name: L.exercises[lang], path: P('/exercises/') }, { name, path }],
        alt: lang === 'en' ? hiPath(path) : path.replace(/^\/hi/, ''),
        jsonld: [
          {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: lang === 'en' ? `How to do ${name}` : `${name} कैसे करें`,
            description: tx(e.summary, lang),
            inLanguage: lang === 'hi' ? 'hi-IN' : 'en',
            supply: [],
            tool: [],
            step: e.steps[lang].map((t: string, i: number) => ({ '@type': 'HowToStep', position: i + 1, text: t })),
          },
        ],
        priority: 0.7,
      });
    }
  }

  // ------------------------------------------------------------- yoga
  add({
    path: '/yoga/',
    lang: 'en',
    title: 'Guided yoga flows: Surya Namaskar, balance and evening calm',
    description: 'Three guided yoga flows with animated poses and a breathing pace — sun salutation in the morning, balance and strength, and an evening wind-down.',
    group: 'yoga',
    page: { kind: 'yogaHub' },
    crumbs: [home, { name: 'Yoga', path: '/yoga/' }],
    priority: 0.8,
  });
  for (const f of yogaFlows) {
    const path = `/yoga/${f.id.replace(/^yoga_/, '').replace(/_/g, '-')}/`;
    const title = `${f.title}: a guided ${f.steps.length}-pose yoga sequence`;
    const description = clip(`${f.summary} Poses: ${f.steps.map((s) => s.name).join(', ')}.`);
    add({
      path,
      lang: 'en',
      title,
      description,
      group: 'yoga',
      page: { kind: 'yogaFlow', flowId: f.id },
      crumbs: [home, { name: 'Yoga', path: '/yoga/' }, { name: f.title, path }],
      jsonld: [
        {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: f.title,
          description: f.summary,
          step: f.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.name, url: abs(`/exercises/${s.id.replace(/_/g, '-')}/`) })),
        },
      ],
      priority: 0.7,
    });
  }

  // ------------------------------------------------------------- food
  add({
    path: '/food/',
    lang: 'en',
    title: `${meals.length} healthy meal ideas with calories and protein — Indian and world cuisines`,
    description: 'Breakfasts, lunches, snacks and dinners from 13 cuisines — vegan, vegetarian, egg and non-veg — each with calories, protein, carbs and fat per portion.',
    group: 'food',
    page: { kind: 'foodHub' },
    crumbs: [home, { name: 'Food', path: '/food/' }],
    priority: 0.9,
  });
  for (const m of meals) {
    const name = m.name.en;
    const path = `/food/${m.id.replace(/_/g, '-')}/`;
    const title = `${name}: calories, protein and nutrition per ${m.portion?.en ?? 'portion'}`;
    const description = clip(
      `${name} — a ${DIET[m.diet].toLowerCase()} ${CUISINE[m.cuisine ?? 'global'] ?? ''} ${m.slot}: about ${m.kcal} kcal, ${m.protein} g protein, ${m.carbs} g carbs and ${m.fat} g fat per ${m.portion?.en ?? 'portion'}.`,
    );
    add({
      path,
      lang: 'en',
      title,
      description,
      group: 'food',
      page: { kind: 'meal', meal: m },
      crumbs: [home, { name: 'Food', path: '/food/' }, { name, path }],
      jsonld: [
        {
          '@context': 'https://schema.org',
          '@type': 'Recipe',
          name,
          description,
          recipeCategory: m.slot,
          recipeCuisine: CUISINE[m.cuisine ?? 'global'],
          recipeYield: m.portion?.en,
          suitableForDiet: m.diet === 'vegan' ? 'https://schema.org/VeganDiet' : m.diet === 'vegetarian' ? 'https://schema.org/VegetarianDiet' : undefined,
          nutrition: {
            '@type': 'NutritionInformation',
            calories: `${m.kcal} calories`,
            proteinContent: `${m.protein} g`,
            carbohydrateContent: `${m.carbs} g`,
            fatContent: `${m.fat} g`,
            servingSize: m.portion?.en,
          },
          author: org,
        },
      ],
      priority: 0.6,
    });
  }

  // -------------------------------------------------------- face shapes
  add({
    path: '/face-shapes/',
    lang: 'en',
    title: 'Face shapes explained: find yours and the glasses, makeup and styles that suit it',
    description: 'Oval, round, square, oblong, heart and diamond face shapes — how they are measured, which glasses frames suit each, and makeup placement tips.',
    group: 'face',
    page: { kind: 'faceHub' },
    crumbs: [home, { name: 'Face shapes', path: '/face-shapes/' }],
    priority: 0.9,
  });
  for (const s of SHAPES) {
    const info = SHAPE_INFO[s];
    const path = `/face-shapes/${s}/`;
    const title = `${info.name} face shape: glasses, makeup and style that suit it`;
    const description = clip(`${info.about} Frames that suit an ${info.name.toLowerCase()} face: ${FRAMES_FOR[s].join(', ')}.`);
    add({
      path,
      lang: 'en',
      title,
      description,
      group: 'face',
      page: { kind: 'face', shape: s },
      crumbs: [home, { name: 'Face shapes', path: '/face-shapes/' }, { name: info.name, path }],
      jsonld: [
        articleLd({ title, description, path, lang: 'en' }),
        faqLd([
          { q: `What glasses suit a ${info.name.toLowerCase()} face?`, a: `${FRAMES_FOR[s].map((f) => f.replace(/([A-Z])/g, '-$1').toLowerCase()).join(', ')} frames. ${info.about}` },
        ]),
      ],
      priority: 0.7,
    });
  }

  // ---------------------------------------------------------- posture
  add({
    path: '/posture/',
    lang: 'en',
    title: 'Posture guide: forward head, uneven shoulders and hips — what they mean and exercises that help',
    description: 'How posture is measured in degrees, what forward head posture, head tilt, uneven shoulders and hips mean, and the exercises that help each one.',
    group: 'posture',
    page: { kind: 'postureHub' },
    crumbs: [home, { name: 'Posture', path: '/posture/' }],
    priority: 0.9,
  });
  for (const [k, v] of Object.entries(POSTURE)) {
    const path = `/posture/${k.replace(/([A-Z])/g, '-$1').toLowerCase()}/`;
    const helps = exercises.filter((e) => e.targets.includes(k));
    const title = `${v.name}: what it is, how it's measured and exercises that help`;
    const description = clip(`${v.what} Exercises: ${helps.map((e) => e.name.en).join(', ')}.`);
    add({
      path,
      lang: 'en',
      title,
      description,
      group: 'posture',
      page: { kind: 'posture', metric: k },
      crumbs: [home, { name: 'Posture', path: '/posture/' }, { name: v.name, path }],
      jsonld: [articleLd({ title, description, path, lang: 'en' })],
      priority: 0.7,
    });
  }

  // ----------------------------------------------------------- guides
  for (const lang of ['en', 'hi'] as Lang[]) {
    const P = (p: string) => (lang === 'en' ? p : hiPath(p));
    const crumbs = [{ name: L.home[lang], path: '/' }];
    add({
      path: P('/guides/'),
      lang,
      title: lang === 'en' ? 'Guides: skincare, hair, makeup, beard, style, colour and glasses' : 'गाइड: त्वचा, बाल, मेकअप, दाढ़ी, स्टाइल, रंग और चश्मा',
      description:
        lang === 'en'
          ? 'Clear, honest answers to everyday grooming and style questions — plus every exercise, skill, meal and posture guide on Personality.'
          : 'रोज़ की ग्रूमिंग और स्टाइल से जुड़े सवालों के साफ़ और सच्चे जवाब।',
      group: 'guides',
      page: { kind: 'guidesHub' },
      crumbs: [...crumbs, { name: L.guides[lang], path: P('/guides/') }],
      alt: lang === 'en' ? hiPath('/guides/') : '/guides/',
      priority: 0.9,
    });
    for (const [topic, meta] of Object.entries(TOPIC)) {
      const items = qa.filter((q) => q.topic === topic);
      const path = P(`/guides/${topic}/`);
      const title = `${tx(meta.title, lang)}: ${items.length} ${lang === 'en' ? 'questions answered' : 'सवालों के जवाब'}`;
      add({
        path,
        lang,
        title,
        description: clip(tx(meta.intro, lang) + ' ' + items.map((q) => tx(q.q, lang)).join(' ')),
        group: 'guides',
        page: { kind: 'guide', topic },
        crumbs: [...crumbs, { name: L.guides[lang], path: P('/guides/') }, { name: tx(meta.title, lang), path }],
        alt: lang === 'en' ? hiPath(path) : path.replace(/^\/hi/, ''),
        jsonld: [faqLd(items.map((q) => ({ q: tx(q.q, lang), a: tx(q.a, lang) })))],
        priority: 0.7,
      });
    }
  }

  // ---------------------------------------------------------- company
  add({
    path: '/about/',
    lang: 'en',
    title: 'How Personality works: on-device face and body scanning, methods and limits',
    description: 'The technology behind Personality — MediaPipe face and pose models running on your device, how readings are calculated, what they can and cannot tell you.',
    group: 'company',
    page: { kind: 'about' },
    crumbs: [home, { name: 'How it works', path: '/about/' }],
    jsonld: [articleLd({ title: 'How Personality works', description: 'On-device scanning, methods and limits.', path: '/about/', lang: 'en' })],
    priority: 0.7,
  });
  add({
    path: '/contact/',
    lang: 'en',
    title: 'Contact Personality — API & integrations, partnerships, press and support',
    description: 'Talk to dhurta.Inc about API access and integrations for on-device face, posture and rep-counting engines, partnerships with gyms, studios and academies, press, or support.',
    group: 'company',
    page: { kind: 'contact' },
    crumbs: [home, { name: 'Contact', path: '/contact/' }],
    jsonld: [{ '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact Personality', url: abs('/contact/'), about: org }],
    priority: 0.6,
  });
  add({
    path: '/press/',
    lang: 'en',
    title: 'Personality press kit — logo, screenshots and facts',
    description: 'Logo, app icon, screenshots, short and long descriptions, and key facts about the Personality app by dhurta.Inc.',
    group: 'company',
    page: { kind: 'press' },
    crumbs: [home, { name: 'Press kit', path: '/press/' }],
    priority: 0.4,
  });

  return out;
}

/** Hindi skill pages exist for every discipline, including yoga. */
export const skillPath = (s: Skill, lang: Lang = 'en') => `${lang === 'hi' ? '/hi' : ''}/skills/${s.id.replace(/_/g, '-')}/`;
export const exercisePath = (id: string, lang: Lang = 'en') => `${lang === 'hi' ? '/hi' : ''}/exercises/${id.replace(/_/g, '-')}/`;
export const mealPath = (id: string) => `/food/${id.replace(/_/g, '-')}/`;
export const posturePath = (k: string) => `/posture/${k.replace(/([A-Z])/g, '-$1').toLowerCase()}/`;
export const yogaPath = (id: string) => `/yoga/${id.replace(/^yoga_/, '').replace(/_/g, '-')}/`;
export { CATEGORY, fightingSkills };
