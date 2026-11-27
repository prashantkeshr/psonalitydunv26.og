import { ArrowUpRight, Swords, Dumbbell, Flower2, PersonStanding, ScanFace, Utensils, BookOpen, Languages } from 'lucide-react';
import { SectionHead } from '../components/ui';
import { exercises, meals } from '../site/content';

/** Home's doorway to every guide on the site. */
const HUBS = [
  { href: '/skills/', icon: Swords, title: 'Fighting skills', meta: '13 arts', body: 'Kalaripayattu, Silambam, Gatka, boxing, karate and more.' },
  { href: '/exercises/', icon: Dumbbell, title: 'Exercises', meta: `${exercises.length} moves`, body: 'Step-by-step, demonstrated, with sets and safety notes.' },
  { href: '/yoga/', icon: Flower2, title: 'Yoga', meta: '3 flows', body: 'Surya Namaskar, balance and an evening wind-down.' },
  { href: '/posture/', icon: PersonStanding, title: 'Posture', meta: '6 guides', body: 'Forward head, uneven shoulders and the exercises that help.' },
  { href: '/face-shapes/', icon: ScanFace, title: 'Face shapes', meta: '6 shapes', body: 'Find yours, and the glasses and makeup that suit it.' },
  { href: '/food/', icon: Utensils, title: 'Meal ideas', meta: `${meals.length} dishes`, body: 'Indian and world dishes with calories and protein.' },
  { href: '/guides/', icon: BookOpen, title: 'Style & grooming', meta: '30 answers', body: 'Skin, hair, makeup, beard, colour, glasses and fit.' },
  { href: '/hi/skills/', icon: Languages, title: 'हिन्दी में पढ़ें', meta: 'Hindi', body: 'युद्ध कलाएँ, व्यायाम और स्टाइल गाइड हिन्दी में।' },
];

export default function Learn() {
  return (
    <section id="learn" className="relative py-24 sm:py-32">
      <div className="page">
        <SectionHead
          eyebrow="Learn"
          title={
            <>
              Go deeper, <span className="iris-text">one guide at a time.</span>
            </>
          }
          intro="Every skill, exercise, pose, dish and style question in Personality has its own page — free to read, no sign-up."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HUBS.map(({ href, icon: Icon, title, meta, body }, i) => (
            <a key={href} href={href} className="glass glass-hover group block p-6" data-reveal data-reveal-delay={String((i % 4) * 0.05)}>
              <div className="flex items-start justify-between">
                <Icon size={22} strokeWidth={1.5} className="text-teal" />
                <ArrowUpRight size={18} className="text-mist transition group-hover:text-teal" />
              </div>
              <p className="mt-5 font-display text-lg font-semibold">{title}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{meta}</p>
              <p className="mt-2 text-sm text-mist">{body}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
