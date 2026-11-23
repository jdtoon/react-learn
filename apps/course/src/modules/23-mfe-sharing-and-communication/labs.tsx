import type { LabComponents } from '../../content/types';
import { CssIsolationLab } from './CssIsolationLab';
import { EventBusLab } from './EventBusLab';
import { SharedDepsLab } from './SharedDepsLab';

export const labs: LabComponents = {
  'event-bus': EventBusLab,
  'shared-deps': SharedDepsLab,
  'css-isolation': CssIsolationLab,
};
