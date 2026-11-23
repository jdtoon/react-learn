import type { ModuleEntry } from '../../content/types';
import { content } from './content';

const entry: ModuleEntry = {
  content,
  loadLabs: () => import('./labs'),
};

export default entry;
