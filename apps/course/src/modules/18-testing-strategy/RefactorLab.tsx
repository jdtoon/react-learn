import { Check, X } from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { CodePeek } from '../../kit';
import { cn } from '../../kit/cn';
import { BasketBuggy, BasketOriginal, BasketRefactored } from './basketVariants';
import { basketTests, type BasketTest } from './basketTests';

type VariantId = 'original' | 'refactored' | 'buggy';

interface Outcome {
  ok: boolean;
  message?: string;
}

type Results = Partial<Record<VariantId, Record<string, Outcome>>>;

const variants: { id: VariantId; label: string; summary: string; Component: ComponentType }[] = [
  {
    id: 'original',
    label: 'Original',
    summary: 'The baseline: `useState`, a `.basket-count` class and a test id on the button.',
    Component: BasketOriginal,
  },
  {
    id: 'refactored',
    label: 'Refactored',
    summary:
      'Same behaviour and same look. Internals changed to `useReducer`, new class names, a different test id and a reordered structure.',
    Component: BasketRefactored,
  },
  {
    id: 'buggy',
    label: 'Buggy',
    summary: 'Same markup as the original, but Add stops counting after the first item.',
    Component: BasketBuggy,
  },
];

const allCode = basketTests.map((test) => test.code).join('\n\n');

function firstLine(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.split('\n')[0]?.trim() ?? text;
}

function mount(Component: ComponentType): { host: HTMLElement; dispose: () => void } {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:480px';
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(<Component />));
  return {
    host,
    dispose: () => {
      root.unmount();
      host.remove();
    },
  };
}

function snapshotOf(Component: ComponentType): string {
  const { host, dispose } = mount(Component);
  const markup = host.innerHTML;
  dispose();
  return markup;
}

async function runTest(
  test: BasketTest,
  Component: ComponentType,
  snapshot: string,
): Promise<Outcome> {
  const { host, dispose } = mount(Component);
  try {
    await test.run(host, snapshot);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: firstLine(error) };
  } finally {
    dispose();
  }
}

function Cell({ outcome }: { outcome: Outcome | undefined }) {
  if (!outcome) return <span className="text-faint">-</span>;
  return outcome.ok ? (
    <span className="inline-flex items-center gap-1 tone-ok">
      <Check aria-hidden="true" size={14} />
      pass
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 tone-bad">
      <X aria-hidden="true" size={14} />
      fail
    </span>
  );
}

function verdict(id: VariantId, outcomes: Record<string, Outcome> | undefined): string {
  if (!outcomes) return 'Press Run tests to run all six against this variant.';
  const failed = (style: BasketTest['style']) =>
    basketTests.filter((test) => test.style === style && !outcomes[test.id]?.ok).length;
  const detail = failed('detail');
  const behaviour = failed('behaviour');
  if (detail === 0 && behaviour === 0) {
    return id === 'original' ? 'All six tests pass. This is the baseline.' : 'All six tests pass.';
  }
  if (id === 'refactored') {
    return `Behaviour is unchanged, yet ${detail} of 3 implementation-detail tests failed while ${3 - behaviour} of 3 behavioural tests passed. Those red tests are noise: no user is affected.`;
  }
  return `The behaviour is broken. ${behaviour} of 3 behavioural tests caught it. ${3 - detail} of 3 implementation-detail tests still passed, because none of them add more than one item.`;
}

export function RefactorLab() {
  const [variantId, setVariantId] = useState<VariantId>('original');
  const [results, setResults] = useState<Results>({});
  const [running, setRunning] = useState(false);

  const variant = variants.find((item) => item.id === variantId) ?? variants[0];
  const outcomes = results[variantId];

  async function runAll(id: VariantId) {
    const target = variants.find((item) => item.id === id);
    if (!target) return;
    setRunning(true);
    const snapshot = snapshotOf(BasketOriginal);
    const next: Record<string, Outcome> = {};
    for (const test of basketTests) {
      next[test.id] = await runTest(test, target.Component, snapshot);
    }
    setResults((current) => ({ ...current, [id]: next }));
    setRunning(false);
  }

  function choose(id: VariantId) {
    setVariantId(id);
    if (results[id]) return;
    void runAll(id);
  }

  if (!variant) return null;
  const Preview = variant.Component;
  const failures = basketTests.filter((test) => outcomes && !outcomes[test.id]?.ok);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Implementation" className="kit-seg">
          {variants.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={variantId === item.id}
              onClick={() => choose(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="kit-btn"
          aria-disabled={running ? true : undefined}
          onClick={() => {
            if (!running) void runAll(variantId);
          }}
        >
          {running ? 'Running' : 'Run tests'}
        </button>
      </div>

      <p className="text-[0.88rem] text-muted">{variant.summary}</p>

      <div className="kit-stage grid gap-2">
        <p className="eyebrow">{`Live preview: ${variant.label}`}</p>
        <Preview key={variantId} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-[0.84rem]">
          <caption className="sr-only">Test results for each implementation</caption>
          <thead>
            <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Test
              </th>
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Style
              </th>
              {variants.map((item) => (
                <th key={item.id} scope="col" className="py-1.5 pr-3 font-medium">
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {basketTests.map((test) => (
              <tr key={test.id} data-test={test.id} className="border-b border-line">
                <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                  {test.title}
                </th>
                <td className="py-1.5 pr-3 font-mono text-[0.74rem] text-muted">
                  {test.style === 'detail' ? 'implementation' : 'behaviour'}
                </td>
                {variants.map((item) => (
                  <td
                    key={item.id}
                    className={cn('py-1.5 pr-3', item.id === variantId && 'bg-surface')}
                  >
                    <Cell outcome={results[item.id]?.[test.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        role="status"
        aria-label="Result summary"
        className="border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
      >
        {verdict(variantId, outcomes)}
      </p>

      {failures.length > 0 && (
        <ul
          aria-label="Failure messages"
          className="grid gap-1 font-mono text-[0.76rem] text-muted"
        >
          {failures.map((test) => (
            <li key={test.id}>
              <span className="tone-bad">{test.id}</span>: {outcomes?.[test.id]?.message}
            </li>
          ))}
        </ul>
      )}

      <CodePeek code={allCode} title="The six tests" />
    </div>
  );
}
