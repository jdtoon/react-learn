import { act, render, screen } from '@testing-library/react';
import type { RemoteDescriptor } from '@react-field-guide/mfe-contracts';
import React, { useState, type ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadFederated = vi.fn();

vi.mock('./federation', () => ({ loadFederated }));

const { RemoteSlot, REMOTE_LOAD_TIMEOUT_MS } = await import('./RemoteSlot');

const catalog: RemoteDescriptor = {
  id: 'react-catalog',
  slot: 'catalog',
  team: 'Discovery',
  framework: 'react',
  kind: 'federation',
  version: '1.0.0',
  url: 'https://example.test/remoteEntry.js',
  container: 'react_catalog',
  expose: './Catalog',
  bytes: 4096,
};

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      count {count}
    </button>
  );
}

function Crashing(): never {
  throw new Error('remote render failed');
}

function answer(modules: Record<string, unknown>) {
  loadFederated.mockImplementation(async (descriptor: RemoteDescriptor) => {
    const module = modules[descriptor.expose ?? ''];
    if (module instanceof Error) throw module;
    return module;
  });
}

beforeEach(() => {
  loadFederated.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('RemoteSlot', () => {
  it('shows a loading note, then renders the remote component with working hooks', async () => {
    answer({
      './Catalog': { default: Counter as ComponentType },
      './reactIdentity': { default: React },
    });

    render(<RemoteSlot descriptor={catalog} xray={false} />);

    expect(screen.getByText('Loading Catalogue')).toBeInTheDocument();
    const button = await screen.findByRole('button', { name: 'count 0' });
    act(() => button.click());
    expect(screen.getByRole('button', { name: 'count 1' })).toBeInTheDocument();
  });

  it('puts the remote inside a frame titled for its slot', async () => {
    answer({ './Catalog': { default: Counter }, './reactIdentity': { default: React } });

    const { container } = render(<RemoteSlot descriptor={catalog} xray={false} />);
    await screen.findByRole('button', { name: 'count 0' });

    expect(screen.getByRole('heading', { level: 3, name: 'Catalogue' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="catalog"]')).toHaveAttribute('data-state', 'ready');
  });

  it('reports a shared React when the identity probe returns the host React', async () => {
    answer({ './Catalog': { default: Counter }, './reactIdentity': { default: React } });

    render(<RemoteSlot descriptor={catalog} xray />);

    expect(await screen.findByText('same React')).toBeInTheDocument();
    expect(
      screen.getByText(/Team Discovery · React · Module Federation · v1\.0\.0 · 4\.0 KB/),
    ).toBeInTheDocument();
  });

  it('reports a different React when the probe returns another instance', async () => {
    answer({ './Catalog': { default: Counter }, './reactIdentity': { default: {} } });

    render(<RemoteSlot descriptor={catalog} xray />);

    expect(await screen.findByText('different React')).toBeInTheDocument();
  });

  it('still renders the remote when the identity probe is not exposed', async () => {
    answer({
      './Catalog': { default: Counter },
      './reactIdentity': new Error('not exposed'),
    });

    render(<RemoteSlot descriptor={catalog} xray />);

    expect(await screen.findByRole('button', { name: 'count 0' })).toBeInTheDocument();
    expect(screen.queryByText(/same React|different React/)).not.toBeInTheDocument();
  });

  it('shows the fallback card when the load fails', async () => {
    answer({ './Catalog': new Error('Failed to fetch remoteEntry') });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { container } = render(<RemoteSlot descriptor={catalog} xray={false} />);

    const fallback = await screen.findByRole('status');
    expect(fallback).toHaveTextContent('Catalogue is unavailable right now');
    expect(fallback).toHaveTextContent('Failed to fetch remoteEntry');
    expect(container.querySelector('[data-slot="catalog"]')).toHaveAttribute(
      'data-state',
      'failed',
    );
  });

  it('gives up after eight seconds and shows the fallback card', async () => {
    vi.useFakeTimers();
    loadFederated.mockImplementation(() => new Promise(() => undefined));

    render(<RemoteSlot descriptor={catalog} xray={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REMOTE_LOAD_TIMEOUT_MS - 1);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Timed out after 8 s');
    expect(REMOTE_LOAD_TIMEOUT_MS).toBe(8000);
  });

  it('contains a crash while the remote renders and leaves siblings alone', async () => {
    answer({ './Catalog': { default: Crashing }, './reactIdentity': { default: React } });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <>
        <button type="button">sibling</button>
        <RemoteSlot descriptor={catalog} xray={false} />
      </>,
    );

    expect(await screen.findByRole('status')).toHaveTextContent('remote render failed');
    expect(screen.getByRole('button', { name: 'sibling' })).toBeInTheDocument();
  });

  it('says a kind is not wired yet instead of loading it', () => {
    render(
      <RemoteSlot
        descriptor={{ ...catalog, id: 'vue-reviews', slot: 'reviews', kind: 'web-component' }}
        xray={false}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('web-component is not wired yet');
    expect(loadFederated).not.toHaveBeenCalled();
  });

  it('loads again when the descriptor url changes', async () => {
    answer({ './Catalog': { default: Counter }, './reactIdentity': { default: React } });
    const { rerender } = render(<RemoteSlot descriptor={catalog} xray={false} />);
    await screen.findByRole('button', { name: 'count 0' });
    const callsBefore = loadFederated.mock.calls.length;

    answer({ './Catalog': new Error('gone') });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    rerender(
      <RemoteSlot
        descriptor={{ ...catalog, url: 'https://example.test/missing.js' }}
        xray={false}
      />,
    );

    expect(await screen.findByRole('status')).toHaveTextContent('gone');
    expect(loadFederated.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
