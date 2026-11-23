import { emit } from '@react-field-guide/mfe-contracts';
import { Storefront } from '../../mfe-host/Storefront';
import { CodePeek } from '../../kit';
import { BusPaths } from './BusPaths';
import { StorefrontPlaceholder, useStorefrontLease } from './StorefrontLease';

const contract = `export type MfeEventMap = {
  'cart:add': { sku: string; name: string; price: number };
  'cart:updated': { count: number; total: number };
  'promo:applied': { code: string; percentOff: number };
  'account:changed': { signedIn: boolean; name: string | null };
  'locator:store-selected': { storeId: string; label: string };
};

emit('cart:add', { sku, name, price }, 'react-catalog');

const stop = on('cart:updated', (summary) => setSummary(summary), 'recs');`;

function sendCartAdd() {
  emit('cart:add', { sku: 'trail-flask', name: 'Trail flask', price: 429 }, 'react-catalog');
}

function sendStoreSelected() {
  emit('locator:store-selected', { storeId: 'cape-town', label: 'Cape Town' }, 'legacy-iframe');
}

export function EventBusLab() {
  const lease = useStorefrontLease('event-bus', true);

  return (
    <div className="grid gap-5">
      <BusPaths />

      <div className="flex flex-wrap gap-2">
        <button type="button" className="kit-btn" onClick={sendCartAdd}>
          Emit cart:add
        </button>
        <button type="button" className="kit-btn" onClick={sendStoreSelected}>
          Emit locator:store-selected
        </button>
      </div>

      {lease.active ? (
        <Storefront controls={['log']} />
      ) : (
        <StorefrontPlaceholder onRun={lease.claim} />
      )}

      <CodePeek title="The typed contract" lang="ts" code={contract} />
    </div>
  );
}
