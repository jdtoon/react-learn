import type { RemoteFramework, RemoteKind } from '@react-field-guide/mfe-contracts';

export interface SlotMeta {
  id: string;
  title: string;
  wide: boolean;
}

export const storefrontSlots: readonly SlotMeta[] = [
  { id: 'promo', title: 'Promotion', wide: true },
  { id: 'catalog', title: 'Catalogue', wide: false },
  { id: 'cart', title: 'Cart', wide: false },
  { id: 'recs', title: 'Recommendations', wide: false },
  { id: 'account', title: 'Account', wide: false },
  { id: 'reviews', title: 'Reviews', wide: false },
  { id: 'locator', title: 'Store locator', wide: false },
];

export function slotMeta(id: string): SlotMeta | undefined {
  return storefrontSlots.find((slot) => slot.id === id);
}

export const frameworkLabels: Record<RemoteFramework, string> = {
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  angular: 'Angular',
  plain: 'Plain JS',
};

export const kindLabels: Record<RemoteKind, string> = {
  federation: 'Module Federation',
  'module-mount': 'ES module mount',
  'web-component': 'Web component',
  iframe: 'iframe',
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
