<script lang="ts">
export const meta = {
  name: 'Avatar',
  group: 'Display',
  order: 2,
  description: 'User image with initials fallback, status and overlapping groups.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import { JAvatar, JAvatarGroup, JCard, JBadge, JInline, JStack } from '@jenni/vue';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const tones = ['accent', 'info', 'success', 'warning', 'danger'] as const;
const statuses = ['online', 'away', 'busy', 'offline'] as const;
const photo = (n: number) => `https://i.pravatar.cc/160?img=${n}`;
const brokenPhoto = 'data:image/gif;base64,invalid';
const people = [
  { name: 'Ada Lovelace', img: 47 },
  { name: 'Grace Hopper', img: 45 },
  { name: 'Alan Turing', img: 12 },
  { name: 'Linus Torvalds', img: 53 },
  { name: 'Margaret Hamilton', img: 32 },
  { name: 'Dennis Ritchie', img: 59 },
  { name: 'Barbara Liskov', img: 44 },
];

const html = `<div class="j-inline" data-gap="item">
  <span class="j-avatar" data-size="lg">
    <img class="j-avatar__image" src="https://i.pravatar.cc/160?img=47" alt="Ada Lovelace">
    <span class="j-avatar__fallback">AL</span>
    <span class="j-avatar__status" data-status="online"></span>
  </span>
  <span class="j-avatar" data-size="lg" data-tone="accent">
    <span class="j-avatar__fallback">GH</span>
  </span>
  <div class="j-avatar-group">
    <span class="j-avatar"><span class="j-avatar__fallback">AT</span></span>
    <span class="j-avatar" data-tone="success"><span class="j-avatar__fallback">LT</span></span>
    <span class="j-avatar j-avatar-group__more"><span class="j-avatar__fallback">+4</span></span>
  </div>
</div>`;
</script>

<template>
  <DemoSection title="Image & fallback" description="Initials render calmly while loading or when an image cannot be reached.">
    <JInline gap="item">
      <JAvatar :src="photo(47)" name="Ada Lovelace" />
      <JAvatar :src="brokenPhoto" name="Grace Hopper" />
      <JAvatar name="Alan Turing" />
      <JAvatar />
    </JInline>
  </DemoSection>

  <DemoSection title="Sizes" description="xs · sm · md · lg · xl">
    <JStack gap="item" align="center">
      <JInline gap="item">
        <JAvatar v-for="s in sizes" :key="s" :size="s" :src="photo(45)" name="Grace Hopper" />
      </JInline>
      <JInline gap="item">
        <JAvatar v-for="s in sizes" :key="s" :size="s" name="Grace Hopper" tone="accent" />
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Shapes" description="Circle for people, tailored square for workspaces and services.">
    <JInline gap="item">
      <JAvatar v-for="s in sizes" :key="s" :size="s" shape="square" name="Meridian Labs" :tone="s === 'xl' ? 'accent' : undefined" />
      <JAvatar size="xl" shape="square" :src="photo(12)" name="Alan Turing" status="online" />
    </JInline>
  </DemoSection>

  <DemoSection title="Tones" description="Soft ink-tinted fallbacks distinguish collaborators.">
    <JInline gap="item">
      <JAvatar name="Neutral Default" />
      <JAvatar v-for="t in tones" :key="t" :tone="t" :name="`${t} tone`" />
    </JInline>
  </DemoSection>

  <DemoSection title="Status">
    <JInline gap="item">
      <JAvatar v-for="(s, i) in statuses" :key="s" :src="photo(i + 20)" :name="s" :status="s" size="lg" />
      <JAvatar name="Ada Lovelace" status="online" size="sm" />
      <JAvatar name="Ada Lovelace" status="busy" size="xl" tone="accent" />
    </JInline>
  </DemoSection>

  <DemoSection title="AvatarGroup" description="Overlapping stack with crisp ring cutouts and an overflow counter.">
    <JStack gap="field" align="center">
      <JAvatarGroup size="sm" :max="4">
        <JAvatar v-for="p in people" :key="p.name" :src="photo(p.img)" :name="p.name" />
      </JAvatarGroup>
      <JAvatarGroup :max="5">
        <JAvatar v-for="p in people" :key="p.name" :src="photo(p.img)" :name="p.name" />
      </JAvatarGroup>
      <JAvatarGroup size="lg" :max="3" :total="128">
        <JAvatar v-for="(p, i) in people.slice(0, 3)" :key="p.name" :name="p.name" :tone="(['accent', 'success', 'warning'] as const)[i]" />
      </JAvatarGroup>
    </JStack>
  </DemoSection>

  <DemoSection title="Profile card" description="Composition pairing an avatar, status badge and collaborator group.">
    <JCard footer-divider style="width:100%;max-width:360px">
      <JInline gap="item" nowrap>
        <JAvatar :src="photo(32)" name="Margaret Hamilton" size="xl" status="online" />
        <JStack gap="none" style="flex:1">
          <strong style="font-size:var(--j-text-lg);letter-spacing:var(--j-tracking-tight)">Margaret Hamilton</strong>
          <span style="color:var(--j-fg-muted);font-size:var(--j-text-sm)">Director of Software Engineering</span>
        </JStack>
      </JInline>
      <template #footer>
        <JAvatarGroup size="xs" :max="4">
          <JAvatar v-for="p in people" :key="p.name" :src="photo(p.img)" :name="p.name" />
        </JAvatarGroup>
        <span style="color:var(--j-fg-muted);font-size:var(--j-text-xs)">7 shared projects</span>
        <JBadge tone="success" dot style="margin-inline-start:auto">Available</JBadge>
      </template>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
