export type Org = 'layers' | 'slices';
export type SliceId = 'catalogue' | 'checkout' | 'account';
export type LayerId = 'ui' | 'api' | 'data';

export interface Cell {
  slice: SliceId;
  layer: LayerId;
}

export interface Team {
  id: string;
  label: string;
}

export const sliceList: { id: SliceId; label: string }[] = [
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'account', label: 'Account' },
];

export const layerList: { id: LayerId; label: string }[] = [
  { id: 'ui', label: 'UI' },
  { id: 'api', label: 'API' },
  { id: 'data', label: 'Data' },
];

export const orgTeams: Record<Org, Team[]> = {
  layers: [
    { id: 'ui', label: 'UI team' },
    { id: 'api', label: 'API team' },
    { id: 'data', label: 'Data team' },
  ],
  slices: [
    { id: 'catalogue', label: 'Catalogue squad' },
    { id: 'checkout', label: 'Checkout squad' },
    { id: 'account', label: 'Account squad' },
  ],
};

export const orgLabels: Record<Org, string> = {
  layers: 'Organised by layer',
  slices: 'Organised by capability',
};

export const orgSummaries: Record<Org, string> = {
  layers:
    'Three deployables stacked by technology. Any feature crosses the layers it needs, so it needs a release from each layer team.',
  slices:
    'Three deployables, one per capability. A feature inside one slice ships alone. A feature across slices needs a contract between teams.',
};

export interface Feature {
  id: string;
  label: string;
  description: string;
  cells: Cell[];
}

const sortFeature: Feature = {
  id: 'sort',
  label: 'Sort option',
  description: 'Add a sort option to the product list. It touches Catalogue UI and API.',
  cells: [
    { slice: 'catalogue', layer: 'ui' },
    { slice: 'catalogue', layer: 'api' },
  ],
};

export const couponFeature: Feature = {
  id: 'coupon',
  label: 'Coupon field',
  description: 'Add a coupon field to checkout. It touches Checkout UI, API and data.',
  cells: [
    { slice: 'checkout', layer: 'ui' },
    { slice: 'checkout', layer: 'api' },
    { slice: 'checkout', layer: 'data' },
  ],
};

const againFeature: Feature = {
  id: 'again',
  label: 'Buy again',
  description:
    'Add Buy again to past orders. It touches Account UI, Catalogue API and Checkout API.',
  cells: [
    { slice: 'account', layer: 'ui' },
    { slice: 'catalogue', layer: 'api' },
    { slice: 'checkout', layer: 'api' },
  ],
};

export const features: Feature[] = [sortFeature, couponFeature, againFeature];

export const workDays = 2;
export const queueDays = 3;
export const horizonDays = 12;

export function ownerOf(org: Org, cell: Cell): string {
  return org === 'layers' ? cell.layer : cell.slice;
}

export function teamIndex(org: Org, teamId: string): number {
  return Math.max(
    0,
    orgTeams[org].findIndex((team) => team.id === teamId),
  );
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.slice === b.slice && a.layer === b.layer;
}

export interface WorkStep {
  cell: Cell;
  team: string;
  start: number;
  end: number;
}

export interface QueueWait {
  team: string;
  start: number;
  end: number;
}

export interface Schedule {
  steps: WorkStep[];
  waits: QueueWait[];
  teams: string[];
  handoffs: number;
  total: number;
}

const layerOrder: LayerId[] = ['data', 'api', 'ui'];
const sliceOrder: SliceId[] = ['catalogue', 'checkout', 'account'];

export function schedule(org: Org, feature: Feature): Schedule {
  const ordered = [...feature.cells].sort(
    (a, b) =>
      layerOrder.indexOf(a.layer) - layerOrder.indexOf(b.layer) ||
      sliceOrder.indexOf(a.slice) - sliceOrder.indexOf(b.slice),
  );
  const steps: WorkStep[] = [];
  const waits: QueueWait[] = [];
  let clock = 0;
  let previous: string | null = null;
  let handoffs = 0;

  for (const cell of ordered) {
    const team = ownerOf(org, cell);
    if (previous !== null && team !== previous) {
      waits.push({ team, start: clock, end: clock + queueDays });
      clock += queueDays;
      handoffs += 1;
    }
    steps.push({ cell, team, start: clock, end: clock + workDays });
    clock += workDays;
    previous = team;
  }

  return {
    steps,
    waits,
    teams: [...new Set(steps.map((step) => step.team))],
    handoffs,
    total: clock,
  };
}
