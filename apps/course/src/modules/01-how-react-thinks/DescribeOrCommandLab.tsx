import { TriangleAlert } from 'lucide-react';
import { useReducer } from 'react';
import { CodePeek, Meter } from '../../kit';
import { cn } from '../../kit/cn';

type Product = 'Tea' | 'Coffee';
type Cart = Record<Product, number>;

interface Row {
  name: Product;
  qty: number;
}

interface Screen {
  rows: Row[];
  count: number;
  emptyShown: boolean;
  checkoutEnabled: boolean;
}

interface Op {
  code: string;
  forgettable?: boolean;
  apply: (screen: Screen) => Screen;
}

interface Written {
  code: string;
  written: boolean;
}

type CartAction =
  { type: 'add'; name: Product } | { type: 'remove'; name: Product } | { type: 'clear' };

type Action = CartAction | { type: 'forget'; forget: boolean } | { type: 'reset' };

interface State {
  cart: Cart;
  screen: Screen;
  forget: boolean;
  last: { label: string; ops: Written[] } | null;
  handOps: number;
  stateCalls: number;
}

const products: Product[] = ['Tea', 'Coffee'];
const emptyCart: Cart = { Tea: 0, Coffee: 0 };

function totalOf(cart: Cart): number {
  return products.reduce((sum, product) => sum + cart[product], 0);
}

function screenOf(cart: Cart): Screen {
  const count = totalOf(cart);
  return {
    rows: products.filter((name) => cart[name] > 0).map((name) => ({ name, qty: cart[name] })),
    count,
    emptyShown: count === 0,
    checkoutEnabled: count > 0,
  };
}

function initialState(forget = false): State {
  return {
    cart: emptyCart,
    screen: screenOf(emptyCart),
    forget,
    last: null,
    handOps: 0,
    stateCalls: 0,
  };
}

function setQty(screen: Screen, name: Product, qty: number): Screen {
  return {
    ...screen,
    rows: screen.rows.map((row) => (row.name === name ? { ...row, qty } : row)),
  };
}

function addRow(screen: Screen, name: Product): Screen {
  const row: Row = { name, qty: 1 };
  return { ...screen, rows: name === 'Tea' ? [row, ...screen.rows] : [...screen.rows, row] };
}

function dropRow(screen: Screen, name: Product): Screen {
  return { ...screen, rows: screen.rows.filter((row) => row.name !== name) };
}

function setCount(count: number): Op {
  return { code: `badge.textContent = ${count}`, apply: (screen) => ({ ...screen, count }) };
}

const showEmpty: Op = {
  code: 'emptyMessage.hidden = false',
  apply: (screen) => ({ ...screen, emptyShown: true }),
};

const lockCheckout: Op = {
  code: 'checkout.disabled = true',
  forgettable: true,
  apply: (screen) => ({ ...screen, checkoutEnabled: false }),
};

function removeRow(name: Product): Op {
  return { code: `row('${name}').remove()`, apply: (screen) => dropRow(screen, name) };
}

function opsFor(action: CartAction, before: Cart): Op[] {
  const beforeTotal = totalOf(before);
  switch (action.type) {
    case 'add': {
      const { name } = action;
      const qty = before[name] + 1;
      const ops: Op[] = [
        before[name] === 0
          ? {
              code:
                name === 'Tea' ? "list.prepend(makeRow('Tea'))" : "list.append(makeRow('Coffee'))",
              apply: (screen) => addRow(screen, name),
            }
          : {
              code: `row('${name}').qty.textContent = ${qty}`,
              apply: (screen) => setQty(screen, name, qty),
            },
        setCount(beforeTotal + 1),
      ];
      if (beforeTotal === 0) {
        ops.push(
          {
            code: 'emptyMessage.hidden = true',
            apply: (screen) => ({ ...screen, emptyShown: false }),
          },
          {
            code: 'checkout.disabled = false',
            apply: (screen) => ({ ...screen, checkoutEnabled: true }),
          },
        );
      }
      return ops;
    }
    case 'remove': {
      const { name } = action;
      const qty = before[name] - 1;
      const ops: Op[] = [
        qty === 0
          ? removeRow(name)
          : {
              code: `row('${name}').qty.textContent = ${qty}`,
              apply: (screen) => setQty(screen, name, qty),
            },
        setCount(beforeTotal - 1),
      ];
      if (beforeTotal - 1 === 0) ops.push(showEmpty, lockCheckout);
      return ops;
    }
    case 'clear':
      return [
        ...products.filter((name) => before[name] > 0).map(removeRow),
        setCount(0),
        showEmpty,
        lockCheckout,
      ];
  }
}

function nextCart(cart: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'add':
      return { ...cart, [action.name]: cart[action.name] + 1 };
    case 'remove':
      return cart[action.name] === 0 ? cart : { ...cart, [action.name]: cart[action.name] - 1 };
    case 'clear':
      return totalOf(cart) === 0 ? cart : emptyCart;
  }
}

function labelOf(action: CartAction): string {
  switch (action.type) {
    case 'add':
      return `Add ${action.name.toLowerCase()}`;
    case 'remove':
      return `Remove ${action.name.toLowerCase()}`;
    case 'clear':
      return 'Clear cart';
  }
}

function reduce(state: State, action: Action): State {
  if (action.type === 'reset') return initialState(state.forget);
  if (action.type === 'forget') return { ...state, forget: action.forget };
  const cart = nextCart(state.cart, action);
  if (cart === state.cart) return state;
  const ops = opsFor(action, state.cart);
  const written = ops.map((op): Written => ({
    code: op.code,
    written: !(state.forget && op.forgettable),
  }));
  const screen = ops.reduce(
    (current, op, index) => (written[index]?.written ? op.apply(current) : current),
    state.screen,
  );
  return {
    ...state,
    cart,
    screen,
    last: { label: labelOf(action), ops: written },
    handOps: state.handOps + written.filter((entry) => entry.written).length,
    stateCalls: state.stateCalls + 1,
  };
}

function differences(actual: Screen, expected: Screen): string[] {
  const found: string[] = [];
  if (actual.count !== expected.count) found.push('the badge shows the wrong count');
  if (actual.emptyShown !== expected.emptyShown) {
    found.push(
      expected.emptyShown ? 'the empty message is hidden' : 'the empty message is still showing',
    );
  }
  if (actual.checkoutEnabled !== expected.checkoutEnabled) {
    found.push(
      expected.checkoutEnabled
        ? 'checkout is disabled with items in the cart'
        : 'checkout is enabled on an empty cart',
    );
  }
  const rows = (screen: Screen) => screen.rows.map((row) => `${row.name}${row.qty}`).join(',');
  if (rows(actual) !== rows(expected)) found.push('the rows do not match the cart');
  return found;
}

function CartScreen({ label, screen }: { label: string; screen: Screen }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-2.5 rounded-lg border border-line bg-bg p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-semibold">Cart</p>
        <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.76rem] tabular-nums">
          {`${screen.count} ${screen.count === 1 ? 'item' : 'items'}`}
        </span>
      </div>
      {screen.rows.length > 0 && (
        <ul aria-label="Cart rows" className="grid gap-1 text-[0.88rem]">
          {screen.rows.map((row) => (
            <li key={row.name} className="flex justify-between gap-2">
              <span>{row.name}</span>
              <span className="font-mono tabular-nums">{`x ${row.qty}`}</span>
            </li>
          ))}
        </ul>
      )}
      {screen.emptyShown && <p className="text-[0.84rem] text-faint">Your cart is empty.</p>}
      <button
        type="button"
        className="kit-btn justify-self-start"
        disabled={!screen.checkoutEnabled}
      >
        Checkout
      </button>
    </div>
  );
}

function OpList({ last }: { last: State['last'] }) {
  if (!last) {
    return (
      <p className="text-[0.84rem] text-muted">Press a button to see the steps you would write.</p>
    );
  }
  return (
    <div className="grid gap-1.5">
      <p className="text-[0.78rem] text-muted">{`Last event: ${last.label}`}</p>
      <ol aria-label="DOM operations" className="grid gap-1">
        {last.ops.map((entry, index) => (
          <li
            key={index}
            className={cn(
              'rounded border px-2 py-1 font-mono text-[0.74rem]',
              entry.written ? 'border-line bg-surface-2' : 'border-bad text-faint line-through',
            )}
          >
            {entry.code}
            {!entry.written && <span className="sr-only"> (forgotten)</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

const declarativeCode = `function Cart({ cart }) {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  return (
    <section>
      <span>{count} items</span>
      {Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([name, qty]) => <Row key={name} name={name} qty={qty} />)}
      {count === 0 && <p>Your cart is empty.</p>}
      <button disabled={count === 0}>Checkout</button>
    </section>
  );
}`;

export function DescribeOrCommandLab() {
  const [state, dispatch] = useReducer(reduce, undefined, () => initialState());
  const expected = screenOf(state.cart);
  const drift = differences(state.screen, expected);
  const meterMax = Math.max(20, state.handOps);

  return (
    <div className="@container grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="kit-btn"
          onClick={() => dispatch({ type: 'add', name: 'Tea' })}
        >
          Add tea
        </button>
        <button
          type="button"
          className="kit-btn"
          onClick={() => dispatch({ type: 'add', name: 'Coffee' })}
        >
          Add coffee
        </button>
        <button
          type="button"
          className="kit-btn"
          aria-disabled={state.cart.Tea === 0 ? true : undefined}
          onClick={() => dispatch({ type: 'remove', name: 'Tea' })}
        >
          Remove tea
        </button>
        <button
          type="button"
          className="kit-btn"
          aria-disabled={totalOf(state.cart) === 0 ? true : undefined}
          onClick={() => dispatch({ type: 'clear' })}
        >
          Clear cart
        </button>
        <button type="button" className="kit-btn" onClick={() => dispatch({ type: 'reset' })}>
          Reset
        </button>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
        <input
          type="checkbox"
          className="kit-check mt-0"
          checked={state.forget}
          onChange={(event) => dispatch({ type: 'forget', forget: event.target.checked })}
        />
        Forget one branch by hand: never disable checkout when the cart empties
      </label>

      <div className="grid items-start gap-3 @xl:grid-cols-2">
        <section aria-labelledby="by-hand-heading" className="grid gap-3">
          <div className="grid gap-0.5">
            <h4 id="by-hand-heading">You write the steps</h4>
            <p className="text-[0.8rem] text-muted">Every event mutates each part it affects.</p>
          </div>
          <CartScreen label="Hand-written screen" screen={state.screen} />
          <OpList last={state.last} />
          <Meter
            label="DOM operations written by hand"
            value={state.handOps}
            max={meterMax}
            thresholds={{ warn: 8, bad: 16 }}
          />
        </section>

        <section aria-labelledby="described-heading" className="grid gap-3">
          <div className="grid gap-0.5">
            <h4 id="described-heading">You describe the result</h4>
            <p className="text-[0.8rem] text-muted">
              Every event sets state. One function draws it.
            </p>
          </div>
          <CartScreen label="Described screen" screen={expected} />
          <div className="grid gap-1.5">
            <p className="text-[0.78rem] text-muted">
              {state.last ? `Last event: ${state.last.label}` : 'Press a button to see the call.'}
            </p>
            {state.last && (
              <p className="rounded border border-line bg-surface-2 px-2 py-1 font-mono text-[0.74rem]">
                setCart(next)
              </p>
            )}
          </div>
          <Meter label="State updates written" value={state.stateCalls} max={meterMax} />
        </section>
      </div>

      <p
        role="status"
        aria-label="Sync check"
        className={cn(
          'flex min-h-[2.6em] items-start gap-2 border-l-2 pl-3 text-[0.88rem]',
          drift.length > 0 ? 'tone-bad border-bad' : 'border-(--tc,var(--accent)) text-muted',
        )}
      >
        {drift.length > 0 ? (
          <>
            <TriangleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            {`The hand-written screen has drifted from the data: ${drift.join(', ')}.`}
          </>
        ) : (
          'Both screens match the cart.'
        )}
      </p>

      <CodePeek title="The whole described component" code={declarativeCode} />
    </div>
  );
}
