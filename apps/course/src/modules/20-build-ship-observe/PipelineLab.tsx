import { Check, ChevronRight, Minus, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../kit/cn';
import {
  scenarios,
  sequence,
  stages,
  type Scenario,
  type Stage,
  type StageId,
} from './pipelineData';

type Status = 'idle' | 'passed' | 'failed' | 'skipped';

const statusText: Record<Status, string> = {
  idle: '',
  passed: 'passed',
  failed: 'stops here',
  skipped: 'not reached',
};

function statusOf(id: StageId, scenario: Scenario): Status {
  if (scenario.id === 'none') return 'idle';
  const index = sequence.indexOf(id);
  if (index === -1) return 'idle';
  if (scenario.stopsAt === null) return 'passed';
  const stop = sequence.indexOf(scenario.stopsAt);
  if (index < stop) return 'passed';
  return index === stop ? 'failed' : 'skipped';
}

function StatusMark({ status }: { status: Status }) {
  if (status === 'idle') return null;
  const Icon = status === 'passed' ? Check : status === 'failed' ? X : Minus;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-[0.08em]',
        status === 'passed' && 'tone-ok',
        status === 'failed' && 'tone-bad',
        status === 'skipped' && 'text-faint',
      )}
    >
      <Icon aria-hidden="true" size={12} />
      {statusText[status]}
    </span>
  );
}

function StageCard({
  stage,
  index,
  status,
  selected,
  unseen,
  onSelect,
}: {
  stage: Stage;
  index: number | null;
  status: Status;
  selected: boolean;
  unseen: boolean;
  onSelect: () => void;
}) {
  const absent = stage.id === 'observe';
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-stage={stage.id}
      data-status={status}
      onClick={onSelect}
      className={cn(
        'grid min-w-0 content-start gap-1 rounded-lg border bg-surface p-2.5 text-left',
        absent ? 'border-dashed' : 'border-solid',
        selected ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-accent',
        status === 'skipped' && 'opacity-55',
        status === 'failed' && 'border-bad',
      )}
    >
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-muted">
        {index === null ? 'gap' : `step ${index + 1}`}
      </span>
      <span className="font-display text-[0.9rem] font-semibold">{stage.title}</span>
      <span className="break-words font-mono text-[0.72rem] text-muted">{stage.short}</span>
      {absent && unseen ? (
        <span className="inline-flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-[0.08em] tone-bad">
          <X aria-hidden="true" size={12} />
          nobody told
        </span>
      ) : (
        <StatusMark status={status} />
      )}
    </button>
  );
}

export function PipelineLab() {
  const [selected, setSelected] = useState<StageId>('install');
  const [scenarioId, setScenarioId] = useState<Scenario['id']>('none');

  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
  const stage = stages.find((item) => item.id === selected) ?? stages[0];
  if (!scenario || !stage) return null;

  function chooseScenario(next: Scenario) {
    setScenarioId(next.id);
    const target = next.stopsAt ?? next.focus ?? (next.unseen ? 'observe' : null);
    if (target) setSelected(target);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="eyebrow">What if</p>
        <div role="group" aria-label="Scenario" className="flex flex-wrap gap-2">
          {scenarios.map((item) => (
            <button
              key={item.id}
              type="button"
              className="kit-btn"
              aria-pressed={scenarioId === item.id}
              onClick={() => chooseScenario(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <ol
        aria-label="Pipeline stages"
        className="grid list-none grid-cols-2 gap-x-1 gap-y-2 p-0 sm:grid-cols-3 lg:grid-cols-4"
      >
        {stages.map((item) => {
          const position = sequence.indexOf(item.id);
          return (
            <li key={item.id} className="flex min-w-0 items-stretch gap-1">
              <div className="min-w-0 flex-1">
                <StageCard
                  stage={item}
                  index={position === -1 ? null : position}
                  status={statusOf(item.id, scenario)}
                  selected={selected === item.id}
                  unseen={Boolean(scenario.unseen)}
                  onSelect={() => setSelected(item.id)}
                />
              </div>
              {position !== -1 && position < sequence.length - 1 && (
                <ChevronRight
                  aria-hidden="true"
                  size={16}
                  className="hidden shrink-0 self-center text-faint sm:block"
                />
              )}
            </li>
          );
        })}
      </ol>

      <p
        role="status"
        aria-label="Scenario result"
        className="border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
      >
        {scenario.result}
      </p>

      <section aria-label={`${stage.title} details`} className="kit-stage grid gap-2">
        <h4>{stage.title}</h4>
        <dl className="grid gap-2 text-[0.86rem]">
          {(
            [
              ['Command', stage.command],
              ['Reads', stage.reads],
              ['Produces', stage.produces],
              ['Guards', stage.guards],
              ...(stage.gap ? [['Gap', stage.gap] as const] : []),
            ] as const
          ).map(([term, text]) => (
            <div
              key={term}
              className="grid gap-0.5 border-t border-line pt-2 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-3"
            >
              <dt className="font-mono text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                {term}
              </dt>
              <dd className={cn(term === 'Gap' && 'tone-warn')}>{text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
