import { ArrowLeft, ArrowRight, Check, ExternalLink } from 'lucide-react';
import { Suspense, use, useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useProgress } from '../app/progress';
import { padNumber, trackStyle } from '../app/trackStyle';
import { isBuilt } from '../content/registry';
import { curriculum, trackById } from '../content/curriculum';
import type { LabComponents, ModuleContent, ModuleEntry, ModuleMeta } from '../content/types';
import { LabFrame, MeetingCardView, PitfallCard, RichText, SelfCheck } from '../kit';
import { LabBoundary } from './LabBoundary';

type LoadLabs = ModuleEntry['loadLabs'];

export interface ModulePageProps {
  content: ModuleContent;
  loadLabs: LoadLabs;
}

interface SectionInfo {
  id: string;
  title: string;
}

const labRequests = new WeakMap<LoadLabs, Promise<{ labs: LabComponents }>>();

function requestLabs(load: LoadLabs): Promise<{ labs: LabComponents }> {
  let request = labRequests.get(load);
  if (!request) {
    const started = load();
    request = started;
    labRequests.set(load, started);
    started.catch(() => labRequests.delete(load));
  }
  return request;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function ErrorBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="alert" className="grid gap-1 rounded-xl border border-bad bg-surface p-4">
      <p className="font-display font-semibold text-bad">{title}</p>
      <p className="text-[0.9rem] text-muted">{children}</p>
    </div>
  );
}

function PageSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="grid scroll-mt-20 gap-5 border-t border-line pt-8"
    >
      <header className="grid gap-1.5">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={headingId}>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function ModuleHeader({ content }: { content: ModuleContent }) {
  const track = trackById[content.track];
  const outcomesId = useId();
  return (
    <header className="grid gap-5">
      <p className="eyebrow flex items-center gap-2">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-(--tc)" />
        {`${track.title} · Module ${padNumber(content.number)} · ${content.minutes} min`}
      </p>
      <h1>{content.title}</h1>
      <p className="max-w-[60ch] text-[1.1rem] leading-relaxed">{content.oneIdea}</p>
      <div className="grid gap-2.5 rounded-xl border border-line border-t-[3px] border-t-(--tc) bg-surface p-4">
        <p id={outcomesId} className="eyebrow">
          After this you can
        </p>
        <ul aria-labelledby={outcomesId} className="grid gap-2">
          {content.outcomes.map((outcome, index) => (
            <li key={index} className="flex gap-2.5 text-[0.95rem] leading-snug">
              <Check aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-(--tc)" />
              <span>
                <RichText text={outcome} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function LabList({ content, loadLabs }: { content: ModuleContent; loadLabs: LoadLabs }) {
  const { labs } = use(requestLabs(loadLabs));

  return (
    <div className="grid gap-6">
      {content.labs.map((spec) => {
        const Lab = labs[spec.id];
        return (
          <LabBoundary
            key={spec.id}
            fallback={(error) => (
              <ErrorBox title={`${spec.title} failed to render`}>{error.message}</ErrorBox>
            )}
          >
            <LabFrame spec={spec}>
              {Lab ? (
                <Lab />
              ) : (
                <ErrorBox title="Lab not found">
                  {`The content declares a lab with id "${spec.id}" but the module has no component for it.`}
                </ErrorBox>
              )}
            </LabFrame>
          </LabBoundary>
        );
      })}
    </div>
  );
}

function LabsFallback() {
  return (
    <div
      role="status"
      aria-label="Loading labs"
      className="rounded-xl border border-dashed border-line bg-surface p-6 font-mono text-sm text-muted"
    >
      Loading labs
    </div>
  );
}

function LinkList({ links }: { links: ModuleContent['links'] }) {
  return (
    <ul className="grid gap-2.5">
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 hover:border-(--tc)"
          >
            <span className="grid min-w-0 gap-0.5">
              <span className="font-medium">{link.label}</span>
              <span className="truncate font-mono text-[0.72rem] text-muted">
                {hostOf(link.url)}
              </span>
            </span>
            <ExternalLink aria-hidden="true" size={16} className="shrink-0 text-muted" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function CompletionPanel({ slug }: { slug: string }) {
  const complete = useProgress((state) => state.completed[slug] === true);
  const toggleComplete = useProgress((state) => state.toggleComplete);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line border-t-[3px] border-t-(--tc) bg-surface p-5">
      <div className="grid gap-1">
        <p className="font-display text-lg font-semibold">
          {complete ? 'Module complete' : 'Finished this module?'}
        </p>
        <p className="text-[0.9rem] text-muted">
          Progress stays in this browser and shows on the course map.
        </p>
      </div>
      <div className="flex items-center gap-3">
        {complete && (
          <span className="inline-flex items-center gap-1.5 tone-ok font-mono text-[0.78rem]">
            <Check aria-hidden="true" size={15} />
            Completed
          </span>
        )}
        <button type="button" className="kit-btn" onClick={() => toggleComplete(slug)}>
          {complete ? 'Mark incomplete' : 'Mark complete'}
        </button>
      </div>
    </div>
  );
}

function Neighbour({
  meta,
  direction,
}: {
  meta: ModuleMeta | undefined;
  direction: 'previous' | 'next';
}) {
  if (!meta) return null;
  const next = direction === 'next';
  const Icon = next ? ArrowRight : ArrowLeft;
  return (
    <Link
      to={`/modules/${meta.slug}`}
      style={trackStyle(meta.track)}
      className={`group grid gap-1 rounded-xl border border-line border-t-[3px] border-t-(--tc) bg-surface p-4 hover:border-(--tc) ${next ? 'text-right sm:col-start-2' : ''}`}
    >
      <span className={`eyebrow flex items-center gap-1.5 ${next ? 'justify-end' : ''}`}>
        {!next && <Icon aria-hidden="true" size={13} />}
        {next ? 'Next' : 'Previous'}
        {next && <Icon aria-hidden="true" size={13} />}
      </span>
      <span className="font-display font-semibold">{`${padNumber(meta.number)} ${meta.title}`}</span>
      {!isBuilt(meta.slug) && <span className="font-mono text-[0.7rem] text-faint">planned</span>}
    </Link>
  );
}

export function ModulePage({ content, loadLabs }: ModulePageProps) {
  const position = curriculum.findIndex((module) => module.slug === content.slug);
  const previous = position > 0 ? curriculum[position - 1] : undefined;
  const next = position >= 0 ? curriculum[position + 1] : undefined;

  const sections: SectionInfo[] = [
    ...(content.sections.length > 0 ? [{ id: 'model', title: 'The model' }] : []),
    ...(content.labs.length > 0 ? [{ id: 'labs', title: 'Labs' }] : []),
    ...(content.pitfalls.length > 0 ? [{ id: 'pitfalls', title: 'Pitfalls' }] : []),
    { id: 'meeting', title: 'In the meeting' },
    ...(content.selfCheck.length > 0 ? [{ id: 'self-check', title: 'Self-check' }] : []),
    ...(content.links.length > 0 ? [{ id: 'go-deeper', title: 'Go deeper' }] : []),
  ];

  return (
    <article
      style={trackStyle(content.track)}
      className="@container mx-auto w-full max-w-[62rem] px-4 py-10 sm:px-8 sm:py-14"
    >
      <title>{`${content.title} | React Field Guide`}</title>
      <div className="grid gap-12 @4xl:grid-cols-[minmax(0,46rem)_minmax(0,11rem)] @4xl:justify-center @4xl:gap-14">
        <div className="grid min-w-0 gap-12">
          <ModuleHeader content={content} />

          {content.sections.length > 0 && (
            <PageSection id="model" eyebrow="Read this first" title="The model">
              <div className="grid gap-6">
                {content.sections.map((section) => (
                  <div key={section.heading} className="grid gap-2">
                    <h3>{section.heading}</h3>
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={index} className="max-w-[64ch] leading-relaxed">
                        <RichText text={paragraph} />
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </PageSection>
          )}

          {content.labs.length > 0 && (
            <PageSection id="labs" eyebrow="Poke at it" title="Labs">
              <LabBoundary
                fallback={(error) => (
                  <ErrorBox title="The labs for this module failed to load">
                    {error.message}
                  </ErrorBox>
                )}
              >
                <Suspense fallback={<LabsFallback />}>
                  <LabList content={content} loadLabs={loadLabs} />
                </Suspense>
              </LabBoundary>
            </PageSection>
          )}

          {content.pitfalls.length > 0 && (
            <PageSection id="pitfalls" eyebrow="Avoid these" title="Pitfalls">
              <div className="grid gap-4">
                {content.pitfalls.map((pitfall) => (
                  <PitfallCard key={pitfall.title} pitfall={pitfall} />
                ))}
              </div>
            </PageSection>
          )}

          <PageSection id="meeting" eyebrow="Before the meeting" title="In the meeting">
            <MeetingCardView card={content.meeting} />
            <p>
              <Link
                to={`/meeting#${content.slug}`}
                className="text-[0.9rem] text-muted underline decoration-line underline-offset-4 hover:decoration-(--tc)"
              >
                See every module's meeting card
              </Link>
            </p>
          </PageSection>

          {content.selfCheck.length > 0 && (
            <PageSection id="self-check" eyebrow="Check yourself" title="Self-check">
              <SelfCheck items={content.selfCheck} />
            </PageSection>
          )}

          {content.links.length > 0 && (
            <PageSection id="go-deeper" eyebrow="Keep reading" title="Go deeper">
              <LinkList links={content.links} />
            </PageSection>
          )}

          <CompletionPanel slug={content.slug} />

          <nav aria-label="Module navigation" className="grid gap-3 sm:grid-cols-2">
            <Neighbour meta={previous} direction="previous" />
            <Neighbour meta={next} direction="next" />
          </nav>
        </div>

        <nav aria-label="On this page" className="hidden @4xl:block">
          <div className="sticky top-[calc(var(--topbar-h)+1.5rem)] grid gap-2">
            <p className="eyebrow">On this page</p>
            <ul className="grid gap-0.5 border-l border-line">
              {sections.map((section) => (
                <li key={section.id}>
                  <Link
                    to={`#${section.id}`}
                    className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-[0.86rem] text-muted hover:border-(--tc) hover:text-fg"
                  >
                    {section.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </article>
  );
}
