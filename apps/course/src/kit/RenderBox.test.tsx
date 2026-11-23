import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { memo, StrictMode, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { LabFrame } from './LabFrame';
import { RenderBox } from './RenderBox';

function countOf(label: string): string {
  const box = screen.getByRole('group', { name: label });
  const text = within(box).getAllByText(/^renders \d+$/)[0]?.textContent ?? '';
  return text.replace('renders ', '');
}

function Rerenderable() {
  const [, setTick] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setTick((tick) => tick + 1)}>
        rerender
      </button>
      <RenderBox label="Box" />
    </>
  );
}

const MemoChild = memo(function MemoChild() {
  return <RenderBox label="Memo child" memoized />;
});

function PlainChild() {
  return <RenderBox label="Plain child" />;
}

function Tree() {
  const [, setTick] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setTick((tick) => tick + 1)}>
        rerender
      </button>
      <RenderBox label="Parent">
        <MemoChild />
        <PlainChild />
      </RenderBox>
    </>
  );
}

describe('RenderBox', () => {
  it('starts at 1 and goes to 2 when its parent re-renders', async () => {
    const user = userEvent.setup();
    render(<Rerenderable />);
    expect(countOf('Box')).toBe('1');
    await user.click(screen.getByRole('button', { name: 'rerender' }));
    expect(countOf('Box')).toBe('2');
    await user.click(screen.getByRole('button', { name: 'rerender' }));
    expect(countOf('Box')).toBe('3');
  });

  it('stays at 1 when a memoized wrapper skips the re-render', async () => {
    const user = userEvent.setup();
    render(<Tree />);
    await user.click(screen.getByRole('button', { name: 'rerender' }));
    expect(countOf('Parent')).toBe('2');
    expect(countOf('Plain child')).toBe('2');
    expect(countOf('Memo child')).toBe('1');
  });

  it('shows the memo badge only when memoized', () => {
    render(
      <>
        <RenderBox label="With" memoized />
        <RenderBox label="Without" />
      </>,
    );
    expect(within(screen.getByRole('group', { name: 'With' })).getByText('memo')).toBeVisible();
    expect(within(screen.getByRole('group', { name: 'Without' })).queryByText('memo')).toBeNull();
  });

  it('renders children inside the box and applies className to the root', () => {
    render(
      <RenderBox label="Outer" className="extra-class">
        <p>inner content</p>
      </RenderBox>,
    );
    const box = screen.getByRole('group', { name: 'Outer' });
    expect(box).toHaveClass('extra-class');
    expect(within(box).getByText('inner content')).toBeInTheDocument();
  });

  it('marks only the boxes that rendered in the latest commit', async () => {
    const user = userEvent.setup();
    render(<Tree />);
    expect(screen.getByRole('group', { name: 'Memo child' })).toHaveAttribute('data-latest');
    await user.click(screen.getByRole('button', { name: 'rerender' }));
    expect(screen.getByRole('group', { name: 'Parent' })).toHaveAttribute('data-latest');
    expect(screen.getByRole('group', { name: 'Plain child' })).toHaveAttribute('data-latest');
    expect(screen.getByRole('group', { name: 'Memo child' })).not.toHaveAttribute('data-latest');
  });

  it('keeps the highlight scopes of separate labs independent', async () => {
    const user = userEvent.setup();
    const spec = { id: 'a', title: 'Lab A', tryThis: [], whatHappened: 'x' };
    render(
      <>
        <LabFrame spec={spec}>
          <Rerenderable />
        </LabFrame>
        <LabFrame spec={{ ...spec, id: 'b', title: 'Lab B' }}>
          <RenderBox label="Other lab" />
        </LabFrame>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'rerender' }));
    expect(screen.getByRole('group', { name: 'Box' })).toHaveAttribute('data-latest');
    expect(screen.getByRole('group', { name: 'Other lab' })).toHaveAttribute('data-latest');
  });

  it('counts a single commit on mount outside StrictMode', () => {
    render(<RenderBox label="Solo" />);
    expect(countOf('Solo')).toBe('1');
  });

  it('survives StrictMode double invocation with a count of at least 1', () => {
    render(
      <StrictMode>
        <RenderBox label="Strict" />
      </StrictMode>,
    );
    expect(Number(countOf('Strict'))).toBeGreaterThanOrEqual(1);
  });
});
