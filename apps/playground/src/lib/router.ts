import { ref } from 'vue';

/**
 * Tiny hash router. Routes:
 *   #/            → overview
 *   #/layout      → layout & spatial system
 *   #/screens     → 18 canonical screen architectures
 *   #/feedback    → all feedback
 *   #/<slug>      → component page
 */
export type Route =
  | { name: 'overview' }
  | { name: 'layout' }
  | { name: 'screens' }
  | { name: 'benchmarks' }
  | { name: 'feedback' }
  | { name: 'component'; slug: string };

function parse(hash: string): Route {
  const path = decodeURIComponent(hash.replace(/^#\/?/, '')).replace(/\/+$/, '');
  if (!path) return { name: 'overview' };
  if (path === 'layout' || path === 'layout-system') return { name: 'layout' };
  if (path === 'screens' || path === 'screen-layouts') return { name: 'screens' };
  if (path === 'benchmarks' || path === 'benchmark') return { name: 'benchmarks' };
  if (path === 'feedback') return { name: 'feedback' };
  return { name: 'component', slug: path };
}

export const route = ref<Route>(parse(location.hash));

window.addEventListener('hashchange', () => {
  route.value = parse(location.hash);
  document.querySelector('.pg-main')?.scrollTo({ top: 0 });
});

export function href(slug: '' | 'feedback' | string) {
  return `#/${slug}`;
}

export function navigate(slug: string) {
  location.hash = `/${slug}`;
}
