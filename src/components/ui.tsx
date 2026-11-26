import { useEffect, useRef, useState, type ReactNode } from 'react';
import { prefersReducedMotion } from '../lib/motion';

/** Section heading: eyebrow, title and intro, aligned left or centre. */
export function SectionHead({
  eyebrow,
  title,
  intro,
  center = false,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className="eyebrow" data-reveal>
        {eyebrow}
      </p>
      <h2 className="h-display mt-4 text-[34px] leading-[1.08] sm:text-5xl" data-reveal data-reveal-delay="0.05">
        {title}
      </h2>
      {intro && (
        <p className="mt-5 text-base text-mist sm:text-lg" data-reveal data-reveal-delay="0.1">
          {intro}
        </p>
      )}
    </div>
  );
}

/** A button that leans toward the pointer. */
export function Magnetic({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || window.matchMedia('(hover: none)').matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
    };
    const leave = () => (el.style.transform = '');
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);
  return (
    <span ref={ref} className={`inline-block transition-transform duration-300 ease-out ${className}`}>
      {children}
    </span>
  );
}

/** Counts up to `to` when scrolled into view. */
export function Counter({ to, suffix = '', duration = 1600 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(prefersReducedMotion() ? to : 0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - start) / duration);
          setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {v.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

/** Scanner-style frame with corner brackets. */
export function Brackets({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`brackets ${className}`}>
      <span className="br tl" />
      <span className="br tr" />
      <span className="br bl" />
      <span className="br bc" />
      {children}
    </div>
  );
}

/** A phone with one of the app's real screenshots. */
export function Phone({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.2rem] border border-white/15 bg-ink-800 p-[7px] shadow-[0_40px_120px_-30px_rgba(124,92,255,0.55)] ${className}`}
    >
      <div className="h-full w-full overflow-hidden rounded-[1.8rem]">
        {/* The store screenshots carry a 1px device border; scale it out of view. */}
        <img src={src} alt={alt} loading="lazy" className="h-full w-full scale-[1.012] object-cover object-top" />
      </div>
    </div>
  );
}

/** Small live indicator dot. */
export function LiveDot({ color = 'bg-teal' }: { color?: string }) {
  return <span className={`inline-block h-1.5 w-1.5 animate-pulseDot rounded-full ${color}`} />;
}
