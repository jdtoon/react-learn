import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useReducer, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './cn';

export interface StepperStep {
  title: string;
  description: string;
  content: ReactNode;
}

export interface StepperProps {
  steps: StepperStep[];
  autoplayMs?: number;
}

interface State {
  index: number;
  playing: boolean;
}

type Action =
  | { type: 'go'; index: number; last: number }
  | { type: 'toggle'; last: number }
  | { type: 'tick'; last: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'go':
      return { index: Math.min(Math.max(action.index, 0), action.last), playing: false };
    case 'toggle':
      if (state.playing) return { ...state, playing: false };
      return { index: state.index >= action.last ? 0 : state.index, playing: true };
    case 'tick': {
      const index = Math.min(state.index + 1, action.last);
      return { index, playing: index < action.last };
    }
  }
}

function isEditable(target: EventTarget): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

export function Stepper({ steps, autoplayMs }: StepperProps) {
  const last = steps.length - 1;
  const [state, dispatch] = useReducer(reducer, { index: 0, playing: false });
  const index = Math.min(state.index, Math.max(last, 0));
  const step = steps[index];
  const canPlay = autoplayMs !== undefined && last > 0;

  useEffect(() => {
    if (!state.playing || autoplayMs === undefined) return;
    const timer = setInterval(() => dispatch({ type: 'tick', last }), autoplayMs);
    return () => clearInterval(timer);
  }, [state.playing, autoplayMs, last]);

  if (!step) return null;

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (isEditable(event.target)) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      dispatch({ type: 'go', index: index + 1, last });
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      dispatch({ type: 'go', index: index - 1, last });
    }
  }

  return (
    <section
      aria-label="Step-through"
      aria-roledescription="stepper"
      onKeyDown={onKeyDown}
      className="grid gap-3"
    >
      <div className="kit-stage">{step.content}</div>

      <div aria-live="polite" aria-atomic="true" className="grid gap-1">
        <p className="eyebrow">{`Step ${index + 1} of ${steps.length}`}</p>
        <h4>{step.title}</h4>
        <p className="max-w-[64ch] text-[0.92rem] leading-relaxed text-muted">{step.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="kit-btn"
          aria-label="Previous step"
          aria-disabled={index === 0}
          onClick={() => dispatch({ type: 'go', index: index - 1, last })}
        >
          <ChevronLeft aria-hidden="true" size={16} />
          Prev
        </button>
        {canPlay && (
          <button
            type="button"
            className="kit-btn"
            onClick={() => dispatch({ type: 'toggle', last })}
          >
            {state.playing ? (
              <Pause aria-hidden="true" size={16} />
            ) : (
              <Play aria-hidden="true" size={16} />
            )}
            {state.playing ? 'Pause' : 'Play'}
          </button>
        )}
        <button
          type="button"
          className="kit-btn"
          aria-label="Next step"
          aria-disabled={index === last}
          onClick={() => dispatch({ type: 'go', index: index + 1, last })}
        >
          Next
          <ChevronRight aria-hidden="true" size={16} />
        </button>
        <ol aria-label="Steps" className="ml-auto flex items-center gap-1.5">
          {steps.map((item, position) => (
            <li key={position}>
              <button
                type="button"
                aria-label={`Step ${position + 1}: ${item.title}`}
                aria-current={position === index ? 'step' : undefined}
                onClick={() => dispatch({ type: 'go', index: position, last })}
                className={cn(
                  'grid size-6 place-items-center rounded-full border font-mono text-[0.68rem] tabular-nums',
                  position === index
                    ? 'border-(--tc,var(--accent)) bg-(--tc,var(--accent)) text-accent-fg'
                    : 'border-line bg-surface text-muted hover:border-accent',
                )}
              >
                {position + 1}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
