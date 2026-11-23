import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from './theme';

const html = document.documentElement;

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  localStorage.clear();
  html.removeAttribute('data-theme');
});

function mockSystemLight(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: matches && query.includes('light'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
}

describe('useTheme', () => {
  it('follows the system with no data-theme attribute and resolves to dark when the system is not light', async () => {
    const { useTheme: fresh } = await import('./theme');
    const { result } = renderHook(() => fresh());
    expect(result.current.pref).toBe('system');
    expect(result.current.resolved).toBe('dark');
    expect(html.hasAttribute('data-theme')).toBe(false);
  });

  it('resolves system to light when the system prefers light', () => {
    mockSystemLight(true);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setPref('system'));
    expect(result.current.resolved).toBe('light');
    expect(html.hasAttribute('data-theme')).toBe(false);
  });

  it('sets data-theme and persists an explicit preference', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setPref('light'));
    expect(result.current.pref).toBe('light');
    expect(result.current.resolved).toBe('light');
    expect(html.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('rfg:theme')).toBe('"light"');
    act(() => result.current.setPref('dark'));
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(result.current.resolved).toBe('dark');
  });

  it('removes data-theme when returning to system', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setPref('light'));
    act(() => result.current.setPref('system'));
    expect(html.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('rfg:theme')).toBe('"system"');
  });

  it('restores a stored preference and ignores an invalid one', async () => {
    localStorage.setItem('rfg:theme', '"light"');
    const stored = await import('./theme');
    expect(renderHook(() => stored.useTheme()).result.current.pref).toBe('light');

    vi.resetModules();
    localStorage.setItem('rfg:theme', '"purple"');
    const invalid = await import('./theme');
    expect(renderHook(() => invalid.useTheme()).result.current.pref).toBe('system');
  });
});
