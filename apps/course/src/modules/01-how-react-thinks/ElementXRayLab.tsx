import { isValidElement, useReducer, type ReactElement, type ReactNode } from 'react';
import { RenderBox } from '../../kit';
import { cn } from '../../kit/cn';

interface ProfileProps {
  name: string;
  online: boolean;
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 font-display font-semibold"
    >
      {name.charAt(0)}
    </span>
  );
}
Avatar.displayName = 'Avatar';

function Badge({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        'w-fit rounded-full border px-2 py-0.5 text-[0.76rem]',
        online ? 'border-ok tone-ok' : 'border-line text-muted',
      )}
    >
      {online ? 'Online' : 'Away'}
    </span>
  );
}
Badge.displayName = 'Badge';

function ProfileCard({ name, online }: ProfileProps) {
  return (
    <article className="flex items-center gap-3">
      <Avatar name={name} />
      <div className="grid gap-1">
        <h4 className="font-display text-[1rem] font-semibold">{name}</h4>
        <Badge online={online} />
      </div>
    </article>
  );
}
ProfileCard.displayName = 'ProfileCard';

type Kind = 'component' | 'host' | 'text';

interface Line {
  depth: number;
  text: string;
  kind: Kind;
}

interface FreshCheck {
  sameObject: boolean;
  sameDescription: boolean;
}

interface State {
  current: ProfileProps;
  previous: ProfileProps;
  levels: number;
  check: FreshCheck | null;
}

type Action =
  | { type: 'name'; name: string }
  | { type: 'online'; online: boolean }
  | { type: 'levels'; levels: number }
  | { type: 'again' };

const names = ['Ada', 'Grace', 'Linus'];
const everyLevel = 9;
const views = [
  { levels: 0, label: 'The element you write' },
  { levels: 1, label: 'What ProfileCard returns' },
  { levels: everyLevel, label: 'All the way down' },
];

function attributes(props: Record<string, unknown>): string {
  return Object.entries(props)
    .filter(([key]) => key !== 'children' && key !== 'className' && key !== 'aria-hidden')
    .map(([key, value]) => {
      if (typeof value === 'string') return ` ${key}="${value}"`;
      if (value === true) return ` ${key}`;
      return ` ${key}={${String(value)}}`;
    })
    .join('');
}

function nameOf(type: unknown): string {
  if (typeof type === 'string') return type;
  if (typeof type === 'function') {
    const named = type as { displayName?: string; name: string };
    return named.displayName ?? named.name;
  }
  return 'Unknown';
}

function walk(node: ReactNode, depth: number, levels: number, lines: Line[]): void {
  if (Array.isArray(node)) {
    for (const child of node) walk(child as ReactNode, depth, levels, lines);
    return;
  }
  if (typeof node === 'string' || typeof node === 'number') {
    lines.push({ depth, kind: 'text', text: `"${node}"` });
    return;
  }
  if (!isValidElement(node)) return;
  const element = node as ReactElement<Record<string, unknown>>;
  const { type, props } = element;
  const name = nameOf(type);
  if (typeof type === 'string') {
    lines.push({ depth, kind: 'host', text: `<${name}${attributes(props)}>` });
    walk(props.children as ReactNode, depth + 1, levels, lines);
    return;
  }
  lines.push({ depth, kind: 'component', text: `<${name}${attributes(props)} />` });
  if (levels > 0 && typeof type === 'function') {
    const render = type as (input: Record<string, unknown>) => ReactNode;
    walk(render(props), depth + 1, levels - 1, lines);
  }
}

function describe(props: ProfileProps, levels: number): Line[] {
  const lines: Line[] = [];
  walk(<ProfileCard name={props.name} online={props.online} />, 0, levels, lines);
  return lines;
}

function signature(lines: Line[]): string {
  return lines.map((line) => `${line.depth}${line.text}`).join('\n');
}

function freshCheck(props: ProfileProps): FreshCheck {
  const first = <ProfileCard name={props.name} online={props.online} />;
  const second = <ProfileCard name={props.name} online={props.online} />;
  const describeOne = (element: ReactNode) => {
    const lines: Line[] = [];
    walk(element, 0, everyLevel, lines);
    return signature(lines);
  };
  return {
    sameObject: Object.is(first, second),
    sameDescription: describeOne(first) === describeOne(second),
  };
}

function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'name':
      if (action.name === state.current.name) return state;
      return {
        ...state,
        previous: state.current,
        current: { ...state.current, name: action.name },
        check: null,
      };
    case 'online':
      if (action.online === state.current.online) return state;
      return {
        ...state,
        previous: state.current,
        current: { ...state.current, online: action.online },
        check: null,
      };
    case 'levels':
      return { ...state, levels: action.levels };
    case 'again':
      return { ...state, previous: state.current, check: freshCheck(state.current) };
  }
}

function summarise(lines: Line[]): string {
  const count = (kind: Kind) => lines.filter((line) => line.kind === kind).length;
  const components = count('component');
  const hosts = count('host');
  const texts = count('text');
  return `${components} ${components === 1 ? 'component element' : 'component elements'}, ${hosts} host ${hosts === 1 ? 'element' : 'elements'}, ${texts} text ${texts === 1 ? 'node' : 'nodes'}`;
}

export function ElementXRayLab() {
  const [state, dispatch] = useReducer(reduce, {
    current: { name: 'Ada', online: true },
    previous: { name: 'Ada', online: true },
    levels: 1,
    check: null,
  });
  const lines = describe(state.current, state.levels);
  const before = describe(state.previous, state.levels);
  const changed = lines.filter((line, index) => before[index]?.text !== line.text).length;

  return (
    <div className="@container grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Name" className="kit-seg">
          {names.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={state.current.name === name}
              onClick={() => dispatch({ type: 'name', name })}
            >
              {name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="kit-btn"
          aria-pressed={state.current.online}
          onClick={() => dispatch({ type: 'online', online: !state.current.online })}
        >
          Online
        </button>
        <button type="button" className="kit-btn" onClick={() => dispatch({ type: 'again' })}>
          Render again, same props
        </button>
      </div>

      <div role="group" aria-label="How much to expand" className="kit-seg justify-self-start">
        {views.map((view) => (
          <button
            key={view.levels}
            type="button"
            aria-pressed={state.levels === view.levels}
            onClick={() => dispatch({ type: 'levels', levels: view.levels })}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-3 @xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="xray-heading" className="grid gap-2">
          <h4 id="xray-heading">Elements: plain data</h4>
          <ul
            aria-label="Element tree"
            className="grid gap-0.5 overflow-x-auto rounded-lg border border-line bg-bg p-3 font-mono text-[0.78rem]"
          >
            {lines.map((line, index) => (
              <li
                key={index}
                style={{ paddingLeft: `${line.depth}rem` }}
                className={cn(
                  'w-fit rounded px-1 whitespace-pre',
                  line.kind === 'component' && 'font-medium text-accent',
                  line.kind === 'text' && 'text-muted',
                  before[index]?.text !== line.text &&
                    'bg-[color-mix(in_oklab,var(--accent)_18%,transparent)]',
                )}
              >
                {line.text}
              </li>
            ))}
          </ul>
          <p className="text-[0.76rem] text-muted">{summarise(lines)}</p>
          <p role="status" aria-label="Description check" className="min-h-[2.6em] text-[0.84rem]">
            {state.check
              ? `Two elements built from the same props. Same object in memory: ${state.check.sameObject ? 'yes' : 'no'}. Same description: ${state.check.sameDescription ? 'yes' : 'no'}.`
              : changed > 0
                ? `${changed} ${changed === 1 ? 'line differs' : 'lines differ'} from the previous description. That is all React has to apply.`
                : 'Change a prop to see which lines of the description differ.'}
          </p>
        </section>

        <section aria-labelledby="page-heading" className="grid gap-2">
          <h4 id="page-heading">On the page</h4>
          <RenderBox label="<ProfileCard>">
            <ProfileCard name={state.current.name} online={state.current.online} />
          </RenderBox>
          <p className="text-[0.76rem] text-muted">
            The render count climbs on every press. The description and the page stay the same until
            a prop changes.
          </p>
        </section>
      </div>
    </div>
  );
}
