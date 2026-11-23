import { defineConfig } from 'vite';

const port = 5208;

export default defineConfig({
  base: '/react-learn/remotes/legacy-iframe/',
  server: { port, strictPort: true },
  build: { target: 'esnext', rollupOptions: { input: './locator.html' } },
});
