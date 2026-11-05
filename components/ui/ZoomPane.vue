<script setup lang="ts">
import { ref } from 'vue'

// Zoom and pan for an image or canvas: mouse wheel or + / − zoom (1–6×) around the pointer, drag to
// pan once zoomed, double-click or ⟲ to reset. Readouts inside the slot keep working because they
// measure their own (transformed) bounding box.
const MAX = 6
const k = ref(1), x = ref(0), y = ref(0)
const box = ref<HTMLElement>()
let drag: { px: number, py: number, x: number, y: number, moved: boolean } | null = null

// Pan offsets are in the box's own pixels (before the slide's scaling to the window)
function clampPan() {
  const b = box.value!
  x.value = Math.min(0, Math.max(b.offsetWidth * (1 - k.value), x.value))
  y.value = Math.min(0, Math.max(b.offsetHeight * (1 - k.value), y.value))
}
function zoomAt(f: number, cx?: number, cy?: number) {
  const px = cx ?? box.value!.offsetWidth / 2, py = cy ?? box.value!.offsetHeight / 2
  const nk = Math.min(MAX, Math.max(1, k.value * f))
  x.value = px - (px - x.value) * (nk / k.value)
  y.value = py - (py - y.value) * (nk / k.value)
  k.value = nk
  clampPan()
}
function wheel(e: WheelEvent) {
  const r = box.value!.getBoundingClientRect()
  // The slide is scaled to the window, so convert screen pixels to the box's own pixels
  const s = r.width / box.value!.offsetWidth
  zoomAt(e.deltaY < 0 ? 1.25 : 0.8, (e.clientX - r.left) / s, (e.clientY - r.top) / s)
}
function reset() { k.value = 1; x.value = 0; y.value = 0 }
function down(e: PointerEvent) {
  if (k.value === 1 || e.button !== 0) return
  drag = { px: e.clientX, py: e.clientY, x: x.value, y: y.value, moved: false }
  box.value!.setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
  if (!drag) return
  const s = box.value!.getBoundingClientRect().width / box.value!.offsetWidth
  x.value = drag.x + (e.clientX - drag.px) / s
  y.value = drag.y + (e.clientY - drag.py) / s
  drag.moved = true
  clampPan()
}
function up() { drag = null }
defineExpose({ reset })
</script>

<template>
  <div ref="box" class="zp" :class="{ zoomed: k > 1 }" @wheel.prevent="wheel" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @dblclick="reset">
    <div class="inner" :style="{ transform: `translate(${x}px, ${y}px) scale(${k})` }">
      <slot />
    </div>
    <div class="tools" @pointerdown.stop @dblclick.stop>
      <button type="button" aria-label="Zoom in" @click="zoomAt(1.5)">+</button>
      <button type="button" aria-label="Zoom out" :disabled="k === 1" @click="zoomAt(1 / 1.5)">−</button>
      <button type="button" aria-label="Reset zoom" :disabled="k === 1" @click="reset">⟲</button>
      <span v-if="k > 1" class="lvl">{{ k.toFixed(1) }}×</span>
    </div>
  </div>
</template>

<style scoped>
.zp { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: inherit; touch-action: none; }
.zp.zoomed { cursor: grab; }
.inner { width: 100%; height: 100%; transform-origin: 0 0; }
.tools { position: absolute; right: 6px; bottom: 6px; display: flex; gap: 4px; align-items: center; opacity: 0.55; transition: opacity var(--dur) var(--ease); }
.zp:hover .tools, .zp.zoomed .tools { opacity: 1; }
.tools button { width: 24px; height: 24px; padding: 0; border: none; border-radius: 5px; background: rgba(20, 22, 28, 0.78); color: #fff; font: 600 15px/24px var(--font-sans); cursor: pointer; }
.tools button:disabled { opacity: 0.4; cursor: default; }
.lvl { font: 600 12px var(--font-sans); color: #fff; background: rgba(20, 22, 28, 0.78); border-radius: 5px; padding: 3px 6px; }
</style>
