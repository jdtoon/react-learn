import type { LabComponents } from '../../content/types';
import { DeploySimulatorLab } from './DeploySimulatorLab';
import { ResilienceLab } from './ResilienceLab';
import { StranglerFigLab } from './StranglerFigLab';

export const labs: LabComponents = {
  'deploy-simulator': DeploySimulatorLab,
  resilience: ResilienceLab,
  'strangler-fig': StranglerFigLab,
};
