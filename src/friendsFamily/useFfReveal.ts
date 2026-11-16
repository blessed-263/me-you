import { useEffect, type RefObject } from 'react';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Fades + lifts each `.ff-reveal` section once as it enters the viewport.
 * Sections are only hidden after this hook opts the root in (`.ff-js`), so the
 * page is fully visible without JavaScript, IntersectionObserver or with
 * reduced motion.
 */
export function useFfReveal(rootRef: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return;

    const items: HTMLElement[] = Array.from(root.querySelectorAll<HTMLElement>('.ff-reveal:not(.ff-in)'));
    if (items.length === 0) return;
    root.classList.add('ff-js');

    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((e) => e.isIntersecting);
        entering.forEach((entry, i) => {
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${i * 90}ms`;
          el.classList.add('ff-in');
          observer.unobserve(el);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef, enabled]);
}
