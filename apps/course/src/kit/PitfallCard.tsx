import { useState } from 'react';
import type { Pitfall } from '../content/types';
import { CodeBlock } from './CodeBlock';
import { RichText } from './RichText';

type Step = { key: 'symptom' | 'cause' | 'fix'; label: string };

const steps: Step[] = [
  { key: 'symptom', label: 'Symptom' },
  { key: 'cause', label: 'Cause' },
  { key: 'fix', label: 'Fix' },
];

function Snippet({ pitfall }: { pitfall: Pitfall }) {
  const [view, setView] = useState<'bad' | 'good'>(pitfall.bad === undefined ? 'good' : 'bad');
  const { bad, good } = pitfall;
  if (bad === undefined && good === undefined) return null;
  const code = view === 'bad' ? bad : good;

  return (
    <div className="grid gap-2">
      {bad !== undefined && good !== undefined ? (
        <div
          role="group"
          aria-label={`Example for ${pitfall.title}`}
          className="kit-seg justify-self-start"
        >
          <button type="button" aria-pressed={view === 'bad'} onClick={() => setView('bad')}>
            Bad
          </button>
          <button type="button" aria-pressed={view === 'good'} onClick={() => setView('good')}>
            Good
          </button>
        </div>
      ) : (
        <p className="eyebrow">{bad === undefined ? 'Good' : 'Bad'}</p>
      )}
      {code !== undefined && <CodeBlock code={code} />}
    </div>
  );
}

export function PitfallCard({ pitfall }: { pitfall: Pitfall }) {
  return (
    <article className="@container grid gap-4 rounded-xl border border-line bg-surface p-4">
      <h4>{pitfall.title}</h4>
      <dl className="pf-steps">
        {steps.map((step) => (
          <div key={step.key} className="pf-step" data-step={step.key}>
            <dt className="font-mono text-[0.7rem] uppercase tracking-[0.09em] text-muted">
              {step.label}
            </dt>
            <dd className="text-[0.92rem] leading-snug">
              <RichText text={pitfall[step.key]} />
            </dd>
          </div>
        ))}
      </dl>
      <Snippet pitfall={pitfall} />
    </article>
  );
}
