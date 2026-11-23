import { emit, on } from '@react-field-guide/mfe-contracts';
import { useCallback, useEffect, useState } from 'react';
import './cart.css';

interface Line {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

interface Promo {
  code: string;
  percentOff: number;
}

interface CartState {
  lines: Line[];
  promo: Promo | null;
}

const rand = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
});

function subtotal(lines: Line[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

function summarise(state: CartState) {
  const gross = subtotal(state.lines);
  const discount = state.promo ? Math.round((gross * state.promo.percentOff) / 100) : 0;
  return {
    count: state.lines.reduce((sum, line) => sum + line.quantity, 0),
    gross,
    discount,
    total: gross - discount,
  };
}

function addLine(state: CartState, item: { sku: string; name: string; price: number }): CartState {
  const existing = state.lines.find((line) => line.sku === item.sku);
  const lines = existing
    ? state.lines.map((line) =>
        line.sku === item.sku ? { ...line, quantity: line.quantity + 1 } : line,
      )
    : [...state.lines, { ...item, quantity: 1 }];
  return { ...state, lines };
}

let stored: CartState = { lines: [], promo: null };

export default function Cart() {
  const [state, setState] = useState<CartState>(stored);

  const commit = useCallback((next: CartState) => {
    stored = next;
    setState(next);
    const { count, total } = summarise(next);
    emit('cart:updated', { count, total }, 'react-cart');
  }, []);

  useEffect(() => {
    const stopAdd = on('cart:add', (item) => commit(addLine(stored, item)), 'cart');
    const stopPromo = on(
      'promo:applied',
      (promo) => commit({ ...stored, promo: { ...promo } }),
      'cart',
    );

    return () => {
      stopAdd();
      stopPromo();
    };
  }, [commit]);

  const { count, gross, discount, total } = summarise(state);

  return (
    <div className="cart" data-count={count}>
      {state.lines.length === 0 ? (
        <p className="cart-empty">Your cart is empty. Add something from the catalogue.</p>
      ) : (
        <ul className="cart-lines" aria-label="Cart items">
          {state.lines.map((line) => (
            <li key={line.sku} className="cart-line">
              <span className="cart-qty">{line.quantity}x</span>
              <span className="cart-name">{line.name}</span>
              <span className="cart-price">{rand.format(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>
      )}
      {state.promo && (
        <p className="cart-promo">
          <span>
            Promo {state.promo.code} ({state.promo.percentOff}% off)
          </span>
          <span>-{rand.format(discount)}</span>
        </p>
      )}
      <p className="cart-total" aria-live="polite">
        <span>
          {count} {count === 1 ? 'item' : 'items'}
        </span>
        <strong>{rand.format(total)}</strong>
      </p>
      {discount > 0 && <p className="cart-was">Was {rand.format(gross)}</p>}
      <button
        type="button"
        className="cart-clear"
        disabled={state.lines.length === 0}
        onClick={() => {
          commit({ ...stored, lines: [] });
        }}
      >
        Clear cart
      </button>
    </div>
  );
}
