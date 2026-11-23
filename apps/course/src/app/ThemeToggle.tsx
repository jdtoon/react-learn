import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePref } from './theme';

const options: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export function ThemeToggle() {
  const { pref, setPref } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex rounded-lg border border-line bg-surface p-0.5"
    >
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={pref === value}
          title={label}
          onClick={() => setPref(value)}
          className="grid size-6 place-items-center rounded-md text-muted transition-colors hover:text-fg aria-pressed:bg-accent aria-pressed:text-accent-fg sm:size-7"
        >
          <Icon aria-hidden="true" size={15} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
