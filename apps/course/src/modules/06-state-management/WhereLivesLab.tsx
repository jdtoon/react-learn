import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Meter } from '../../kit';
import { cn } from '../../kit/cn';

type Home = 'ui' | 'form' | 'url' | 'server' | 'shared';

interface Item {
  id: string;
  label: string;
  home: Home;
  why: string;
  hint: string;
}

const homes: { id: Home; label: string }[] = [
  { id: 'ui', label: 'UI state' },
  { id: 'form', label: 'Form state' },
  { id: 'url', label: 'URL' },
  { id: 'server', label: 'Server cache' },
  { id: 'shared', label: 'Shared client' },
];

const items: Item[] = [
  {
    id: 'products',
    label: 'Product list from /api/products',
    home: 'server',
    why: 'The server owns it and other people change it. A query cache gives you staleness, deduplication and invalidation.',
    hint: 'Who owns this data, and can someone else change it while you look at it?',
  },
  {
    id: 'me',
    label: 'Signed-in user from /api/me',
    home: 'server',
    why: 'Still server-owned, only read often. One cache entry serves every component that needs it.',
    hint: 'It comes from an endpoint. Does the browser own it?',
  },
  {
    id: 'unread',
    label: 'Unread notification count from the API',
    home: 'server',
    why: 'A cached server value that goes stale. Refetch on an interval or on focus instead of pushing it into a store.',
    hint: 'It is only a number, but who is the source of truth?',
  },
  {
    id: 'search',
    label: 'Search text and sort order of the product list',
    home: 'url',
    why: 'It describes what the user is looking at, so it should survive a reload and travel in a shared link.',
    hint: 'Should a colleague who opens your link see the same list?',
  },
  {
    id: 'drawer',
    label: 'Whether the filter drawer is open',
    home: 'ui',
    why: 'One component cares. Keep it in useState where it is used.',
    hint: 'How many components read it?',
  },
  {
    id: 'checkout',
    label: 'Checkout form draft: address and card',
    home: 'form',
    why: 'It is a draft until submitted. Keep it in the form and send it to the server once.',
    hint: 'What happens to it when the user submits or cancels?',
  },
  {
    id: 'selection',
    label: 'Selected rows read by a table and its toolbar',
    home: 'ui',
    why: 'Two siblings share it, so lift it to their nearest common parent. No store needed.',
    hint: 'Is the tree between the two readers actually deep?',
  },
  {
    id: 'theme',
    label: 'Light or dark theme',
    home: 'shared',
    why: 'Client-owned, read all over the tree and rarely changed. Context or a small store fits.',
    hint: 'No server owns it and it is read all over the tree. Is it part of a link?',
  },
];

function isLeft(item: Item, choice: Home | undefined): boolean {
  return choice === undefined || choice !== item.home || item.home === 'shared';
}

export function WhereLivesLab() {
  const [choices, setChoices] = useState<Partial<Record<string, Home>>>({});
  const left = items.filter((item) => isLeft(item, choices[item.id])).length;
  const correct = items.filter((item) => choices[item.id] === item.home).length;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <Meter
          label="Left in the global store"
          value={left}
          max={items.length}
          thresholds={{ warn: 4, bad: 7 }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" className="text-[0.88rem] text-muted">
            {`Placed correctly: ${correct} of ${items.length}`}
          </p>
          <button type="button" className="kit-btn" onClick={() => setChoices({})}>
            Reset
          </button>
        </div>
      </div>

      <ul aria-label="State items" className="grid gap-2">
        {items.map((item) => {
          const choice = choices[item.id];
          const right = choice === item.home;
          return (
            <li key={item.id} className="grid gap-2 rounded-lg border border-line bg-surface p-3">
              <p className="text-[0.92rem] font-medium">{item.label}</p>
              <div
                role="group"
                aria-label={`Home for ${item.label}`}
                className="kit-seg justify-self-start"
              >
                {homes.map((home) => (
                  <button
                    key={home.id}
                    type="button"
                    aria-pressed={choice === home.id}
                    onClick={() => setChoices({ ...choices, [item.id]: home.id })}
                  >
                    {home.label}
                  </button>
                ))}
              </div>
              {choice !== undefined && (
                <p
                  className={cn(
                    'flex items-start gap-1.5 text-[0.82rem]',
                    right ? 'tone-ok' : 'tone-bad',
                  )}
                >
                  {right ? (
                    <Check aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
                  ) : (
                    <X aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
                  )}
                  <span>{`${right ? 'Right.' : 'Not quite.'} ${right ? item.why : item.hint}`}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
