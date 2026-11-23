import { Info, Lightbulb, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type CalloutTone = 'info' | 'warn' | 'insight';

const icons: Record<CalloutTone, LucideIcon> = {
  info: Info,
  warn: TriangleAlert,
  insight: Lightbulb,
};

export interface CalloutProps {
  tone: CalloutTone;
  title?: string;
  children: ReactNode;
}

export function Callout({ tone, title, children }: CalloutProps) {
  const Icon = icons[tone];
  return (
    <aside className="kit-callout" data-tone={tone}>
      <Icon aria-hidden="true" size={18} className="mt-0.5 text-(--callout)" />
      <div className="grid min-w-0 gap-1 text-[0.92rem] leading-relaxed">
        {title && <p className="font-display text-[0.98rem] font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </aside>
  );
}
