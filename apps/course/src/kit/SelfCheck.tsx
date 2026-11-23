import { useId, useState } from 'react';
import type { ModuleContent } from '../content/types';
import { RichText } from './RichText';

type SelfCheckItems = ModuleContent['selfCheck'];

function Question({ item, number }: { item: SelfCheckItems[number]; number: number }) {
  const [revealed, setRevealed] = useState(false);
  const answerId = useId();

  return (
    <li className="grid gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex gap-3">
        <span aria-hidden="true" className="font-mono text-[0.78rem] text-(--tc,var(--accent))">
          {String(number).padStart(2, '0')}
        </span>
        <p className="text-[0.98rem] leading-snug">
          <RichText text={item.question} />
        </p>
      </div>
      <div className="grid gap-2.5 pl-8">
        <div>
          <button
            type="button"
            className="kit-btn"
            aria-expanded={revealed}
            aria-controls={answerId}
            onClick={() => setRevealed((open) => !open)}
          >
            {revealed ? 'Hide answer' : 'Reveal answer'}
          </button>
        </div>
        {revealed && (
          <p
            id={answerId}
            className="border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.92rem] leading-relaxed text-muted"
          >
            <RichText text={item.answer} />
          </p>
        )}
      </div>
    </li>
  );
}

export function SelfCheck({ items }: { items: SelfCheckItems }) {
  return (
    <ol aria-label="Self-check questions" className="grid gap-3">
      {items.map((item, index) => (
        <Question key={index} item={item} number={index + 1} />
      ))}
    </ol>
  );
}
