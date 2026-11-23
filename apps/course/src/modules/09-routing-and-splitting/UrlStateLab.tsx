import { Check, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

type Where = 'url' | 'state';
type Category = 'all' | 'keyboards' | 'mice' | 'monitors';
type Sort = 'name' | 'price-asc' | 'price-desc';

interface Filters {
  q: string;
  cat: Category;
  sort: Sort;
}

interface Product {
  name: string;
  category: Exclude<Category, 'all'>;
  price: number;
}

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'keyboards', label: 'Keyboards' },
  { id: 'mice', label: 'Mice' },
  { id: 'monitors', label: 'Monitors' },
];

const sorts: { id: Sort; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'price-asc', label: 'Price, low to high' },
  { id: 'price-desc', label: 'Price, high to low' },
];

const products: Product[] = [
  { name: 'Alder 65 keyboard', category: 'keyboards', price: 129 },
  { name: 'Birch TKL keyboard', category: 'keyboards', price: 99 },
  { name: 'Cedar split keyboard', category: 'keyboards', price: 189 },
  { name: 'Drift wireless mouse', category: 'mice', price: 59 },
  { name: 'Ember ergonomic mouse', category: 'mice', price: 79 },
  { name: 'Fern trackball', category: 'mice', price: 89 },
  { name: 'Grove 24 inch monitor', category: 'monitors', price: 179 },
  { name: 'Hazel 27 inch monitor', category: 'monitors', price: 289 },
  { name: 'Ivy ultrawide monitor', category: 'monitors', price: 499 },
  { name: 'Juniper compact keyboard', category: 'keyboards', price: 79 },
  { name: 'Larch gaming mouse', category: 'mice', price: 69 },
];

const defaults: Filters = { q: '', cat: 'all', sort: 'name' };

function isCategory(value: string | null): value is Category {
  return categories.some((item) => item.id === value);
}

function isSort(value: string | null): value is Sort {
  return sorts.some((item) => item.id === value);
}

function readFilters(params: URLSearchParams): Filters {
  const cat = params.get('cat');
  const sort = params.get('sort');
  return {
    q: params.get('q')?.slice(0, 40) ?? defaults.q,
    cat: isCategory(cat) ? cat : defaults.cat,
    sort: isSort(sort) ? sort : defaults.sort,
  };
}

function toParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.cat !== defaults.cat) params.set('cat', filters.cat);
  if (filters.sort !== defaults.sort) params.set('sort', filters.sort);
  return params;
}

function applyFilters(filters: Filters): Product[] {
  const needle = filters.q.trim().toLowerCase();
  const matches = products.filter(
    (product) =>
      (filters.cat === 'all' || product.category === filters.cat) &&
      product.name.toLowerCase().includes(needle),
  );
  return [...matches].sort((a, b) => {
    if (filters.sort === 'price-asc') return a.price - b.price;
    if (filters.sort === 'price-desc') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });
}

interface PanelProps {
  filters: Filters;
  onChange: (next: Filters, mode: 'push' | 'replace') => void;
}

function FilterPanel({ filters, onChange }: PanelProps) {
  const results = applyFilters(filters);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <label className="grid gap-1.5 text-[0.88rem]">
          <span className="text-muted">Search</span>
          <input
            type="search"
            aria-label="Search products"
            placeholder="Type to filter"
            value={filters.q}
            onChange={(event) => onChange({ ...filters, q: event.target.value }, 'replace')}
            className="h-9 w-48 max-w-full rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint"
          />
        </label>
        <div role="group" aria-label="Category" className="kit-seg">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === filters.cat}
              onClick={() => onChange({ ...filters, cat: item.id }, 'push')}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="grid gap-1.5 text-[0.88rem]">
          <span className="text-muted">Sort</span>
          <select
            aria-label="Sort products"
            value={filters.sort}
            onChange={(event) => {
              const value = event.target.value;
              if (isSort(value)) onChange({ ...filters, sort: value }, 'push');
            }}
            className="h-9 rounded-lg border border-line bg-bg px-2 text-[0.9rem]"
          >
            {sorts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ul aria-label="Products" className="grid gap-1.5">
        {results.length === 0 && <li className="text-[0.88rem] text-faint">No products match.</li>}
        {results.map((product) => (
          <li
            key={product.name}
            className="flex items-baseline justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-1.5 text-[0.88rem]"
          >
            <span className="min-w-0 break-words">{product.name}</span>
            <span className="shrink-0 font-mono text-[0.78rem] tabular-nums text-muted">{`$${product.price}`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UrlPanel() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);

  return (
    <FilterPanel
      filters={filters}
      onChange={(next, mode) =>
        setParams(toParams(next), { replace: mode === 'replace', preventScrollReset: true })
      }
    />
  );
}

function StatePanel() {
  const [filters, setFilters] = useState<Filters>(defaults);
  return <FilterPanel filters={filters} onChange={(next) => setFilters(next)} />;
}

function AddressBar({ where }: { where: Where }) {
  const [params] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const search = where === 'url' ? params.toString() : '';
  const address = `${window.location.host}${window.location.pathname}${search ? `?${search}` : ''}`;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${window.location.pathname}${search ? `?${search}` : ''}`,
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5">
      <p
        aria-label="Address bar"
        className="min-w-0 flex-1 break-all font-mono text-[0.76rem] text-muted"
      >
        {address}
      </p>
      <button
        type="button"
        className="kit-btn min-h-8 shrink-0 px-2.5 text-[0.8rem]"
        onClick={copy}
      >
        {copied ? <Check aria-hidden="true" size={14} /> : <Link2 aria-hidden="true" size={14} />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}

export function UrlStateLab() {
  const [where, setWhere] = useState<Where>('url');
  const [, setParams] = useSearchParams();
  const [reloads, setReloads] = useState(0);

  function choose(next: Where) {
    if (next === where) return;
    setParams(new URLSearchParams(), { replace: true, preventScrollReset: true });
    setWhere(next);
    setReloads((value) => value + 1);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="group" aria-label="Where the filters live" className="kit-seg">
          <button type="button" aria-pressed={where === 'url'} onClick={() => choose('url')}>
            URL
          </button>
          <button type="button" aria-pressed={where === 'state'} onClick={() => choose('state')}>
            useState
          </button>
        </div>
        <button type="button" className="kit-btn" onClick={() => setReloads((value) => value + 1)}>
          Simulate reload
        </button>
        <p className="font-mono text-[0.78rem] text-muted">
          {where === 'url' ? 'filters = useSearchParams()' : 'filters = useState()'}
        </p>
      </div>

      <AddressBar where={where} />

      <div key={`${where}-${reloads}`}>{where === 'url' ? <UrlPanel /> : <StatePanel />}</div>
    </div>
  );
}
