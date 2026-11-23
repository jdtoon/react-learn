import { useEffect, useRef, useState, type RefObject } from 'react';
import { Compare, RichText } from '../../kit';
import { cn } from '../../kit/cn';
import { Storefront } from '../../mfe-host/Storefront';
import { StorefrontPlaceholder, useStorefrontLease } from './StorefrontLease';

type Mode = 'Light DOM' | 'Shadow root' | 'iframe';
type Result = 'restyled' | 'untouched';

interface Reading {
  slot: string;
  title: string;
  mode: Mode;
  result: Result;
}

const probeSelector = 'h4, p, li, span, strong, label, a, button, code';
const leakStyleId = 'rfg-css-leak';

function leakedInto(element: Element): boolean {
  return getComputedStyle(element).fontFamily.includes('Georgia');
}

function readSlot(slot: Element): Reading | null {
  if (slot.getAttribute('data-state') !== 'ready') return null;
  const body = slot.querySelector('.slot-body');
  const name = slot.getAttribute('data-slot');
  if (!body || !name) return null;
  const title = slot.querySelector('.slot-title')?.textContent ?? name;

  if (body.querySelector('iframe')) {
    return { slot: name, title, mode: 'iframe', result: 'untouched' };
  }
  const light = body.querySelector(probeSelector);
  if (light) {
    return {
      slot: name,
      title,
      mode: 'Light DOM',
      result: leakedInto(light) ? 'restyled' : 'untouched',
    };
  }
  for (const element of body.querySelectorAll('*')) {
    const inner = element.shadowRoot?.querySelector(probeSelector);
    if (inner) {
      return {
        slot: name,
        title,
        mode: 'Shadow root',
        result: leakedInto(inner) ? 'restyled' : 'untouched',
      };
    }
  }
  return null;
}

function readAll(scope: ParentNode | null): { leak: boolean; readings: Reading[] } {
  const slots = scope?.querySelectorAll('.storefront .slot[data-slot]') ?? [];
  const readings = [...slots].flatMap((slot) => {
    const reading = readSlot(slot);
    return reading ? [reading] : [];
  });
  return { leak: document.getElementById(leakStyleId) !== null, readings };
}

function useScoreboard(scope: RefObject<HTMLElement | null>): {
  leak: boolean;
  readings: Reading[];
} {
  const [snapshot, setSnapshot] = useState<{ leak: boolean; readings: Reading[] }>({
    leak: false,
    readings: [],
  });

  useEffect(() => {
    const read = () => {
      const next = readAll(scope.current);
      setSnapshot((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    read();
    const timer = setInterval(read, 400);
    return () => clearInterval(timer);
  }, [scope]);

  return snapshot;
}

function Scoreboard({ scope }: { scope: RefObject<HTMLElement | null> }) {
  const { leak, readings } = useScoreboard(scope);
  const restyled = readings.filter((reading) => reading.result === 'restyled').length;

  return (
    <div className="grid gap-2" data-leak-scoreboard={leak ? 'on' : 'off'}>
      <p className="eyebrow">Scoreboard, read from the real slots</p>
      <p role="status" aria-live="polite" className="text-[0.9rem] text-muted">
        {readings.length === 0
          ? 'Run the storefront in this lab to fill the scoreboard.'
          : leak
            ? `The leak is on: ${restyled} of ${readings.length} loaded slots were restyled.`
            : 'The leak is off. Turn it on and watch which slots change.'}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] text-left text-[0.86rem]">
          <thead className="text-[0.74rem] uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="py-1 pr-3 font-medium">Slot</th>
              <th className="py-1 pr-3 font-medium">Renders in</th>
              <th className="py-1 font-medium">Host rule reached it</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr
                key={reading.slot}
                data-slot-row={reading.slot}
                data-result={reading.result}
                className="border-t border-line"
              >
                <th scope="row" className="py-1.5 pr-3 text-left font-medium">
                  {reading.title}
                </th>
                <td className="py-1.5 pr-3 font-mono text-[0.8rem] text-muted">{reading.mode}</td>
                <td
                  className={cn(
                    'py-1.5 font-mono text-[0.8rem]',
                    leak && (reading.result === 'restyled' ? 'tone-bad' : 'tone-ok'),
                  )}
                >
                  {!leak ? 'leak is off' : reading.result === 'restyled' ? 'yes, restyled' : 'no'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Technique({ children }: { children: string }) {
  return (
    <p className="max-w-[62ch] text-[0.9rem] leading-relaxed text-muted">
      <RichText text={children} />
    </p>
  );
}

export function CssIsolationLab() {
  const lease = useStorefrontLease('css-isolation', false);
  const root = useRef<HTMLDivElement>(null);

  return (
    <div ref={root} className="grid gap-5">
      {lease.active ? (
        <Storefront controls={['css-leak']} />
      ) : (
        <StorefrontPlaceholder onRun={lease.claim} />
      )}
      <Scoreboard scope={root} />
      <Compare
        items={[
          {
            id: 'prefix',
            label: 'Prefixes and CSS Modules',
            verdict: 'neutral',
            content: (
              <Technique>
                Cheap and works in every framework. It prevents your own accidental collisions, but
                a global rule such as `button` in the host still reaches in, and yours can reach
                out. It relies on discipline, and a linter can enforce it.
              </Technique>
            ),
          },
          {
            id: 'shadow',
            label: 'Shadow DOM',
            verdict: 'good',
            content: (
              <Technique>
                Selectors stop at the boundary in both directions, while inherited properties and
                custom properties still cross, so design tokens work. The costs are that global
                resets and fonts must be passed in, overlays and portals can escape it, and a React
                remote needs a custom element wrapper.
              </Technique>
            ),
          },
          {
            id: 'iframe',
            label: 'iframe',
            verdict: 'neutral',
            content: (
              <Technique>
                A separate document, so styles, scripts and globals are fully isolated. It also
                brings sizing, deep linking, focus and accessibility work, and a second page load.
                Use it for a legacy page you cannot change.
              </Technique>
            ),
          },
        ]}
      />
    </div>
  );
}
