import { use } from 'react';
import { useParams } from 'react-router';
import { getModule } from '../content/registry';
import type { LabComponents, ModuleEntry } from '../content/types';
import { ModulePage } from '../module-page/ModulePage';
import { NotFoundPage } from './NotFoundPage';
import { PlannedModulePage } from './PlannedModulePage';

const labRequests = new Map<string, Promise<{ labs: LabComponents }>>();

function requestLabs(slug: string, entry: ModuleEntry) {
  let request = labRequests.get(slug);
  if (!request) {
    request = entry.loadLabs();
    request.catch(() => labRequests.delete(slug));
    labRequests.set(slug, request);
  }
  return request;
}

function BuiltModule({ slug, entry }: { slug: string; entry: ModuleEntry }) {
  const { labs } = use(requestLabs(slug, entry));
  return <ModulePage content={entry.content} labs={labs} />;
}

export function ModuleRoute() {
  const { slug = '' } = useParams();
  const found = getModule(slug);

  if (!found) return <NotFoundPage />;
  if (!found.entry) return <PlannedModulePage meta={found.meta} />;
  return <BuiltModule slug={slug} entry={found.entry} />;
}
