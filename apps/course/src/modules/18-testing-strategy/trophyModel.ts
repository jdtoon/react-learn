export type LayerId = 'static' | 'unit' | 'integration' | 'e2e';

export interface Layer {
  id: LayerId;
  label: string;
  blurb: string;
  effortPerTest: number;
  reach: number;
  saturation: number;
  secondsPerTest: number;
  upkeepPerTest: number;
  flakePerTest: number;
}

export type Shares = Record<LayerId, number>;

export interface Outcome {
  confidence: number;
  ciMinutes: number;
  upkeepHours: number;
  flakeRisk: number;
  counts: Record<LayerId, number>;
}

export const budget = 400;

export const layers: Layer[] = [
  {
    id: 'e2e',
    label: 'End-to-end',
    blurb: 'Real browser, real stack',
    effortPerTest: 15,
    reach: 0.8,
    saturation: 8,
    secondsPerTest: 30,
    upkeepPerTest: 0.8,
    flakePerTest: 0.02,
  },
  {
    id: 'integration',
    label: 'Integration',
    blurb: 'Real components, faked network',
    effortPerTest: 5,
    reach: 0.65,
    saturation: 20,
    secondsPerTest: 1,
    upkeepPerTest: 0.12,
    flakePerTest: 0.003,
  },
  {
    id: 'unit',
    label: 'Unit',
    blurb: 'Pure logic in isolation',
    effortPerTest: 2,
    reach: 0.3,
    saturation: 40,
    secondsPerTest: 0.05,
    upkeepPerTest: 0.04,
    flakePerTest: 0.0005,
  },
  {
    id: 'static',
    label: 'Static',
    blurb: 'Types and lint rules',
    effortPerTest: 1,
    reach: 0.25,
    saturation: 6,
    secondsPerTest: 0.5,
    upkeepPerTest: 0.02,
    flakePerTest: 0,
  },
];

export const presets: { id: string; label: string; shares: Shares }[] = [
  { id: 'pyramid', label: 'Pyramid', shares: { static: 10, unit: 60, integration: 25, e2e: 5 } },
  { id: 'trophy', label: 'Trophy', shares: { static: 15, unit: 20, integration: 50, e2e: 15 } },
  { id: 'cone', label: 'Ice cream cone', shares: { static: 0, unit: 5, integration: 15, e2e: 80 } },
  {
    id: 'unit',
    label: 'Only unit tests',
    shares: { static: 0, unit: 100, integration: 0, e2e: 0 },
  },
];

export function evaluate(shares: Shares): Outcome {
  const total = layers.reduce((sum, layer) => sum + shares[layer.id], 0) || 1;
  let missed = 1;
  let seconds = 0;
  let upkeep = 0;
  let clean = 1;
  const counts: Record<LayerId, number> = { static: 0, unit: 0, integration: 0, e2e: 0 };

  for (const layer of layers) {
    const count = ((shares[layer.id] / total) * budget) / layer.effortPerTest;
    counts[layer.id] = Math.round(count);
    missed *= 1 - layer.reach * (1 - Math.exp(-count / layer.saturation));
    seconds += count * layer.secondsPerTest;
    upkeep += count * layer.upkeepPerTest;
    clean *= Math.pow(1 - layer.flakePerTest, count);
  }

  return {
    confidence: Math.round((1 - missed) * 100),
    ciMinutes: Math.round((seconds / 60) * 10) / 10,
    upkeepHours: Math.round(upkeep * 10) / 10,
    flakeRisk: Math.round((1 - clean) * 100),
    counts,
  };
}
