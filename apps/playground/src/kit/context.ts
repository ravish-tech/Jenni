import type { InjectionKey, Ref } from 'vue';

/** Provided by the component page so DemoSections know which component they belong to. */
export interface DemoContext {
  component: Ref<string>;
  /** Section titles registered by DemoSections, in mount order (for the page TOC). */
  sections: Ref<string[]>;
  register(title: string): void;
  unregister(title: string): void;
}

export const DEMO_CONTEXT: InjectionKey<DemoContext> = Symbol('jenni-demo-context');

export function sectionId(title: string) {
  return 'section-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
