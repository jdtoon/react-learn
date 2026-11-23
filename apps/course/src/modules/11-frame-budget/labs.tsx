import type { LabComponents } from '../../content/types';
import { CompositorLab } from './CompositorLab';
import { FrameBudgetLab } from './FrameBudgetLab';

export const labs: LabComponents = {
  'frame-budget': FrameBudgetLab,
  'compositor-glide': CompositorLab,
};
