import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

const version = process.env['RECS_VERSION'] === 'v2' ? 'v2' : 'v1';
const remote = pkg.mfe.remotes.find((entry) => entry.id === `react-recs-${version}`);
if (!remote) throw new Error(`package.json has no mfe remote for ${version}`);

const source = version === 'v2' ? './src/RecsV2.tsx' : './src/RecsV1.tsx';

export default defineConfig({
  base: `/react-learn/remotes/${remote.path}/`,
  server: { port: remote.devPort, strictPort: true },
  plugins: [
    react(),
    federation({
      name: remote.container,
      filename: remote.entry,
      manifest: true,
      dts: false,
      exposes: {
        [remote.expose]: source,
        './reactIdentity': './src/reactIdentity.ts',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.3.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.3.0' },
      },
    }),
  ],
  build: {
    target: 'esnext',
    outDir: remote.dist,
    rollupOptions: { input: { entry: source } },
  },
});
