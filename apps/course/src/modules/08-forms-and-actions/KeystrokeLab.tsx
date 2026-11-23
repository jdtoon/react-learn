import { useState } from 'react';
import { RenderBox } from '../../kit';

interface Saved {
  name: string;
  email: string;
  bio: string;
}

const inputClass =
  'h-9 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint';

const emptySaved: Saved = { name: '', email: '', bio: '' };

function readFields(formData: FormData): Saved {
  return {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    bio: String(formData.get('bio') ?? ''),
  };
}

function SavedSummary({ saved }: { saved: Saved | null }) {
  return (
    <RenderBox label="<SavedSummary>">
      <p className="font-mono text-[0.78rem] text-muted">
        {saved
          ? `Saved: ${saved.name || '(no name)'}, ${saved.email || '(no email)'}`
          : 'Nothing saved'}
      </p>
    </RenderBox>
  );
}

function ControlledForm() {
  const [values, setValues] = useState<Saved>(emptySaved);
  const [saved, setSaved] = useState<Saved | null>(null);

  function field(key: keyof Saved) {
    return {
      value: values[key],
      onChange: (event: { target: { value: string } }) =>
        setValues({ ...values, [key]: event.target.value }),
    };
  }

  return (
    <RenderBox label="<ControlledForm>">
      <form
        aria-label="Controlled form"
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(values);
        }}
      >
        <input aria-label="Name" placeholder="Name" className={inputClass} {...field('name')} />
        <input aria-label="Email" placeholder="Email" className={inputClass} {...field('email')} />
        <input aria-label="Bio" placeholder="Bio" className={inputClass} {...field('bio')} />
        <button type="submit" className="kit-btn justify-self-start">
          Save
        </button>
      </form>
      <p className="text-[0.78rem] text-muted">Value lives in React state.</p>
      <SavedSummary saved={saved} />
    </RenderBox>
  );
}

function UncontrolledForm() {
  const [saved, setSaved] = useState<Saved | null>(null);

  return (
    <RenderBox label="<UncontrolledForm>">
      <form
        aria-label="Uncontrolled form"
        className="grid gap-2"
        action={(formData) => setSaved(readFields(formData))}
      >
        <input name="name" aria-label="Name" placeholder="Name" className={inputClass} />
        <input name="email" aria-label="Email" placeholder="Email" className={inputClass} />
        <input name="bio" aria-label="Bio" placeholder="Bio" className={inputClass} />
        <button type="submit" className="kit-btn justify-self-start">
          Save
        </button>
      </form>
      <p className="text-[0.78rem] text-muted">Value lives in the DOM until the Action reads it.</p>
      <SavedSummary saved={saved} />
    </RenderBox>
  );
}

export function KeystrokeLab() {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      <ControlledForm />
      <UncontrolledForm />
    </div>
  );
}
