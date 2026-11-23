import { pick, rand, useCartSummary } from './useRecs';
import './recs-v1.css';

export default function RecsV1() {
  const { count } = useCartSummary();

  return (
    <div className="recs-v1" data-recs-version="v1">
      <p className="recs-v1-lead">
        {count === 0 ? 'You might like' : `Because you have ${count} in your cart`}
      </p>
      <ul className="recs-v1-list" aria-label="Recommendations">
        {pick(count).map((item) => (
          <li key={item.sku}>
            <span>{item.name}</span>
            <span className="recs-v1-price">{rand.format(item.price)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
