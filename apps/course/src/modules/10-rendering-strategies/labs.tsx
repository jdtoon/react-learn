import type { LabComponents } from '../../content/types';
import { BoundaryLab } from './BoundaryLab';
import { StrategyLab } from './StrategyLab';

export const labs: LabComponents = {
  'strategy-timeline': StrategyLab,
  'boundary-builder': BoundaryLab,
};
