import { useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'perfusion3d-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    // Ignore localStorage access failures
  }
  return 'system';
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(getInitialPreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initialPref = getInitialPreference();
    return initialPref === 'system' ? getSystemTheme() : initialPref;
  });

  const applyTheme = useCallback((pref: ThemePreference) => {
    const resolved = pref === 'system' ? getSystemTheme() : pref;
    setResolvedTheme(resolved);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = resolved;
    }
  }, []);

  const setTheme = useCallback(
    (newPref: ThemePreference) => {
      setPreferenceState(newPref);
      try {
        localStorage.setItem(STORAGE_KEY, newPref);
      } catch (e) {
        // Ignore storage errors
      }
      applyTheme(newPref);
    },
    [applyTheme]
  );

  useEffect(() => {
    // Initial sync
    applyTheme(preference);

    // Media query listener for system changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preference === 'system') {
        applyTheme('system');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [preference, applyTheme]);

  return {
    theme: preference,
    resolvedTheme,
    setTheme,
  };
}
