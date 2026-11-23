import { Check, Circle } from 'lucide-react';
import { useRef, useState, type FocusEvent } from 'react';
import { cn } from '../../kit/cn';

type Variant = 'soup' | 'semantic';

const fieldClass =
  'h-9 w-full rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint';

function Challenge({ variant, keyboardOnly }: { variant: Variant; keyboardOnly: boolean }) {
  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  const [mouse, setMouse] = useState(0);
  const [stops, setStops] = useState(0);
  const reached = useRef(new Set<EventTarget>());

  function onFocus(event: FocusEvent<HTMLDivElement>) {
    reached.current.add(event.target);
    setStops(reached.current.size);
  }

  function submit() {
    if (email.trim() === '' || !agree) {
      setMessage('Enter an email and tick the box first.');
      return;
    }
    setDone(true);
    setMessage(`Subscribed ${email.trim()}.`);
  }

  const steps = [
    { label: 'Typed an email', met: email.trim() !== '' },
    { label: 'Ticked the box', met: agree },
    { label: 'Subscribed', met: done },
  ];

  return (
    <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
      <div className="relative">
        <div
          data-challenge={variant}
          onFocus={onFocus}
          onPointerDown={() => setMouse((count) => count + 1)}
          className={cn(
            'grid max-w-sm gap-3 rounded-xl border border-line bg-surface p-4',
            keyboardOnly && 'pointer-events-none select-none',
          )}
        >
          {variant === 'soup' ? (
            <>
              <div className="font-display text-[1.05rem] font-semibold">Join the newsletter</div>
              <div className="grid gap-1">
                <div className="text-[0.82rem] text-muted">Email</div>
                <input
                  type="text"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={fieldClass}
                />
              </div>
              <div
                data-soup="checkbox"
                onClick={() => setAgree((on) => !on)}
                className="flex cursor-pointer items-center gap-2"
              >
                <div className="grid h-5 w-5 place-items-center rounded border border-line bg-bg">
                  {agree && <Check aria-hidden="true" size={14} />}
                </div>
                <div className="text-[0.88rem]">Send me the weekly digest</div>
              </div>
              <div
                data-soup="submit"
                onClick={submit}
                className="kit-btn cursor-pointer justify-self-start"
              >
                Subscribe
              </div>
              {message && <div className="text-[0.86rem] text-muted">{message}</div>}
            </>
          ) : (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
              className="grid gap-3"
            >
              <h4 className="text-[1.05rem]">Join the newsletter</h4>
              <label className="grid gap-1 text-[0.82rem]">
                <span className="text-muted">Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[0.88rem]">
                <input
                  type="checkbox"
                  className="kit-check mt-0"
                  checked={agree}
                  onChange={(event) => setAgree(event.target.checked)}
                />
                Send me the weekly digest
              </label>
              <button type="submit" className="kit-btn justify-self-start">
                Subscribe
              </button>
              <p role="status" className="min-h-[1.4em] text-[0.86rem] text-muted">
                {message}
              </p>
            </form>
          )}
        </div>
        {keyboardOnly && (
          <span className="absolute right-2 top-2 rounded bg-bad/25 px-1.5 font-mono text-[0.64rem] leading-4">
            mouse off
          </span>
        )}
      </div>

      <div className="grid min-w-0 gap-3">
        <ul aria-label="Challenge steps" className="grid gap-1.5 text-[0.88rem]">
          {steps.map((step) => (
            <li
              key={step.label}
              className={cn('flex items-center gap-2', step.met ? 'tone-ok' : 'text-muted')}
            >
              {step.met ? (
                <Check aria-hidden="true" size={15} />
              ) : (
                <Circle aria-hidden="true" size={15} />
              )}
              {step.label}
              <span className="sr-only">{step.met ? ', done' : ', not done'}</span>
            </li>
          ))}
        </ul>
        <p className="font-mono text-[0.78rem] text-muted" role="status" aria-label="Counters">
          {`tab stops reached ${stops}, mouse presses ${mouse}`}
        </p>
        {done && (
          <p className="border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted">
            {mouse === 0
              ? 'Done with the keyboard alone.'
              : 'Done, but the mouse was used, so the keyboard path is untested.'}
          </p>
        )}
      </div>
    </div>
  );
}

export function KeyboardChallengeLab() {
  const [variant, setVariant] = useState<Variant>('soup');
  const [keyboardOnly, setKeyboardOnly] = useState(false);
  const [round, setRound] = useState(0);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="group" aria-label="Markup" className="kit-seg">
          <button type="button" aria-pressed={variant === 'soup'} onClick={() => setVariant('soup')}>
            Div soup
          </button>
          <button
            type="button"
            aria-pressed={variant === 'semantic'}
            onClick={() => setVariant('semantic')}
          >
            Semantic
          </button>
        </div>
        <button type="button" className="kit-btn" onClick={() => setRound((count) => count + 1)}>
          Reset form
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-[0.88rem]">
          <input
            type="checkbox"
            className="kit-check mt-0"
            checked={keyboardOnly}
            onChange={(event) => setKeyboardOnly(event.target.checked)}
          />
          Keyboard only
        </label>
      </div>

      <Challenge key={`${variant}-${round}`} variant={variant} keyboardOnly={keyboardOnly} />
    </div>
  );
}
