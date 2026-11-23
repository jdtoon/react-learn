import { Check, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from './cn';

export type CompareVerdict = 'bad' | 'good' | 'neutral';

export interface CompareItem {
  id: string;
  label: string;
  verdict?: CompareVerdict;
  content: ReactNode;
}

export interface CompareProps {
  items: CompareItem[];
  initial?: string;
}

function VerdictBadge({ verdict }: { verdict: CompareVerdict | undefined }) {
  if (verdict !== 'bad' && verdict !== 'good') return null;
  const Icon = verdict === 'good' ? Check : X;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-[0.08em]',
        verdict === 'good' ? 'tone-ok' : 'tone-bad',
      )}
    >
      <Icon aria-hidden="true" size={13} />
      {verdict}
    </span>
  );
}

export function Compare({ items, initial }: CompareProps) {
  const [selected, setSelected] = useState(initial);
  const first = items[0];
  if (!first) return null;
  const activeId = items.some((item) => item.id === selected) ? selected : first.id;

  return (
    <div className="cmp grid gap-3" data-pair={items.length === 2 ? 'true' : undefined}>
      <div
        role="group"
        aria-label="Choose a view"
        className="cmp-toggle kit-seg justify-self-start"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === activeId}
            onClick={() => setSelected(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="cmp-panels">
        {items.map((item) => (
          <div
            key={item.id}
            role="group"
            aria-label={item.label}
            data-active={item.id === activeId ? 'true' : undefined}
            data-verdict={item.verdict ?? 'neutral'}
            className="cmp-panel grid min-w-0 content-start gap-3 rounded-xl border border-line border-t-[3px] border-t-line bg-surface p-3.5 data-[verdict=bad]:border-t-bad data-[verdict=good]:border-t-ok"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-[0.95rem] font-semibold">{item.label}</p>
              <VerdictBadge verdict={item.verdict} />
            </div>
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
