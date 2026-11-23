export type Conflicts = 'rare' | 'monthly' | 'weekly' | 'constant';
export type Boundaries = 'fuzzy' | 'mostly' | 'stable';
export type Stack = 'one' | 'legacy' | 'several';
export type Budget = 'tight' | 'moderate' | 'generous';
export type Platform = 'none' | 'part' | 'team';

export interface Inputs {
  teams: number;
  conflicts: Conflicts;
  boundaries: Boundaries;
  stack: Stack;
  budget: Budget;
  platform: Platform;
}

export type Verdict = 'single' | 'monolith' | 'pilot' | 'mfe';

export interface Factor {
  id: string;
  label: string;
  answer: string;
  weight: number;
  points: number;
  side: 'pressure' | 'capacity';
}

export interface Risk {
  title: string;
  text: string;
}

export interface Assessment {
  pressure: number;
  capacity: number;
  verdict: Verdict;
  title: string;
  reason: string;
  factors: Factor[];
  risks: Risk[];
}

export interface Option<T extends string> {
  value: T;
  label: string;
  level: number;
}

export const conflictOptions: Option<Conflicts>[] = [
  { value: 'rare', label: 'Rarely', level: 0 },
  { value: 'monthly', label: 'Monthly', level: 1 / 3 },
  { value: 'weekly', label: 'Weekly', level: 2 / 3 },
  { value: 'constant', label: 'Constantly', level: 1 },
];

export const boundaryOptions: Option<Boundaries>[] = [
  { value: 'fuzzy', label: 'Fuzzy', level: 0 },
  { value: 'mostly', label: 'Mostly clear', level: 0.5 },
  { value: 'stable', label: 'Stable for a year', level: 1 },
];

export const stackOptions: Option<Stack>[] = [
  { value: 'one', label: 'One framework', level: 0 },
  { value: 'legacy', label: 'Legacy to migrate', level: 1 },
  { value: 'several', label: 'Several by choice', level: 0.5 },
];

export const budgetOptions: Option<Budget>[] = [
  { value: 'tight', label: 'Tight', level: 0 },
  { value: 'moderate', label: 'Moderate', level: 0.5 },
  { value: 'generous', label: 'Generous', level: 1 },
];

export const platformOptions: Option<Platform>[] = [
  { value: 'none', label: 'None', level: 0 },
  { value: 'part', label: 'Part-time', level: 0.5 },
  { value: 'team', label: 'Dedicated team', level: 1 },
];

export const minTeams = 1;
export const maxTeams = 12;

const weights = {
  teams: 35,
  conflicts: 45,
  stack: 20,
  boundaries: 30,
  platform: 45,
  budget: 25,
  runtimes: 10,
};

export const verdictTitles: Record<Verdict, string> = {
  single: 'Stay one app, keep clean modules',
  monolith: 'Modular monolith first',
  pilot: 'Modular monolith, pilot one slice',
  mfe: 'Micro frontends, sliced vertically',
};

function levelOf<T extends string>(options: Option<T>[], value: T): Option<T> {
  const found = options.find((option) => option.value === value);
  if (!found) throw new Error(`Unknown option ${value}`);
  return found;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function pickVerdict(
  pressure: number,
  capacity: number,
  inputs: Inputs,
): { verdict: Verdict; reason: string } {
  if (pressure < 25) {
    return {
      verdict: 'single',
      reason:
        'Nothing pushes you to split yet. Runtime integration would cost a lot and buy almost nothing.',
    };
  }
  if (inputs.boundaries === 'fuzzy') {
    return {
      verdict: 'monolith',
      reason:
        'The seams are not clear. A boundary in the wrong place is costly once it is a deployment boundary, so draw it inside one codebase first.',
    };
  }
  if (capacity < 45) {
    return {
      verdict: 'monolith',
      reason:
        'There is pressure but not the capacity to carry the cost. Build module boundaries, a platform owner and a performance budget inside one deployable first.',
    };
  }
  if (pressure >= 60 && capacity >= 60) {
    return {
      verdict: 'mfe',
      reason:
        'Teams are blocked, the seams are stable and there is capacity to run the platform. Split by capability and fund the shell, tokens and shared dependency policy.',
    };
  }
  return {
    verdict: 'pilot',
    reason:
      'Pressure and capacity justify an experiment, not a migration. Split the most independent vertical slice, measure its cost against the budget, and expand only if it pays.',
  };
}

function pickRisks(inputs: Inputs, verdict: Verdict): Risk[] {
  const risks: Risk[] = [];
  const painful = inputs.conflicts === 'weekly' || inputs.conflicts === 'constant';

  if (inputs.teams <= 2) {
    risks.push({
      title: 'Premature split',
      text: 'With one or two teams there is little coordination to remove, so you would pay the full integration cost for almost no gain.',
    });
  }
  if (inputs.conflicts === 'rare' && inputs.teams >= 5) {
    risks.push({
      title: 'The pain may not be deploys',
      text: 'Many teams that rarely wait on each other are not blocked by releases. Check whether the real friction is review, flaky tests or unclear ownership.',
    });
  }
  if (painful && (verdict === 'single' || verdict === 'monolith')) {
    risks.push({
      title: 'Real pain, shared release',
      text: 'The waiting is real. Trunk-based delivery, feature flags and module ownership inside one deployable remove much of it.',
    });
  }
  if (inputs.boundaries === 'fuzzy') {
    risks.push({
      title: 'Wrong seams',
      text: 'Unclear boundaries become expensive deployment boundaries. Expect code to move between teams and releases.',
    });
  }
  if (inputs.platform === 'none') {
    risks.push({
      title: 'No platform owner',
      text: 'Nobody owns the shell, shared dependencies, design tokens or observability, so slices drift and failures go untraced.',
    });
  }
  if (inputs.platform === 'part') {
    risks.push({
      title: 'Platform on the side',
      text: 'A part-time platform copes with one or two slices. The paved road and the dependency policy slip as slices multiply.',
    });
  }
  if (inputs.boundaries === 'mostly') {
    risks.push({
      title: 'Seams still moving',
      text: 'While seams move, each change crosses two teams and two pipelines. Watch where changes land before you commit.',
    });
  }
  if (inputs.budget === 'tight') {
    risks.push({
      title: 'Performance budget',
      text: 'Each remote adds requests, JavaScript and a possible load waterfall. A tight budget needs server-rendered slots and a measured cost per slice.',
    });
  }
  if (inputs.budget === 'moderate') {
    risks.push({
      title: 'Performance budget',
      text: 'Every slice spends from the budget. Measure it per slice and enforce it in CI.',
    });
  }
  if (inputs.stack === 'several') {
    risks.push({
      title: 'Several runtimes',
      text: 'Each extra framework ships its own runtime and accessibility conventions, and splits hiring and code review.',
    });
  }
  if (inputs.stack === 'legacy') {
    risks.push({
      title: 'Two worlds',
      text: 'Wrapping legacy code means running both. Plan the migration path and an end date, or the old app never leaves.',
    });
  }
  if (verdict === 'pilot' || verdict === 'mfe') {
    risks.push({
      title: 'Distributed monolith',
      text: 'If two slices always release together, they are one slice. Track how often that happens and merge them when it is constant.',
    });
  }
  return risks.slice(0, 5);
}

export function assess(inputs: Inputs): Assessment {
  const conflicts = levelOf(conflictOptions, inputs.conflicts);
  const boundaries = levelOf(boundaryOptions, inputs.boundaries);
  const stack = levelOf(stackOptions, inputs.stack);
  const budget = levelOf(budgetOptions, inputs.budget);
  const platform = levelOf(platformOptions, inputs.platform);

  const teamsLevel = clamp((inputs.teams - 1) / 7, 0, 1);
  const waitingNeedsTeams = clamp((inputs.teams - 1) / 2, 0, 1);

  const factors: Factor[] = [
    {
      id: 'teams',
      label: 'Teams',
      answer: String(inputs.teams),
      weight: weights.teams,
      points: weights.teams * teamsLevel,
      side: 'pressure',
    },
    {
      id: 'conflicts',
      label: 'Release conflicts',
      answer: conflicts.label,
      weight: weights.conflicts,
      points: weights.conflicts * conflicts.level * waitingNeedsTeams,
      side: 'pressure',
    },
    {
      id: 'stack',
      label: 'Legacy or mixed stack',
      answer: stack.label,
      weight: weights.stack,
      points: weights.stack * stack.level,
      side: 'pressure',
    },
    {
      id: 'boundaries',
      label: 'Domain boundaries',
      answer: boundaries.label,
      weight: weights.boundaries,
      points: weights.boundaries * boundaries.level,
      side: 'capacity',
    },
    {
      id: 'platform',
      label: 'Platform capacity',
      answer: platform.label,
      weight: weights.platform,
      points: weights.platform * platform.level,
      side: 'capacity',
    },
    {
      id: 'budget',
      label: 'Performance budget',
      answer: budget.label,
      weight: weights.budget,
      points: weights.budget * budget.level,
      side: 'capacity',
    },
  ];
  if (inputs.stack === 'several') {
    factors.push({
      id: 'runtimes',
      label: 'Extra runtimes',
      answer: stack.label,
      weight: weights.runtimes,
      points: -weights.runtimes,
      side: 'capacity',
    });
  }

  const sum = (side: Factor['side']) =>
    factors.filter((factor) => factor.side === side).reduce((total, f) => total + f.points, 0);
  const pressure = Math.round(clamp(sum('pressure'), 0, 100));
  const capacity = Math.round(clamp(sum('capacity'), 0, 100));
  const { verdict, reason } = pickVerdict(pressure, capacity, inputs);

  return {
    pressure,
    capacity,
    verdict,
    title: verdictTitles[verdict],
    reason,
    factors,
    risks: pickRisks(inputs, verdict),
  };
}

export interface Preset {
  id: string;
  label: string;
  inputs: Inputs;
}

export const defaultInputs: Inputs = {
  teams: 6,
  conflicts: 'weekly',
  boundaries: 'mostly',
  stack: 'one',
  budget: 'moderate',
  platform: 'part',
};

export const presets: Preset[] = [
  {
    id: 'startup',
    label: 'Startup, one team',
    inputs: {
      teams: 1,
      conflicts: 'rare',
      boundaries: 'mostly',
      stack: 'one',
      budget: 'tight',
      platform: 'none',
    },
  },
  {
    id: 'scaleup',
    label: 'Scale-up, six teams',
    inputs: defaultInputs,
  },
  {
    id: 'enterprise',
    label: 'Enterprise portal',
    inputs: {
      teams: 10,
      conflicts: 'constant',
      boundaries: 'stable',
      stack: 'legacy',
      budget: 'moderate',
      platform: 'team',
    },
  },
  {
    id: 'eager',
    label: 'Eager, no platform',
    inputs: {
      teams: 9,
      conflicts: 'constant',
      boundaries: 'fuzzy',
      stack: 'several',
      budget: 'tight',
      platform: 'none',
    },
  },
];

export function sameInputs(a: Inputs, b: Inputs): boolean {
  return (
    a.teams === b.teams &&
    a.conflicts === b.conflicts &&
    a.boundaries === b.boundaries &&
    a.stack === b.stack &&
    a.budget === b.budget &&
    a.platform === b.platform
  );
}
