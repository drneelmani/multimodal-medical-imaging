<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { appendixNumber, coreNumber } from './composables/useNumbering'
import { refNumber, slideSources } from './composables/useRefs'
import HonestyTag from './components/ui/HonestyTag.vue'
import { linkByKey } from './data/links'

// Quiet footer: the slide's one honesty label (or nothing), its source numbers, and the slide number.
// Links to the datasets and models the slide uses sit in the empty strip above the title, top right.
const { $frontmatter, $page } = useSlideContext()
const show = computed(() => $frontmatter.chrome !== false && $frontmatter.layout !== 'opener')
const nums = computed(() =>
  slideSources($frontmatter)
    .map(k => refNumber(k))
    .filter((n): n is number => n !== undefined)
    .sort((a, b) => a - b),
)
const links = computed(() => ((($frontmatter.links ?? []) as string[]).map(k => linkByKey.get(k)).filter(Boolean)) as { key: string, label: string, kind: string, url: string }[])
const label = computed(() => {
  const a = appendixNumber($page.value)
  if (a)
    return `A${a}`
  return coreNumber($page.value)
})
</script>

<template>
  <footer v-if="show" class="foot">
    <span class="left">
      <HonestyTag v-if="$frontmatter.tag" :kind="$frontmatter.tag" :text="$frontmatter.tagText" />
    </span>
    <span v-if="nums.length" class="src">Sources {{ nums.map(n => `[${n}]`).join(' ') }}</span>
    <span class="no">{{ label }}</span>
  </footer>
  <nav v-if="show && links.length" class="links" aria-label="Datasets and models on this slide">
    <a v-for="l in links" :key="l.key" :href="l.url" target="_blank" rel="noopener" :title="l.url"><span class="k">{{ l.kind === 'model' ? 'Model' : 'Data' }}</span>{{ l.label }} ↗</a>
  </nav>
</template>

<style scoped>
.foot {
  position: absolute;
  left: var(--gutter);
  right: var(--gutter);
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 20px;
  font: 400 var(--fs-micro)/1.2 var(--font-sans);
  color: var(--ink-3);
  z-index: 10;
}
.left { flex: 1 1 auto; min-width: 0; }
.src { flex: 0 0 auto; }
.links {
  position: absolute; top: 8px; right: var(--gutter); left: var(--gutter); z-index: 10;
  display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 3px 5px; pointer-events: none;
  font: 500 11.5px/1.2 var(--font-sans);
}
.links a {
  display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px 1px 3px; white-space: nowrap; pointer-events: auto;
  border: 1px solid var(--rule) !important; border-radius: 999px; background: var(--surface);
  color: var(--accent) !important; text-decoration: none !important;
}
.links a:hover { border-color: var(--accent) !important; }
.links .k { font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-2); background: var(--stage); border-radius: 999px; padding: 1px 5px; }
.no { flex: 0 0 auto; font-variant-numeric: tabular-nums; color: var(--ink-2); font-weight: 500; min-width: 2em; text-align: right; }
</style>
