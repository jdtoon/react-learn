import { BookA } from 'lucide-react';
import { Link } from 'react-router';
import { padNumber, trackStyle } from '../app/trackStyle';
import { listBuiltContent } from '../content/builtContent';
import type { ModuleContent } from '../content/types';

interface TermEntry {
  term: string;
  definition: string;
  module: ModuleContent;
}

const alphabet = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));

function letterOf(term: string): string {
  const first = term.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}

function letterId(letter: string): string {
  return letter === '#' ? 'letter-other' : `letter-${letter.toLowerCase()}`;
}

function collectTerms(): Map<string, TermEntry[]> {
  const entries = listBuiltContent().flatMap((module) =>
    module.glossary.map((entry): TermEntry => ({ ...entry, module })),
  );
  entries.sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
  const byLetter = new Map<string, TermEntry[]>();
  for (const entry of entries) {
    const letter = letterOf(entry.term);
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), entry]);
  }
  return byLetter;
}

function EmptyState() {
  return (
    <section
      aria-labelledby="glossary-empty"
      className="mt-10 grid gap-6 rounded-2xl border border-dashed border-line bg-surface p-5 sm:p-8"
    >
      <div aria-hidden="true" className="flex flex-wrap gap-1">
        {alphabet.map((letter) => (
          <span
            key={letter}
            className="grid size-8 place-items-center rounded-md border border-line bg-bg font-mono text-[0.78rem] text-faint"
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="grid gap-3">
        <span className="grid size-11 place-items-center rounded-xl border border-line bg-surface-2 text-accent">
          <BookA aria-hidden="true" size={22} />
        </span>
        <h2 id="glossary-empty">No terms yet</h2>
        <p className="max-w-[58ch] text-muted">
          Every module defines its key terms in one line each. They collect here in A to Z order as
          modules are built, and each one links back to the module that teaches it.
        </p>
      </div>
      <div>
        <Link
          to="/#map"
          className="inline-flex h-10 items-center rounded-lg border border-line bg-surface-2 px-4 text-sm font-medium hover:border-accent"
        >
          Browse the curriculum
        </Link>
      </div>
    </section>
  );
}

export function GlossaryPage() {
  const byLetter = collectTerms();
  const letters = [...byLetter.keys()];
  const jumpLetters = byLetter.has('#') ? [...alphabet, '#'] : alphabet;

  return (
    <div className="mx-auto w-full max-w-[56rem] px-4 py-10 sm:px-8 sm:py-14">
      <title>Glossary | React Field Guide</title>
      <header className="grid gap-4">
        <p className="eyebrow">Reference</p>
        <h1>Glossary</h1>
        <p className="lede">
          Every key term with a one-line definition, linked to the module that teaches it. It fills
          in as modules are built.
        </p>
      </header>

      {letters.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <nav aria-label="Jump to letter" className="mt-8 flex flex-wrap gap-1">
            {jumpLetters.map((letter) =>
              byLetter.has(letter) ? (
                <Link
                  key={letter}
                  to={{ hash: `#${letterId(letter)}` }}
                  className="grid size-8 place-items-center rounded-md border border-line bg-surface font-mono text-[0.78rem] hover:border-accent"
                >
                  {letter}
                </Link>
              ) : (
                <span
                  key={letter}
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-md font-mono text-[0.78rem] text-faint"
                >
                  {letter}
                </span>
              ),
            )}
          </nav>
          <div className="mt-8 grid gap-9">
            {letters.map((letter) => (
              <section key={letter} aria-labelledby={letterId(letter)}>
                <h2
                  id={letterId(letter)}
                  className="mb-3 scroll-mt-20 border-b border-line pb-2 font-mono text-[1.1rem] text-muted"
                >
                  {letter}
                </h2>
                <dl className="grid gap-5">
                  {(byLetter.get(letter) ?? []).map(({ term, definition, module }) => (
                    <div key={`${module.slug}|${term}`} className="grid gap-1">
                      <dt className="font-display text-[1.08rem] font-semibold">{term}</dt>
                      <dd className="max-w-[64ch]">{definition}</dd>
                      <dd style={trackStyle(module.track)}>
                        <Link
                          to={`/modules/${module.slug}`}
                          className="inline-flex items-center gap-2 rounded-sm text-[0.82rem] text-muted underline decoration-line underline-offset-4 hover:text-fg hover:decoration-(--tc)"
                        >
                          <span
                            aria-hidden="true"
                            className="size-2 shrink-0 rounded-full bg-(--tc)"
                          />
                          {`${padNumber(module.number)} ${module.title}`}
                        </Link>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
