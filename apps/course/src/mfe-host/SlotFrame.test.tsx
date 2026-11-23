import { render, screen } from '@testing-library/react';
import type { RemoteDescriptor } from '@react-field-guide/mfe-contracts';
import { describe, expect, it } from 'vitest';
import { SlotFrame } from './SlotFrame';
import { formatBytes } from './slots';

const catalog: RemoteDescriptor = {
  id: 'react-catalog',
  slot: 'catalog',
  team: 'Discovery',
  framework: 'react',
  kind: 'federation',
  version: '1.4.0',
  url: 'https://example.test/remoteEntry.js',
  bytes: 12_800,
};

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1024, '1.0 KB'],
    [12_800, '12.5 KB'],
    [1_048_576, '1.0 MB'],
  ])('formats %i as %s', (bytes, text) => {
    expect(formatBytes(bytes)).toBe(text);
  });
});

describe('SlotFrame', () => {
  it('shows the title and body without the x-ray tag when x-ray is off', () => {
    render(
      <SlotFrame slot="catalog" title="Catalogue" xray={false} descriptor={catalog} state="ready">
        <p>body</p>
      </SlotFrame>,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Catalogue' })).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.queryByText(/Team Discovery/)).not.toBeInTheDocument();
  });

  it('draws the x-ray tag with team, framework, kind, version, size and load time', () => {
    render(
      <SlotFrame
        slot="catalog"
        title="Catalogue"
        xray
        descriptor={catalog}
        state="ready"
        loadMs={84.4}
        identity="same"
      >
        <p>body</p>
      </SlotFrame>,
    );

    expect(
      screen.getByText('Team Discovery · React · Module Federation · v1.4.0 · 12.5 KB · 84 ms'),
    ).toBeInTheDocument();
    expect(screen.getByText('same React')).toBeInTheDocument();
  });

  it('says so in the tag while the load time is not known yet', () => {
    render(
      <SlotFrame slot="catalog" title="Catalogue" xray descriptor={catalog} state="loading">
        <p>body</p>
      </SlotFrame>,
    );

    expect(
      screen.getByText(/Team Discovery · React · Module Federation · v1\.4\.0/),
    ).toHaveTextContent('loading');
  });

  it('leaves out the size when the manifest has none', () => {
    render(
      <SlotFrame
        slot="catalog"
        title="Catalogue"
        xray
        descriptor={{ ...catalog, bytes: undefined }}
        state="ready"
        loadMs={20}
      >
        <p>body</p>
      </SlotFrame>,
    );

    expect(
      screen.getByText('Team Discovery · React · Module Federation · v1.4.0 · 20 ms'),
    ).toBeInTheDocument();
  });

  it('reports a different React instance in the tag', () => {
    render(
      <SlotFrame
        slot="catalog"
        title="Catalogue"
        xray
        descriptor={catalog}
        state="ready"
        loadMs={20}
        identity="different"
      >
        <p>body</p>
      </SlotFrame>,
    );

    expect(screen.getByText('different React')).toBeInTheDocument();
  });

  it('colours the frame by framework and marks x-ray and state on the element', () => {
    const { container } = render(
      <SlotFrame
        slot="reviews"
        title="Reviews"
        xray
        descriptor={{ ...catalog, framework: 'vue' }}
        state="failed"
      >
        <p>body</p>
      </SlotFrame>,
    );

    const frame = container.querySelector('[data-slot="reviews"]');
    expect(frame).toHaveAttribute('data-state', 'failed');
    expect(frame).toHaveAttribute('data-xray', 'true');
    expect(frame).toHaveAttribute('data-remote', 'react-catalog');
    expect(frame?.getAttribute('style')).toContain('--fc: var(--vue)');
  });

  it('marks the promo slot as full width', () => {
    const { container } = render(
      <SlotFrame slot="promo" title="Promotion" xray={false} state="empty">
        <p>body</p>
      </SlotFrame>,
    );

    expect(container.querySelector('[data-slot="promo"]')).toHaveAttribute('data-wide', 'true');
    expect(container.querySelector('[data-slot="promo"]')).not.toHaveAttribute('data-remote');
  });

  it('labels a slot with no remote as not deployed in x-ray', () => {
    render(
      <SlotFrame slot="reviews" title="Reviews" xray state="empty">
        <p>body</p>
      </SlotFrame>,
    );

    expect(screen.getByText('Not deployed')).toBeInTheDocument();
  });
});
