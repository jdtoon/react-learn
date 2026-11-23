import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgress } from '../app/progress';
import type { LabComponents, ModuleContent } from '../content/types';
import { RenderBox } from '../kit';
import { validContent } from '../test/fixtures';
import { ModulePage } from './ModulePage';

const slug = '02-rendering';

function DemoLab() {
  return <RenderBox label="Demo box" />;
}

function ThrowingLab(): ReactNode {
  throw new Error('lab exploded');
}

async function renderPage(
  content: ModuleContent,
  loadLabs: () => Promise<{ labs: LabComponents }> = async () => ({ labs: { demo: DemoLab } }),
  path = '/',
) {
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(
      <MemoryRouter initialEntries={[path]}>
        <ModulePage content={content} loadLabs={loadLabs} />
      </MemoryRouter>,
    );
  });
  if (!result) throw new Error('render did not run');
  return result;
}

beforeEach(() => {
  useProgress.setState({ completed: {} });
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ModulePage header', () => {
  it('shows track, number, title, one idea, minutes and outcomes', async () => {
    const content = validContent(slug);
    await renderPage(content);
    expect(screen.getByRole('heading', { level: 1, name: content.title })).toBeInTheDocument();
    expect(screen.getByText(/Foundations · Module 02 · 12 min/)).toBeInTheDocument();
    expect(screen.getByText(content.oneIdea)).toBeInTheDocument();
    const outcomes = screen.getByRole('list', { name: 'After this you can' });
    expect(within(outcomes).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Demo lab' })).toBeInTheDocument();
  });
});

describe('ModulePage deep links', () => {
  it('scrolls to the section named by the hash after the first render', async () => {
    const scroll = vi.mocked(window.HTMLElement.prototype.scrollIntoView);
    scroll.mockClear();
    await renderPage(validContent(slug), undefined, `/modules/${slug}#labs`);
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('labs'));
  });

  it('leaves the scroll position alone without a hash', async () => {
    const scroll = vi.mocked(window.HTMLElement.prototype.scrollIntoView);
    scroll.mockClear();
    await renderPage(validContent(slug));
    expect(scroll).not.toHaveBeenCalled();
  });
});

describe('ModulePage sections', () => {
  it('renders the model, pitfalls, meeting card, self-check and links', async () => {
    await renderPage(validContent(slug));
    expect(screen.getByRole('heading', { level: 2, name: 'The model' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Trigger, render, commit' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Pitfalls' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Index keys' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'In the meeting' })).toBeInTheDocument();
    expect(screen.getByText('A render is React calling your function')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Self-check' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Reveal answer' })).toHaveLength(3);
    expect(screen.getByRole('heading', { level: 2, name: 'Go deeper' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Render and commit/ });
    expect(link).toHaveAttribute('href', 'https://react.dev/learn/render-and-commit');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders inline code and bold in section paragraphs', async () => {
    const content = validContent(slug, {
      sections: [{ heading: 'Rich', paragraphs: ['Use **bold** and `code` here.'] }],
    });
    await renderPage(content);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('code').tagName).toBe('CODE');
  });

  it('offers an in-page navigation to every section', async () => {
    await renderPage(validContent(slug));
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    const names = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(names).toEqual([
      'The model',
      'Labs',
      'Pitfalls',
      'In the meeting',
      'Self-check',
      'Go deeper',
    ]);
    expect(within(nav).getByRole('link', { name: 'Labs' }).getAttribute('href')).toMatch(/#labs$/);
  });

  it('leaves out sections that have no content', async () => {
    await renderPage(validContent(slug, { labs: [], pitfalls: [], links: [] }));
    expect(screen.queryByRole('heading', { level: 2, name: 'Labs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Pitfalls' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Go deeper' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'In the meeting' })).toBeInTheDocument();
  });
});

describe('ModulePage labs', () => {
  it('shows a loading state while the labs load, then the lab inside its frame', async () => {
    let resolve: (value: { labs: LabComponents }) => void = () => undefined;
    const pending = new Promise<{ labs: LabComponents }>((done) => {
      resolve = done;
    });
    await renderPage(validContent(slug), () => pending);
    expect(screen.getByRole('status', { name: 'Loading labs' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Demo lab' })).not.toBeInTheDocument();
    await act(async () => {
      resolve({ labs: { demo: DemoLab } });
    });
    const frame = screen.getByRole('region', { name: 'Demo lab' });
    expect(within(frame).getByRole('group', { name: 'Demo box' })).toBeInTheDocument();
    expect(within(frame).getByText('Press the first button')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading labs' })).not.toBeInTheDocument();
  });

  it('keeps the rest of the page readable while labs are still loading', async () => {
    await renderPage(validContent(slug), () => new Promise(() => undefined));
    expect(screen.getByRole('heading', { level: 2, name: 'The model' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Pitfalls' })).toBeInTheDocument();
  });

  it('shows a visible error box for a lab missing from the labs map', async () => {
    await renderPage(validContent(slug), async () => ({ labs: {} }));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('demo');
    expect(screen.getByRole('heading', { name: 'Demo lab' })).toBeInTheDocument();
  });

  it('shows an error box when the labs fail to load', async () => {
    await renderPage(validContent(slug), () => Promise.reject(new Error('chunk failed')));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('chunk failed');
    expect(screen.getByRole('heading', { level: 2, name: 'In the meeting' })).toBeInTheDocument();
  });

  it('contains a lab that throws so the page and other labs survive', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const content = validContent(slug, {
      labs: [
        { id: 'boom', title: 'Boom lab', tryThis: ['x'], whatHappened: 'y' },
        { id: 'demo', title: 'Demo lab', tryThis: ['x'], whatHappened: 'y' },
      ],
    });
    await renderPage(content, async () => ({ labs: { boom: ThrowingLab, demo: DemoLab } }));
    expect(screen.getByRole('alert')).toHaveTextContent('lab exploded');
    expect(screen.getByRole('heading', { name: 'Demo lab' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('leaves a lab alone when the page re-renders with unchanged content', async () => {
    const content = validContent(slug);
    const loadLabs = async () => ({ labs: { demo: DemoLab } });
    const { rerender } = await renderPage(content, loadLabs);
    const rendersOfDemoBox = () =>
      screen.getByRole('group', { name: 'Demo box' }).querySelector('.rb-count')?.textContent;
    expect(rendersOfDemoBox()).toBe('renders 1');
    await act(async () => {
      rerender(
        <MemoryRouter>
          <ModulePage content={content} loadLabs={loadLabs} />
        </MemoryRouter>,
      );
    });
    expect(rendersOfDemoBox()).toBe('renders 1');
  });

  it('reveals what just happened inside a lab frame', async () => {
    const user = userEvent.setup();
    await renderPage(validContent(slug));
    const frame = screen.getByRole('region', { name: 'Demo lab' });
    expect(within(frame).queryByText(/second press changed nothing/)).not.toBeInTheDocument();
    await user.click(within(frame).getByRole('button', { name: 'What just happened' }));
    expect(within(frame).getByText(/second press changed nothing/)).toBeInTheDocument();
  });
});

describe('ModulePage completion and neighbours', () => {
  it('marks the module complete and back again', async () => {
    const user = userEvent.setup();
    await renderPage(validContent(slug));
    await user.click(screen.getByRole('button', { name: 'Mark complete' }));
    expect(useProgress.getState().completed[slug]).toBe(true);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mark incomplete' }));
    expect(useProgress.getState().completed[slug]).toBeUndefined();
    expect(screen.getByRole('button', { name: 'Mark complete' })).toBeInTheDocument();
  });

  it('links to the previous and next modules in curriculum order', async () => {
    await renderPage(validContent(slug));
    const nav = screen.getByRole('navigation', { name: 'Module navigation' });
    expect(within(nav).getByRole('link', { name: /Previous.*How React thinks/ })).toHaveAttribute(
      'href',
      '/modules/01-how-react-thinks',
    );
    expect(
      within(nav).getByRole('link', { name: /Next.*State & the snapshot model/ }),
    ).toHaveAttribute('href', '/modules/03-state-snapshots');
  });

  it('has no previous link on the first module and no next link on the last', async () => {
    const { unmount } = await renderPage(validContent('01-how-react-thinks'));
    expect(screen.queryByRole('link', { name: /Previous/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Next/ })).toBeInTheDocument();
    unmount();
    await renderPage(validContent('24-mfe-in-production'));
    expect(screen.queryByRole('link', { name: /Next/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Previous/ })).toBeInTheDocument();
  });
});
