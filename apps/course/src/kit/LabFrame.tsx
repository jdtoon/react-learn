import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import type { LabSpec } from '../content/types';
import { RenderScopeContext, createRenderScope } from './renderScope';
import { RichText } from './RichText';

export function LabFrame({ spec, children }: { spec: LabSpec; children: ReactNode }) {
  const [scope] = useState(createRenderScope);
  const [revealed, setRevealed] = useState(false);
  const titleId = useId();
  const happenedId = useId();

  return (
    <section id={`lab-${spec.id}`} aria-labelledby={titleId} className="kit-panel scroll-mt-20">
      <header className="grid gap-1">
        <p className="eyebrow">Lab</p>
        <h3 id={titleId}>{spec.title}</h3>
      </header>

      {spec.tryThis.length > 0 && (
        <div className="grid gap-2">
          <p className="eyebrow">Try this</p>
          <ul className="grid gap-1.5">
            {spec.tryThis.map((item, index) => (
              <li key={index}>
                <label className="flex cursor-pointer items-start gap-2.5 text-[0.92rem] leading-snug">
                  <input type="checkbox" className="kit-check peer" />
                  <span className="peer-checked:text-muted peer-checked:line-through">
                    <RichText text={item} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RenderScopeContext.Provider value={scope}>
        <div className="kit-stage">{children}</div>
      </RenderScopeContext.Provider>

      <div className="grid gap-2.5">
        <div>
          <button
            type="button"
            className="kit-btn"
            aria-expanded={revealed}
            aria-controls={happenedId}
            onClick={() => setRevealed((open) => !open)}
          >
            What just happened
            <ChevronDown
              aria-hidden="true"
              size={16}
              className={revealed ? 'rotate-180' : undefined}
            />
          </button>
        </div>
        {revealed && (
          <p
            id={happenedId}
            className="border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.92rem] leading-relaxed text-muted"
          >
            <RichText text={spec.whatHappened} />
          </p>
        )}
      </div>
    </section>
  );
}
