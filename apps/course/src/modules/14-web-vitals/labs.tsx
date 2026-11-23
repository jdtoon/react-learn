import type { LabComponents } from '../../content/types';
import { LayoutShiftLab } from './LayoutShiftLab';
import { LongTaskLab } from './LongTaskLab';

export const labs: LabComponents = {
  'layout-shift': LayoutShiftLab,
  'long-task-vs-yield': LongTaskLab,
};
