import { Check, TriangleAlert } from 'lucide-react';
import { useReducer, useState } from 'react';
import { RenderBox, createRng } from '../../kit';
import { cn } from '../../kit/cn';

interface Person {
  id: string;
  name: string;
}

type Strategy = 'index' | 'id';

interface State {
  strategy: Strategy;
  items: Person[];
  nextPerson: number;
  shuffles: number;
  generation: number;
  message: string;
}

type Action =
  | { type: 'strategy'; strategy: Strategy }
  | { type: 'insert' }
  | { type: 'shuffle' }
  | { type: 'remove' }
  | { type: 'reset' };

const roster: Person[] = [
  'Ada',
  'Grace',
  'Linus',
  'Margaret',
  'Alan',
  'Barbara',
  'Dennis',
  'Edsger',
  'Radia',
  'Donald',
  'Hedy',
  'Ken',
].map((name) => ({ id: name.toLowerCase(), name }));

const startingRows = 3;
const maxRows = 6;
const intro =
  'Type in a row, then use the buttons. The line under each row says where your text went.';

function initialState(strategy: Strategy, message = intro, generation = 0): State {
  return {
    strategy,
    items: roster.slice(0, startingRows),
    nextPerson: startingRows,
    shuffles: 0,
    generation,
    message,
  };
}

function shuffled(items: Person[], seed: number): Person[] {
  if (items.length < 2) return items;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const random = createRng(seed + attempt * 7919);
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1));
      const a = copy[index];
      const b = copy[other];
      if (a && b) {
        copy[index] = b;
        copy[other] = a;
      }
    }
    if (copy.some((person, index) => person !== items[index])) return copy;
  }
  return [...items].reverse();
}

function canInsert(state: State): boolean {
  return state.items.length < maxRows && state.nextPerson < roster.length;
}

function reduce(state: State, action: Action): State {
  const byIndex = state.strategy === 'index';
  switch (action.type) {
    case 'strategy':
      if (action.strategy === state.strategy) return state;
      return initialState(
        action.strategy,
        action.strategy === 'index'
          ? 'Index keys: React matches each row to an item by its position. The list is back to its starting order.'
          : 'Stable ids: React matches each row to an item by the id in the data. The list is back to its starting order.',
        state.generation + 1,
      );
    case 'insert': {
      if (!canInsert(state)) {
        return {
          ...state,
          message:
            state.items.length >= maxRows
              ? `${maxRows} rows is the limit here. Remove a row first.`
              : 'Everyone in the roster is already in use. Reset the list to start again.',
        };
      }
      const person = roster[state.nextPerson];
      if (!person) return state;
      return {
        ...state,
        items: [person, ...state.items],
        nextPerson: state.nextPerson + 1,
        message: byIndex
          ? `Inserted ${person.name} at the top. The keys are positions, so every existing row kept its instance and its text, and React mounted a new row at the end.`
          : `Inserted ${person.name} at the top. Each key still matches its own item, so the existing rows kept their text and React mounted one new row.`,
      };
    }
    case 'shuffle':
      return {
        ...state,
        items: shuffled(state.items, state.shuffles + 1),
        shuffles: state.shuffles + 1,
        message: byIndex
          ? 'Shuffled. The keys are still 0, 1, 2 in order, so each row kept its text and now shows a different item.'
          : 'Shuffled. Each key moved with its item, so React moved the rows and the text went with them.',
      };
    case 'remove': {
      const [first, second] = state.items;
      if (!first || state.items.length <= 1) return state;
      return {
        ...state,
        items: state.items.slice(1),
        message: byIndex
          ? `Removed ${first.name}. React unmounted the last row, and the top row kept its text under ${second?.name ?? 'the next item'}.`
          : `Removed ${first.name}. React unmounted that item's row, and its text went with it.`,
      };
    }
    case 'reset':
      return initialState(
        state.strategy,
        'List reset to its starting order, with every input empty.',
        state.generation + 1,
      );
  }
}

interface Note {
  text: string;
  owner: string;
}

function Row({ person, keyLabel }: { person: Person; keyLabel: string }) {
  const [note, setNote] = useState<Note>({ text: '', owner: '' });
  const misplaced = note.text !== '' && note.owner !== person.name;

  return (
    <li data-person={person.name} data-misplaced={misplaced ? 'true' : undefined}>
      <RenderBox label={`<Row key=${keyLabel}>`} className={misplaced ? 'border-bad' : undefined}>
        <div className="grid gap-2 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:items-center">
          <p className="font-display font-semibold">{person.name}</p>
          <input
            type="text"
            aria-label={`Note for ${person.name}`}
            placeholder="Type a note"
            value={note.text}
            onChange={(event) => setNote({ text: event.target.value, owner: person.name })}
            className="h-9 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint"
          />
        </div>
        <p
          className={cn(
            'flex items-center gap-1.5 text-[0.8rem]',
            misplaced ? 'tone-bad' : note.text === '' ? 'text-faint' : 'text-muted',
          )}
        >
          {misplaced ? (
            <TriangleAlert aria-hidden="true" size={14} className="shrink-0" />
          ) : note.text !== '' ? (
            <Check aria-hidden="true" size={14} className="shrink-0" />
          ) : null}
          {misplaced
            ? `Typed on ${note.owner}, now shown on ${person.name}`
            : note.text === ''
              ? 'Empty'
              : `Typed on ${person.name}`}
        </p>
      </RenderBox>
    </li>
  );
}

export function KeyChaosLab() {
  const [state, dispatch] = useReducer(reduce, undefined, () => initialState('index'));
  const insertable = canInsert(state);
  const removable = state.items.length > 1;
  const keyExpression = state.strategy === 'index' ? 'key={index}' : 'key={person.id}';

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Key strategy" className="kit-seg">
          <button
            type="button"
            aria-pressed={state.strategy === 'index'}
            onClick={() => dispatch({ type: 'strategy', strategy: 'index' })}
          >
            Index keys
          </button>
          <button
            type="button"
            aria-pressed={state.strategy === 'id'}
            onClick={() => dispatch({ type: 'strategy', strategy: 'id' })}
          >
            Stable ids
          </button>
        </div>
        <p className="font-mono text-[0.78rem] text-muted">
          rows use <code className="kit-inline-code">{keyExpression}</code>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="kit-btn"
          aria-disabled={insertable ? undefined : true}
          onClick={() => dispatch({ type: 'insert' })}
        >
          Insert at top
        </button>
        <button type="button" className="kit-btn" onClick={() => dispatch({ type: 'shuffle' })}>
          Shuffle
        </button>
        <button
          type="button"
          className="kit-btn"
          aria-disabled={removable ? undefined : true}
          onClick={() => dispatch({ type: 'remove' })}
        >
          Remove first
        </button>
        <button type="button" className="kit-btn" onClick={() => dispatch({ type: 'reset' })}>
          Reset list
        </button>
      </div>

      <ul key={state.generation} aria-label="Rows" className="grid gap-2">
        {state.items.map((person, index) => {
          const key = state.strategy === 'index' ? index : person.id;
          return <Row key={key} person={person} keyLabel={String(key)} />;
        })}
      </ul>

      <p
        role="status"
        aria-label="What React did"
        className="min-h-[3.2em] border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
      >
        {state.message}
      </p>
    </div>
  );
}
