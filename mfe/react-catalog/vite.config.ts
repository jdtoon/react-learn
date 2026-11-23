import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

const remote = pkg.mfe.remotes[0];
if (!remote) throw new Error('package.json has no mfe remote');

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
        [remote.expose]: './src/Catalog.tsx',
        './reactIdentity': './src/reactIdentity.ts',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.3.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.3.0' },
      },
    }),
  ],
  build: { target: 'esnext', rollupOptions: { input: { entry: './src/Catalog.tsx' } } },
});
