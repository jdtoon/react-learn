import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pitfall } from '../content/types';
import {
  Callout,
  CodePeek,
  Compare,
  LabFrame,
  MeetingCardView,
  Meter,
  PitfallCard,
  RichText,
  SelfCheck,
  Stepper,
  Timeline,
  Waterfall,
} from './index';

afterEach(() => {
  vi.useRealTimers();
});

describe('RichText', () => {
  it('renders code and bold and leaves other text alone', () => {
    const { container } = render(
      <p>
        <RichText text="Use `memo` to **skip** work, not `useMemo()`" />
      </p>,
    );
    expect(container.querySelectorAll('code')).toHaveLength(2);
    expect(screen.getByText('memo').tagName).toBe('CODE');
    expect(screen.getByText('skip').tagName).toBe('STRONG');
    expect(container.textContent).toBe('Use memo to skip work, not useMemo()');
  });

  it('leaves unmatched markers as plain text', () => {
    const { container } = render(
      <p>
        <RichText text="A lone ` backtick and ** stars" />
      </p>,
    );
    expect(container.querySelector('code')).toBeNull();
    expect(container.querySelector('strong')).toBeNull();
    expect(container.textContent).toBe('A lone ` backtick and ** stars');
  });
});

describe('LabFrame', () => {
  const spec = {
    id: 'demo',
    title: 'Demo lab',
    tryThis: ['Press **go**', 'Press `stop`'],
    whatHappened: 'The `state` changed.',
  };

  it('shows the title, a Try this checklist and the lab', () => {
    render(
      <LabFrame spec={spec}>
        <p>the lab itself</p>
      </LabFrame>,
    );
    const frame = screen.getByRole('region', { name: 'Demo lab' });
    expect(frame).toHaveAttribute('id', 'lab-demo');
    expect(within(frame).getAllByRole('checkbox')).toHaveLength(2);
    expect(within(frame).getByText('the lab itself')).toBeInTheDocument();
  });

  it('lets the visitor tick items without persisting anything', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(
      <LabFrame spec={spec}>
        <p>lab</p>
      </LabFrame>,
    );
    const [first, second] = screen.getAllByRole('checkbox');
    if (!first || !second) throw new Error('expected two checkboxes');
    await user.click(first);
    expect(first).toBeChecked();
    expect(second).not.toBeChecked();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('hides What just happened until it is asked for', async () => {
    const user = userEvent.setup();
    render(
      <LabFrame spec={spec}>
        <p>lab</p>
      </LabFrame>,
    );
    const toggle = screen.getByRole('button', { name: 'What just happened' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/changed/)).not.toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('state').tagName).toBe('CODE');
    await user.click(toggle);
    expect(screen.queryByText(/changed/)).not.toBeInTheDocument();
  });

  it('omits the checklist when there is nothing to try', () => {
    render(
      <LabFrame spec={{ ...spec, tryThis: [] }}>
        <p>lab</p>
      </LabFrame>,
    );
    expect(screen.queryByText('Try this')).not.toBeInTheDocument();
  });
});

describe('Timeline', () => {
  const lanes = [
    { id: 'react', label: 'React' },
    { id: 'net', label: 'Network' },
  ];

  it('lists each lane with its events and their timings', () => {
    render(
      <Timeline
        lanes={lanes}
        duration={100}
        events={[
          { id: 'a', lane: 'react', start: 0, end: 20, label: 'render App', kind: 'render' },
          { id: 'b', lane: 'react', start: 20, label: 'commit', kind: 'commit' },
          { id: 'c', lane: 'net', start: 10, end: 90, label: 'GET /posts', kind: 'network' },
        ]}
      />,
    );
    const react = screen.getByRole('list', { name: 'React' });
    expect(within(react).getAllByRole('listitem')).toHaveLength(2);
    expect(within(react).getByText(/render App/)).toBeInTheDocument();
    expect(
      screen.getByRole('listitem', { name: /GET \/posts: network, 10 ms to 90 ms/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /commit: commit, at 20 ms/ })).toBeInTheDocument();
  });

  it('puts overlapping events in the same lane on separate rows', () => {
    render(
      <Timeline
        lanes={lanes}
        duration={100}
        events={[
          { id: 'a', lane: 'react', start: 0, end: 50, label: 'first', kind: 'render' },
          { id: 'b', lane: 'react', start: 10, end: 40, label: 'second', kind: 'render' },
          { id: 'c', lane: 'react', start: 60, end: 80, label: 'third', kind: 'render' },
        ]}
      />,
    );
    const items = within(screen.getByRole('list', { name: 'React' })).getAllByRole('listitem');
    const rows = items.map((item) => item.style.getPropertyValue('--row'));
    expect(rows).toEqual(['0', '1', '0']);
  });

  it('positions events as a percentage of the duration', () => {
    render(
      <Timeline
        lanes={lanes}
        duration={200}
        events={[{ id: 'a', lane: 'react', start: 50, end: 150, label: 'half', kind: 'task' }]}
      />,
    );
    const item = within(screen.getByRole('list', { name: 'React' })).getByRole('listitem');
    expect(item.style.getPropertyValue('--l')).toBe('25%');
    expect(item.style.getPropertyValue('--w')).toBe('50%');
  });

  it('announces the cursor and draws it at its position', () => {
    const { container } = render(<Timeline lanes={lanes} duration={100} events={[]} cursor={40} />);
    expect(screen.getByText('Cursor at 40 ms')).toBeInTheDocument();
    const cursor = container.querySelector<HTMLElement>('.tl-cursor');
    expect(cursor?.style.getPropertyValue('--l')).toBe('40%');
  });

  it('ignores events for lanes that were not declared', () => {
    render(
      <Timeline
        lanes={lanes}
        duration={100}
        events={[{ id: 'x', lane: 'nowhere', start: 0, end: 10, label: 'lost', kind: 'render' }]}
      />,
    );
    expect(screen.queryByText('lost')).not.toBeInTheDocument();
  });

  it('keeps a zero duration from dividing by zero', () => {
    render(
      <Timeline
        lanes={lanes}
        duration={0}
        events={[{ id: 'x', lane: 'react', start: 0, label: 'tick', kind: 'effect' }]}
      />,
    );
    const item = within(screen.getByRole('list', { name: 'React' })).getByRole('listitem');
    expect(item.style.getPropertyValue('--l')).toBe('0%');
  });
});

describe('Waterfall', () => {
  it('lists every request with its range, duration and status', () => {
    render(
      <Waterfall
        total={1000}
        requests={[
          { id: 'a', label: 'GET /user', start: 0, end: 200 },
          { id: 'b', label: 'GET /posts', start: 200, end: 700, status: 'error' },
          { id: 'c', label: 'GET /feed', start: 200, end: 900, status: 'pending' },
        ]}
      />,
    );
    const items = within(screen.getByRole('list', { name: 'Requests' })).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('0 to 200 ms · 200 ms · ok');
    expect(items[1]).toHaveTextContent('200 to 700 ms · 500 ms · failed');
    expect(items[2]).toHaveTextContent('pending');
  });

  it('sizes each bar against the total', () => {
    const { container } = render(
      <Waterfall total={400} requests={[{ id: 'a', label: 'x', start: 100, end: 300 }]} />,
    );
    const bar = container.querySelector<HTMLElement>('.wf-bar');
    expect(bar?.style.getPropertyValue('--l')).toBe('25%');
    expect(bar?.style.getPropertyValue('--w')).toBe('50%');
    expect(container.querySelector('.wf-fill')).toHaveAttribute('data-status', 'ok');
  });
});

describe('Compare', () => {
  const items = [
    { id: 'a', label: 'Before', verdict: 'bad' as const, content: <p>before content</p> },
    { id: 'b', label: 'After', verdict: 'good' as const, content: <p>after content</p> },
  ];

  it('starts on the first item and switches with the toggle', async () => {
    const user = userEvent.setup();
    render(<Compare items={items} />);
    const toggle = screen.getByRole('group', { name: 'Choose a view' });
    expect(within(toggle).getByRole('button', { name: 'Before' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('group', { name: 'Before' })).toHaveAttribute('data-active');
    expect(screen.getByRole('group', { name: 'After' })).not.toHaveAttribute('data-active');
    await user.click(within(toggle).getByRole('button', { name: 'After' }));
    expect(screen.getByRole('group', { name: 'After' })).toHaveAttribute('data-active');
    expect(screen.getByRole('group', { name: 'Before' })).not.toHaveAttribute('data-active');
  });

  it('honours initial', () => {
    render(<Compare items={items} initial="b" />);
    expect(screen.getByRole('group', { name: 'After' })).toHaveAttribute('data-active');
  });

  it('falls back to the first item when initial is unknown', () => {
    render(<Compare items={items} initial="zzz" />);
    expect(screen.getByRole('group', { name: 'Before' })).toHaveAttribute('data-active');
  });

  it('marks exactly two items as a side-by-side pair', () => {
    const { container, rerender } = render(<Compare items={items} />);
    expect(container.querySelector('.cmp')).toHaveAttribute('data-pair');
    rerender(<Compare items={[...items, { id: 'c', label: 'Third', content: <p>third</p> }]} />);
    expect(container.querySelector('.cmp')).not.toHaveAttribute('data-pair');
  });

  it('labels a verdict with text, not only colour', () => {
    render(<Compare items={items} />);
    expect(screen.getByText('bad')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
  });

  it('renders nothing for no items', () => {
    const { container } = render(<Compare items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Meter', () => {
  it('exposes the value to assistive technology', () => {
    render(<Meter label="Render time" value={12} max={32} unit="ms" />);
    const meter = screen.getByRole('meter', { name: 'Render time' });
    expect(meter).toHaveAttribute('aria-valuenow', '12');
    expect(meter).toHaveAttribute('aria-valuemax', '32');
    expect(meter).toHaveAttribute('aria-valuetext', '12 ms of 32 ms');
  });

  it.each([
    [8, 'ok'],
    [16, 'warn'],
    [20, 'warn'],
    [24, 'bad'],
    [30, 'bad'],
  ])('rates %s ms as %s when higher is worse', (value, level) => {
    const { container } = render(
      <Meter label="Time" value={value} max={32} unit="ms" thresholds={{ warn: 16, bad: 24 }} />,
    );
    expect(container.querySelector('.meter-fill')).toHaveAttribute('data-level', level);
  });

  it.each([
    [58, 'ok'],
    [45, 'warn'],
    [20, 'bad'],
  ])('rates %s fps as %s when warn is above bad', (value, level) => {
    const { container } = render(
      <Meter label="Rate" value={value} max={60} unit="fps" thresholds={{ warn: 50, bad: 30 }} />,
    );
    expect(container.querySelector('.meter-fill')).toHaveAttribute('data-level', level);
  });

  it('says the level in words and draws the thresholds', () => {
    const { container } = render(
      <Meter label="Time" value={30} max={32} thresholds={{ warn: 16, bad: 24 }} />,
    );
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '30 of 32, bad');
    expect(container.querySelectorAll('.meter-tick')).toHaveLength(2);
  });

  it('stays neutral without thresholds and clamps the fill', () => {
    const { container } = render(<Meter label="Size" value={900} max={400} unit="KB" />);
    const fill = container.querySelector<HTMLElement>('.meter-fill');
    expect(fill).toHaveAttribute('data-level', 'neutral');
    expect(fill?.style.getPropertyValue('--w')).toBe('100%');
    expect(container.querySelector('.meter-tick')).toBeNull();
  });
});

describe('Stepper', () => {
  const steps = [
    { title: 'One', description: 'first step', content: <p>content one</p> },
    { title: 'Two', description: 'second step', content: <p>content two</p> },
    { title: 'Three', description: 'third step', content: <p>content three</p> },
  ];

  it('shows the first step and moves with next and previous', async () => {
    const user = userEvent.setup();
    render(<Stepper steps={steps} />);
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('content one')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous step' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText('content two')).toBeInTheDocument();
    expect(screen.queryByText('content one')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByRole('button', { name: 'Next step' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Previous step' }));
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('steps with the arrow keys while focus is inside', async () => {
    const user = userEvent.setup();
    render(<Stepper steps={steps} />);
    screen.getByRole('button', { name: 'Next step' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('leaves arrow keys alone inside form fields', async () => {
    const user = userEvent.setup();
    render(
      <Stepper
        steps={[
          { title: 'Form', description: 'type here', content: <input aria-label="field" /> },
          ...steps,
        ]}
      />,
    );
    await user.click(screen.getByRole('textbox', { name: 'field' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('jumps to a step from the step buttons', async () => {
    const user = userEvent.setup();
    render(<Stepper steps={steps} />);
    await user.click(screen.getByRole('button', { name: 'Step 3: Three' }));
    expect(screen.getByText('content three')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Step 3: Three' })).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('has no play button without autoplayMs', () => {
    render(<Stepper steps={steps} />);
    expect(screen.queryByRole('button', { name: /Play|Pause/ })).not.toBeInTheDocument();
  });

  it('plays, advances on the interval and stops on the last step', async () => {
    vi.useFakeTimers();
    render(<Stepper steps={steps} autoplayMs={1000} />);
    act(() => {
      screen.getByRole('button', { name: 'Play' }).click();
    });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses on request and when the visitor steps by hand', async () => {
    vi.useFakeTimers();
    render(<Stepper steps={steps} autoplayMs={1000} />);
    act(() => {
      screen.getByRole('button', { name: 'Play' }).click();
    });
    act(() => {
      screen.getByRole('button', { name: 'Pause' }).click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    act(() => {
      screen.getByRole('button', { name: 'Play' }).click();
    });
    act(() => {
      screen.getByRole('button', { name: 'Next step' }).click();
    });
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('restarts from the beginning when played on the last step', () => {
    render(<Stepper steps={steps} autoplayMs={1000} />);
    act(() => {
      screen.getByRole('button', { name: 'Step 3: Three' }).click();
    });
    act(() => {
      screen.getByRole('button', { name: 'Play' }).click();
    });
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });
});

describe('CodePeek', () => {
  const code = 'const answer = 42;\nconsole.log(answer);';

  it('is collapsed by default and opens on demand', async () => {
    const user = userEvent.setup();
    const { container } = render(<CodePeek code={code} title="Example" />);
    const toggle = screen.getByRole('button', { name: /Example/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('pre')).toBeNull();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('pre')?.textContent).toBe(code);
  });

  it('can start open', () => {
    const { container } = render(<CodePeek code={code} defaultOpen />);
    expect(container.querySelector('pre')).not.toBeNull();
  });

  it('highlights tokens without using innerHTML', () => {
    const { container } = render(<CodePeek code={'const a = "x";'} defaultOpen />);
    const keyword = container.querySelector('.sh__token--keyword');
    expect(keyword?.textContent).toBe('const');
    expect(container.querySelector('.sh__token--string')).not.toBeNull();
  });

  it('shows code that looks like markup as text', () => {
    const { container } = render(
      <CodePeek code={'<img src=x onerror="alert(1)">'} lang="html" defaultOpen />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('pre')?.textContent).toBe('<img src=x onerror="alert(1)">');
  });

  it.each(['tsx', 'ts', 'css', 'html', 'bash'] as const)('renders %s code verbatim', (lang) => {
    const sample = 'a { b: c }\n\nline three';
    const { container } = render(<CodePeek code={sample} lang={lang} defaultOpen />);
    expect(container.querySelector('pre')?.textContent).toBe(sample);
  });

  it('copies the code and says so', async () => {
    const user = userEvent.setup();
    render(<CodePeek code={code} title="Example" />);
    await user.click(screen.getByRole('button', { name: 'Copy example' }));
    expect(await navigator.clipboard.readText()).toBe(code);
    expect(screen.getByRole('status')).toHaveTextContent('Copied to clipboard');
    expect(screen.getByRole('button', { name: 'Copy example' })).toHaveTextContent('Copied');
  });

  it('reports a failed copy instead of throwing', async () => {
    const user = userEvent.setup();
    render(<CodePeek code={code} />);
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('blocked'));
    await user.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(screen.getByRole('status')).toHaveTextContent('Copy failed');
  });
});

describe('Callout', () => {
  it.each(['info', 'warn', 'insight'] as const)('renders the %s tone with its title', (tone) => {
    const { container } = render(
      <Callout tone={tone} title="Heads up">
        body text
      </Callout>,
    );
    expect(container.querySelector('aside')).toHaveAttribute('data-tone', tone);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('body text')).toBeInTheDocument();
  });

  it('omits the title when none is given', () => {
    render(<Callout tone="info">only body</Callout>);
    expect(screen.getByText('only body')).toBeInTheDocument();
  });
});

describe('PitfallCard', () => {
  const pitfall: Pitfall = {
    title: 'Index keys',
    symptom: 'Text lands in the wrong row',
    cause: 'The key is the **index**',
    fix: 'Use a stable id',
    bad: 'key={index}',
    good: 'key={item.id}',
  };

  it('shows symptom, cause and fix', () => {
    const { container } = render(<PitfallCard pitfall={pitfall} />);
    expect(screen.getByRole('heading', { level: 4, name: 'Index keys' })).toBeInTheDocument();
    expect(screen.getByText('Symptom')).toBeInTheDocument();
    expect(screen.getByText('Text lands in the wrong row')).toBeInTheDocument();
    expect(container.querySelector('strong')?.textContent).toBe('index');
    expect(screen.getByText('Use a stable id')).toBeInTheDocument();
  });

  it('toggles between the bad and good snippets', async () => {
    const user = userEvent.setup();
    const { container } = render(<PitfallCard pitfall={pitfall} />);
    expect(container.querySelector('pre')?.textContent).toBe('key={index}');
    await user.click(screen.getByRole('button', { name: 'Good' }));
    expect(container.querySelector('pre')?.textContent).toBe('key={item.id}');
    expect(screen.getByRole('button', { name: 'Good' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Bad' }));
    expect(container.querySelector('pre')?.textContent).toBe('key={index}');
  });

  it('shows a single snippet without a toggle', () => {
    const { container } = render(<PitfallCard pitfall={{ ...pitfall, good: undefined }} />);
    expect(screen.queryByRole('button', { name: 'Good' })).not.toBeInTheDocument();
    expect(container.querySelector('pre')?.textContent).toBe('key={index}');
  });

  it('has no snippet area when neither is given', () => {
    const { container } = render(
      <PitfallCard pitfall={{ ...pitfall, bad: undefined, good: undefined }} />,
    );
    expect(container.querySelector('pre')).toBeNull();
    expect(screen.queryByRole('group', { name: /Example/ })).not.toBeInTheDocument();
  });
});

describe('MeetingCardView', () => {
  it('shows the four parts with inline formatting', () => {
    render(
      <MeetingCardView
        card={{
          say: ['Mention `this`', 'And **that**'],
          ask: ['Ask one', 'Ask two'],
          redFlags: ['Flag one', 'Flag two'],
          tradeoff: 'The cost of it all.',
        }}
      />,
    );
    for (const name of ['Say', 'Ask', 'Red flags', 'Trade-off']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByText('this').tagName).toBe('CODE');
    expect(screen.getByText('that').tagName).toBe('STRONG');
    expect(screen.getByText('The cost of it all.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });
});

describe('SelfCheck', () => {
  const items = [
    { question: 'Q one?', answer: 'A one.' },
    { question: 'Q two?', answer: 'A **two**.' },
    { question: 'Q three?', answer: 'A three.' },
  ];

  it('hides every answer until it is revealed', async () => {
    const user = userEvent.setup();
    render(<SelfCheck items={items} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByText('A one.')).not.toBeInTheDocument();
    const [first, second] = screen.getAllByRole('button', { name: 'Reveal answer' });
    if (!first || !second) throw new Error('expected reveal buttons');
    await user.click(second);
    expect(screen.getByText('two').tagName).toBe('STRONG');
    expect(screen.queryByText('A one.')).not.toBeInTheDocument();
    await user.click(first);
    expect(screen.getByText('A one.')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Hide answer' })[0] ?? first);
    expect(screen.queryByText('A one.')).not.toBeInTheDocument();
  });
});
