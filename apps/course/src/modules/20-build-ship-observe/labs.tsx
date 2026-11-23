import type { LabComponents } from '../../content/types';
import { BundlerLab } from './BundlerLab';
import { PipelineLab } from './PipelineLab';

export const labs: LabComponents = {
  pipeline: PipelineLab,
  bundlers: BundlerLab,
};
