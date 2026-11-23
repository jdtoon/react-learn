import { getLog, on } from '@react-field-guide/mfe-contracts';
import { useEffect, useState } from 'react';

export interface Suggestion {
  sku: string;
  name: string;
  price: number;
  reason: string;
}

const pool: readonly Suggestion[] = [
  { sku: 'wool-socks', name: 'Wool socks', price: 189, reason: 'Pairs with boots' },
  { sku: 'trail-flask', name: 'Trail flask', price: 429, reason: 'Often added with a jacket' },
  { sku: 'head-torch', name: 'Head torch', price: 599, reason: 'Popular this week' },
  { sku: 'rain-cover', name: 'Pack rain cover', price: 279, reason: 'Keeps the map case dry' },
  { sku: 'compass', name: 'Field compass', price: 349, reason: 'Pairs with a map case' },
];

export const freeDeliveryFrom = 2000;

export function pick(count: number): Suggestion[] {
  return [0, 1, 2].map((offset) => pool[(count + offset) % pool.length] as Suggestion);
}

export const rand = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
});

function lastKnownSummary() {
  const entry = getLog().findLast((item) => item.type === 'cart:updated');
  const payload = entry?.payload as { count: number; total: number } | undefined;
  return { count: payload?.count ?? 0, total: payload?.total ?? 0 };
}

export function useCartSummary() {
  const [summary, setSummary] = useState(lastKnownSummary);

  useEffect(
    () =>
      on(
        'cart:updated',
        (payload) => setSummary({ count: payload.count, total: payload.total }),
        'recs',
      ),
    [],
  );

  return summary;
}
