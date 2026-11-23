import { render, screen } from '@testing-library/react';
import { Suspense, lazy } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaletteBoundary } from './PaletteBoundary';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PaletteBoundary', () => {
  it('renders its children when nothing fails', () => {
    render(
      <PaletteBoundary>
        <p>search body</p>
      </PaletteBoundary>,
    );
    expect(screen.getByText('search body')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a short message when the lazy chunk fails to load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Broken = lazy(() =>
      Promise.reject<{ default: () => null }>(
        new TypeError('Failed to fetch dynamically imported module'),
      ),
    );
    render(
      <div>
        <p>rest of the app</p>
        <PaletteBoundary>
          <Suspense fallback={<p role="status">Loading search</p>}>
            <Broken />
          </Suspense>
        </PaletteBoundary>
      </div>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Search could not load. Reload the page to try again.',
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('rest of the app')).toBeInTheDocument();
  });
});
