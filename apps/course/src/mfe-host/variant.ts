import { createContext } from 'react';

export type ComponentVariant = 'shadow' | 'light';

export const ComponentVariantContext = createContext<ComponentVariant>('shadow');
