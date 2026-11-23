import { getLog, on } from '@react-field-guide/mfe-contracts';
import { useEffect, useState } from 'react';

interface Suggestion {
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

const freeDeliveryFrom = 2000;

const rand = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
});

function pick(count: number): Suggestion[] {
  return [0, 1, 2].map((offset) => pool[(count + offset) % pool.length] as Suggestion);
}

function lastKnownSummary() {
  const entry = getLog().findLast((item) => item.type === 'cart:updated');
  const payload = entry?.payload as { count: number; total: number } | undefined;
  return { count: payload?.count ?? 0, total: payload?.total ?? 0 };
}

export function Recs({ version }: { version: string }) {
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

  const items = pick(summary.count);
  const remaining = Math.max(0, freeDeliveryFrom - summary.total);

  if (version === 'v2') {
    return (
      <div className="iso iso-v2" data-recs-version="v2" data-recs-build="isolated">
        <header className="iso-head">
          <span className="iso-badge">New</span>
          <strong>Picked for you</strong>
        </header>
        <ul className="iso-cards" aria-label="Recommendations">
          {items.map((item) => (
            <li key={item.sku} className="iso-card">
              <span className="iso-art" aria-hidden="true" />
              <span className="iso-name">{item.name}</span>
              <span className="iso-why">{item.reason}</span>
              <span className="iso-price">{rand.format(item.price)}</span>
            </li>
          ))}
        </ul>
        <p className="iso-note">
          {remaining === 0
            ? 'Free delivery unlocked'
            : `${rand.format(remaining)} more for free delivery`}
          {' · '}own React copy
        </p>
      </div>
    );
  }

  return (
    <div className="iso iso-v1" data-recs-version="v1" data-recs-build="isolated">
      <p className="iso-lead">
        {summary.count === 0 ? 'You might like' : `Because you have ${summary.count} in your cart`}
      </p>
      <ul className="iso-list" aria-label="Recommendations">
        {items.map((item) => (
          <li key={item.sku}>
            <span>{item.name}</span>
            <span className="iso-price">{rand.format(item.price)}</span>
          </li>
        ))}
      </ul>
      <p className="iso-note">Own React copy</p>
    </div>
  );
}
