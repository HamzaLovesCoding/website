'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

/** useLayoutEffect that doesn't warn during SSR. */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function useMediaQuery(query: string, fallback = false) {
  const [matches, setMatches] = useState(fallback);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True when the visitor has asked the OS to cut motion down. */
export const useReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)');

/**
 * True for a device with a precise, hoverable pointer. Gates every
 * cursor-driven effect — on touch they'd either never fire or fire on tap.
 */
export const usePrecisePointer = () =>
  useMediaQuery('(hover: hover) and (pointer: fine)');
