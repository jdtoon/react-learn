import type { LabComponents } from '../../content/types';
import { DescribeOrCommandLab } from './DescribeOrCommandLab';
import { ElementXRayLab } from './ElementXRayLab';

export const labs: LabComponents = {
  'describe-or-command': DescribeOrCommandLab,
  'element-xray': ElementXRayLab,
};
