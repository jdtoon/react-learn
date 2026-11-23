import { defineConfig, type Plugin } from 'vite';
import pkg from './package.json' with { type: 'json' };

const remote = pkg.mfe.remotes[0];
if (!remote) throw new Error('package.json has no mfe remote');

const { entry, devPort } = remote;
const base = `/react-learn/remotes/${remote.path}/`;

function devEntry(): Plugin {
  return {
    name: 'rfg-isolated-dev-entry',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url?.split('?')[0] === `${base}${entry}`) {
          request.url = `${base}src/main.tsx`;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  base,
  server: { port: devPort, strictPort: true },
  plugins: [devEntry()],
  oxc: { jsx: { runtime: 'automatic' } },
  define: command === 'build' ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
  build: {
    target: 'esnext',
    lib: { entry: './src/main.tsx', formats: ['es'], fileName: () => entry },
  },
}));
