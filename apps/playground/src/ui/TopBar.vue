<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import Icon from './Icon.vue';
import { HUE_PRESETS, knobsChanged, prefs, resetKnobs, type StageBg, type Theme } from '@/lib/prefs';

defineProps<{ crumbs: string[]; showRailToggle: boolean; navOpen?: boolean }>();
defineEmits<{ toggleNav: [] }>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const themes: { value: Theme; icon: string; label: string }[] = [
  { value: 'system', icon: 'monitor', label: 'System' },
  { value: 'light', icon: 'sun', label: 'Light' },
  { value: 'dark', icon: 'moon', label: 'Dark' },
];
const stages: StageBg[] = ['plain', 'dots', 'grid'];

// Visualization only: an ink-rich spectrum track matching --j-accent's composed chroma.
const hueTrack = computed(() => {
  const stops = Array.from({ length: 13 }, (_, i) => `oklch(55% 0.145 ${i * 30})`).join(', ');
  return { '--pg-track': `linear-gradient(to right, ${stops})` };
});
const changed = computed(() => knobsChanged());

function onDoc(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false;
}
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') open.value = false; }
onMounted(() => { document.addEventListener('pointerdown', onDoc); document.addEventListener('keydown', onKey); });
onBeforeUnmount(() => { document.removeEventListener('pointerdown', onDoc); document.removeEventListener('keydown', onKey); });
</script>

<template>
  <header class="pg-topbar">
    <div class="pg-topbar__start">
      <button
        type="button"
        class="pg-icon-btn pg-mobile-menu"
        :aria-expanded="Boolean(navOpen)"
        aria-label="Toggle navigation"
        @click="$emit('toggleNav')"
      >
        <Icon :name="navOpen ? 'x' : 'menu'" :size="16" />
      </button>

      <div class="pg-crumbs">
        <template v-for="(c, i) in crumbs" :key="i">
          <span v-if="i" class="pg-crumbs__sep">/</span>
          <span class="pg-crumbs__item" :class="{ 'is-last': i === crumbs.length - 1 }">{{ c }}</span>
        </template>
      </div>
    </div>

    <div class="pg-topbar__actions">
      <div class="pg-segmented" role="radiogroup" aria-label="Theme">
        <button
          v-for="t in themes"
          :key="t.value"
          role="radio"
          :aria-checked="prefs.theme === t.value"
          :title="t.label"
          @click="prefs.theme = t.value"
        >
          <Icon :name="t.icon" :size="14" />
        </button>
      </div>

      <div ref="root" class="pg-knobs-anchor">
        <button class="pg-btn" data-variant="outline" :aria-expanded="open" @click="open = !open">
          <span class="pg-knob-swatch" />
          Tokens
          <span v-if="changed" class="pg-dot-mark" title="Modified" />
        </button>

        <Transition name="pg-pop">
          <div v-if="open" class="pg-knobs" role="dialog" aria-label="Design tokens">
            <div class="pg-knobs__head">
              <p class="pg-knobs__title">Design tokens</p>
              <button class="pg-btn" data-size="sm" data-variant="ghost" :disabled="!changed" @click="resetKnobs">
                <Icon name="reset" :size="13" /> Reset
              </button>
            </div>

            <div class="pg-knob">
              <div class="pg-knob__row"><label for="k-hue">Accent hue</label><output>{{ prefs.knobs.hue }}°</output></div>
              <input id="k-hue" v-model.number="prefs.knobs.hue" class="pg-range is-hue" :style="hueTrack" type="range" min="0" max="360" step="1" />
              <div class="pg-swatches">
                <button
                  v-for="p in HUE_PRESETS"
                  :key="p.name"
                  class="pg-swatch"
                  :style="{ '--pg-swatch': `light-dark(oklch(50% 0.15 ${p.hue}), oklch(67% 0.135 ${p.hue}))` }"
                  :aria-pressed="prefs.knobs.hue === p.hue"
                  :title="`${p.name} (${p.hue}°)`"
                  @click="prefs.knobs.hue = p.hue"
                />
              </div>
            </div>

            <div class="pg-knob">
              <div class="pg-knob__row"><label for="k-chroma">Neutral tint</label><output>{{ prefs.knobs.neutralChroma.toFixed(3) }}</output></div>
              <input id="k-chroma" v-model.number="prefs.knobs.neutralChroma" class="pg-range" type="range" min="0" max="0.03" step="0.001" />
              <label class="pg-check">
                <input v-model="prefs.knobs.linkNeutralHue" type="checkbox" /> Tint grays with accent hue
              </label>
              <template v-if="!prefs.knobs.linkNeutralHue">
                <div class="pg-knob__row"><label for="k-nhue">Neutral hue</label><output>{{ prefs.knobs.neutralHue }}°</output></div>
                <input id="k-nhue" v-model.number="prefs.knobs.neutralHue" class="pg-range is-hue" :style="hueTrack" type="range" min="0" max="360" step="1" />
              </template>
            </div>

            <div class="pg-knob">
              <div class="pg-knob__row"><label for="k-radius">Radius</label><output>×{{ prefs.knobs.radius.toFixed(2) }}</output></div>
              <input id="k-radius" v-model.number="prefs.knobs.radius" class="pg-range" type="range" min="0" max="2" step="0.05" />
              <div class="pg-knob__scale"><span>square</span><span>round</span></div>
            </div>

            <div class="pg-knob">
              <div class="pg-knob__row"><label for="k-density">Density</label><output>×{{ prefs.knobs.density.toFixed(2) }}</output></div>
              <div class="pg-segmented is-full" role="radiogroup" aria-label="Density preset">
                <button
                  v-for="dp in ([
                    { label: 'Compact', value: 0.65 },
                    { label: 'Default', value: 1 },
                    { label: 'Comfortable', value: 1.15 },
                  ] as const)"
                  :key="dp.label"
                  type="button"
                  role="radio"
                  :aria-checked="Math.abs(prefs.knobs.density - dp.value) < 0.005"
                  @click="prefs.knobs.density = dp.value"
                >
                  {{ dp.label }}
                </button>
              </div>
              <input id="k-density" v-model.number="prefs.knobs.density" class="pg-range" type="range" min="0.6" max="1.25" step="0.01" />
              <div class="pg-knob__scale"><span>0.60×</span><span>1.25×</span></div>
            </div>

            <div class="pg-knob">
              <div class="pg-knob__row"><span>Stage</span></div>
              <div class="pg-segmented is-full" role="radiogroup" aria-label="Stage background">
                <button v-for="s in stages" :key="s" role="radio" :aria-checked="prefs.stage === s" @click="prefs.stage = s">{{ s }}</button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <button v-if="showRailToggle" class="pg-icon-btn" title="Show feedback panel" @click="prefs.rail = true">
        <Icon name="message" />
      </button>
    </div>
  </header>
</template>
