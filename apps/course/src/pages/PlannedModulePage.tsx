import { Link } from 'react-router';
import { padNumber, trackStyle } from '../app/trackStyle';
import { trackById } from '../content/curriculum';
import type { ModuleMeta } from '../content/types';

export function PlannedModulePage({ meta }: { meta: ModuleMeta }) {
  const track = trackById[meta.track];

  return (
    <article
      style={trackStyle(meta.track)}
      className="mx-auto grid max-w-[46rem] gap-5 px-4 py-10 sm:px-8 sm:py-14"
    >
      <title>{`${meta.title} | React Field Guide`}</title>
      <p className="eyebrow flex items-center gap-2">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-(--tc)" />
        {`${track.title} · Module ${padNumber(meta.number)}`}
      </p>
      <h1>{meta.title}</h1>
      <p className="max-w-[60ch] text-[1.05rem] leading-relaxed">{meta.oneIdea}</p>
      <div className="mt-3 grid gap-2 rounded-xl border border-line border-t-[3px] border-t-(--tc) bg-surface p-5">
        <p className="font-display text-xl font-semibold">Arrives in phase {meta.phase}</p>
        <p className="text-muted">
          This module is planned and has no content yet. Modules are built in phases, and the
          finished ones are marked in the course navigation.
        </p>
        <div className="mt-2">
          <Link
            to="/"
            className="inline-flex h-9 items-center rounded-lg border border-line bg-surface-2 px-3.5 text-sm font-medium hover:border-accent"
          >
            Back to all modules
          </Link>
        </div>
      </div>
    </article>
  );
}
