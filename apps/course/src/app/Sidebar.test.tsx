import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from 'radix-ui';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { curriculum, tracks } from '../content/curriculum';
import { useProgress } from './progress';
import { Sidebar } from './Sidebar';

vi.mock('../content/builtSlugs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../content/builtSlugs')>()),
  isBuilt: (slug: string) => slug === '02-rendering',
}));

afterEach(() => {
  useProgress.setState({ completed: {} });
});

function renderSidebar(
  path = '/',
  drawer: { open: boolean; onOpenChange: (open: boolean) => void } = {
    open: false,
    onOpenChange: () => undefined,
  },
) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Dialog.Root open={drawer.open} onOpenChange={drawer.onOpenChange}>
        <Sidebar />
      </Dialog.Root>
    </MemoryRouter>,
  );
  return screen.getByRole('navigation', { name: 'Course modules' });
}

describe('Sidebar', () => {
  it('lists every track and all 24 modules as links', () => {
    const nav = renderSidebar();
    for (const track of tracks) {
      expect(within(nav).getByText(track.title)).toBeInTheDocument();
    }
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(curriculum.length);
    expect(links[0]).toHaveAttribute('href', '/modules/01-how-react-thinks');
  });

  it('labels each track with a heading and names its list after it', () => {
    const nav = renderSidebar();
    for (const track of tracks) {
      const heading = within(nav).getByRole('heading', { level: 2, name: track.title });
      const modules = curriculum.filter((module) => module.track === track.id);
      const list = within(nav).getByRole('list', { name: track.title });
      expect(heading).toBeInTheDocument();
      expect(within(list).getAllByRole('link')).toHaveLength(modules.length);
    }
    expect(within(nav).getAllByRole('heading')).toHaveLength(tracks.length);
  });

  it('marks planned modules and leaves built modules unmarked', () => {
    const nav = renderSidebar();
    expect(within(nav).getByRole('link', { name: /Why & when/ })).toHaveAccessibleName(/planned/);
    expect(
      within(nav).getByRole('link', { name: /Rendering & reconciliation/ }),
    ).not.toHaveAccessibleName(/planned/);
  });

  it('marks completed modules', () => {
    useProgress.setState({ completed: { '02-rendering': true } });
    const nav = renderSidebar();
    expect(
      within(nav).getByRole('link', { name: /Rendering & reconciliation/ }),
    ).toHaveAccessibleName(/completed/);
  });

  it('flags the current module', () => {
    const nav = renderSidebar('/modules/02-rendering');
    expect(within(nav).getByRole('link', { name: /Rendering & reconciliation/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows the same navigation in a drawer that closes when a module is chosen', async () => {
    const onOpenChange = vi.fn();
    renderSidebar('/', { open: true, onOpenChange });
    const drawer = screen.getByRole('dialog', { name: 'Course modules' });
    const nav = within(drawer).getByRole('navigation', { name: 'Course modules' });
    expect(within(nav).getAllByRole('link')).toHaveLength(curriculum.length);
    expect(within(nav).getAllByRole('heading', { level: 3 })).toHaveLength(tracks.length);
    await userEvent.click(within(nav).getByRole('link', { name: /Why & when/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
