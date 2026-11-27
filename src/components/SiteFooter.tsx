/** Footer with links to every section, so people and crawlers can reach
 *  all pages from anywhere. */
const COLS: [string, [string, string][]][] = [
  ['Try it live', [['/#face', 'Face scan'], ['/#body', 'Body scan & squat counter'], ['/#skills', 'Skills arena'], ['/#food', 'Food planner']]],
  ['Learn', [['/skills/', 'Fighting skills'], ['/exercises/', 'Exercises'], ['/yoga/', 'Yoga flows'], ['/posture/', 'Posture'], ['/face-shapes/', 'Face shapes'], ['/food/', 'Meal ideas'], ['/guides/', 'Style & grooming']]],
  ['हिन्दी', [['/hi/skills/', 'युद्ध कलाएँ'], ['/hi/exercises/', 'व्यायाम'], ['/hi/guides/', 'स्टाइल गाइड']]],
  ['Company', [['/about/', 'How it works'], ['/contact/', 'Contact & API'], ['/press/', 'Press kit'], ['/privacy/', 'Privacy'], ['/credits/', 'Credits']]],
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line pb-10 pt-16">
      <div className="page">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr_1fr]">
          <div>
            <a href="/" className="flex items-center gap-2.5">
              <img src="/app/icon-512.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
              <span className="font-display text-[17px] font-semibold">Personality</span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-mist">
              Your body, food, style and skills — read live and privately on your own device. Coming soon to Android.
            </p>
            <a href="mailto:support@dhurta.org" className="mt-4 inline-block text-sm text-teal hover:underline">
              support@dhurta.org
            </a>
          </div>
          {COLS.map(([title, links]) => (
            <nav key={title} aria-label={title}>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">{title}</p>
              <ul className="mt-4 grid gap-2.5 text-sm">
                {links.map(([href, label]) => (
                  <li key={href}>
                    <a href={href} className="text-white/80 hover:text-white">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-mist sm:flex-row">
          <span>© 2026 dhurta.Inc · Personality</span>
          <span>No cookies · No analytics · Scans stay on your device</span>
        </div>
      </div>
    </footer>
  );
}
