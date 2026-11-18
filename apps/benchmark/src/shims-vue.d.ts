declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  export type RejectedFileEntry = unknown;
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>;
  export default component;
}
