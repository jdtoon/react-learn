import { padNumber, trackStyle } from '../app/trackStyle';
import { trackById } from '../content/curriculum';
import type { LabComponents, ModuleContent } from '../content/types';

export interface ModulePageProps {
  content: ModuleContent;
  labs: LabComponents;
}

export function ModulePage({ content }: ModulePageProps) {
  const track = trackById[content.track];

  return (
    <article
      style={trackStyle(content.track)}
      className="mx-auto grid max-w-[46rem] gap-5 px-4 py-10 sm:px-8 sm:py-14"
    >
      <title>{`${content.title} | React Field Guide`}</title>
      <p className="eyebrow flex items-center gap-2">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-(--tc)" />
        {`${track.title} · Module ${padNumber(content.number)} · ${content.minutes} min`}
      </p>
      <h1>{content.title}</h1>
      <p className="max-w-[60ch] text-[1.05rem] leading-relaxed">{content.oneIdea}</p>
    </article>
  );
}
