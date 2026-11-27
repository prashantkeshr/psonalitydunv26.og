/** Typed access to the content exported from the app (English + Hindi). */
import skillsJson from '../content/skills.json';
import exercisesJson from '../content/exercises.json';
import mealsJson from '../content/meals.json';
import qaJson from '../content/qa.json';
import shapesJson from '../content/makeupShapes.json';
import yogaJson from '../data/yoga.json';

export type Lang = 'en' | 'hi';
export type T = { en: string; hi: string };
export const tx = (t: T | null | undefined, lang: Lang) => (t ? t[lang] || t.en : '');

export type Skill = (typeof skillsJson)[number];
export type Exercise = Omit<(typeof exercisesJson)[number], 'targets'> & { targets: string[] };
export type Meal = (typeof mealsJson)[number];
export type QA = (typeof qaJson)[number];

export const skills = skillsJson as Skill[];
export const fightingSkills = skills.filter((s) => s.family !== 'mindbody');
export const exercises = exercisesJson as Exercise[];
export const meals = mealsJson as Meal[];
export const qa = qaJson as QA[];
export const makeupShapes = shapesJson as Record<string, Record<'blush' | 'contour' | 'highlight', T>>;
export const yogaFlows = yogaJson;

export const site = {
  origin: 'https://personality.dhurta.org',
  name: 'Personality',
  org: 'dhurta.Inc',
  email: 'support@dhurta.org',
};

export const CATEGORY: Record<string, T> = {
  strength: { en: 'Strength', hi: 'ताक़त' },
  core: { en: 'Core', hi: 'कोर' },
  cardio: { en: 'Cardio', hi: 'कार्डियो' },
  stretching: { en: 'Stretching', hi: 'स्ट्रेचिंग' },
  yoga: { en: 'Yoga', hi: 'योग' },
  upperBack: { en: 'Upper back', hi: 'ऊपरी पीठ' },
  lowerBack: { en: 'Lower back', hi: 'निचली पीठ' },
  shoulder: { en: 'Shoulders', hi: 'कंधे' },
  neck: { en: 'Neck', hi: 'गर्दन' },
  posture: { en: 'Posture', hi: 'मुद्रा' },
};

export const CUISINE: Record<string, string> = {
  northIndian: 'North Indian', southIndian: 'South Indian', eastIndian: 'East Indian', westIndian: 'West Indian',
  indian: 'Indian', global: 'Global', mediterranean: 'Mediterranean', middleEastern: 'Middle Eastern',
  eastAsian: 'East Asian', southeastAsian: 'Southeast Asian', western: 'Western', latin: 'Latin American', african: 'African',
};
export const DIET: Record<string, string> = { vegan: 'Vegan', vegetarian: 'Vegetarian', egg: 'Eggetarian', nonveg: 'Non-vegetarian' };

export const TOPIC: Record<string, { title: T; intro: T }> = {
  skin: { title: { en: 'Skincare basics', hi: 'त्वचा की देखभाल' }, intro: { en: 'Simple, honest skincare: routines, skin types, sunscreen, breakouts and dark circles.', hi: 'आसान और सच्ची त्वचा देखभाल: दिनचर्या, त्वचा का प्रकार, सनस्क्रीन, मुँहासे और काले घेरे।' } },
  hair: { title: { en: 'Hair care', hi: 'बालों की देखभाल' }, intro: { en: 'Washing, frizz, hair fall, trims and how to ask for the cut you want.', hi: 'धोना, फ्रिज़, बाल झड़ना, ट्रिम और मनचाहा कट कैसे माँगें।' } },
  makeup: { title: { en: 'Makeup for beginners', hi: 'शुरुआती लोगों के लिए मेकअप' }, intro: { en: 'Where to start, matching foundation, making it last in heat, and the no-makeup look.', hi: 'कहाँ से शुरू करें, फ़ाउंडेशन मिलाना, गर्मी में टिकाऊ मेकअप और नैचुरल लुक।' } },
  beard: { title: { en: 'Beard and shaving', hi: 'दाढ़ी और शेविंग' }, intro: { en: 'Growing a fuller beard, itch, razor bumps and where the neckline goes.', hi: 'घनी दाढ़ी, खुजली, रेज़र के दाने और नेकलाइन कहाँ हो।' } },
  style: { title: { en: 'Style and fit', hi: 'स्टाइल और फ़िट' }, intro: { en: 'Capsule wardrobes, fit, looking taller, formal basics and fragrance.', hi: 'कैप्सूल वॉर्डरोब, फ़िट, लंबे दिखना, फ़ॉर्मल बेसिक्स और खुशबू।' } },
  colour: { title: { en: 'Colour and undertone', hi: 'रंग और अंडरटोन' }, intro: { en: 'Matching colours, finding your undertone, and whether black or white suits you.', hi: 'रंग मिलाना, अपना अंडरटोन जानना, और क्या काला या सफ़ेद आप पर जँचता है।' } },
  glasses: { title: { en: 'Glasses and sunglasses', hi: 'चश्मा और धूप का चश्मा' }, intro: { en: 'Choosing frames that suit you, how glasses should fit, and what to look for in sunglasses.', hi: 'अपने लिए सही फ़्रेम, चश्मा कैसे फ़िट हो, और धूप के चश्मे में क्या देखें।' } },
};

export const SHAPES = ['oval', 'round', 'square', 'oblong', 'heart', 'diamond'] as const;
export type Shape = (typeof SHAPES)[number];

export const POSTURE: Record<string, { name: string; what: string; measure: string; bands: [number, number] }> = {
  headForward: {
    name: 'Forward head posture',
    what: 'The head sits in front of the shoulders instead of stacked above them — common with long hours at a phone or desk ("tech neck"). Every few centimetres forward adds load the neck and upper back must hold.',
    measure: 'Side-on, the angle between the ear and the shoulder from vertical. Under 15° reads as aligned; 15–25° as slightly forward; above 25° as noticeably forward.',
    bands: [15, 25],
  },
  headTilt: {
    name: 'Head tilt',
    what: 'One ear sits lower than the other when facing forward. Often a habit — holding a phone on one shoulder, a one-sided screen setup, or tight neck muscles on one side.',
    measure: 'Facing the camera, the angle of the line between the ears from horizontal. Under 3° reads as aligned; 3–7° as slight; above 7° as noticeable.',
    bands: [3, 7],
  },
  shoulderLevel: {
    name: 'Uneven shoulders',
    what: 'One shoulder rests higher than the other. Carrying a bag on one side, a dominant arm or a one-sided sport can all build it up over time.',
    measure: 'Facing the camera, the angle of the shoulder line from horizontal. Under 2° reads as level; 2–5° as slightly uneven; above 5° as noticeably uneven.',
    bands: [2, 5],
  },
  hipLevel: {
    name: 'Uneven hips',
    what: 'One hip sits higher than the other — often from standing with weight on one leg, or from differences in strength or flexibility between sides.',
    measure: 'Facing the camera, the angle of the hip line from horizontal. Under 2° reads as level; 2–5° as slightly uneven; above 5° as noticeable.',
    bands: [2, 5],
  },
  torsoLean: {
    name: 'Torso lean',
    what: 'The upper body leans to one side or forward instead of stacking over the hips. Weak core muscles and long sitting are frequent causes.',
    measure: 'The angle between the shoulder midpoint and the hip midpoint from vertical. Under 3° reads as upright; 3–7° as a slight lean; above 7° as noticeable.',
    bands: [3, 7],
  },
  kneeAlignment: {
    name: 'Knee alignment',
    what: 'The knee drifts in or out of the line between hip and ankle. It shows most during squats and lunges, where it matters most for comfortable knees.',
    measure: 'Facing the camera, how far the knee bends away from the hip–ankle line. Under 5° reads as aligned; 5–10° as slight; above 10° as noticeable.',
    bands: [5, 10],
  },
};

/** Questions answered on the home page (also marked up for search). */
export const HOME_FAQ: [string, string][] = [
    ['When can I get it?', 'Personality is coming soon to Android. iPhone follows later.'],
    ['Does it need the internet?', 'No. Everything runs on your phone. The internet is only used if you choose to download extra content packs.'],
    ['Are my photos uploaded?', 'Never. Face and body scans are processed on your device and are not stored unless you save a snapshot yourself.'],
    ['Is it for beginners?', 'Yes. Plans start where you are, every move is demonstrated, and the app adjusts as you get stronger.'],
    ['Is martial arts practice safe?', 'The app teaches solo practice — stances, footwork, shadow drills and conditioning — with safety notes. Partner and weapon work belongs with a qualified teacher.'],
];
