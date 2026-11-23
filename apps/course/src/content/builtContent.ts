import { curriculum } from './curriculum';
import { builtModules } from './registry';
import type { ModuleContent } from './types';

export function listBuiltContent(): ModuleContent[] {
  return curriculum.flatMap((meta) => {
    const entry = builtModules[meta.slug];
    return entry ? [entry.content] : [];
  });
}
