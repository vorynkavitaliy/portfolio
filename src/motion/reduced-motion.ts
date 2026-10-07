export const MOTION_ALLOWED_QUERY = '(prefers-reduced-motion: no-preference)';

export const FINE_POINTER_QUERY = '(pointer: fine)';

export const matchesMedia = (query: string): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(query).matches;
};

export const prefersReducedMotion = (): boolean => {
  return !matchesMedia(MOTION_ALLOWED_QUERY);
};
