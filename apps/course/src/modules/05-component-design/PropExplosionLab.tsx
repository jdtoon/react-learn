import { useState, type ReactNode } from 'react';
import { CodePeek, Meter } from '../../kit';
import { cn } from '../../kit/cn';

type Mode = 'configured' | 'composed';
type RequirementId = 'image' | 'badge' | 'overlay' | 'actions' | 'align' | 'selected';

interface Requirement {
  id: RequirementId;
  label: string;
  props: string[];
  requires: RequirementId[];
}

const requirements: Requirement[] = [
  { id: 'image', label: 'Show an image', props: ['image', 'imageAlt'], requires: [] },
  { id: 'badge', label: 'Show a status badge', props: ['badge'], requires: [] },
  {
    id: 'overlay',
    label: 'Put the badge over the image',
    props: ['badgePlacement'],
    requires: ['image', 'badge'],
  },
  { id: 'actions', label: 'Show footer actions', props: ['actions'], requires: [] },
  {
    id: 'align',
    label: 'Right-align the actions',
    props: ['actionsAlign'],
    requires: ['actions'],
  },
  { id: 'selected', label: 'Highlight when selected', props: ['selected'], requires: [] },
];

const propTypes: Record<string, string> = {
  image: 'string',
  imageAlt: 'string',
  badge: 'string',
  badgePlacement: "'title' | 'image'",
  actions: 'ReactNode',
  actionsAlign: "'start' | 'end'",
  selected: 'boolean',
};

function activeOf(checked: Set<RequirementId>): Set<RequirementId> {
  const active = new Set<RequirementId>();
  for (const requirement of requirements) {
    if (checked.has(requirement.id) && requirement.requires.every((id) => active.has(id))) {
      active.add(requirement.id);
    }
  }
  return active;
}

interface PartProps {
  children?: ReactNode;
  className?: string;
}

function Badge({ children, className }: PartProps) {
  return (
    <span
      className={cn(
        'w-fit rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.7rem]',
        className,
      )}
    >
      {children}
    </span>
  );
}

function MediaFrame({ children, className }: PartProps) {
  return (
    <div className={cn('relative h-24 overflow-hidden rounded-lg', className)}>{children}</div>
  );
}

function Picture({ alt }: { alt: string }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className="absolute inset-0"
      style={{ background: 'linear-gradient(135deg, var(--accent), var(--surface-2))' }}
    />
  );
}

function SampleActions() {
  return (
    <>
      <button type="button" className="kit-btn">
        Open
      </button>
      <button type="button" className="kit-btn">
        Share
      </button>
    </>
  );
}

const cardClass = 'grid min-w-0 gap-3 rounded-xl border border-line bg-surface p-3';
const titleClass = 'flex flex-wrap items-center gap-2 font-display font-semibold';
const selectedClass = 'ring-2 ring-(--accent)';

interface ConfiguredCardProps {
  title: string;
  image?: string;
  imageAlt?: string;
  badge?: string;
  badgePlacement?: 'title' | 'image';
  actions?: ReactNode;
  actionsAlign?: 'start' | 'end';
  selected?: boolean;
}

function ConfiguredCard({
  title,
  image,
  imageAlt,
  badge,
  badgePlacement = 'title',
  actions,
  actionsAlign = 'start',
  selected,
}: ConfiguredCardProps) {
  const overImage = badge !== undefined && image !== undefined && badgePlacement === 'image';
  return (
    <article className={cn(cardClass, selected && selectedClass)}>
      {image !== undefined && (
        <MediaFrame>
          <Picture alt={imageAlt ?? image} />
          {overImage && <Badge className="absolute top-2 right-2">{badge}</Badge>}
        </MediaFrame>
      )}
      <p className={titleClass}>
        {title}
        {badge !== undefined && !overImage && <Badge>{badge}</Badge>}
      </p>
      {actions !== undefined && (
        <div className={cn('flex flex-wrap gap-2', actionsAlign === 'end' && 'justify-end')}>
          {actions}
        </div>
      )}
    </article>
  );
}

function CardRoot({ children, className }: PartProps) {
  return <article className={cn(cardClass, className)}>{children}</article>;
}

function CardTitle({ children, className }: PartProps) {
  return <p className={cn(titleClass, className)}>{children}</p>;
}

function CardActions({ children, className }: PartProps) {
  return <div className={cn('flex flex-wrap gap-2', className)}>{children}</div>;
}

const Card = Object.assign(CardRoot, {
  Media: MediaFrame,
  Title: CardTitle,
  Badge,
  Actions: CardActions,
});

function ConfiguredPreview({ active }: { active: Set<RequirementId> }) {
  return (
    <ConfiguredCard
      title="Q3 report"
      image={active.has('image') ? 'q3.png' : undefined}
      imageAlt={active.has('image') ? 'Quarterly chart' : undefined}
      badge={active.has('badge') ? 'Draft' : undefined}
      badgePlacement={active.has('overlay') ? 'image' : undefined}
      actions={active.has('actions') ? <SampleActions /> : undefined}
      actionsAlign={active.has('align') ? 'end' : undefined}
      selected={active.has('selected')}
    />
  );
}

function ComposedPreview({ active }: { active: Set<RequirementId> }) {
  const overlay = active.has('overlay');
  return (
    <Card className={active.has('selected') ? selectedClass : undefined}>
      {active.has('image') && (
        <Card.Media>
          <Picture alt="Quarterly chart" />
          {overlay && <Card.Badge className="absolute top-2 right-2">Draft</Card.Badge>}
        </Card.Media>
      )}
      <Card.Title>
        Q3 report
        {active.has('badge') && !overlay && <Card.Badge>Draft</Card.Badge>}
      </Card.Title>
      {active.has('actions') && (
        <Card.Actions className={active.has('align') ? 'justify-end' : undefined}>
          <SampleActions />
        </Card.Actions>
      )}
    </Card>
  );
}

function configuredApi(active: Set<RequirementId>): string {
  const props = requirements
    .filter((requirement) => active.has(requirement.id))
    .flatMap((requirement) => requirement.props)
    .map((name) => `  ${name}?: ${propTypes[name]};`);
  return ['interface CardProps {', '  title: string;', ...props, '}'].join('\n');
}

function configuredCall(active: Set<RequirementId>): string {
  const lines = ['<Card', '  title="Q3 report"'];
  if (active.has('image')) lines.push('  image="q3.png"', '  imageAlt="Quarterly chart"');
  if (active.has('badge')) lines.push('  badge="Draft"');
  if (active.has('overlay')) lines.push('  badgePlacement="image"');
  if (active.has('actions')) lines.push('  actions={<Actions />}');
  if (active.has('align')) lines.push('  actionsAlign="end"');
  if (active.has('selected')) lines.push('  selected');
  lines.push('/>');
  return lines.join('\n');
}

const composedApi = [
  'Card, Card.Media, Card.Title, Card.Badge, Card.Actions',
  '',
  'interface PartProps {',
  '  children?: ReactNode;',
  '  className?: string;',
  '}',
].join('\n');

function composedCall(active: Set<RequirementId>): string {
  const overlay = active.has('overlay');
  const lines = [active.has('selected') ? '<Card className="ring-2 ring-accent">' : '<Card>'];
  if (active.has('image')) {
    lines.push('  <Card.Media>', '    <img src="q3.png" alt="Quarterly chart" />');
    if (overlay) {
      lines.push('    <Card.Badge className="absolute top-2 right-2">Draft</Card.Badge>');
    }
    lines.push('  </Card.Media>');
  }
  if (active.has('badge') && !overlay) {
    lines.push(
      '  <Card.Title>',
      '    Q3 report',
      '    <Card.Badge>Draft</Card.Badge>',
      '  </Card.Title>',
    );
  } else {
    lines.push('  <Card.Title>Q3 report</Card.Title>');
  }
  if (active.has('actions')) {
    lines.push(
      active.has('align') ? '  <Card.Actions className="justify-end">' : '  <Card.Actions>',
      '    <Actions />',
      '  </Card.Actions>',
    );
  }
  lines.push('</Card>');
  return lines.join('\n');
}

export function PropExplosionLab() {
  const [mode, setMode] = useState<Mode>('configured');
  const [checked, setChecked] = useState<Set<RequirementId>>(new Set());
  const active = activeOf(checked);
  const configured = mode === 'configured';
  const propCount = configured
    ? 1 + requirements.reduce((sum, r) => sum + (active.has(r.id) ? r.props.length : 0), 0)
    : 2;

  function toggle(id: RequirementId) {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  }

  return (
    <div className="@container grid gap-4">
      <div role="group" aria-label="API style" className="kit-seg justify-self-start">
        <button type="button" aria-pressed={configured} onClick={() => setMode('configured')}>
          Configured
        </button>
        <button type="button" aria-pressed={!configured} onClick={() => setMode('composed')}>
          Composed
        </button>
      </div>

      <div className="grid items-start gap-4 @xl:grid-cols-[15rem_minmax(0,1fr)]">
        <fieldset className="grid gap-2">
          <legend className="eyebrow mb-1">The card must</legend>
          {requirements.map((requirement) => {
            const ready = requirement.requires.every((id) => active.has(id));
            return (
              <label
                key={requirement.id}
                className={cn(
                  'flex items-center gap-2 text-[0.88rem]',
                  ready ? 'cursor-pointer text-fg' : 'cursor-not-allowed text-faint',
                )}
              >
                <input
                  type="checkbox"
                  className="kit-check mt-0"
                  checked={active.has(requirement.id)}
                  disabled={!ready}
                  onChange={() => toggle(requirement.id)}
                />
                {requirement.label}
              </label>
            );
          })}
        </fieldset>

        <div className="grid min-w-0 gap-4">
          <div aria-label="Card preview" role="group" className="max-w-sm">
            {configured ? (
              <ConfiguredPreview active={active} />
            ) : (
              <ComposedPreview active={active} />
            )}
          </div>
          <div className="grid gap-3">
            <Meter
              label="Props on the widest component"
              value={propCount}
              max={8}
              thresholds={{ warn: 5, bad: 8 }}
            />
            <Meter
              label="Conditional branches inside Card"
              value={configured ? active.size : 0}
              max={6}
              thresholds={{ warn: 3, bad: 5 }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2 @xl:grid-cols-2">
        <CodePeek
          title={configured ? 'The props type you maintain' : 'The API you maintain'}
          code={configured ? configuredApi(active) : composedApi}
          defaultOpen
        />
        <CodePeek
          title="The call site"
          code={configured ? configuredCall(active) : composedCall(active)}
          defaultOpen
        />
      </div>
    </div>
  );
}
