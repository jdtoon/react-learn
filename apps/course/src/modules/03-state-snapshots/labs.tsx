import type { LabComponents } from '../../content/types';
import { BatchingLab } from './BatchingLab';
import { StaleTimerLab } from './StaleTimerLab';

export const labs: LabComponents = {
  batching: BatchingLab,
  'stale-timer': StaleTimerLab,
};
