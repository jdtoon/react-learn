import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Meter } from '../../kit';
import { cn } from '../../kit/cn';

type NodeId = 'page' | 'header' | 'tabs' | 'description' | 'reviews' | 'cart' | 'footer';
type Side = 'server' | 'client';
type Need = Side | 'either';

interface TreeNode {
  id: NodeId;
  name: string;
  parent: NodeId | null;
  depth: number;
  need: Need;
  reason: string;
  kb: number;
  lib?: { name: string; kb: number };
  passedAsChildren?: boolean;
  fnProp?: string;
}

interface Analysis {
  effective: Record<NodeId, Side>;
  inherited: Record<NodeId, boolean>;
  problems: Partial<Record<NodeId, string>>;
  clientKb: number;
  serverKb: number;
  boundaries: string[];
}

const runtimeKb = 45;

const nodes: TreeNode[] = [
  {
    id: 'page',
    name: 'ProductPage',
    parent: null,
    depth: 0,
    need: 'server',
    reason: 'reads the product from the database',
    kb: 5,
  },
  {
    id: 'header',
    name: 'Header',
    parent: 'page',
    depth: 1,
    need: 'either',
    reason: 'static markup',
    kb: 3,
  },
  {
    id: 'tabs',
    name: 'Tabs',
    parent: 'page',
    depth: 1,
    need: 'client',
    reason: 'useState for the selected tab',
    kb: 6,
  },
  {
    id: 'description',
    name: 'Description',
    parent: 'tabs',
    depth: 2,
    need: 'either',
    reason: 'renders markdown with a 38 KB parser',
    kb: 4,
    lib: { name: 'marked', kb: 38 },
    passedAsChildren: true,
  },
  {
    id: 'reviews',
    name: 'ReviewList',
    parent: 'tabs',
    depth: 2,
    need: 'server',
    reason: 'reads reviews from the database, formats dates with a 22 KB library',
    kb: 5,
    lib: { name: 'date-fns', kb: 22 },
    passedAsChildren: true,
  },
  {
    id: 'cart',
    name: 'AddToCart',
    parent: 'page',
    depth: 1,
    need: 'client',
    reason: 'onClick and useOptimistic',
    kb: 7,
    fnProp: 'onAdd',
  },
  {
    id: 'footer',
    name: 'Footer',
    parent: 'page',
    depth: 1,
    need: 'either',
    reason: 'static markup',
    kb: 2,
  },
];

const byId = Object.fromEntries(nodes.map((node) => [node.id, node])) as Record<NodeId, TreeNode>;

function allOn(side: Side): Record<NodeId, Side> {
  return Object.fromEntries(nodes.map((node) => [node.id, side])) as Record<NodeId, Side>;
}

function analyse(
  placement: Record<NodeId, Side>,
  passChildren: boolean,
  serverFunction: boolean,
): Analysis {
  const effective = {} as Record<NodeId, Side>;
  const inherited = {} as Record<NodeId, boolean>;
  const problems: Partial<Record<NodeId, string>> = {};

  for (const node of nodes) {
    let side = placement[node.id];
    let isInherited = false;
    const parent = node.parent ? byId[node.parent] : null;
    if (side === 'server' && parent && effective[parent.id] === 'client') {
      const owner = parent.parent;
      const keptOnServer =
        passChildren &&
        node.passedAsChildren === true &&
        owner !== null &&
        effective[owner] === 'server';
      if (!keptOnServer) {
        side = 'client';
        isInherited = true;
      }
    }
    effective[node.id] = side;
    inherited[node.id] = isInherited;
  }

  for (const node of nodes) {
    const side = effective[node.id];
    const parent = node.parent ? byId[node.parent] : null;
    if (node.need === 'client' && side === 'server') {
      problems[node.id] = `Server Components cannot use this: ${node.reason}.`;
    } else if (node.need === 'server' && side === 'client') {
      problems[node.id] =
        `The browser cannot do this, and the credentials would ship: ${node.reason}.`;
    } else if (
      node.fnProp &&
      side === 'client' &&
      parent &&
      effective[parent.id] === 'server' &&
      !serverFunction
    ) {
      problems[node.id] =
        `${node.fnProp} is a plain function. Functions cannot be serialised across the boundary.`;
    }
  }

  let clientKb = runtimeKb;
  let serverKb = 0;
  for (const node of nodes) {
    const weight = node.kb + (node.lib?.kb ?? 0);
    if (effective[node.id] === 'client') clientKb += weight;
    else serverKb += weight;
  }

  const boundaries = nodes
    .filter((node) => {
      if (effective[node.id] !== 'client') return false;
      const parent = node.parent ? byId[node.parent] : null;
      return !parent || effective[parent.id] === 'server';
    })
    .map((node) => `${node.name}.tsx`);

  return { effective, inherited, problems, clientKb, serverKb, boundaries };
}

function NodeRow({
  node,
  placement,
  analysis,
  onPlace,
}: {
  node: TreeNode;
  placement: Side;
  analysis: Analysis;
  onPlace: (side: Side) => void;
}) {
  const side = analysis.effective[node.id];
  const problem = analysis.problems[node.id];
  const isInherited = analysis.inherited[node.id];

  return (
    <li
      data-node={node.id}
      data-side={side}
      data-problem={problem ? 'true' : undefined}
      style={{ marginLeft: `${node.depth * 1.25}rem` }}
      className={cn(
        'grid gap-1.5 rounded-lg border border-l-[3px] bg-surface px-3 py-2',
        side === 'server' ? 'border-l-accent' : 'border-l-faint',
        problem ? 'border-bad' : 'border-line',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="min-w-0">
          <p className="font-mono text-[0.84rem]">{`<${node.name}>`}</p>
          <p className="text-[0.76rem] text-muted">{node.reason}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted">
            {isInherited ? 'client, inherited' : side}
          </span>
          <div role="group" aria-label={`Where ${node.name} runs`} className="kit-seg">
            <button
              type="button"
              aria-pressed={placement === 'server'}
              onClick={() => onPlace('server')}
            >
              Server
            </button>
            <button
              type="button"
              aria-pressed={placement === 'client'}
              onClick={() => onPlace('client')}
            >
              Client
            </button>
          </div>
        </div>
      </div>
      {problem && (
        <p role="alert" className="tone-bad flex items-start gap-1.5 text-[0.8rem]">
          <TriangleAlert aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
          {problem}
        </p>
      )}
    </li>
  );
}

export function BoundaryLab() {
  const [placement, setPlacement] = useState<Record<NodeId, Side>>(() => allOn('server'));
  const [passChildren, setPassChildren] = useState(true);
  const [serverFunction, setServerFunction] = useState(false);
  const analysis = analyse(placement, passChildren, serverFunction);
  const problemCount = Object.keys(analysis.problems).length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="kit-btn" onClick={() => setPlacement(allOn('server'))}>
          Everything on the server
        </button>
        <button type="button" className="kit-btn" onClick={() => setPlacement(allOn('client'))}>
          Everything on the client
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
          <input
            type="checkbox"
            className="kit-check mt-0"
            checked={passChildren}
            onChange={(event) => setPassChildren(event.target.checked)}
          />
          Pass server content as children
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
          <input
            type="checkbox"
            className="kit-check mt-0"
            checked={serverFunction}
            onChange={(event) => setServerFunction(event.target.checked)}
          />
          Make onAdd a Server Function
        </label>
      </div>

      <ul aria-label="Component tree" className="grid gap-1.5">
        {nodes.map((node) => (
          <NodeRow
            key={node.id}
            node={node}
            placement={placement[node.id]}
            analysis={analysis}
            onPlace={(side) => setPlacement({ ...placement, [node.id]: side })}
          />
        ))}
      </ul>

      <div className="grid gap-3">
        <Meter
          label="JavaScript shipped to the browser"
          value={analysis.clientKb}
          max={140}
          unit="KB"
          thresholds={{ warn: 90, bad: 120 }}
        />
        <p
          role="status"
          aria-label="Boundary summary"
          className="border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
        >
          {problemCount > 0
            ? `${problemCount} ${problemCount === 1 ? 'problem' : 'problems'} to fix before this renders. `
            : 'No problems. '}
          {`${analysis.serverKb} KB of component and library code stays on the server. `}
          {analysis.boundaries.length > 0
            ? `The directive use client goes at the top of ${analysis.boundaries.join(' and ')}.`
            : 'No file needs the use client directive.'}
        </p>
      </div>
    </div>
  );
}
