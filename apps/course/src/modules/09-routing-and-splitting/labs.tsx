import type { LabComponents } from '../../content/types';
import { ChunkLab } from './ChunkLab';
import { UrlStateLab } from './UrlStateLab';

export const labs: LabComponents = {
  'chunk-map': ChunkLab,
  'url-state': UrlStateLab,
};
