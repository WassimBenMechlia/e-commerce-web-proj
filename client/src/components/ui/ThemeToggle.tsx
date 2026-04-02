import { MoonStar, SunMedium } from 'lucide-react';

import { useUiStore } from '@/store/uiStore';

export const ThemeToggle = () => {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background-secondary text-text-primary transition hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      aria-label="Toggle color theme"
    >
      {theme === 'light' ? (
        <MoonStar className="h-4 w-4" />
      ) : (
        <SunMedium className="h-4 w-4" />
      )}
    </button>
  );
};
