import { Link } from 'react-router';
import { useProgress } from '../app/progress';
import { padNumber, trackStyle } from '../app/trackStyle';
import { curriculum, tracks } from '../content/curriculum';
import { isBuilt } from '../content/registry';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="grid">
      <dd className="order-1 font-display text-3xl font-semibold tabular-nums">{value}</dd>
      <dt className="order-2 text-sm text-muted">{label}</dt>
    </div>
  );
}

export function HomePage() {
  const completedCount = useProgress((state) => Object.keys(state.completed).length);

  return (
    <div className="mx-auto w-full max-w-[72rem] px-4 py-10 sm:px-8 sm:py-14">
      <title>React Field Guide</title>
      <header className="grid gap-4">
        <p className="eyebrow">Learn frontend by watching it happen</p>
        <h1 className="text-[clamp(2.2rem,5vw,3.4rem)]">React Field Guide</h1>
        <p className="lede">
          A React app that teaches frontend through React. Every concept is something you watch
          happen in a live lab, and every module ends with what to say, ask and watch for in a
          meeting.
        </p>
        <dl className="mt-2 flex flex-wrap gap-x-9 gap-y-3">
          <Stat value={curriculum.length} label="modules" />
          <Stat value={tracks.length} label="tracks" />
          <Stat value={completedCount} label="completed" />
        </dl>
      </header>

      <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        {tracks.map((track) => {
          const modules = curriculum.filter((module) => module.track === track.id);
          const headingId = `home-${track.id}`;
          return (
            <section key={track.id} aria-labelledby={headingId} style={trackStyle(track.id)}>
              <div className="mb-3 grid gap-1 border-b-2 border-(--tc) pb-2.5">
                <h2 id={headingId} className="text-[1.15rem]">
                  {track.title}
                </h2>
                <p className="text-sm text-muted">{track.blurb}</p>
              </div>
              <ul className="grid gap-1.5">
                {modules.map((module) => (
                  <li key={module.slug}>
                    <Link
                      to={`/modules/${module.slug}`}
                      data-planned={!isBuilt(module.slug)}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 text-[0.88rem] leading-snug hover:border-(--tc) data-[planned=true]:text-faint"
                    >
                      <span className="font-mono text-[0.72rem] tabular-nums text-muted">
                        {padNumber(module.number)}
                      </span>
                      <span>{module.title}</span>
                      <span className="font-mono text-[0.68rem] uppercase tracking-wider text-muted">
                        {isBuilt(module.slug) ? `${module.minutes} min` : `Phase ${module.phase}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
