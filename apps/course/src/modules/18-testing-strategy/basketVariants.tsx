import { useReducer, useState } from 'react';

function describe(count: number): string {
  if (count === 0) return 'Basket is empty';
  return count === 1 ? '1 item' : `${count} items`;
}

function OriginalBasket({ buggy = false }: { buggy?: boolean }) {
  const [count, setCount] = useState(0);
  const add = buggy ? () => setCount((current) => Math.max(current, 1)) : () => setCount(count + 1);

  return (
    <div className="basket flex flex-wrap items-center gap-3">
      <button type="button" data-testid="add" className="basket-add kit-btn" onClick={add}>
        Add to basket
      </button>
      <span role="status" className="basket-count font-mono text-[0.86rem]">
        {describe(count)}
      </span>
      <button type="button" className="basket-clear kit-btn" onClick={() => setCount(0)}>
        Clear
      </button>
    </div>
  );
}

export function BasketOriginal() {
  return <OriginalBasket />;
}

export function BasketBuggy() {
  return <OriginalBasket buggy />;
}

type BasketAction = { type: 'add' } | { type: 'clear' };

function basketReducer(count: number, action: BasketAction): number {
  return action.type === 'add' ? count + 1 : 0;
}

export function BasketRefactored() {
  const [count, dispatch] = useReducer(basketReducer, 0);

  return (
    <section className="bsk grid gap-2">
      <p role="status" aria-live="polite" className="bsk__total font-mono text-[0.86rem]">
        {describe(count)}
      </p>
      <div className="bsk__actions flex flex-wrap gap-2">
        <button
          type="button"
          data-cy="add-to-basket"
          className="kit-btn"
          onClick={() => dispatch({ type: 'add' })}
        >
          Add to basket
        </button>
        <button type="button" className="kit-btn" onClick={() => dispatch({ type: 'clear' })}>
          Clear
        </button>
      </div>
    </section>
  );
}
