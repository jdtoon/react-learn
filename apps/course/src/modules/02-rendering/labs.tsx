import type { LabComponents } from '../../content/types';
import { KeyChaosLab } from './KeyChaosLab';
import { RenderTreeLab } from './RenderTreeLab';
import { ResetWithKeyLab } from './ResetWithKeyLab';

export const labs: LabComponents = {
  'render-tree': RenderTreeLab,
  'key-chaos': KeyChaosLab,
  'reset-with-key': ResetWithKeyLab,
};
