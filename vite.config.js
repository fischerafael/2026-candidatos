import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Se for hospedar num subcaminho (ex.: GitHub Pages em /candidatos-2026/),
// defina BASE_PATH=/candidatos-2026/ no build.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
});
