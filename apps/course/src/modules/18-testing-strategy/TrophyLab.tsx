import { useState } from 'react';
import { Meter } from '../../kit';
import { budget, evaluate, layers, presets, type LayerId, type Shares } from './trophyModel';

const trophyShares: Shares = presets[1]?.shares ?? {
  static: 15,
  unit: 20,
  integration: 50,
  e2e: 15,
};

function sameShares(a: Shares, b: Shares): boolean {
  return layers.every((layer) => a[layer.id] === b[layer.id]);
}

export function TrophyLab() {
  const [shares, setShares] = useState<Shares>(trophyShares);
  const outcome = evaluate(shares);
  const total = layers.reduce((sum, layer) => sum + shares[layer.id], 0);

  function setShare(id: LayerId, value: number) {
    setShares((current) => ({ ...current, [id]: value }));
  }

  return (
    <div className="grid gap-4">
      <div role="group" aria-label="Presets" className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="kit-btn"
            aria-pressed={sameShares(shares, preset.shares)}
            onClick={() => setShares(preset.shares)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="kit-stage grid content-center gap-1.5" aria-label="Test shape">
          {layers.map((layer) => {
            const percent = total === 0 ? 0 : Math.round((shares[layer.id] / total) * 100);
            return (
              <div
                key={layer.id}
                data-layer={layer.id}
                className="mx-auto grid min-h-11 content-center rounded-md border border-line bg-surface px-3 py-1 text-center"
                style={{
                  width: `${Math.max(percent, 44)}%`,
                  opacity: percent === 0 ? 0.45 : 1,
                  borderColor: percent === 0 ? undefined : 'var(--tc, var(--accent))',
                }}
              >
                <span className="font-display text-[0.86rem] font-semibold">{layer.label}</span>
                <span className="font-mono text-[0.7rem] tabular-nums text-muted">
                  {percent}% of effort, ~{outcome.counts[layer.id]} tests
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid content-start gap-3">
          {layers.map((layer) => (
            <label key={layer.id} className="grid gap-1 text-[0.86rem]">
              <span className="flex items-baseline justify-between gap-3">
                <span>
                  {layer.label} <span className="text-muted">({layer.blurb})</span>
                </span>
                <span className="font-mono tabular-nums text-muted">{shares[layer.id]}</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={shares[layer.id]}
                aria-label={`${layer.label} effort`}
                onChange={(event) => setShare(layer.id, Number(event.target.value))}
                className="w-full accent-(--accent)"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <Meter
          label="Confidence that a release works"
          value={outcome.confidence}
          max={100}
          unit="%"
          thresholds={{ warn: 75, bad: 55 }}
        />
        <Meter
          label="CI time for this suite"
          value={outcome.ciMinutes}
          max={15}
          unit="min"
          thresholds={{ warn: 5, bad: 10 }}
        />
        <Meter
          label="Upkeep per month"
          value={outcome.upkeepHours}
          max={24}
          unit="h"
          thresholds={{ warn: 12, bad: 18 }}
        />
        <Meter
          label="Chance of a spurious red build"
          value={outcome.flakeRisk}
          max={50}
          unit="%"
          thresholds={{ warn: 20, bad: 35 }}
        />
      </div>

      <p className="text-[0.82rem] text-muted">
        {`Fixed budget of ${budget} effort units, split by the sliders. Illustrative model: read the shape, not the digits.`}
      </p>
    </div>
  );
}
