import { getLog, on } from '@react-field-guide/mfe-contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Catalog from './Catalog';
import identity from './reactIdentity';

const busKey = Symbol.for('rfg.mfe-bus');

afterEach(() => {
  Reflect.deleteProperty(globalThis, busKey);
});

describe('Catalog', () => {
  it('lists the products with a labelled Add button each', () => {
    render(<Catalog />);

    const list = screen.getByRole('list', { name: 'Products' });
    for (const name of ['Field jacket', 'Trail boots', 'Map case']) {
      expect(within(list).getByText(name)).toBeInTheDocument();
      expect(within(list).getByRole('button', { name: `Add ${name}` })).toBeInTheDocument();
    }
  });

  it('shows each price in rand', () => {
    render(<Catalog />);

    const jacket = screen.getByRole('listitem', { name: 'Field jacket' });
    expect(jacket).toHaveTextContent(/R\s?1\s?899/);
  });

  it('counts what has been added, using state that lives inside the remote', async () => {
    const user = userEvent.setup();
    render(<Catalog />);

    expect(screen.getByText('Added this visit: 0')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Field jacket' }));
    await user.click(screen.getByRole('button', { name: 'Add Field jacket' }));
    await user.click(screen.getByRole('button', { name: 'Add Map case' }));

    expect(screen.getByText('Added this visit: 3')).toBeInTheDocument();
  });

  it('emits cart:add with the product, from react-catalog', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    const unsubscribe = on('cart:add', handler, 'test');
    render(<Catalog />);

    await user.click(screen.getByRole('button', { name: 'Add Trail boots' }));
    unsubscribe();

    expect(handler).toHaveBeenCalledWith(
      { sku: 'trail-boots', name: 'Trail boots', price: 2499 },
      { source: 'react-catalog' },
    );
  });

  it('carries on when nothing is listening and the event is dropped', async () => {
    const user = userEvent.setup();
    render(<Catalog />);

    await user.click(screen.getByRole('button', { name: 'Add Map case' }));

    expect(screen.getByText('Added this visit: 1')).toBeInTheDocument();
    expect(getLog().at(-1)).toMatchObject({ type: 'cart:add', delivered: 0 });
  });
});

describe('reactIdentity', () => {
  it('exposes the React the remote resolved', () => {
    expect(identity).toBe(React);
  });
});
