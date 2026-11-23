import { TriangleAlert } from 'lucide-react';
import { memo, useReducer, useState } from 'react';
import { CodePeek, RenderBox } from '../../kit';

interface User {
  id: string;
  name: string;
}

type Mode = 'keep' | 'key';

interface State {
  userId: string;
  mode: Mode;
  message: string;
}

type Action = { type: 'user'; userId: string } | { type: 'mode'; mode: Mode };

const users: User[] = [
  { id: 'ada', name: 'Ada' },
  { id: 'grace', name: 'Grace' },
  { id: 'linus', name: 'Linus' },
];

const intro = 'Type a draft and pin the conversation. Then switch to another user.';

function nameOf(userId: string): string {
  return users.find((user) => user.id === userId)?.name ?? userId;
}

function reduce(state: State, action: Action): State {
  if (action.type === 'user') {
    if (action.userId === state.userId) return state;
    const name = nameOf(action.userId);
    return {
      ...state,
      userId: action.userId,
      message:
        state.mode === 'keep'
          ? `Switched to ${name}. Same component type at the same position, so React kept the instance and only updated its props. The draft, the pin and the render count carried over.`
          : `Switched to ${name}. The key changed, so React discarded the previous editor and mounted a new one. State started empty and the render count started again.`,
    };
  }
  if (action.mode === state.mode) return state;
  return {
    ...state,
    mode: action.mode,
    message:
      action.mode === 'key'
        ? 'Now keyed by user id. Adding a key changed the identity, so the editor mounted fresh.'
        : 'Keys removed. Position alone decides again, so switching users keeps state.',
  };
}

interface Draft {
  text: string;
  owner: string;
}

function Profile({ user }: { user: User }) {
  const [draft, setDraft] = useState<Draft>({ text: '', owner: '' });
  const [pinned, setPinned] = useState(false);
  const stale = draft.text !== '' && draft.owner !== user.name;

  return (
    <RenderBox label="<Profile>" className={stale ? 'border-bad' : undefined}>
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-[0.88rem]">
          <span className="text-muted">{`Draft to ${user.name}`}</span>
          <input
            type="text"
            value={draft.text}
            placeholder="Type a message"
            onChange={(event) => setDraft({ text: event.target.value, owner: user.name })}
            className="h-9 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint"
          />
        </label>
        <button
          type="button"
          className="kit-btn justify-self-start"
          aria-pressed={pinned}
          onClick={() => setPinned(!pinned)}
        >
          Pin conversation
        </button>
        {stale && (
          <p className="tone-bad flex items-center gap-1.5 text-[0.8rem]">
            <TriangleAlert aria-hidden="true" size={14} className="shrink-0" />
            {`Typed for ${draft.owner}, now addressed to ${user.name}`}
          </p>
        )}
      </div>
    </RenderBox>
  );
}

export const ResetWithKeyLab = memo(function ResetWithKeyLab() {
  const [state, dispatch] = useReducer(reduce, { userId: 'ada', mode: 'keep', message: intro });
  const user = users.find((candidate) => candidate.id === state.userId) ?? users[0];
  if (!user) return null;
  const keyed = state.mode === 'key';

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Conversation with" className="kit-seg">
          {users.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={candidate.id === user.id}
              onClick={() => dispatch({ type: 'user', userId: candidate.id })}
            >
              {candidate.name}
            </button>
          ))}
        </div>
        <div role="group" aria-label="State handling" className="kit-seg">
          <button
            type="button"
            aria-pressed={!keyed}
            onClick={() => dispatch({ type: 'mode', mode: 'keep' })}
          >
            Keep state
          </button>
          <button
            type="button"
            aria-pressed={keyed}
            onClick={() => dispatch({ type: 'mode', mode: 'key' })}
          >
            Key by user id
          </button>
        </div>
      </div>

      <Profile key={keyed ? user.id : undefined} user={user} />

      <p
        role="status"
        aria-label="What React did"
        className="min-h-[3.2em] border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
      >
        {state.message}
      </p>

      <CodePeek
        title="What the page renders"
        code={keyed ? '<Profile key={user.id} user={user} />' : '<Profile user={user} />'}
      />
    </div>
  );
});
