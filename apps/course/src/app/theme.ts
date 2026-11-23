import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { readJSON, writeJSON } from '../lib/safeStorage';

export type ThemePref = 'system' | 'light' | 'dark';

const storageKey = 'theme';
const lightQuery = '(prefers-color-scheme: light)';

function isThemePref(value: unknown): value is ThemePref {
  return value === 'system' || value === 'light' || value === 'dark';
}

function applyPref(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
}

function readStoredPref(): ThemePref {
  const stored = readJSON<unknown>(storageKey, 'system');
  return isThemePref(stored) ? stored : 'system';
}

const useThemeStore = create<{ pref: ThemePref; setPref: (pref: ThemePref) => void }>()((set) => ({
  pref: readStoredPref(),
  setPref: (pref) => {
    applyPref(pref);
    writeJSON(storageKey, pref);
    set({ pref });
  },
}));

function subscribeToSystemTheme(notify: () => void) {
  const query = window.matchMedia(lightQuery);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}

function systemPrefersLight() {
  return window.matchMedia(lightQuery).matches;
}

export function useTheme(): {
  pref: ThemePref;
  resolved: 'light' | 'dark';
  setPref: (pref: ThemePref) => void;
} {
  const pref = useThemeStore((state) => state.pref);
  const setPref = useThemeStore((state) => state.setPref);
  const systemLight = useSyncExternalStore(subscribeToSystemTheme, systemPrefersLight);
  const resolved = pref === 'system' ? (systemLight ? 'light' : 'dark') : pref;
  return { pref, resolved, setPref };
}
