import { X } from 'lucide-react';
import { ViewTransition, startTransition, useState, type CSSProperties } from 'react';
import { Callout, CodePeek, createRng } from '../../kit';

type UpdateMode = 'transition' | 'sync';

interface Card {
  id: number;
  title: string;
  hue: number;
}

const names = [
  'Aurora',
  'Basalt',
  'Cobalt',
  'Dune',
  'Ember',
  'Fjord',
  'Glacier',
  'Harbour',
  'Indigo',
  'Juniper',
  'Kelp',
  'Lagoon',
];

const maxCards = 12;

function cardAt(id: number): Card {
  return { id, title: names[id % names.length] ?? `Card ${id}`, hue: (id * 47) % 360 };
}

const initialCards: Card[] = [0, 1, 2, 3, 4, 5].map(cardAt);

const code = `<ul>
  {cards.map((card) => (
    <ViewTransition key={card.id}>
      <li>{card.title}</li>
    </ViewTransition>
  ))}
</ul>

function shuffle() {
  startTransition(() => setCards(shuffled(cards)));
}`;

function slowStyles(slow: boolean): string {
  const reduce =
    '@media (prefers-reduced-motion: reduce) { ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; } }';
  const slowRule = slow
    ? '::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation-duration: 1500ms; }'
    : '';
  return `${slowRule} ${reduce}`;
}

export function ViewTransitionLab() {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [nextId, setNextId] = useState(initialCards.length);
  const [shuffles, setShuffles] = useState(0);
  const [mode, setMode] = useState<UpdateMode>('transition');
  const [enabled, setEnabled] = useState(true);
  const [slow, setSlow] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [supported] = useState(
    () => typeof document !== 'undefined' && 'startViewTransition' in document,
  );

  function apply(update: () => void) {
    if (mode === 'transition') startTransition(update);
    else update();
  }

  function record(text: string) {
    setLog((current) => [text, ...current].slice(0, 6));
  }

  function shuffle() {
    const random = createRng(shuffles + 11);
    const order = [...cards];
    for (let index = order.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1));
      const a = order[index];
      const b = order[other];
      if (a && b) {
        order[index] = b;
        order[other] = a;
      }
    }
    setShuffles((count) => count + 1);
    apply(() => setCards(order));
  }

  function sort() {
    apply(() => setCards((current) => [...current].sort((a, b) => a.title.localeCompare(b.title))));
  }

  function add() {
    if (cards.length >= maxCards) return;
    const card = cardAt(nextId);
    setNextId((id) => id + 1);
    apply(() => setCards((current) => [card, ...current]));
  }

  function remove(id: number) {
    apply(() => setCards((current) => current.filter((card) => card.id !== id)));
  }

  function reset() {
    setCards(initialCards);
    setNextId(initialCards.length);
    setLog([]);
  }

  return (
    <div className="grid gap-4">
      <style>{slowStyles(slow)}</style>

      {!supported && (
        <Callout tone="warn" title="No View Transitions API in this browser">
          The cards still update, with no animation. That is the intended fallback.
        </Callout>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Update mode" className="kit-seg">
          <button
            type="button"
            aria-pressed={mode === 'transition'}
            onClick={() => setMode('transition')}
          >
            startTransition
          </button>
          <button type="button" aria-pressed={mode === 'sync'} onClick={() => setMode('sync')}>
            Plain setState
          </button>
        </div>
        <label className="flex items-center gap-2 text-[0.86rem]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          ViewTransition
        </label>
        <label className="flex items-center gap-2 text-[0.86rem]">
          <input
            type="checkbox"
            checked={slow}
            onChange={(event) => setSlow(event.target.checked)}
          />
          Slow motion
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="kit-btn" onClick={shuffle}>
          Shuffle
        </button>
        <button type="button" className="kit-btn" onClick={sort}>
          Sort A to Z
        </button>
        <button
          type="button"
          className="kit-btn"
          aria-disabled={cards.length >= maxCards ? true : undefined}
          onClick={add}
        >
          Add card
        </button>
        <button type="button" className="kit-btn" onClick={reset}>
          Reset
        </button>
      </div>

      <ul
        aria-label="Cards"
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(8.5rem, 1fr))' }}
      >
        {cards.map((card) => (
          <ViewTransition
            key={card.id}
            default={enabled ? 'auto' : 'none'}
            onEnter={() => record(`enter ${card.title}`)}
            onExit={() => record(`exit ${card.title}`)}
            onUpdate={() => record(`update ${card.title}`)}
          >
            <li
              style={{ '--hue': card.hue } as CSSProperties}
              className="flex h-16 items-center justify-between gap-2 rounded-lg border border-line border-l-4 border-l-[oklch(0.65_0.14_var(--hue))] bg-surface px-3"
            >
              <span className="truncate font-display text-[0.92rem] font-semibold">
                {card.title}
              </span>
              <button
                type="button"
                aria-label={`Remove ${card.title}`}
                onClick={() => remove(card.id)}
                className="grid size-7 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
              >
                <X aria-hidden="true" size={15} />
              </button>
            </li>
          </ViewTransition>
        ))}
      </ul>

      <div className="grid gap-1.5">
        <p className="eyebrow">ViewTransition events</p>
        {log.length === 0 ? (
          <p className="text-[0.84rem] text-muted">
            Nothing yet. Shuffle the cards with startTransition selected.
          </p>
        ) : (
          <ol aria-label="ViewTransition events" className="grid gap-0.5 font-mono text-[0.78rem]">
            {log.map((entry, index) => (
              <li key={`${entry}-${index}`} className="text-muted">
                {entry}
              </li>
            ))}
          </ol>
        )}
      </div>

      <CodePeek code={code} title="The wrapper and the update" />
    </div>
  );
}
