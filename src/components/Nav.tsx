import { useEffect, useState } from 'react';
import { Menu, X, Languages } from 'lucide-react';
import { scrollToId } from '../lib/motion';

/** Top bar. Links are real URLs (crawlable); on the home page, links to its
 *  own sections scroll smoothly instead of reloading. */
const LINKS = [
  ['/#face', 'Face scan'],
  ['/#body', 'Body scan'],
  ['/skills/', 'Fighting skills'],
  ['/exercises/', 'Exercises'],
  ['/food/', 'Food'],
  ['/guides/', 'Guides'],
  ['/contact/', 'Contact'],
] as const;

export default function Nav({ alt, altLabel }: { alt?: string; altLabel?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const onHome = typeof window !== 'undefined' && window.location.pathname === '/';

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const click = (href: string) => (e: React.MouseEvent) => {
    setOpen(false);
    if (onHome && href.startsWith('/#')) {
      e.preventDefault();
      scrollToId(href.slice(2));
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open ? 'border-b border-line bg-ink/75 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav className="page flex h-16 items-center justify-between" aria-label="Main">
        <a href="/" className="flex items-center gap-2.5" aria-label="Personality home">
          <img src="/app/icon-512.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
          <span className="font-display text-[17px] font-semibold tracking-tight">Personality</span>
        </a>

        <div className="hidden items-center gap-0.5 xl:flex">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={click(href)} className="rounded-full px-3 py-2 text-sm text-mist transition hover:bg-white/5 hover:text-white">
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {alt && (
            <a href={alt} hrefLang={altLabel === 'हिन्दी' ? 'hi' : 'en'} className="chip !py-1.5 hover:!text-white">
              <Languages size={14} strokeWidth={1.6} /> {altLabel}
            </a>
          )}
          <a href="/#download" onClick={click('/#download')} className="btn btn-ghost hidden !py-2 text-xs sm:inline-flex">
            Coming soon to Android
          </a>
          <button
            className="rounded-full p-2 text-white xl:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="page grid gap-1 pb-5 xl:hidden">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={click(href)} className="rounded-xl px-3 py-3 text-base text-white/90 hover:bg-white/5">
              {label}
            </a>
          ))}
          <a href="/#download" onClick={click('/#download')} className="btn btn-iris mt-2">
            Coming soon to Android
          </a>
        </div>
      )}
    </header>
  );
}
