import { useContext, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { cn } from './cn';
import { RenderScopeContext } from './renderScope';

export interface RenderBoxProps {
  label: string;
  children?: ReactNode;
  memoized?: boolean;
  className?: string;
}

export function RenderBox({ label, children, memoized, className }: RenderBoxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const commits = useRef(0);
  const scope = useContext(RenderScopeContext);
  const labelId = useId();

  useLayoutEffect(() => {
    const root = rootRef.current;
    return root ? scope.register(root) : undefined;
  }, [scope]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const count = countRef.current;
    if (!root || !count) return;
    commits.current += 1;
    count.textContent = `renders ${commits.current}`;
    scope.commit(root);
  });

  return (
    <div ref={rootRef} role="group" aria-labelledby={labelId} className={cn('rb', className)}>
      <div className="rb-head">
        <span id={labelId} className="rb-label">
          {label}
        </span>
        <span className="rb-meta">
          {memoized && <span className="rb-memo">memo</span>}
          <span ref={countRef} className="rb-count" />
        </span>
      </div>
      {children != null && children !== false && <div className="rb-body">{children}</div>}
    </div>
  );
}
