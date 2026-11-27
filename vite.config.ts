import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from the root of personality.dhurta.org.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  // Bundle these into the prerender build; they don't load as plain Node ESM.
  ssr: { noExternal: ['gsap', 'lenis', 'lucide-react'] },
});
