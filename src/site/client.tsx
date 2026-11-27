import { StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { buildRoutes } from './routes';
import { PageView } from './pages';

/** Renders the guide page for this URL (unknown paths keep the static 404). */
export function mount(root: Root, path: string) {
  const want = path.endsWith('/') ? path : `${path}/`;
  const route = buildRoutes().find((r) => r.path === want);
  if (!route) return;
  root.render(
    <StrictMode>
      <PageView route={route} />
    </StrictMode>,
  );
}
