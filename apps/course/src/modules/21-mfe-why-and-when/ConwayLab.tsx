import { Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Meter } from '../../kit';
import {
  couponFeature,
  features,
  horizonDays,
  layerList,
  orgLabels,
  orgSummaries,
  orgTeams,
  ownerOf,
  queueDays,
  sameCell,
  schedule,
  sliceList,
  teamIndex,
  workDays,
  type Cell,
  type Feature,
  type Org,
  type Schedule,
} from './conway';

const orgs: Org[] = ['layers', 'slices'];
const tickDays = 0.5;
const tickMs = 160;

const teamColours = [
  'var(--track-foundations)',
  'var(--track-architecture)',
  'var(--track-performance)',
];

const queueStripes = 'repeating-linear-gradient(135deg, var(--line) 0 4px, transparent 4px 8px)';

function colourOf(org: Org, teamId: string): string {
  return teamColours[teamIndex(org, teamId)] ?? teamColours[0] ?? 'var(--accent)';
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type CellState = 'idle' | 'waiting' | 'working' | 'done';

function Ownership({ org, plan, seen }: { org: Org; plan: Schedule; seen: number }) {
  return (
    <table
      aria-label="Who owns each part of the product"
      className="w-full table-fixed border-separate border-spacing-1"
    >
      <thead>
        <tr>
          <td className="w-11" />
          {sliceList.map((slice) => (
            <th
              key={slice.id}
              scope="col"
              className="pb-0.5 text-center font-mono text-[0.68rem] font-medium text-muted"
            >
              {slice.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {layerList.map((layer) => (
          <tr key={layer.id}>
            <th
              scope="row"
              className="pr-1 text-right font-mono text-[0.68rem] font-medium text-muted"
            >
              {layer.label}
            </th>
            {sliceList.map((slice) => {
              const cell: Cell = { slice: slice.id, layer: layer.id };
              const owner = ownerOf(org, cell);
              const team = orgTeams[org].find((entry) => entry.id === owner);
              const index = plan.steps.findIndex((step) => sameCell(step.cell, cell));
              const step = plan.steps[index];
              let state: CellState = 'idle';
              if (step) {
                if (seen >= step.end) state = 'done';
                else if (seen > step.start) state = 'working';
                else state = 'waiting';
              }
              const colour = colourOf(org, owner);
              return (
                <td
                  key={slice.id}
                  data-state={state}
                  data-owner={owner}
                  className="relative h-12 rounded-md border px-0.5 text-center align-middle font-mono text-[0.66rem] leading-tight transition-colors duration-500 motion-reduce:transition-none"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${colour} ${state === 'idle' ? 10 : state === 'waiting' ? 18 : 42}%, transparent)`,
                    borderColor:
                      state === 'idle'
                        ? 'var(--line)'
                        : `color-mix(in oklab, ${colour} 80%, var(--fg))`,
                    borderStyle: state === 'waiting' ? 'dashed' : 'solid',
                  }}
                >
                  {step && (
                    <span className="absolute -top-1.5 -left-1.5 grid size-4 place-items-center rounded-full bg-fg font-mono text-[0.6rem] text-bg">
                      {index + 1}
                    </span>
                  )}
                  <span className={state === 'idle' ? 'text-muted' : ''}>{team?.label}</span>
                  {step && (
                    <span className="sr-only">{`, step ${index + 1} of ${plan.steps.length}, ${state}`}</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Lanes({ org, plan, seen }: { org: Org; plan: Schedule; seen: number }) {
  const clipped = (start: number, end: number) => Math.max(0, Math.min(end, seen) - start);
  const percent = (days: number) => `${(days / horizonDays) * 100}%`;

  return (
    <div className="grid gap-1.5">
      {orgTeams[org].map((team) => {
        const colour = colourOf(org, team.id);
        return (
          <div key={team.id} className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-2">
            <span className="text-[0.74rem] leading-tight text-muted">{team.label}</span>
            <div data-lane={team.id} className="relative h-6 overflow-hidden rounded bg-surface-2">
              {plan.waits
                .filter((wait) => wait.team === team.id)
                .map((wait) => (
                  <span
                    key={`wait-${wait.start}`}
                    data-segment="wait"
                    title={`Waits in the ${team.label} queue`}
                    className="absolute inset-y-0"
                    style={{
                      left: percent(wait.start),
                      width: percent(clipped(wait.start, wait.end)),
                      backgroundImage: queueStripes,
                    }}
                  />
                ))}
              {plan.steps
                .filter((step) => step.team === team.id)
                .map((step) => (
                  <span
                    key={`work-${step.start}`}
                    data-segment="work"
                    title={`${team.label} works`}
                    className="absolute inset-y-0.5 rounded-sm"
                    style={{
                      left: percent(step.start),
                      width: percent(clipped(step.start, step.end)),
                      backgroundColor: colour,
                    }}
                  />
                ))}
            </div>
          </div>
        );
      })}
      <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2" aria-hidden="true">
        <span />
        <div className="flex justify-between font-mono text-[0.68rem] text-muted tabular-nums">
          <span>day 0</span>
          <span>{`day ${horizonDays}`}</span>
        </div>
      </div>
    </div>
  );
}

export function ConwayLab() {
  const [org, setOrg] = useState<Org>('layers');
  const [feature, setFeature] = useState<Feature>(couponFeature);
  const [clock, setClock] = useState<number | null>(null);

  const plan = schedule(org, feature);
  const seen = clock ?? plan.total;

  useEffect(() => {
    if (clock === null) return;
    const timer = setTimeout(() => {
      setClock(clock + tickDays >= plan.total ? null : clock + tickDays);
    }, tickMs);
    return () => clearTimeout(timer);
  }, [clock, plan.total]);

  function chooseOrg(next: Org) {
    setClock(null);
    setOrg(next);
  }

  function chooseFeature(next: Feature) {
    setClock(null);
    setFeature(next);
  }

  function replay() {
    setClock(prefersReducedMotion() ? null : 0);
  }

  const teamNames = plan.teams
    .map((id) => orgTeams[org].find((team) => team.id === id)?.label)
    .filter((label): label is string => label !== undefined);

  return (
    <div className="@container grid gap-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div role="group" aria-label="How the organisation is split" className="grid gap-1.5">
          <p className="eyebrow">Organisation</p>
          <div className="kit-seg">
            {orgs.map((entry) => (
              <button
                key={entry}
                type="button"
                aria-pressed={entry === org}
                onClick={() => chooseOrg(entry)}
              >
                {orgLabels[entry]}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Feature request" className="grid gap-1.5">
          <p className="eyebrow">Feature request</p>
          <div className="kit-seg">
            {features.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === feature.id}
                onClick={() => chooseFeature(entry)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[0.9rem] leading-relaxed text-muted" aria-live="polite">
        {feature.description}
      </p>

      <div className="grid items-start gap-5 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-3">
          <Ownership org={org} plan={plan} seen={seen} />
          <p className="text-[0.82rem] leading-relaxed text-muted">{orgSummaries[org]}</p>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">Who works when</p>
            <button type="button" className="kit-btn" onClick={replay}>
              <Play aria-hidden="true" size={14} />
              Replay
            </button>
          </div>
          <Lanes org={org} plan={plan} seen={seen} />
          <div className="grid gap-3" role="status" aria-live="polite">
            <Meter
              label="Teams involved"
              value={plan.teams.length}
              max={3}
              thresholds={{ warn: 2, bad: 3 }}
            />
            <Meter
              label="Elapsed, model days"
              value={plan.total}
              max={horizonDays}
              unit="days"
              thresholds={{ warn: 7, bad: 10 }}
            />
            <p className="text-[0.82rem] leading-relaxed text-muted">
              {`${teamNames.join(', ')}. ${plan.handoffs} ${plan.handoffs === 1 ? 'handoff' : 'handoffs'}, each waiting ${queueDays} days in the next team's queue. Work takes ${workDays} days per box. These are model numbers, not measurements.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
