import type { Component } from 'vue';
import roadmap from '../../../../COMPONENTS.md?raw';

export type Status = 'planned' | 'draft' | 'review' | 'stable';

export interface DemoMeta {
  name: string;
  group: string;
  order: number;
  description: string;
  status: Status;
  wide?: boolean | 'full';
}

export interface DemoEntry extends DemoMeta {
  slug: string;
  file: string;
  component: Component | null;
  missingMeta: boolean;
}

export interface PlannedEntry {
  name: string;
  slug: string;
  group: string;
  description: string;
}

export const STATUSES: Status[] = ['planned', 'draft', 'review', 'stable'];
export const GROUP_ORDER = ['Layout', 'Forms', 'Display', 'Overlay'];

export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function titleCase(s: string) {
  return s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const modules = import.meta.glob('../demos/**/*.demo.vue', { eager: true }) as Record<
  string,
  { default?: Component; meta?: Partial<DemoMeta> }
>;

export const demos: DemoEntry[] = Object.entries(modules)
  .map(([file, mod]) => {
    const parts = file.split('/');
    const base = parts[parts.length - 1].replace(/\.demo\.vue$/, '');
    const folder = parts[parts.length - 2];
    const meta = (mod && typeof mod.meta === 'object' && mod.meta) || {};
    const name = String(meta.name ?? titleCase(base));
    const status = STATUSES.includes(meta.status as Status) ? (meta.status as Status) : 'draft';
    return {
      name,
      group: String(meta.group ?? (folder === 'demos' ? 'Other' : titleCase(folder))),
      order: Number.isFinite(Number(meta.order)) ? Number(meta.order) : 999,
      description: String(meta.description ?? ''),
      status,
      wide: meta.wide === 'full' ? 'full' : meta.wide === true ? true : undefined,
      slug: slugify(name),
      file: file.replace(/^\.\.\//, 'src/'),
      component: mod?.default ?? null,
      missingMeta: !mod?.meta,
    } satisfies DemoEntry;
  })
  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

export function groupDemos(list: DemoEntry[]) {
  const map = new Map<string, DemoEntry[]>();
  for (const d of list) {
    if (!map.has(d.group)) map.set(d.group, []);
    map.get(d.group)!.push(d);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const ia = GROUP_ORDER.indexOf(a), ib = GROUP_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    })
    .map(([group, items]) => ({ group, items }));
}

/** Parse `⬜` rows under `## <Group>` sections of COMPONENTS.md into a planned list. */
function parsePlanned(md: string): PlannedEntry[] {
  const out: PlannedEntry[] = [];
  let group: string | null = null;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      group = h[1].trim();
      continue;
    }
    if (!group || !line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    const name = cells[1] ?? '';
    const statusCell = cells[2] ?? '';
    const notes = cells[3] ?? '';
    if (!name || name === 'Component' || /^-+$/.test(name)) continue;
    if (!statusCell.includes('⬜')) continue;
    out.push({ name, slug: slugify(name), group, description: notes });
  }
  return out;
}

const demoSlugs = new Set(demos.map((d) => d.slug));
const demoNames = new Set(demos.map((d) => d.name.toLowerCase()));

export const planned: PlannedEntry[] = parsePlanned(roadmap).filter(
  (p) => !demoSlugs.has(p.slug) && !p.name.split('/').some((n) => demoNames.has(n.trim().toLowerCase())),
);

export function findDemo(slug: string) {
  return demos.find((d) => d.slug === slug) ?? null;
}

export function findPlanned(slug: string) {
  return planned.find((p) => p.slug === slug) ?? null;
}
