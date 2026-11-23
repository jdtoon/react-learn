import { subscribeLog } from '@react-field-guide/mfe-contracts';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Meter } from '../../kit';
import { Storefront } from '../../mfe-host/Storefront';
import { StorefrontPlaceholder, useStorefrontLease } from './StorefrontLease';

type Behaviour = 'throws' | 'missing' | 'hangs' | 'slow';
type Policy = 'none' | 'boundary' | 'timeout3' | 'timeout8';

interface Result {
  affected: number;
  page: string;
  slot: string;
  time: string;
}

interface Reading {
  total: number;
  ready: number;
  loading: number;
  failed: string[];
}

const totalSlots = 7;

const behaviours: { id: Behaviour; label: string }[] = [
  { id: 'throws', label: 'Throws while rendering' },
  { id: 'missing', label: 'Entry returns 404' },
  { id: 'hangs', label: 'Never answers' },
  { id: 'slow', label: 'Answers after 5 s' },
];

const policies: { id: Policy; label: string }[] = [
  { id: 'none', label: 'No protection' },
  { id: 'boundary', label: 'Error boundary' },
  { id: 'timeout3', label: 'Boundary + 3 s timeout' },
  { id: 'timeout8', label: 'Boundary + 8 s timeout' },
];

const contained = 'Keeps working';

function outcome(behaviour: Behaviour, policy: Policy): Result {
  const guarded = policy !== 'none';
  switch (behaviour) {
    case 'throws':
      return guarded
        ? { affected: 1, page: contained, slot: 'Fallback card', time: 'Immediately' }
        : {
            affected: totalSlots,
            page: 'Blank: the error unmounts the whole tree',
            slot: 'Gone with the page',
            time: 'Never, until a reload',
          };
    case 'missing':
      return guarded
        ? { affected: 1, page: contained, slot: 'Fallback card', time: 'About 100 ms' }
        : {
            affected: totalSlots,
            page: 'Blank: a rejected lazy import throws during render',
            slot: 'Gone with the page',
            time: 'Never, until a reload',
          };
    case 'hangs':
      if (policy === 'timeout3') {
        return { affected: 1, page: contained, slot: 'Fallback card', time: '3 s' };
      }
      if (policy === 'timeout8') {
        return { affected: 1, page: contained, slot: 'Fallback card', time: '8 s' };
      }
      return {
        affected: 1,
        page: 'Keeps working, if each slot has its own Suspense boundary',
        slot: 'Spinner forever. A hang is not an error, so a boundary never fires',
        time: 'Never',
      };
    case 'slow':
      if (policy === 'timeout3') {
        return {
          affected: 1,
          page: contained,
          slot: 'Fallback at 3 s, although the remote would have arrived at 5 s',
          time: '3 s',
        };
      }
      return {
        affected: 1,
        page: 'Keeps working, and the layout shifts when the slot lands unless space is reserved',
        slot: 'Content arrives at 5 s',
        time: 'Not needed',
      };
  }
}

function readSlots(scope: ParentNode | null): Reading {
  const slots = [...(scope?.querySelectorAll('.storefront .slot[data-slot]') ?? [])];
  const state = (slot: Element) => slot.getAttribute('data-state');
  return {
    total: slots.length,
    ready: slots.filter((slot) => state(slot) === 'ready').length,
    loading: slots.filter((slot) => state(slot) === 'loading').length,
    failed: slots
      .filter((slot) => state(slot) === 'failed')
      .map((slot) => slot.querySelector('.slot-title')?.textContent ?? 'A slot'),
  };
}

function useSlotReading(scope: RefObject<HTMLElement | null>): Reading {
  const [reading, setReading] = useState<Reading>({ total: 0, ready: 0, loading: 0, failed: [] });

  useEffect(() => {
    const read = () => {
      const next = readSlots(scope.current);
      setReading((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    read();
    const timer = setInterval(read, 300);
    return () => clearInterval(timer);
  }, [scope]);

  return reading;
}

function useLostAdditions(): number {
  const [lost, setLost] = useState(0);

  useEffect(
    () =>
      subscribeLog((entry) => {
        if (entry.type === 'cart:add' && entry.delivered === 0) setLost((count) => count + 1);
      }),
    [],
  );

  return lost;
}

function BlastRadius({ scope }: { scope: RefObject<HTMLElement | null> }) {
  const reading = useSlotReading(scope);
  const lost = useLostAdditions();
  const settled = reading.total > 0 && reading.loading === 0;
  const failedLabel = reading.failed.length === 0 ? 'none' : reading.failed.join(', ');

  return (
    <div className="grid gap-2" data-blast={settled ? reading.failed.length : 'loading'}>
      <p className="eyebrow">Blast radius, read from the real slots</p>
      {settled ? (
        <Meter
          label="Slots working"
          value={reading.ready}
          max={reading.total}
          thresholds={{ warn: reading.total - 1, bad: Math.ceil(reading.total / 2) }}
        />
      ) : (
        <p className="text-[0.88rem] text-muted">
          {reading.total === 0
            ? 'Run the storefront in this lab to measure it.'
            : 'Loading the remotes.'}
        </p>
      )}
      <p role="status" aria-live="polite" className="text-[0.88rem] text-muted">
        Failed: {failedLabel}. Cart additions that reached nobody:{' '}
        <b data-stat="lost-additions">{lost}</b>.
      </p>
    </div>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <p className="eyebrow">{label}</p>
      <div role="group" aria-label={label} className="kit-seg flex-wrap justify-self-start">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={option.id === value}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PolicyTable() {
  const [behaviour, setBehaviour] = useState<Behaviour>('hangs');
  const [policy, setPolicy] = useState<Policy>('boundary');
  const result = outcome(behaviour, policy);

  return (
    <div className="grid gap-3">
      <p className="eyebrow">Policy simulator</p>
      <Choice label="The remote" options={behaviours} value={behaviour} onChange={setBehaviour} />
      <Choice label="The host" options={policies} value={policy} onChange={setPolicy} />
      <div
        role="status"
        aria-live="polite"
        aria-label="Policy outcome"
        data-affected={result.affected}
        className="grid gap-2 rounded-lg border border-line bg-surface p-3 text-[0.9rem]"
      >
        <Meter
          label="Slots affected"
          value={result.affected}
          max={totalSlots}
          thresholds={{ warn: 2, bad: 5 }}
        />
        <dl className="grid gap-1.5">
          <div>
            <dt className="text-[0.74rem] uppercase tracking-[0.08em] text-muted">The page</dt>
            <dd>{result.page}</dd>
          </div>
          <div>
            <dt className="text-[0.74rem] uppercase tracking-[0.08em] text-muted">That slot</dt>
            <dd>{result.slot}</dd>
          </div>
          <div>
            <dt className="text-[0.74rem] uppercase tracking-[0.08em] text-muted">
              Usable fallback after
            </dt>
            <dd>{result.time}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function ResilienceLab() {
  const lease = useStorefrontLease('resilience', false);
  const root = useRef<HTMLDivElement>(null);

  return (
    <div ref={root} className="grid gap-5">
      <BlastRadius scope={root} />
      {lease.active ? (
        <Storefront controls={['kill', 'log']} />
      ) : (
        <StorefrontPlaceholder onRun={lease.claim} />
      )}
      <PolicyTable />
    </div>
  );
}
