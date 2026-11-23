import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RemoteDescriptor, RemoteManifest } from '@react-field-guide/mfe-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadManifest = vi.fn();

vi.mock('./manifest', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./manifest')>()),
  loadManifest,
}));

vi.mock('./RemoteSlot', () => ({
  RemoteSlot: ({ descriptor, xray }: { descriptor: RemoteDescriptor; xray: boolean }) => (
    <div
      data-slot={descriptor.slot}
      data-testid={`remote-${descriptor.id}`}
      data-xray={String(xray)}
    >
      {descriptor.id}
    </div>
  ),
}));

const { Storefront } = await import('./Storefront');
const { ManifestError } = await import('./manifest');

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
};

const manifest: RemoteManifest = { remotes: [catalog], live: { catalog: 'react-catalog' } };

const slotIds = ['promo', 'catalog', 'cart', 'recs', 'account', 'reviews', 'locator'];

beforeEach(() => {
  loadManifest.mockReset();
  loadManifest.mockResolvedValue(manifest);
});

function slot(container: HTMLElement, id: string) {
  const element = container.querySelector<HTMLElement>(`[data-slot="${id}"]`);
  if (!element) throw new Error(`no slot ${id}`);
  return element;
}

describe('Storefront', () => {
  it('lays out the seven slots in order and loads the live remote into its slot', async () => {
    const { container } = render(<Storefront controls={['xray']} />);

    expect(await screen.findByTestId('remote-react-catalog')).toBeInTheDocument();
    const rendered = [...container.querySelectorAll('[data-slot]')].map((element) =>
      element.getAttribute('data-slot'),
    );
    expect(rendered).toEqual(slotIds);
    expect(slot(container, 'catalog')).toHaveAttribute('data-testid', 'remote-react-catalog');
  });

  it('shows a neutral placeholder for slots with nothing deployed', async () => {
    const { container } = render(<Storefront controls={['xray']} />);
    await screen.findByTestId('remote-react-catalog');

    for (const id of slotIds.filter((id) => id !== 'catalog')) {
      expect(slot(container, id)).toHaveAttribute('data-state', 'empty');
      expect(within(slot(container, id)).getByText('Not built yet')).toBeInTheDocument();
    }
  });

  it('shows a placeholder when a live entry points at a remote that is not in the manifest', async () => {
    loadManifest.mockResolvedValue({ remotes: [], live: { catalog: 'react-catalog' } });
    const { container } = render(<Storefront controls={['xray']} />);

    expect(
      await within(slot(container, 'catalog')).findByText('Not built yet'),
    ).toBeInTheDocument();
  });

  it('ignores live entries for slots the storefront does not have', async () => {
    loadManifest.mockResolvedValue({
      remotes: [catalog, { ...catalog, id: 'x', slot: 'footer' }],
      live: { catalog: 'react-catalog', footer: 'x' },
    });
    const { container } = render(<Storefront controls={['xray']} />);
    await screen.findByTestId('remote-react-catalog');

    expect(container.querySelector('[data-slot="footer"]')).toBeNull();
    expect(screen.queryByTestId('remote-x')).not.toBeInTheDocument();
  });

  it('summarises how many remotes are live and that React is shared', async () => {
    render(<Storefront controls={['xray']} />);
    await screen.findByTestId('remote-react-catalog');

    expect(screen.getByText('loads 1 remote · 1 shared React')).toBeInTheDocument();
  });

  it('turns x-ray on and off from a pressed-state toggle and tells the slots', async () => {
    const user = userEvent.setup();
    render(<Storefront controls={['xray']} />);
    await screen.findByTestId('remote-react-catalog');

    const toggle = screen.getByRole('button', { name: 'X-ray' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('remote-react-catalog')).toHaveAttribute('data-xray', 'false');
    expect(screen.getByText(/looks like one app/)).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('remote-react-catalog')).toHaveAttribute('data-xray', 'true');
    expect(screen.getByText(/separate app owned by a separate team/)).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('draws only the controls it is given', async () => {
    const { container } = render(<Storefront controls={[]} />);
    await screen.findByTestId('remote-react-catalog');

    expect(screen.queryByRole('button', { name: 'X-ray' })).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="catalog"]')).not.toBeNull();
  });

  it('ignores controls that are not wired yet', async () => {
    render(<Storefront controls={['xray', 'css-leak']} />);
    await screen.findByTestId('remote-react-catalog');

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('explains the failure and keeps the page when the manifest cannot be loaded', async () => {
    loadManifest.mockRejectedValue(new ManifestError('Manifest request failed with 404'));
    render(<Storefront controls={['xray']} />);

    const message = await screen.findByRole('status');
    expect(message).toHaveTextContent('The remote manifest could not be loaded');
    expect(message).toHaveTextContent('Manifest request failed with 404');
    expect(screen.getByRole('button', { name: 'X-ray' })).toBeInTheDocument();
  });
});
