import { useEffect } from 'react';

import { useUiStore } from '@/store/uiStore';

export const useThemeEffect = () => {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
};
