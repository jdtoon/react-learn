import React from 'react';
import { createRoot } from 'react-dom/client';
import { Recs } from './Recs';
import css from './recs.css?inline';

export interface MountProps {
  version: string;
}

export const reactIdentity = React;

export function mount(el: HTMLElement, props: MountProps): () => void {
  const style = document.createElement('style');
  style.textContent = css;
  const container = document.createElement('div');
  el.append(style, container);

  const root = createRoot(container);
  root.render(<Recs version={props.version} />);

  return () => {
    root.unmount();
    container.remove();
    style.remove();
  };
}
