import { ArrowRight, Check, ClipboardList } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { useProgress } from '../app/progress';
import { padNumber, trackStyle } from '../app/trackStyle';
import { curriculum, tracks } from '../content/curriculum';
import { isBuilt } from '../content/registry';
import type { ModuleMeta } from '../content/types';

type NodeState = 'planned' | 'built' | 'complete';

const stateSuffix: Record<NodeState, string> = {
  planned: ', planned',
  built: ', built',
  complete: ', completed',
};

function nodeState(slug: string, completed: Record<string, true>): NodeState {
  if (completed[slug]) return 'complete';
  return isBuilt(slug) ? 'built' : 'planned';
}

function nodeMeta(module: ModuleMeta, state: NodeState): string {
  return state === 'planned' ? `Phase ${module.phase}` : `${module.minutes} min`;
}

function ProgressCard({
  completedCount,
  builtCount,
  states,
}: {
  completedCount: number;
  builtCount: number;
  states: Record<string, NodeState>;
}) {
  const total = curriculum.length;

  return (
    <div className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
      <p className="eyebrow">Your progress</p>
      <p className="flex items-baseline gap-2">
        <span className="font-display text-[2.6rem] font-semibold leading-none tabular-nums">
          {completedCount}
        </span>
        <span className="text-muted">{`of ${total} modules completed`}</span>
      </p>
      <div
        role="progressbar"
        aria-label="Course progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completedCount}
        aria-valuetext={`${completedCount} of ${total} modules completed`}
        className="progress-strip"
      >
        {tracks.map((track) => {
          const modules = curriculum.filter((module) => module.track === track.id);
          return (
            <div
              key={track.id}
              style={{ ...trackStyle(track.id), '--count': modules.length } as CSSProperties}
              className="strip-group"
            >
              {modules.map((module) => (
                <span
                  key={module.slug}
                  aria-hidden="true"
                  data-state={states[module.slug]}
                  className="strip-seg"
                />
              ))}
            </div>
          );
        })}
      </div>
      <p className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.74rem] text-muted">
        <span>{`${builtCount} built`}</span>
        <span>{`${total - builtCount} planned`}</span>
      </p>
    </div>
  );
}

function Legend() {
  const keys: { state: NodeState; label: string }[] = [
    { state: 'built', label: 'Built' },
    { state: 'planned', label: 'Planned' },
    { state: 'complete', label: 'Completed' },
  ];
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[0.8rem] text-muted">
      {keys.map(({ state, label }) => (
        <li key={state} data-state={state} className="flex items-center gap-2">
          <span aria-hidden="true" className="state-dot key-dot">
            {state === 'complete' && <Check size={9} strokeWidth={3.5} />}
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

export function HomePage() {
  const completed = useProgress((state) => state.completed);
  const states = Object.fromEntries(
    curriculum.map((module) => [module.slug, nodeState(module.slug, completed)]),
  );
  const completedCount = curriculum.filter((module) => completed[module.slug]).length;
  const builtCount = curriculum.filter((module) => isBuilt(module.slug)).length;
  const firstBuilt = curriculum.find((module) => isBuilt(module.slug));
  const mapHeadingId = 'map-heading';

  return (
    <div className="@container mx-auto w-full max-w-[72rem] px-4 py-10 sm:px-8 sm:py-14">
      <title>React Field Guide</title>
      <header className="hero-surface grid gap-8 @3xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] @3xl:items-end">
        <div className="grid content-start gap-4">
          <p className="eyebrow">Learn frontend by watching it happen</p>
          <h1 className="text-[clamp(2.2rem,5vw,3.4rem)]">React Field Guide</h1>
          <p className="lede">
            Learn React and the frontend around it from live labs you can poke at, then walk into
            any meeting knowing what to say, ask and watch for.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              to={firstBuilt ? `/modules/${firstBuilt.slug}` : { hash: '#map' }}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-accent bg-accent px-5 text-sm font-semibold text-accent-fg hover:opacity-90"
            >
              Start here
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link
              to="/meeting"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-sm font-medium hover:border-accent"
            >
              <ClipboardList aria-hidden="true" size={16} />
              Prep for a meeting
            </Link>
          </div>
        </div>
        <ProgressCard completedCount={completedCount} builtCount={builtCount} states={states} />
      </header>

      <section id="map" aria-labelledby={mapHeadingId} className="mt-14 scroll-mt-20 sm:mt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="grid gap-2">
            <p className="eyebrow">The curriculum</p>
            <h2
              id={mapHeadingId}
            >{`${curriculum.length} modules across ${tracks.length} tracks`}</h2>
          </div>
          <Legend />
        </div>

        <div className="grid gap-4">
          {tracks.map((track, laneIndex) => {
            const modules = curriculum.filter((module) => module.track === track.id);
            const builtInLane = modules.filter((module) => isBuilt(module.slug)).length;
            const completedInLane = modules.filter((module) => completed[module.slug]).length;
            const headingId = `lane-${track.id}`;
            return (
              <section
                key={track.id}
                aria-labelledby={headingId}
                style={{ ...trackStyle(track.id), '--lane': laneIndex } as CSSProperties}
                className="lane"
              >
                <div className="grid gap-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="flex items-baseline gap-3">
                      <span className="eyebrow">{`Track ${track.order}`}</span>
                      <h3 id={headingId}>{track.title}</h3>
                    </div>
                    <p className="font-mono text-[0.72rem] text-muted">
                      {`${builtInLane} of ${modules.length} built`}
                      {completedInLane > 0 && <span>{` · ${completedInLane} completed`}</span>}
                    </p>
                  </div>
                  <p className="max-w-[62ch] text-sm text-muted">{track.blurb}</p>
                </div>
                <ol className="lane-nodes" style={{ '--n': modules.length } as CSSProperties}>
                  {modules.map((module) => {
                    const state = states[module.slug] ?? 'planned';
                    const suffix = stateSuffix[state];
                    return (
                      <li key={module.slug} data-state={state} className="lane-node">
                        <Link to={`/modules/${module.slug}`}>
                          <span aria-hidden="true" className="state-dot">
                            {state === 'complete' ? (
                              <Check size={17} strokeWidth={3} />
                            ) : (
                              padNumber(module.number)
                            )}
                          </span>
                          <span className="node-body">
                            <span className="node-title">
                              <span className="sr-only">{padNumber(module.number)}</span>{' '}
                              {module.title}
                            </span>{' '}
                            <span className="node-meta">
                              {nodeMeta(module, state)}
                              <span className="sr-only">{suffix}</span>
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
