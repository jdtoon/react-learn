import { createContext } from 'react';

export interface RenderScope {
  register: (element: HTMLElement) => () => void;
  commit: (element: HTMLElement) => void;
}

export function createRenderScope(): RenderScope {
  const elements = new Set<HTMLElement>();
  let inBatch = false;

  return {
    register(element) {
      elements.add(element);
      return () => {
        elements.delete(element);
      };
    },
    commit(element) {
      if (!inBatch) {
        inBatch = true;
        for (const other of elements) delete other.dataset['latest'];
        queueMicrotask(() => {
          inBatch = false;
        });
      }
      element.dataset['latest'] = 'true';
      element.classList.remove('rb-flash');
      element.getBoundingClientRect();
      element.classList.add('rb-flash');
    },
  };
}

export const RenderScopeContext = createContext<RenderScope>(createRenderScope());
