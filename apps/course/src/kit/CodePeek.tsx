import { Check, ChevronRight, Copy } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { CodeBlock, type CodeLang } from './CodeBlock';

export interface CodePeekProps {
  code: string;
  lang?: CodeLang;
  title?: string;
  defaultOpen?: boolean;
}

type CopyState = 'idle' | 'copied' | 'failed';

const copyAnnouncement: Record<CopyState, string> = {
  idle: '',
  copied: 'Copied to clipboard',
  failed: 'Copy failed',
};

export function CodePeek({ code, lang = 'tsx', title, defaultOpen = false }: CodePeekProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const regionId = useId();
  const name = title ?? 'Code';

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = setTimeout(() => setCopyState('idle'), 1800);
    return () => clearTimeout(timer);
  }, [copyState]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-2 px-1.5 py-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((isOpen) => !isOpen)}
          className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left text-[0.86rem] font-medium hover:bg-surface-2"
        >
          <ChevronRight
            aria-hidden="true"
            size={16}
            className={open ? 'shrink-0 rotate-90' : 'shrink-0'}
          />
          <span className="truncate">{name}</span>
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">
            {lang}
          </span>
        </button>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${name.toLowerCase()}`}
          className="kit-btn min-h-8 shrink-0 px-2.5 text-[0.8rem]"
        >
          {copyState === 'copied' ? (
            <Check aria-hidden="true" size={14} />
          ) : (
            <Copy aria-hidden="true" size={14} />
          )}
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
        </button>
      </div>
      <p role="status" className="sr-only">
        {copyAnnouncement[copyState]}
      </p>
      {open && (
        <div id={regionId} className="border-t border-line p-2">
          <CodeBlock code={code} lang={lang} />
        </div>
      )}
    </div>
  );
}
