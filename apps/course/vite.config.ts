import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import { devManifest, readRemoteSources, siteBase } from '../../scripts/mfe-registry.ts';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');

function remoteDevManifest(): Plugin {
  return {
    name: 'rfg-remote-dev-manifest',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(`${siteBase}remotes/manifest.dev.json`, async (_request, response) => {
        try {
          const manifest = devManifest(await readRemoteSources(repoRoot));
          response.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          });
          response.end(JSON.stringify(manifest));
        } catch (error) {
          response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end(error instanceof Error ? error.message : String(error));
        }
      });
    },
  };
}

export default defineConfig({
  base: siteBase,
  plugins: [react(), tailwindcss(), remoteDevManifest()],
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
});
