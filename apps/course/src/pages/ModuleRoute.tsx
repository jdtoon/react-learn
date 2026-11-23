import { useParams } from 'react-router';
import { getModule } from '../content/registry';
import { ModulePage } from '../module-page/ModulePage';
import { NotFoundPage } from './NotFoundPage';
import { PlannedModulePage } from './PlannedModulePage';

export function ModuleRoute() {
  const { slug = '' } = useParams();
  const found = getModule(slug);

  if (!found) return <NotFoundPage />;
  if (!found.entry) return <PlannedModulePage meta={found.meta} />;
  return <ModulePage key={slug} content={found.entry.content} loadLabs={found.entry.loadLabs} />;
}
