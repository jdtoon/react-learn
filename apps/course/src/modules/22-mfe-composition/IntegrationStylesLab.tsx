import { useState } from 'react';
import { Stepper, Waterfall } from '../../kit';
import { cn } from '../../kit/cn';
import {
  criteria,
  fitScore,
  scoreLabels,
  styles,
  zones,
  type CriterionId,
  type IntegrationStyle,
  type Score,
} from './integrationData';

const rowColumns = '@xl:grid-cols-[7.5rem_repeat(6,minmax(0,1fr))_3rem]';

function Rating({ score, stacked = false }: { score: Score; stacked?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex gap-1.5',
        stacked ? 'flex-col items-start gap-0.5 @xl:items-center' : 'items-center',
      )}
      data-score={score}
    >
      <span aria-hidden="true" className="flex gap-0.5">
        {[1, 2, 3].map((pip) => (
          <i
            key={pip}
            className={cn(
              'h-1.5 w-2.5 rounded-sm',
              pip <= score ? 'bg-(--tc,var(--accent))' : 'bg-line',
            )}
          />
        ))}
      </span>
      <span className="text-[0.76rem]">{scoreLabels[score]}</span>
    </span>
  );
}

function StepView({ style, index }: { style: IntegrationStyle; index: number }) {
  const step = style.steps[index];
  const visible = style.requests.filter((request) => request.step <= index);
  return (
    <div className="grid gap-4">
      <ol aria-label="Where this step happens" className="grid grid-cols-4 gap-1.5">
        {zones.map((zone) => {
          const active = step?.zone === zone.id;
          return (
            <li
              key={zone.id}
              aria-current={active ? 'step' : undefined}
              data-active={active ? 'true' : undefined}
              className={cn(
                'rounded-md border px-1 py-1.5 text-center font-mono text-[0.72rem]',
                active
                  ? 'border-(--tc,var(--accent)) bg-[color-mix(in_oklab,var(--tc,var(--accent))_18%,transparent)]'
                  : 'border-line text-faint',
              )}
            >
              {zone.label}
            </li>
          );
        })}
      </ol>
      {visible.length === 0 ? (
        <p className="text-[0.86rem] text-muted">No network requests yet.</p>
      ) : (
        <div className="grid gap-2">
          <p className="text-[0.8rem] text-muted" data-requests={visible.length}>
            {`${visible.length} ${visible.length === 1 ? 'request' : 'requests'} so far. Timings are illustrative.`}
          </p>
          <Waterfall
            total={style.span}
            requests={visible.map((request) => ({
              id: request.id,
              label: request.label,
              start: request.start,
              end: request.end,
              status: request.step === index ? 'pending' : 'ok',
            }))}
          />
        </div>
      )}
    </div>
  );
}

function StyleDetail({ style }: { style: IntegrationStyle }) {
  return (
    <section
      aria-label={`Details for ${style.label}`}
      className="grid gap-5 rounded-xl border border-line border-t-[3px] border-t-(--tc,var(--accent)) bg-surface p-4"
    >
      <div className="grid gap-2">
        <p className="eyebrow">{`Why ${style.label} rates this way`}</p>
        <ul className="grid gap-x-5 gap-y-2 @xl:grid-cols-2">
          {criteria.map((criterion) => {
            const rating = style.ratings[criterion.id];
            return (
              <li key={criterion.id} className="grid gap-0.5 text-[0.84rem] leading-snug">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="font-medium">{criterion.label}</strong>
                  <Rating score={rating.score} />
                </span>
                <span className="text-muted">{rating.why}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="grid gap-2">
        <p className="eyebrow">{`What happens at load: ${style.label}`}</p>
        <Stepper
          key={style.id}
          steps={style.steps.map((step, index) => ({
            title: step.title,
            description: step.description,
            content: <StepView style={style} index={index} />,
          }))}
        />
      </div>
    </section>
  );
}

export function IntegrationStylesLab() {
  const [picked, setPicked] = useState<CriterionId[]>([]);
  const [selectedId, setSelectedId] = useState<IntegrationStyle['id']>('federation');
  const selected = styles.find((style) => style.id === selectedId) ?? styles[0];

  const scores = styles.map((style) => fitScore(style, picked));
  const best = Math.max(...scores);
  const maxScore = picked.length * 3;

  function toggle(id: CriterionId) {
    setPicked((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  return (
    <div className="@container grid gap-5">
      <div role="group" aria-label="What matters for this slot" className="grid gap-1.5">
        <p className="eyebrow">What matters for this slot?</p>
        <div className="flex flex-wrap gap-2">
          {criteria.map((criterion) => (
            <button
              key={criterion.id}
              type="button"
              className="kit-btn"
              aria-pressed={picked.includes(criterion.id)}
              onClick={() => toggle(criterion.id)}
            >
              {criterion.label}
            </button>
          ))}
        </div>
        <p className="text-[0.76rem] text-faint" aria-live="polite">
          {picked.length === 0
            ? 'Pick one or more to score every style. Select a style name for its load steps.'
            : `Each style scores the ratings of your picks, out of ${maxScore}. Ties share the badge.`}
        </p>
      </div>

      <div role="table" aria-label="Integration styles compared" className="grid gap-2">
        <div
          role="row"
          className={cn(
            'hidden gap-2 px-2.5 text-center text-[0.68rem] leading-tight text-muted @xl:grid',
            rowColumns,
          )}
        >
          <span role="columnheader">Style</span>
          {criteria.map((criterion) => (
            <span
              key={criterion.id}
              role="columnheader"
              data-picked={picked.includes(criterion.id) ? 'true' : undefined}
              className={cn(picked.includes(criterion.id) && 'text-fg')}
            >
              {criterion.label}
            </span>
          ))}
          <span role="columnheader">Fit</span>
        </div>

        {styles.map((style, index) => {
          const fit = scores[index] ?? 0;
          const isBest = picked.length > 0 && fit === best;
          const isSelected = style.id === selectedId;
          return (
            <div
              key={style.id}
              role="row"
              data-style={style.id}
              data-selected={isSelected ? 'true' : undefined}
              data-best={isBest ? 'true' : undefined}
              className={cn(
                'grid grid-cols-2 items-center gap-x-3 gap-y-2 rounded-lg border bg-surface p-2.5 @md:grid-cols-3',
                rowColumns,
                isSelected ? 'border-(--tc,var(--accent))' : 'border-line',
              )}
            >
              <div
                role="rowheader"
                className="col-span-full flex flex-wrap items-center gap-2 @xl:col-auto"
              >
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(style.id)}
                  className="text-left text-[0.9rem] font-medium underline-offset-4 hover:underline aria-pressed:text-(--tc-text,var(--accent))"
                >
                  {style.label}
                </button>
                {isBest && (
                  <span className="rounded border border-(--tc,var(--accent)) px-1.5 font-mono text-[0.64rem] uppercase">
                    Best fit
                  </span>
                )}
              </div>
              {criteria.map((criterion) => (
                <div
                  key={criterion.id}
                  role="cell"
                  data-picked={picked.includes(criterion.id) ? 'true' : undefined}
                  className={cn(
                    'grid justify-items-start gap-0.5 rounded px-1 py-0.5 @xl:justify-items-center',
                    picked.includes(criterion.id) &&
                      'bg-[color-mix(in_oklab,var(--tc,var(--accent))_14%,transparent)]',
                  )}
                >
                  <span className="text-[0.68rem] text-muted @xl:hidden">{criterion.label}</span>
                  <Rating stacked score={style.ratings[criterion.id].score} />
                </div>
              ))}
              <div
                role="cell"
                data-fit={picked.length > 0 ? fit : undefined}
                className="col-span-full font-mono text-[0.8rem] tabular-nums @xl:col-auto @xl:text-center"
              >
                {picked.length > 0 ? `${fit}/${maxScore}` : ''}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[0.76rem] text-faint">
        Ratings are rules of thumb for a typical setup, not benchmarks. Strong is always the good
        end: low runtime cost, small blast radius.
      </p>

      {selected && <StyleDetail style={selected} />}
    </div>
  );
}
