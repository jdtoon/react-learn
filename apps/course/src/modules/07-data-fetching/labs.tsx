import type { LabComponents } from '../../content/types';
import { BoundaryLab } from './BoundaryLab';
import { WaterfallLab } from './WaterfallLab';

export const labs: LabComponents = {
  'waterfall-sim': WaterfallLab,
  'boundary-placement': BoundaryLab,
};
