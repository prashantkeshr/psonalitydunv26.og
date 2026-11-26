import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, WifiOff } from 'lucide-react';
import answers from '../data/coach.json';
import { prefersReducedMotion } from '../lib/motion';

type Msg = { from: 'you' | 'coach'; text: string; link?: string; typing?: boolean };

/** A preview of the in-app coach: real answers from the app's guides,
 *  typed out. (The real coach runs on the phone; this page doesn't call
 *  any AI service.) */
export default function CoachDemo() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const asked = new Set(msgs.filter((m) => m.from === 'you').map((m) => m.text));

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  const ask = async (i: number) => {
    if (busy) return;
    const { q, a, link } = answers[i];
    setBusy(true);
    setMsgs((m) => [...m, { from: 'you', text: q }, { from: 'coach', text: '', typing: true }]);
    await new Promise((r) => setTimeout(r, 700));
    const words = a.split(' ');
    if (prefersReducedMotion()) {
      setMsgs((m) => [...m.slice(0, -1), { from: 'coach', text: a, link }]);
    } else {
      for (let k = 1; k <= words.length; k++) {
        await new Promise((r) => setTimeout(r, 28));
        const text = words.slice(0, k).join(' ');
        setMsgs((m) => [...m.slice(0, -1), { from: 'coach', text, link: k === words.length ? link : undefined }]);
      }
    }
    setBusy(false);
  };

  return (
    <div className="glass flex flex-col p-5 sm:p-6" data-reveal>
      <div className="flex items-center justify-between gap-2 text-xs text-mist">
        <span className="flex items-center gap-2">
          <WifiOff size={14} strokeWidth={1.6} className="text-teal" /> In the app: runs on your phone, offline
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Preview</span>
      </div>
      <div ref={box} className="mt-4 grid max-h-[340px] min-h-[220px] content-start gap-3 overflow-y-auto pr-1 text-sm" aria-live="polite">
        {msgs.length === 0 && <p className="mt-16 text-center text-mist">Pick a question below to see how the coach answers.</p>}
        {msgs.map((m, i) =>
          m.from === 'you' ? (
            <p key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.08] px-4 py-3">{m.text}</p>
          ) : (
            <div key={i} className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-white/[0.02] px-4 py-3 text-white/85">
              {m.typing ? (
                <span className="inline-flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-white/60" style={{ animationDelay: `${d * 0.2}s` }} />
                  ))}
                </span>
              ) : (
                <>
                  {m.text}
                  {m.link && (
                    <span className="mt-2 flex w-fit items-center gap-1 rounded-md bg-teal/15 px-2 py-1 text-xs text-teal">
                      Open {m.link} <ArrowUpRight size={12} />
                    </span>
                  )}
                </>
              )}
            </div>
          ),
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {answers.map((x, i) =>
          asked.has(x.q) ? null : (
            <button key={x.q} disabled={busy} onClick={() => ask(i)} className="chip !py-1.5 text-left hover:!text-white disabled:opacity-50">
              {x.q}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
