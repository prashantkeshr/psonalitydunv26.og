import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { scrollToId } from '../lib/motion';

const LINKS = [
  ['face', 'Face scan'],
  ['body', 'Body scan'],
  ['skills', 'Fighting skills'],
  ['food', 'Food'],
  ['style', 'Style'],
  ['privacy', 'Privacy'],
] as const;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open ? 'border-b border-line bg-ink/75 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav className="page flex h-16 items-center justify-between">
        <button onClick={() => go('top')} className="flex items-center gap-2.5" aria-label="Personality, back to top">
          <img src="/app/icon-512.png" alt="" className="h-8 w-8 rounded-lg" />
          <span className="font-display text-[17px] font-semibold tracking-tight">Personality</span>
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className="rounded-full px-3.5 py-2 text-sm text-mist transition hover:bg-white/5 hover:text-white"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => go('download')} className="btn btn-ghost hidden !py-2 text-xs sm:inline-flex">
            Coming soon to Android
          </button>
          <button
            className="rounded-full p-2 text-white lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="page grid gap-1 pb-5 lg:hidden">
          {LINKS.map(([id, label]) => (
            <button key={id} onClick={() => go(id)} className="rounded-xl px-3 py-3 text-left text-base text-white/90 hover:bg-white/5">
              {label}
            </button>
          ))}
          <button onClick={() => go('download')} className="btn btn-iris mt-2">
            Coming soon to Android
          </button>
        </div>
      )}
    </header>
  );
}
