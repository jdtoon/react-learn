import { useId, useState } from 'react';
import { Meter } from '../../kit';
import { cn } from '../../kit/cn';
import {
  assess,
  boundaryOptions,
  budgetOptions,
  conflictOptions,
  defaultInputs,
  maxTeams,
  minTeams,
  platformOptions,
  presets,
  sameInputs,
  stackOptions,
  type Factor,
  type Inputs,
  type Option,
  type Verdict,
} from './decision';

interface ChoiceProps<T extends string> {
  label: string;
  hint: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

function Choice<T extends string>({ label, hint, options, value, onChange }: ChoiceProps<T>) {
  const hintId = useId();
  return (
    <div role="group" aria-label={label} aria-describedby={hintId} className="grid gap-1.5">
      <p className="text-[0.88rem] font-medium">{label}</p>
      <div className="kit-seg">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p id={hintId} className="text-[0.76rem] text-faint">
        {hint}
      </p>
    </div>
  );
}

const verdictTone: Record<Verdict, string> = {
  single: 'var(--faint)',
  monolith: 'var(--warn)',
  pilot: 'var(--accent)',
  mfe: 'var(--ok)',
};

function formatPoints(factor: Factor): string {
  if (factor.points < 0) return `−${Math.abs(factor.points)}`;
  return `${Math.round(factor.points * 10) / 10} / ${factor.weight}`;
}

function Breakdown({ factors }: { factors: Factor[] }) {
  const sides: { side: Factor['side']; title: string }[] = [
    { side: 'pressure', title: 'Pressure to split' },
    { side: 'capacity', title: 'Capacity to carry the cost' },
  ];
  return (
    <div className="grid gap-3">
      <p className="eyebrow">How the score is built</p>
      <div className="grid items-start gap-4 @xl:grid-cols-2">
        {sides.map(({ side, title }) => (
          <table key={side} className="w-full border-collapse text-[0.8rem]">
            <caption className="pb-1 text-left text-[0.76rem] text-muted">{title}</caption>
            <tbody>
              {factors
                .filter((factor) => factor.side === side)
                .map((factor) => (
                  <tr key={factor.id} className="border-t border-line">
                    <th scope="row" className="py-1 pr-2 text-left font-normal">
                      {factor.label}
                    </th>
                    <td className="py-1 pr-2 text-muted">{factor.answer}</td>
                    <td
                      className={cn(
                        'py-1 text-right font-mono whitespace-nowrap tabular-nums',
                        factor.points < 0 && 'tone-bad',
                      )}
                    >
                      {formatPoints(factor)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}

export function ShouldWeLab() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const result = assess(inputs);
  const teamsId = useId();

  function update<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="@container grid gap-5">
      <div role="group" aria-label="Start from a situation" className="grid gap-1.5">
        <p className="eyebrow">Start from a situation</p>
        <div className="kit-seg">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={sameInputs(inputs, preset.inputs)}
              onClick={() => setInputs(preset.inputs)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-5 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor={teamsId} className="flex items-baseline justify-between gap-3">
              <span className="text-[0.88rem] font-medium">Teams</span>
              <output htmlFor={teamsId} className="font-mono text-[0.86rem] tabular-nums">
                {inputs.teams}
              </output>
            </label>
            <input
              id={teamsId}
              type="range"
              min={minTeams}
              max={maxTeams}
              step={1}
              value={inputs.teams}
              onChange={(event) => update('teams', Number(event.target.value))}
              className="w-full accent-(--accent)"
            />
            <p className="text-[0.76rem] text-faint">Teams shipping changes to this product.</p>
          </div>
          <Choice
            label="Release conflicts"
            hint="How often one team's release waits on another's."
            options={conflictOptions}
            value={inputs.conflicts}
            onChange={(value) => update('conflicts', value)}
          />
          <Choice
            label="Domain boundaries"
            hint="Whether the business seams have stopped moving."
            options={boundaryOptions}
            value={inputs.boundaries}
            onChange={(value) => update('boundaries', value)}
          />
          <Choice
            label="Stack"
            hint="Legacy to wrap is a real driver. Several frameworks by choice is a weak one."
            options={stackOptions}
            value={inputs.stack}
            onChange={(value) => update('stack', value)}
          />
          <Choice
            label="Performance budget"
            hint="How much headroom you have for extra requests and JavaScript."
            options={budgetOptions}
            value={inputs.budget}
            onChange={(value) => update('budget', value)}
          />
          <Choice
            label="Platform team"
            hint="Who owns the shell, tokens, shared dependencies and observability."
            options={platformOptions}
            value={inputs.platform}
            onChange={(value) => update('platform', value)}
          />
        </div>

        <div className="grid gap-4 @xl:sticky @xl:top-20">
          <div
            role="status"
            aria-live="polite"
            data-verdict={result.verdict}
            className="grid gap-2 rounded-xl border border-line border-t-[3px] bg-surface p-4"
            style={{ borderTopColor: verdictTone[result.verdict] }}
          >
            <p className="eyebrow">Recommendation</p>
            <p className="font-display text-[1.15rem] leading-snug font-semibold">{result.title}</p>
            <p className="text-[0.9rem] leading-relaxed text-muted">{result.reason}</p>
          </div>

          <div className="grid gap-3">
            <Meter label="Pressure to split" value={result.pressure} max={100} />
            <Meter
              label="Capacity to carry the cost"
              value={result.capacity}
              max={100}
              thresholds={{ warn: 59, bad: 44 }}
            />
          </div>

          <div className="grid gap-2">
            <p className="eyebrow">Named risks</p>
            <ul className="grid gap-2">
              {result.risks.map((risk) => (
                <li key={risk.title} className="grid gap-0.5 text-[0.86rem] leading-snug">
                  <strong className="font-medium">{risk.title}</strong>
                  <span className="text-muted">{risk.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Breakdown factors={result.factors} />
    </div>
  );
}
