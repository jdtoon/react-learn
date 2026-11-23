import type { LabComponents } from '../../content/types';
import { KeyboardChallengeLab } from './KeyboardChallengeLab';
import { XrayLab } from './XrayLab';

export const labs: LabComponents = {
  'a11y-xray': XrayLab,
  'div-soup-vs-semantic': KeyboardChallengeLab,
};
