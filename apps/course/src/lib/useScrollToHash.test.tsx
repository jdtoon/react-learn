import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollToHash } from './useScrollToHash';

function Page() {
  useScrollToHash();
  return (
    <main>
      <section id="labs">Labs</section>
      <section id="café">Cafe</section>
    </main>
  );
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Page />
    </MemoryRouter>,
  );
}

const scroll = vi.mocked(window.HTMLElement.prototype.scrollIntoView);
const originalMatchMedia = window.matchMedia;

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  scroll.mockClear();
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe('useScrollToHash', () => {
  it('scrolls to the element named by the hash once the page has rendered', () => {
    renderAt('/modules/02-rendering#labs');
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('labs'));
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
  });

  it('does not animate when the visitor prefers reduced motion', () => {
    setReducedMotion(true);
    renderAt('/modules/02-rendering#labs');
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
  });

  it('decodes an encoded hash', () => {
    renderAt('/modules/02-rendering#caf%C3%A9');
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('café'));
  });

  it('does nothing without a hash or when the target is missing', () => {
    renderAt('/modules/02-rendering');
    renderAt('/modules/02-rendering#nope');
    renderAt('/modules/02-rendering#');
    expect(scroll).not.toHaveBeenCalled();
  });

  it('survives a malformed hash', () => {
    renderAt('/modules/02-rendering#%E0%A4%A');
    expect(scroll).not.toHaveBeenCalled();
  });
});
