import { getLog, subscribeLog, type BusEntry } from '@react-field-guide/mfe-contracts';
import { useSyncExternalStore } from 'react';

export const busLogSize = 8;

let cache: { lastId: number; entries: BusEntry[] } = { lastId: -1, entries: [] };

function latestEntries(): BusEntry[] {
  const log = getLog();
  const lastId = log.at(-1)?.id ?? 0;
  if (cache.lastId !== lastId) cache = { lastId, entries: log.slice(-busLogSize).reverse() };
  return cache.entries;
}

function subscribe(notify: () => void): () => void {
  return subscribeLog(() => notify());
}

export function BusLogRows({ entries }: { entries: BusEntry[] }) {
  if (entries.length === 0) {
    return <p className="slot-note">No events yet. Add something to the cart.</p>;
  }

  return (
    <ol className="buslog" aria-label="Event bus log">
      {entries.map((entry) => {
        const dropped = entry.delivered === 0;
        return (
          <li key={entry.id} className="buslog-row" data-dropped={dropped ? 'true' : 'false'}>
            <span className="buslog-route">
              {entry.source} → {dropped ? 'nobody' : entry.subscribers.join(', ')}
            </span>{' '}
            <code className="buslog-type">{entry.type}</code>{' '}
            <code className="buslog-payload">{JSON.stringify(entry.payload)}</code>
            {dropped && (
              <>
                {' '}
                <span className="buslog-flag">dropped</span>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function BusLog() {
  const entries = useSyncExternalStore(subscribe, latestEntries, latestEntries);
  return <BusLogRows entries={entries} />;
}
