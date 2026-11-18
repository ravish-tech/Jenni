<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import StatusPill from './StatusPill.vue';
import { demos, groupDemos, planned, STATUSES } from '@/lib/registry';
import { notes, openCount } from '@/lib/feedback';
import { href } from '@/lib/router';

const groups = computed(() => groupDemos(demos));
const byStatus = computed(() =>
  STATUSES.map((s) => ({ status: s, count: s === 'planned' ? demos.filter((d) => d.status === s).length + planned.length : demos.filter((d) => d.status === s).length })),
);
const openNotes = computed(() => notes.value.filter((n) => n.status === 'open').length);
const doneNotes = computed(() => notes.value.filter((n) => n.status === 'done').length);
</script>

<template>
  <div class="pg-page is-wide">
    <header class="pg-hero">
      <p class="pg-eyebrow">Jenni · /ˈjɛni/ (“yenni”) · Design Lab</p>
      <h1 class="pg-hero__title">Mature elegance, spatial precision.</h1>
      <p class="pg-page__lede">
        Built in loving memory of Jenni — a web UI framework shaped by quiet beauty, simplicity, and poised performance.
        Inspect every component, tune tokens live, and leave notes on how each detail feels.
      </p>
    </header>

    <section class="pg-stats">
      <div class="pg-stat">
        <p class="pg-stat__value">{{ demos.length }}</p>
        <p class="pg-stat__label">Components</p>
      </div>
      <div v-for="s in byStatus" :key="s.status" class="pg-stat">
        <p class="pg-stat__value">{{ s.count }}</p>
        <p class="pg-stat__label"><span class="pg-status-dot" :data-status="s.status" /> {{ s.status[0].toUpperCase() + s.status.slice(1) }}</p>
      </div>
      <a class="pg-stat is-link" :href="href('feedback')">
        <p class="pg-stat__value">{{ openNotes }}</p>
        <p class="pg-stat__label">Open notes <span class="pg-muted">· {{ doneNotes }} done</span> <Icon name="arrow" :size="12" /></p>
      </a>
    </section>

    <div class="pg-foundations-banners">
      <a class="pg-layout-banner" :href="href('layout')">
        <div class="pg-layout-banner__icon" aria-hidden="true">
          <Icon name="layout" :size="20" />
        </div>
        <div class="pg-layout-banner__body">
          <div class="pg-layout-banner__top">
            <span class="pg-eyebrow">Foundations · Specification</span>
            <span v-if="openCount('Layout System')" class="pg-pill is-notes">
              <Icon name="message" :size="12" /> {{ openCount('Layout System') }} open
            </span>
          </div>
          <h2 class="pg-layout-banner__title">
            Spatial, Motion &amp; Layout System — Component spacing, weighted motion calibration, and full-page structure
          </h2>
          <div class="pg-layout-banner__chips">
            <span>4px / 8px grid &amp; density</span>
            <span>6 semantic gaps</span>
            <span>Control &amp; list heights</span>
            <span>Containers &amp; keylines</span>
            <span>0-bounce damped motion</span>
          </div>
        </div>
        <span class="pg-layout-banner__cta">
          Explore spec <Icon name="arrow" :size="14" />
        </span>
      </a>

      <a class="pg-layout-banner is-screens" :href="href('screens')">
        <div class="pg-layout-banner__icon" aria-hidden="true">
          <Icon name="screens" :size="20" />
        </div>
        <div class="pg-layout-banner__body">
          <div class="pg-layout-banner__top">
            <span class="pg-eyebrow">Foundations · Interactive Atlas</span>
            <span v-if="openCount('Screen Layouts')" class="pg-pill is-notes">
              <Icon name="message" :size="12" /> {{ openCount('Screen Layouts') }} open
            </span>
          </div>
          <h2 class="pg-layout-banner__title">
            Explore all 18 canonical screen architectures →
          </h2>
          <div class="pg-layout-banner__chips">
            <span>App &amp; SaaS shells (4)</span>
            <span>Multi-pane &amp; studio (4)</span>
            <span>Editorial &amp; docs (3)</span>
            <span>Flows &amp; 12-col bento (3)</span>
            <span>Mobile &amp; adaptive (2)</span>
            <span>AI artifact &amp; spatial canvas (2)</span>
          </div>
        </div>
        <span class="pg-layout-banner__cta">
          Open studio <Icon name="arrow" :size="14" />
        </span>
      </a>
    </div>

    <div v-if="!demos.length" class="pg-empty">
      <Icon name="code" :size="20" />
      <p>No demos yet.</p>
      <p class="pg-muted">Create <code>apps/playground/src/demos/&lt;group&gt;/&lt;Name&gt;.demo.vue</code> with a <code>meta</code> export.</p>
    </div>

    <section v-for="g in groups" :key="g.group" class="pg-ov-group">
      <h2 class="pg-section-title">{{ g.group }} <span class="pg-muted">{{ g.items.length }}</span></h2>
      <div class="pg-grid">
        <a v-for="d in g.items" :key="d.slug" class="pg-card" :href="href(d.slug)">
          <div class="pg-card__top">
            <h3 class="pg-card__title">{{ d.name }}</h3>
            <StatusPill :status="d.status" />
          </div>
          <p class="pg-card__desc">{{ d.description || '—' }}</p>
          <div class="pg-card__foot">
            <span v-if="openCount(d.name)" class="pg-pill is-notes"><Icon name="message" :size="12" /> {{ openCount(d.name) }} open</span>
            <span v-else class="pg-muted">No open notes</span>
            <Icon class="pg-card__arrow" name="arrow" :size="14" />
          </div>
        </a>
      </div>
    </section>

    <section v-if="planned.length" class="pg-ov-group">
      <h2 class="pg-section-title">Planned <span class="pg-muted">{{ planned.length }}</span></h2>
      <div class="pg-planned-grid">
        <a v-for="p in planned" :key="p.slug" class="pg-planned-chip" :href="href(p.slug)">
          <span class="pg-status-dot" data-status="planned" />
          {{ p.name }}
          <span class="pg-muted">{{ p.group }}</span>
          <span v-if="openCount(p.name)" class="pg-count">{{ openCount(p.name) }}</span>
        </a>
      </div>
    </section>
  </div>
</template>
