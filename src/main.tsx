import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are served from this site, so a visit makes no requests elsewhere.
import '@fontsource-variable/inter';
import '@fontsource-variable/sora';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './index.css';

/**
 * Every page arrives as finished HTML (built by scripts/prerender.mjs), so
 * search engines and AI assistants can read it without running scripts.
 * Here the page comes alive: the home page loads the interactive labs; the
 * guide pages load only what they need.
 */
const root = createRoot(document.getElementById('root')!);
const path = window.location.pathname;

if (path === '/' || path === '/index.html') {
  import('./App').then(({ default: App }) =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  );
} else {
  import('./site/client').then(({ mount }) => mount(root, path));
}
