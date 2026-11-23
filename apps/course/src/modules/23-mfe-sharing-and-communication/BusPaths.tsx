import {
  getSubscribers,
  subscribeLog,
  type BusEntry,
  type MfeEventType,
} from '@react-field-guide/mfe-contracts';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

type Framework = 'react' | 'svelte' | 'angular' | 'plain';

interface BusNode {
  id: string;
  label: string;
  framework: Framework;
  side: 'left' | 'right';
  y: number;
}

interface Point {
  x: number;
  y: number;
}

interface Packet {
  id: string;
  points: Point[];
  dropped: boolean;
}

interface LastEvent {
  entry: BusEntry;
  routes: Point[][];
  dropped: boolean;
  involved: string[];
}

const nodes: readonly BusNode[] = [
  { id: 'catalog', label: 'Catalogue', framework: 'react', side: 'left', y: 50 },
  { id: 'promo', label: 'Promotion', framework: 'svelte', side: 'left', y: 130 },
  { id: 'account', label: 'Account', framework: 'angular', side: 'left', y: 210 },
  { id: 'cart', label: 'Cart', framework: 'react', side: 'right', y: 50 },
  { id: 'recs', label: 'Recommendations', framework: 'react', side: 'right', y: 130 },
  { id: 'locator', label: 'Store locator', framework: 'plain', side: 'right', y: 210 },
];

const sourceNodes: Record<string, string> = {
  'react-catalog': 'catalog',
  'svelte-promo': 'promo',
  'react-cart': 'cart',
  'angular-account': 'account',
  'legacy-iframe': 'locator',
};

const listenerNodes: Record<string, string> = { cart: 'cart', recs: 'recs' };

const eventTypes: readonly MfeEventType[] = [
  'cart:add',
  'cart:updated',
  'promo:applied',
  'account:changed',
  'locator:store-selected',
];

const busX = 200;
const busTop = 22;
const nodeWidth = 120;
const nodeHeight = 36;
const packetMs = 900;

function findNode(id: string | undefined): BusNode | undefined {
  return nodes.find((node) => node.id === id);
}

function edgeX(node: BusNode): number {
  return node.side === 'left' ? 10 + nodeWidth : 270;
}

function route(from: BusNode | undefined, to: BusNode | undefined): Point[] {
  const start = from ? { x: edgeX(from), y: from.y } : { x: busX, y: busTop };
  const onBus = { x: busX, y: from ? from.y : busTop };
  if (!to) return [start, onBus];
  return [start, onBus, { x: busX, y: to.y }, { x: edgeX(to), y: to.y }];
}

function nodeLabel(source: string): string {
  return findNode(sourceNodes[source])?.label ?? source;
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function PacketDot({ packet, onDone }: { packet: Packet; onDone: (id: string) => void }) {
  const ref = useRef<SVGCircleElement>(null);
  const first = packet.points[0];

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof element.animate !== 'function') {
      onDone(packet.id);
      return;
    }
    const lengths = packet.points.slice(1).map((point, index) => {
      const previous = packet.points[index];
      return previous ? Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y) : 0;
    });
    const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
    let travelled = 0;
    const frames: Keyframe[] = packet.points.map((point, index) => {
      if (index > 0) travelled += lengths[index - 1] ?? 0;
      return {
        transform: `translate(${point.x}px, ${point.y}px)`,
        opacity: packet.dropped && index === packet.points.length - 1 ? 0.15 : 1,
        offset: travelled / total,
      };
    });
    const animation = element.animate(frames, {
      duration: packetMs,
      easing: 'linear',
      fill: 'forwards',
    });
    animation.onfinish = () => onDone(packet.id);
    return () => animation.cancel();
  }, [packet, onDone]);

  return (
    <circle
      ref={ref}
      r={6}
      cx={0}
      cy={0}
      data-packet={packet.id}
      style={{
        transform: first ? `translate(${first.x}px, ${first.y}px)` : undefined,
        fill: packet.dropped ? 'var(--bad)' : 'var(--accent)',
      }}
    />
  );
}

function listenerSnapshot(): string {
  return eventTypes.map((type) => `${type}=${getSubscribers(type).join(',')}`).join(';');
}

function useListeners(): { type: string; names: string[] }[] {
  const [snapshot, setSnapshot] = useState(listenerSnapshot);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = listenerSnapshot();
      setSnapshot((previous) => (previous === next ? previous : next));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return snapshot.split(';').map((row) => {
    const [type = '', names = ''] = row.split('=');
    return { type, names: names === '' ? [] : names.split(',') };
  });
}

const chainWindowMs = 50;

function currentChain(recent: LastEvent[]): LastEvent[] {
  const latest = recent.at(-1);
  if (!latest) return [];
  return recent.filter((item) => latest.entry.at - item.entry.at < chainWindowMs);
}

function describe(last: LastEvent): string {
  const { entry, dropped } = last;
  const sender = nodeLabel(entry.source);
  if (dropped) {
    return `${sender} sent ${entry.type}. Nobody was listening, so it was dropped. Nothing failed.`;
  }
  const count = entry.delivered;
  return `${sender} sent ${entry.type}, delivered to ${entry.subscribers.join(', ')} (${count} ${count === 1 ? 'listener' : 'listeners'}).`;
}

export function BusPaths() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [recent, setRecent] = useState<LastEvent[]>([]);
  const chain = currentChain(recent);
  const latest = recent.at(-1);
  const listeners = useListeners();

  const finish = useCallback((id: string) => {
    setPackets((current) => current.filter((packet) => packet.id !== id));
  }, []);

  useEffect(
    () =>
      subscribeLog((entry) => {
        const from = findNode(sourceNodes[entry.source]);
        const targets = entry.subscribers
          .map((name) => findNode(listenerNodes[name]))
          .filter((node): node is BusNode => node !== undefined);
        const dropped = entry.delivered === 0;
        const routes =
          dropped || targets.length === 0
            ? [route(from, undefined)]
            : targets.map((target) => route(from, target));
        const involved = [from, ...targets].flatMap((node) => (node ? [node.id] : []));
        setRecent((current) => [...current, { entry, routes, dropped, involved }].slice(-3));
        if (reducedMotion()) return;
        setPackets((current) => [
          ...current,
          ...routes.map((points, index) => ({ id: `${entry.id}-${index}`, points, dropped })),
        ]);
      }),
    [],
  );

  return (
    <div className="grid gap-3">
      <svg
        viewBox="0 0 400 250"
        role="img"
        aria-label="Six slots connected to one event bus"
        className="mx-auto w-full max-w-[34rem]"
      >
        <rect
          x={busX - 30}
          y={10}
          width={60}
          height={230}
          rx={10}
          style={{ fill: 'var(--surface-2)', stroke: 'var(--line)' }}
        />
        <text
          x={busX}
          y={125}
          textAnchor="middle"
          transform={`rotate(-90 ${busX} 125)`}
          style={{ fill: 'var(--faint)', fontSize: 11, letterSpacing: '0.08em' }}
        >
          EVENT BUS
        </text>
        {nodes.map((node) => (
          <line
            key={`link-${node.id}`}
            x1={edgeX(node)}
            y1={node.y}
            x2={node.side === 'left' ? busX - 30 : busX + 30}
            y2={node.y}
            style={{ stroke: 'var(--line)', strokeWidth: 1.5 }}
          />
        ))}
        {chain.flatMap((item) =>
          item.routes.map((points, index) => (
            <polyline
              key={`route-${item.entry.id}-${index}`}
              data-route={item.dropped ? 'dropped' : 'delivered'}
              points={points.map((point) => `${point.x},${point.y}`).join(' ')}
              style={{
                fill: 'none',
                stroke: item.dropped ? 'var(--bad)' : 'var(--accent)',
                strokeWidth: 3,
                strokeLinejoin: 'round',
                opacity: 0.55,
              }}
            />
          )),
        )}
        {nodes.map((node) => {
          const active = chain.some((item) => item.involved.includes(node.id));
          return (
            <g
              key={node.id}
              data-node={node.id}
              data-active={active ? 'true' : 'false'}
              style={{ '--fc': `var(--${node.framework})` } as CSSProperties}
            >
              <rect
                x={node.side === 'left' ? 10 : 270}
                y={node.y - nodeHeight / 2}
                width={nodeWidth}
                height={nodeHeight}
                rx={8}
                style={{
                  fill: active
                    ? 'color-mix(in oklab, var(--fc) 22%, var(--surface))'
                    : 'var(--surface)',
                  stroke: 'var(--fc)',
                  strokeWidth: active ? 3 : 1.5,
                }}
              />
              <text
                x={(node.side === 'left' ? 10 : 270) + nodeWidth / 2}
                y={node.y + 4}
                textAnchor="middle"
                style={{ fill: 'var(--fg)', fontSize: 12 }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
        {packets.map((packet) => (
          <PacketDot key={packet.id} packet={packet} onDone={finish} />
        ))}
      </svg>

      <div
        role="status"
        aria-label="Last event"
        data-last-type={latest?.entry.type}
        className="grid min-h-[2.8em] gap-1 border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
      >
        {chain.length === 0 ? (
          <p>Nothing sent yet. Press Add in the Catalogue, or use the buttons below.</p>
        ) : (
          chain.map((item) => <p key={item.entry.id}>{describe(item)}</p>)
        )}
      </div>

      <div className="grid gap-1.5">
        <p className="eyebrow">Who listens right now</p>
        <ul aria-label="Listeners per event" className="grid gap-1 font-mono text-[0.78rem]">
          {listeners.map(({ type, names }) => (
            <li
              key={type}
              data-listeners={names.length}
              className="flex flex-wrap items-baseline gap-x-2"
            >
              <code className="kit-inline-code">{type}</code>
              <span className={names.length === 0 ? 'tone-warn' : 'text-muted'}>
                {names.length === 0 ? 'no listeners' : names.join(', ')}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
