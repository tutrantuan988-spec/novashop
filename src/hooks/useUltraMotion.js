import { useEffect } from 'react';

export default function useUltraMotion() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const root = document.documentElement;
    const previousValue = root.dataset.motion;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const applyState = (isReduced) => {
      root.dataset.motion = isReduced ? 'reduced' : '120fps';
    };

    applyState(mediaQuery.matches);
    const handler = (event) => applyState(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
      if (previousValue) {
        root.dataset.motion = previousValue;
      } else {
        delete root.dataset.motion;
      }
    };
  }, []);
}
