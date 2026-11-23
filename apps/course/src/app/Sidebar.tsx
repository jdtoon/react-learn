import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useId, useRef } from 'react';
import { NavLink } from 'react-router';
import { curriculum, tracks } from '../content/curriculum';
import { isBuilt } from '../content/registry';
import { useProgress } from './progress';
import { padNumber, trackStyle } from './trackStyle';

type ModuleState = 'complete' | 'todo' | 'planned';

function moduleStateLabel(state: ModuleState): string | null {
  if (state === 'complete') return ', completed';
  if (state === 'planned') return ', planned';
  return null;
}

function moduleState(slug: string, completed: Record<string, true>): ModuleState {
  if (completed[slug]) return 'complete';
  return isBuilt(slug) ? 'todo' : 'planned';
}

function RailNav({ onNavigate }: { onNavigate?: () => void }) {
  const idPrefix = useId();
  const completed = useProgress((state) => state.completed);

  return (
    <nav aria-label="Course modules" className="px-3 py-4">
      {tracks.map((track) => {
        const modules = curriculum.filter((module) => module.track === track.id);
        const headingId = `${idPrefix}-${track.id}`;
        return (
          <div key={track.id} style={trackStyle(track.id)} className="mb-5 last:mb-0">
            <p
              id={headingId}
              className="mb-1.5 flex items-baseline justify-between gap-3 border-b-2 border-(--tc) px-0.5 pb-1.5"
            >
              <span className="font-display text-[0.95rem] font-semibold">{track.title}</span>
              <span className="font-mono text-[0.68rem] text-muted">{modules.length} modules</span>
            </p>
            <ul aria-labelledby={headingId} className="grid gap-px">
              {modules.map((module) => {
                const state = moduleState(module.slug, completed);
                const stateLabel = moduleStateLabel(state);
                const link = (
                  <NavLink
                    to={`/modules/${module.slug}`}
                    onClick={onNavigate}
                    data-planned={state === 'planned'}
                    className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[0.84rem] leading-snug hover:bg-surface aria-[current=page]:bg-surface-2 aria-[current=page]:shadow-[inset_3px_0_0_var(--tc)] data-[planned=true]:text-faint"
                  >
                    <span className="w-5 shrink-0 pt-px font-mono text-[0.72rem] tabular-nums text-muted group-data-[planned=true]:text-faint">
                      {padNumber(module.number)}
                    </span>
                    <span className="min-w-0 flex-1">
                      {module.title}
                      {stateLabel && <span className="sr-only">{stateLabel}</span>}
                    </span>
                    <span
                      aria-hidden="true"
                      data-state={state}
                      className="mt-[0.3rem] size-2 shrink-0 rounded-full border border-muted data-[state=complete]:border-(--tc) data-[state=complete]:bg-(--tc) data-[state=planned]:border-dashed data-[state=planned]:border-faint"
                    />
                  </NavLink>
                );
                return (
                  <li key={module.slug}>
                    {onNavigate ? <Dialog.Close asChild>{link}</Dialog.Close> : link}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const closedByNavigation = useRef(false);

  return (
    <>
      <aside className="scroll-thin sticky top-[var(--topbar-h)] hidden h-[calc(100dvh-var(--topbar-h))] self-start overflow-y-auto border-r border-line rail:block">
        <RailNav />
      </aside>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay fixed inset-0 z-40 bg-overlay rail:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            if (!closedByNavigation.current) return;
            closedByNavigation.current = false;
            event.preventDefault();
          }}
          className="drawer-panel fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col border-r border-line bg-bg rail:hidden"
        >
          <div className="flex h-[var(--topbar-h)] shrink-0 items-center justify-between border-b border-line pl-4 pr-2">
            <Dialog.Title className="eyebrow">Course modules</Dialog.Title>
            <Dialog.Close
              aria-label="Close course navigation"
              className="grid size-9 place-items-center rounded-lg text-muted hover:text-fg"
            >
              <X aria-hidden="true" size={18} />
            </Dialog.Close>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            <RailNav
              onNavigate={() => {
                closedByNavigation.current = true;
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </>
  );
}
