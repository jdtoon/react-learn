import { freeDeliveryFrom, pick, rand, useCartSummary } from './useRecs';
import './recs-v2.css';

export default function RecsV2() {
  const { count, total } = useCartSummary();
  const remaining = Math.max(0, freeDeliveryFrom - total);

  return (
    <div className="recs-v2" data-recs-version="v2">
      <header className="recs-v2-head">
        <span className="recs-v2-badge">New</span>
        <strong>Picked for you</strong>
      </header>
      <ul className="recs-v2-cards" aria-label="Recommendations">
        {pick(count).map((item) => (
          <li key={item.sku} className="recs-v2-card">
            <span className="recs-v2-art" aria-hidden="true" />
            <span className="recs-v2-name">{item.name}</span>
            <span className="recs-v2-why">{item.reason}</span>
            <span className="recs-v2-price">{rand.format(item.price)}</span>
          </li>
        ))}
      </ul>
      <p className="recs-v2-delivery">
        {remaining === 0
          ? 'Free delivery unlocked'
          : `${rand.format(remaining)} more for free delivery`}
      </p>
    </div>
  );
}
