import type { CSSProperties } from 'react';
import { Meter, Stepper, type StepperStep } from '../../kit';
import { cn } from '../../kit/cn';

type Owner = 'legacy' | 'react' | 'svelte' | 'vue' | 'angular' | 'plain';

interface Area {
  id: string;
  title: string;
  target: Owner;
}

interface Stage {
  title: string;
  description: string;
  owners: Record<string, Owner>;
  shell: boolean;
  routes: string;
  bus: boolean;
  teams: number;
}

const areas: Area[] = [
  { id: 'promo', title: 'Promotion', target: 'svelte' },
  { id: 'catalog', title: 'Catalogue', target: 'react' },
  { id: 'cart', title: 'Cart', target: 'react' },
  { id: 'recs', title: 'Recommendations', target: 'react' },
  { id: 'reviews', title: 'Reviews', target: 'vue' },
  { id: 'account', title: 'Account', target: 'angular' },
  { id: 'locator', title: 'Store locator', target: 'plain' },
];

const ownerLabel: Record<Owner, string> = {
  legacy: 'Monolith',
  react: 'React slot',
  svelte: 'Svelte slot',
  vue: 'Vue slot',
  angular: 'Angular slot',
  plain: 'Legacy, in an iframe',
};

function owners(migrated: string[], contained: string[] = []): Record<string, Owner> {
  return Object.fromEntries(
    areas.map((area): [string, Owner] => [
      area.id,
      migrated.includes(area.id) || contained.includes(area.id) ? area.target : 'legacy',
    ]),
  );
}

const stages: Stage[] = [
  {
    title: 'One monolith serves every area',
    description:
      'Every area ships in one build and one deploy. Any change waits for the next release train, which is the pain that justifies moving. Do not start by rewriting anything.',
    owners: owners([]),
    shell: false,
    routes: '',
    bus: false,
    teams: 0,
  },
  {
    title: 'Put a shell in front',
    description:
      'A thin host takes over routing and forwards every path to the monolith. Users see no change. You now have the seam: any route can be pointed somewhere else without touching the old code.',
    owners: owners([]),
    shell: true,
    routes: '/* to monolith',
    bus: false,
    teams: 0,
  },
  {
    title: 'Define the contract before moving code',
    description:
      'The monolith starts publishing and listening to the typed events the slots will use, such as cart:add and promo:applied. Old and new code can then talk without sharing state, so each area can move on its own.',
    owners: owners([]),
    shell: true,
    routes: '/* to monolith',
    bus: true,
    teams: 0,
  },
  {
    title: 'Carve out a leaf first',
    description:
      'Promotion goes first because it is a leaf: little state, few callers, easy to compare with the old one. The shell serves it from a slot and everything else from the monolith. Rollback is one route pointing back.',
    owners: owners(['promo']),
    shell: true,
    routes: '/promo to slot, /* to monolith',
    bus: true,
    teams: 1,
  },
  {
    title: 'Move the core behind the contract',
    description:
      'Catalogue, Cart and Recommendations follow, each team shipping from its own pipeline. Because they already speak events, the remaining monolith code still works beside them. Each move can be reverted by changing its route, so the migration never has a point of no return.',
    owners: owners(['promo', 'catalog', 'cart', 'recs']),
    shell: true,
    routes: '/promo, /catalog, /cart to slots',
    bus: true,
    teams: 4,
  },
  {
    title: 'Move the rest while the benefit lasts',
    description:
      'Reviews and Account move once their owners are ready. The monolith now holds one area, so its deploys are rare and small. Watch the budgets and the dropped-event count as you go.',
    owners: owners(['promo', 'catalog', 'cart', 'recs', 'reviews', 'account']),
    shell: true,
    routes: '/* to slots, /stores to monolith',
    bus: true,
    teams: 6,
  },
  {
    title: 'Retire the monolith, or contain what is left',
    description:
      'The Store locator stays as a legacy page in an iframe. Rewriting it has no user benefit, and the contract still reaches it through postMessage. Retire the monolith when nothing routes to it. Keeping a contained leftover is a fine place to stop.',
    owners: owners(['promo', 'catalog', 'cart', 'recs', 'reviews', 'account'], ['locator']),
    shell: true,
    routes: '/* to slots, /stores to iframe',
    bus: true,
    teams: 6,
  },
];

function Page({ stage }: { stage: Stage }) {
  const migrated = areas.filter((area) => stage.owners[area.id] !== 'legacy').length;

  return (
    <div className="grid gap-3" data-stage-migrated={migrated}>
      <div
        className={cn(
          'rounded-lg border border-dashed px-3 py-2 font-mono text-[0.78rem]',
          stage.shell ? 'border-accent text-fg' : 'border-line text-faint',
        )}
      >
        {stage.shell ? `Shell: ${stage.routes}` : 'No shell yet'}
      </div>
      <ul aria-label="Page areas" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {areas.map((area) => {
          const owner = stage.owners[area.id] ?? 'legacy';
          const legacy = owner === 'legacy';
          return (
            <li
              key={area.id}
              data-area={area.id}
              data-owner={owner}
              style={{ '--fc': legacy ? 'var(--faint)' : `var(--${owner})` } as CSSProperties}
              className={cn(
                'grid min-h-16 content-between gap-1 rounded-lg border p-2 text-[0.82rem] motion-safe:transition-colors',
                legacy
                  ? 'border-line bg-surface-2 text-muted'
                  : 'border-(--fc) bg-[color-mix(in_oklab,var(--fc)_16%,var(--surface))] text-fg',
              )}
            >
              <span className="break-words font-medium">{area.title}</span>
              <span className="font-mono text-[0.7rem] text-muted">{ownerLabel[owner]}</span>
            </li>
          );
        })}
      </ul>
      <div
        className={cn(
          'rounded-lg border px-3 py-1.5 font-mono text-[0.74rem] uppercase tracking-[0.08em]',
          stage.bus ? 'border-accent text-fg' : 'border-line text-faint',
        )}
      >
        {stage.bus ? 'Event bus: typed contract in use' : 'No contract yet'}
      </div>
      <Meter label="Areas migrated" value={migrated} max={areas.length} />
      <p className="text-[0.84rem] text-muted">
        Teams shipping on their own: <b className="font-mono">{stage.teams}</b>
      </p>
    </div>
  );
}

const steps: StepperStep[] = stages.map((stage) => ({
  title: stage.title,
  description: stage.description,
  content: <Page stage={stage} />,
}));

export function StranglerFigLab() {
  return <Stepper steps={steps} autoplayMs={3200} />;
}
