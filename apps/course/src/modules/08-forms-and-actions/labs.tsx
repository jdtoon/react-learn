import type { LabComponents } from '../../content/types';
import { KeystrokeLab } from './KeystrokeLab';
import { OptimisticLab } from './OptimisticLab';

export const labs: LabComponents = {
  'optimistic-actions': OptimisticLab,
  'keystroke-renders': KeystrokeLab,
};
