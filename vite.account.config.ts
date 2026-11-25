import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: 'server/vercel-handler.ts',
    outDir: '.vercel-runtime',
    copyPublicDir: false,
  },
});
