import type { CSSProperties } from 'react';
import { clamp } from './cn';

export type TimelineEventKind =
  'render' | 'commit' | 'effect' | 'cleanup' | 'network' | 'paint' | 'idle' | 'task';

export interface TimelineLane {
  id: string;
  label: string;
}

export interface TimelineEvent {
  id: string;
  lane: string;
  start: number;
  end?: number;
  label: string;
  kind: TimelineEventKind;
}

export interface TimelineProps {
  lanes: TimelineLane[];
  events: TimelineEvent[];
  duration: number;
  cursor?: number;
}

interface PlacedEvent {
  event: TimelineEvent;
  row: number;
  left: number;
  width: number;
}

const minWidthPercent = 5;
const tickFractions = [0, 0.25, 0.5, 0.75, 1];
const kindOrder: TimelineEventKind[] = [
  'render',
  'commit',
  'effect',
  'cleanup',
  'network',
  'paint',
  'task',
  'idle',
];

function formatMs(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ms`;
}

function detail(event: TimelineEvent): string {
  const range =
    event.end === undefined
      ? `at ${formatMs(event.start)}`
      : `${formatMs(event.start)} to ${formatMs(event.end)}`;
  return `${event.kind}, ${range}`;
}

function placeEvents(
  events: TimelineEvent[],
  span: number,
): { placed: PlacedEvent[]; rows: number } {
  const rowEnds: number[] = [];
  const placed = [...events]
    .sort((a, b) => a.start - b.start)
    .map((event): PlacedEvent => {
      const left = clamp((event.start / span) * 100, 0, 100);
      const rawWidth = (((event.end ?? event.start) - event.start) / span) * 100;
      const width = Math.min(Math.max(rawWidth, minWidthPercent), 100 - left);
      let row = rowEnds.findIndex((rowEnd) => rowEnd <= left);
      if (row === -1) row = rowEnds.length;
      rowEnds[row] = left + width;
      return { event, row, left, width };
    });
  return { placed, rows: Math.max(rowEnds.length, 1) };
}

function LaneRow({
  lane,
  events,
  span,
  gridRow,
}: {
  lane: TimelineLane;
  events: TimelineEvent[];
  span: number;
  gridRow: number;
}) {
  const { placed, rows } = placeEvents(events, span);
  return (
    <>
      <span className="tl-lane-label" style={{ gridColumn: 1, gridRow }}>
        {lane.label}
      </span>
      <ul
        aria-label={lane.label}
        className="tl-track"
        style={{ gridColumn: 2, gridRow, '--rows': rows } as CSSProperties}
      >
        {placed.map(({ event, row, left, width }) => (
          <li
            key={event.id}
            data-kind={event.kind}
            title={`${event.label}: ${detail(event)}`}
            className="tl-event tl-k"
            style={{ '--l': `${left}%`, '--w': `${width}%`, '--row': row } as CSSProperties}
          >
            <span>{event.label}</span>
            <span className="sr-only">{`, ${detail(event)}`}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Timeline({ lanes, events, duration, cursor }: TimelineProps) {
  const span = duration > 0 ? duration : 1;
  const laneIds = new Set(lanes.map((lane) => lane.id));
  const kinds = kindOrder.filter((kind) =>
    events.some((event) => event.kind === kind && laneIds.has(event.lane)),
  );

  return (
    <div role="group" aria-label="Timeline" className="grid gap-3 pt-5">
      <div className="tl-grid">
        {lanes.map((lane, index) => (
          <LaneRow
            key={lane.id}
            gridRow={index + 1}
            lane={lane}
            events={events.filter((event) => event.lane === lane.id)}
            span={span}
          />
        ))}
        {cursor !== undefined && lanes.length > 0 && (
          <div
            aria-hidden="true"
            className="tl-cursor-layer"
            style={{ gridColumn: 2, gridRow: `1 / span ${lanes.length}` }}
          >
            <div
              className="tl-cursor"
              style={{ '--l': `${clamp((cursor / span) * 100, 0, 100)}%` } as CSSProperties}
            >
              <span>{formatMs(cursor)}</span>
            </div>
          </div>
        )}
        <div
          aria-hidden="true"
          className="tl-axis"
          style={{ gridColumn: 2, gridRow: lanes.length + 1 }}
        >
          {tickFractions.map((fraction) => (
            <span key={fraction}>{formatMs(Math.round(span * fraction * 10) / 10)}</span>
          ))}
        </div>
      </div>
      {cursor !== undefined && <p className="sr-only">{`Cursor at ${formatMs(cursor)}`}</p>}
      {kinds.length > 0 && (
        <ul aria-label="Event kinds" className="tl-legend">
          {kinds.map((kind) => (
            <li key={kind} data-kind={kind} className="tl-k">
              <i />
              {kind}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
