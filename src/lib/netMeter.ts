import { useEffect, useRef, useState } from 'react';

/**
 * Counts every request that could carry data off the device from the moment
 * a scan starts, so the labs show — not just claim — that nothing is sent:
 *  - any upload (a request with a body, or any method but GET/HEAD),
 *  - beacons and web sockets,
 *  - any request to another site.
 * Plain same-site GETs (this page's own images and scripts) cannot carry
 * camera data and are not counted. The site's fonts come from Google Fonts
 * and are loaded when the page opens, so they are not counted either.
 */
type Listener = (n: number) => void;
let count = 0;
const listeners = new Set<Listener>();
const bump = () => {
  count++;
  listeners.forEach((l) => l(count));
};

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const otherSite = (url: string) => {
  try {
    const u = new URL(url, location.href);
    return u.origin !== location.origin && !FONT_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
};

let installed = false;
function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Anything the browser loads from another site (images, scripts, frames).
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const r = e as PerformanceResourceTiming;
        if (r.initiatorType !== 'fetch' && r.initiatorType !== 'xmlhttprequest' && otherSite(r.name)) bump();
      }
    }).observe({ type: 'resource', buffered: false });
  } catch {
    // Older browsers: the wrappers below still count uploads.
  }

  const f = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : null;
    const url = req ? req.url : String(input);
    const method = (init?.method ?? req?.method ?? 'GET').toUpperCase();
    if (init?.body || (method !== 'GET' && method !== 'HEAD') || otherSite(url)) bump();
    return f(input, init);
  };

  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest & { _m?: string; _u?: string }, method: string, url: string | URL, ...rest: unknown[]) {
    this._m = method.toUpperCase();
    this._u = String(url);
    // @ts-expect-error forwarding the optional async/user/password arguments
    return open.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (this: XMLHttpRequest & { _m?: string; _u?: string }, body?: Document | XMLHttpRequestBodyInit | null) {
    if (body || (this._m !== 'GET' && this._m !== 'HEAD') || otherSite(this._u ?? '')) bump();
    return send.call(this, body);
  };

  const ws = window.WebSocket;
  window.WebSocket = class extends ws {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      bump();
    }
  } as typeof WebSocket;

  if (navigator.sendBeacon) {
    const beacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => {
      bump();
      return beacon(url, data);
    };
  }
}

/** Uploads since `active` last turned on. */
export function useNetworkMeter(active: boolean) {
  const base = useRef(0);
  const [since, setSince] = useState(0);
  useEffect(() => {
    install();
    if (!active) return;
    base.current = count;
    setSince(0);
    const l: Listener = (n) => setSince(n - base.current);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [active]);
  return since;
}
