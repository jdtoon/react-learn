import { emit } from '@react-field-guide/mfe-contracts';
import { useState } from 'react';
import './catalog.css';

interface Product {
  sku: string;
  name: string;
  price: number;
}

const products: readonly Product[] = [
  { sku: 'field-jacket', name: 'Field jacket', price: 1899 },
  { sku: 'trail-boots', name: 'Trail boots', price: 2499 },
  { sku: 'map-case', name: 'Map case', price: 349 },
];

const rand = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
});

export default function Catalog() {
  const [added, setAdded] = useState(0);

  function add(product: Product) {
    setAdded((count) => count + 1);
    emit(
      'cart:add',
      { sku: product.sku, name: product.name, price: product.price },
      'react-catalog',
    );
  }

  return (
    <div className="catalog">
      <ul className="catalog-products" aria-label="Products">
        {products.map((product) => (
          <li
            key={product.sku}
            className="catalog-product"
            aria-labelledby={`catalog-name-${product.sku}`}
          >
            <span className="catalog-swatch" aria-hidden="true" />
            <span id={`catalog-name-${product.sku}`} className="catalog-name">
              {product.name}
            </span>
            <span className="catalog-price">{rand.format(product.price)}</span>
            <button type="button" aria-label={`Add ${product.name}`} onClick={() => add(product)}>
              Add
            </button>
          </li>
        ))}
      </ul>
      <p className="catalog-count" aria-live="polite">
        Added this visit: {added}
      </p>
    </div>
  );
}
