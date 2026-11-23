import { useState } from 'react';
import { Meter } from '../../kit';

type Criterion = 'speed' | 'ecosystem' | 'webpack' | 'federation' | 'next' | 'library';
type Score = 0 | 1 | 2 | 3;

interface Bundler {
  id: string;
  name: string;
  built: string;
  model: string;
  notes: string;
  scores: Record<Criterion, Score>;
}

const criteria: { id: Criterion; label: string }[] = [
  { id: 'speed', label: 'Raw build speed' },
  { id: 'ecosystem', label: 'Plugin ecosystem' },
  { id: 'webpack', label: 'Existing webpack app' },
  { id: 'federation', label: 'Module Federation' },
  { id: 'next', label: 'Next.js app' },
  { id: 'library', label: 'Publishing a library' },
];

const bundlers: Bundler[] = [
  {
    id: 'vite',
    name: 'Vite 8 (Rolldown)',
    built: 'Rust core with Rolldown and Oxc, JavaScript config',
    model: 'Development serves unbundled native ES modules. Production bundles with Rolldown.',
    notes:
      'The default for new React single-page apps, and the tool this repo uses. Module Federation comes from a plugin.',
    scores: { speed: 3, ecosystem: 3, webpack: 1, federation: 2, next: 0, library: 3 },
  },
  {
    id: 'rspack',
    name: 'Rspack',
    built: 'Rust, webpack-compatible config and loaders',
    model: 'Bundles in development and production, like webpack but faster.',
    notes: 'The closest drop-in for a large webpack codebase, with first-class Module Federation.',
    scores: { speed: 3, ecosystem: 2, webpack: 3, federation: 3, next: 1, library: 2 },
  },
  {
    id: 'webpack',
    name: 'webpack 5',
    built: 'JavaScript',
    model: 'Bundles in development and production.',
    notes:
      'The largest plugin ecosystem and the origin of Module Federation. Mature, and the slowest of the group on big apps.',
    scores: { speed: 1, ecosystem: 3, webpack: 3, federation: 3, next: 1, library: 2 },
  },
  {
    id: 'turbopack',
    name: 'Turbopack',
    built: 'Rust, incremental',
    model: 'Built into Next.js, with incremental rebuilds in development and for production.',
    notes: 'Chosen for you by Next.js. It is not a general-purpose standalone bundler.',
    scores: { speed: 3, ecosystem: 1, webpack: 0, federation: 0, next: 3, library: 0 },
  },
  {
    id: 'esbuild',
    name: 'esbuild',
    built: 'Go, small plugin API',
    model: 'A very fast bundler and transformer with no built-in hot module replacement.',
    notes:
      'Excellent for libraries, scripts and as a building block, including inside the Angular CLI. It leaves app-level features to other tools.',
    scores: { speed: 3, ecosystem: 2, webpack: 0, federation: 0, next: 0, library: 3 },
  },
];

export function BundlerLab() {
  const [chosen, setChosen] = useState<Criterion[]>(['speed']);

  function toggle(id: Criterion) {
    setChosen((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  const max = Math.max(chosen.length, 1) * 3;
  const ranked = bundlers
    .map((bundler) => ({
      bundler,
      total: chosen.reduce((sum, id) => sum + bundler.scores[id], 0),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="eyebrow">What matters for this project</p>
        <div role="group" aria-label="Criteria" className="flex flex-wrap gap-2">
          {criteria.map((item) => (
            <button
              key={item.id}
              type="button"
              className="kit-btn"
              aria-pressed={chosen.includes(item.id)}
              onClick={() => toggle(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <ol aria-label="Ranked bundlers" className="grid list-none gap-3 p-0">
        {ranked.map(({ bundler, total }, index) => (
          <li
            key={bundler.id}
            data-bundler={bundler.id}
            className="grid gap-2 rounded-lg border border-line bg-surface p-3"
          >
            <Meter
              label={`${index + 1}. ${bundler.name}`}
              value={chosen.length === 0 ? 0 : total}
              max={max}
              unit=""
            />
            <p className="font-mono text-[0.74rem] text-muted">{bundler.built}</p>
            <p className="text-[0.86rem]">{bundler.model}</p>
            <p className="text-[0.86rem] text-muted">{bundler.notes}</p>
          </li>
        ))}
      </ol>

      <p className="text-[0.82rem] text-muted">
        Fit scores run from 0 to 3 per criterion. They are a judgement, not a benchmark: measure on
        your own code before you migrate.
      </p>
    </div>
  );
}
