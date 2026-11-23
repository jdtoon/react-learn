import { createContext, use, useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../../kit/cn';

interface ControllableOptions<T> {
  value: T | undefined;
  defaultValue: T;
  onChange?: (next: T) => void;
}

export function useControllableState<T>({ value, defaultValue, onChange }: ControllableOptions<T>) {
  const [inner, setInner] = useState(defaultValue);
  const current = value !== undefined ? value : inner;

  function set(next: T) {
    if (Object.is(next, current)) return;
    if (value === undefined) setInner(next);
    onChange?.(next);
  }

  return [current, set] as const;
}

interface TabsContextValue {
  current: string;
  select: (value: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const context = use(TabsContext);
  if (!context) throw new Error('Tabs parts must render inside <Tabs>');
  return context;
}

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

function TabsRoot({ value, defaultValue = '', onValueChange, children }: TabsProps) {
  const [current, select] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const baseId = useId();
  return <TabsContext value={{ current, select, baseId }}>{children}</TabsContext>;
}

function TabList({ label, children }: { label: string; children: ReactNode }) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const index = tabs.findIndex((tab) => tab === document.activeElement);
    if (index === -1) return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : tabs.length - 1;
    const next = tabs[(index + step) % tabs.length];
    next?.focus();
    next?.click();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex flex-wrap gap-1 border-b border-line"
    >
      {children}
    </div>
  );
}

function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { current, select, baseId } = useTabs();
  const selected = current === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => select(value)}
      className={cn(
        '-mb-px min-h-9 border-b-2 border-transparent px-3 text-[0.88rem] font-medium text-muted hover:text-fg',
        selected && 'border-(--accent) text-fg',
      )}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { current, baseId } = useTabs();
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={current !== value}
      className="pt-3"
    >
      {children}
    </div>
  );
}

export const Tabs = Object.assign(TabsRoot, { List: TabList, Tab, Panel: TabPanel });
