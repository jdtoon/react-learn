import type { LabComponents } from '../../content/types';
import { OwnershipLab } from './OwnershipLab';
import { PropExplosionLab } from './PropExplosionLab';

export const labs: LabComponents = {
  'prop-explosion': PropExplosionLab,
  'state-ownership': OwnershipLab,
};
