import { ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { padNumber, trackStyle } from '../app/trackStyle';
import { listBuiltContent } from '../content/builtContent';
import { tracks } from '../content/curriculum';
import type { ModuleContent, TrackId } from '../content/types';
import {
  MeetingCardView,
  MeetingPartLabel,
  meetingPartInfo,
  meetingPartOrder,
} from '../kit/MeetingCardView';

type Filter = 'all' | TrackId;

function ModuleMeetingCard({ content }: { content: ModuleContent }) {
  const headingId = `card-${content.slug}`;

  return (
    <article
      id={content.slug}
      aria-labelledby={headingId}
      className="grid scroll-mt-20 gap-4 rounded-2xl border border-line border-t-[3px] border-t-(--tc) bg-surface p-4 sm:p-5"
    >
      <header className="grid gap-1.5">
        <p className="eyebrow">{`Module ${padNumber(content.number)} · ${content.minutes} min`}</p>
        <h3 id={headingId}>
          <Link
            to={`/modules/${content.slug}`}
            className="rounded-sm underline decoration-line decoration-2 underline-offset-4 hover:decoration-(--tc)"
          >
            {content.title}
          </Link>
        </h3>
        <p className="max-w-[64ch] text-sm text-muted">{content.oneIdea}</p>
      </header>
      <MeetingCardView card={content.meeting} />
    </article>
  );
}

function EmptyState() {
  return (
    <section
      aria-labelledby="meeting-empty"
      className="mt-10 grid gap-6 rounded-2xl border border-dashed border-line bg-surface p-5 sm:p-8"
    >
      <div className="grid gap-3">
        <span className="grid size-11 place-items-center rounded-xl border border-line bg-surface-2 text-accent">
          <ClipboardList aria-hidden="true" size={22} />
        </span>
        <h2 id="meeting-empty">No meeting cards yet</h2>
        <p className="max-w-[58ch] text-muted">
          Each module ends with a meeting card, and the cards appear here as modules are built.
          Every card has the same four parts.
        </p>
      </div>
      <ul className="grid gap-3 @2xl:grid-cols-2">
        {meetingPartOrder.map((name) => (
          <li key={name} className="grid gap-1.5 rounded-xl border border-line bg-bg p-4">
            <MeetingPartLabel name={name} />
            <p className="text-sm">{meetingPartInfo[name].hint}</p>
          </li>
        ))}
      </ul>
      <div>
        <Link
          to="/#map"
          className="inline-flex h-10 items-center rounded-lg border border-line bg-surface-2 px-4 text-sm font-medium hover:border-accent"
        >
          Browse the curriculum
        </Link>
      </div>
    </section>
  );
}

function FilterChip({
  label,
  count,
  pressed,
  onPress,
  trackId,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onPress: () => void;
  trackId?: TrackId;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPress}
      style={trackId ? trackStyle(trackId) : undefined}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm hover:border-[var(--tc,var(--accent))] aria-pressed:border-[var(--tc,var(--accent))] aria-pressed:bg-surface-2 aria-pressed:shadow-[inset_0_-2px_0_var(--tc,var(--accent))]"
    >
      {trackId && <span aria-hidden="true" className="size-2 rounded-full bg-(--tc)" />}
      {label}
      <span className="font-mono text-[0.7rem] text-muted">{count}</span>
    </button>
  );
}

export function MeetingPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const { hash } = useLocation();
  const built = listBuiltContent();

  useEffect(() => {
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash]);

  const groups = tracks
    .map((track) => ({ track, modules: built.filter((content) => content.track === track.id) }))
    .filter((group) => group.modules.length > 0);
  const visible = filter === 'all' ? groups : groups.filter((group) => group.track.id === filter);

  return (
    <div className="@container mx-auto w-full max-w-[60rem] px-4 py-10 sm:px-8 sm:py-14">
      <title>Meeting mode | React Field Guide</title>
      <header className="grid gap-4">
        <p className="eyebrow">Ten minutes before the meeting</p>
        <h1>Meeting mode</h1>
        <p className="lede">
          What to say, what to ask and what to watch for, one card per module on one scannable page.
          The cards fill in as modules are built.
        </p>
      </header>

      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div role="group" aria-label="Filter by track" className="mt-8 flex flex-wrap gap-2">
            <FilterChip
              label="All tracks"
              count={built.length}
              pressed={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            {groups.map(({ track, modules }) => (
              <FilterChip
                key={track.id}
                label={track.title}
                count={modules.length}
                pressed={filter === track.id}
                onPress={() => setFilter(track.id)}
                trackId={track.id}
              />
            ))}
          </div>
          <div className="mt-8 grid gap-10">
            {visible.map(({ track, modules }) => {
              const headingId = `meeting-${track.id}`;
              return (
                <section key={track.id} aria-labelledby={headingId} style={trackStyle(track.id)}>
                  <div className="mb-4 flex items-baseline justify-between gap-4 border-b-2 border-(--tc) pb-2">
                    <h2 id={headingId} className="text-[1.3rem]">
                      {track.title}
                    </h2>
                    <p className="font-mono text-[0.72rem] text-muted">
                      {modules.length === 1 ? '1 card' : `${modules.length} cards`}
                    </p>
                  </div>
                  <div className="grid gap-4">
                    {modules.map((content) => (
                      <ModuleMeetingCard key={content.slug} content={content} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
