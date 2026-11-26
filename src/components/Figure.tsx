import { useEffect, useRef } from 'react';
import { bounds, getMotion, paint, poseAt, IRIS, type FigureStyle } from '../lib/figure';
import { prefersReducedMotion } from '../lib/motion';

/** Plays one of the app's motions on a canvas. Pauses off-screen; shows
 *  the first pose when the visitor prefers less motion. */
export default function Figure({
  motion,
  className = '',
  style = IRIS,
  speed = 1,
  label,
}: {
  motion: string;
  className?: string;
  style?: FigureStyle;
  speed?: number;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const m = getMotion(motion);
    if (!c || !m) return;
    const ctx = c.getContext('2d')!;
    const box = bounds(m);
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      c.width = Math.max(1, Math.round(c.clientWidth * dpr));
      c.height = Math.max(1, Math.round(c.clientHeight * dpr));
    };
    fit();
    const ro = new ResizeObserver(() => {
      fit();
      draw(performance.now());
    });
    ro.observe(c);
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);
    const t0 = performance.now();
    const draw = (t: number) => paint(ctx, m, poseAt(m, (t - t0) * speed), box, c.width, c.height, style);
    let raf = 0;
    if (prefersReducedMotion()) {
      paint(ctx, m, m.frames[Math.min(1, m.frames.length - 1)].pose, box, c.width, c.height, style);
    } else {
      const loop = (t: number) => {
        raf = requestAnimationFrame(loop);
        if (visible) draw(t);
      };
      draw(t0);
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [motion, speed, style]);

  return <canvas ref={ref} className={`block h-full w-full ${className}`} role="img" aria-label={label ?? 'Animated demonstration'} />;
}
