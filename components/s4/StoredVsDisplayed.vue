<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStep } from '../../composables/useStep'
import { useBinary } from '../../composables/useBinary'
import huUrl from '../../data/imaging/ct/slice_hu.bin?url'
import meta from '../../data/imaging/dicom/meta.json'
import ZoomPane from '../ui/ZoomPane.vue'

// A stored number becomes a real-world unit (Hounsfield) through the file's slope and intercept, in three
// steps: stored value → conversion → HU on a scale from air to bone. Hover the CT to read real values;
// zoom with the wheel or the + / − buttons. clicks: 2
const { step } = useStep(2)
const buf = useBinary(huUrl)
const cv = ref<HTMLCanvasElement>()
const tags = meta.ct_tags['How to read the pixels']
const intercept = Number(tags.find(r => r.keyword === 'RescaleIntercept')!.value)
const slope = Number(tags.find(r => r.keyword === 'RescaleSlope')!.value)
watch([buf, cv], () => {
  if (!buf.value || !cv.value) return
  const hu = new Int16Array(buf.value)
  const g = cv.value.getContext('2d')!
  const img = g.createImageData(512, 512)
  for (let i = 0; i < hu.length; i++) { const v = Math.max(0, Math.min(255, ((hu[i] + 1350) / 1500) * 255)); img.data.set([v, v, v, 255], i * 4) }
  g.putImageData(img, 0, 0)
}, { flush: 'post' })
const at = ref<{ x: number, y: number } | null>({ x: 316, y: 367 })
const probe = computed(() => {
  if (!buf.value || !at.value) return null
  const hu = new Int16Array(buf.value)[at.value.y * 512 + at.value.x]
  return { hu, stored: (hu - intercept) / slope }
})
const move = (e: PointerEvent) => {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  at.value = { x: Math.min(511, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 512))), y: Math.min(511, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * 512))) }
}
// Scale strip: tissue bands in Hounsfield units, stretched piecewise so the narrow middle bands can be read
const HB = [-1100, -900, -500, -150, -30, 100, 400, 1500], XB = [0, 45, 115, 185, 245, 320, 400, 500]
const SX = (hu: number) => {
  const v = Math.min(1500, Math.max(-1100, hu))
  const i = Math.max(0, HB.findIndex(b => b >= v) - 1)
  return XB[i] + ((v - HB[i]) / (HB[i + 1] - HB[i])) * (XB[i + 1] - XB[i])
}
// Between lung and fat a pixel usually straddles an edge (part air, part tissue), so it gets its own band
const BANDS: [number, number, string, string][] = [[-1100, -900, 'air', '#111'], [-900, -500, 'lung', '#3a3a3a'], [-500, -150, 'lung edge', '#5e5e5e'], [-150, -30, 'fat', '#808080'], [-30, 100, 'soft tissue', '#aaa'], [100, 400, 'contrast', '#ccc'], [400, 1500, 'bone', '#eee']]
const what = (hu: number) => hu < -900 ? 'air' : hu < -500 ? 'lung' : hu < -150 ? 'edge of the lung' : hu < -30 ? 'fat' : hu < 100 ? 'soft tissue' : hu < 400 ? 'blood vessel with contrast' : 'bone'
</script>

<template>
  <div class="sd">
    <div class="pic">
      <ZoomPane>
        <div class="probe" @pointermove="move">
          <canvas ref="cv" width="512" height="512" />
          <span v-if="at" class="cross" :style="{ left: `${(at.x / 512) * 100}%`, top: `${(at.y / 512) * 100}%` }" />
        </div>
      </ZoomPane>
    </div>
    <div v-if="probe" class="side">
      <div class="row">
        <span class="lbl">Stored in the file</span>
        <span class="big mono">{{ probe.stored }}</span>
      </div>
      <div class="row rv" :class="{ on: step >= 1 }">
        <span class="lbl">Rule in the file</span>
        <span class="mid mono">× {{ slope }} {{ intercept < 0 ? '−' : '+' }} {{ Math.abs(intercept) }}</span>
      </div>
      <div class="row rv" :class="{ on: step >= 1 }">
        <span class="lbl">Real unit</span>
        <span class="big mono hu">{{ probe.hu }} HU</span>
        <span class="tissue">{{ what(probe.hu) }}</span>
      </div>
      <div class="rv" :class="{ on: step >= 2 }">
        <svg viewBox="0 0 500 58" class="scale" role="img" aria-label="Hounsfield scale from air to bone with the current value marked">
          <g v-for="[a, b, l, c] in BANDS" :key="l"><rect :x="SX(a)" y="16" :width="SX(b) - SX(a)" height="16" :fill="c" /><text :x="(SX(a) + SX(b)) / 2" y="48" class="bl">{{ l }}</text></g>
          <text v-for="t in [-1000, 0, 1000]" :key="t" :x="SX(t)" y="11" class="tk">{{ t }}</text>
          <path :d="`M${SX(probe.hu)} 16 l-6 -10 h12 z`" class="mk" />
        </svg>
        <p class="why">The same tissue gives the same HU on every CT scanner.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sd { display: grid; grid-template-columns: 330px 1fr; gap: 40px; align-items: center; }
.pic { position: relative; width: 330px; height: 330px; border-radius: var(--radius); overflow: hidden; }
.probe { position: relative; width: 100%; height: 100%; cursor: crosshair; }
canvas { width: 100%; height: 100%; display: block; border-radius: var(--radius); }
.cross { position: absolute; width: 18px; height: 18px; border: 2px solid #ffc400; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }
.side { display: flex; flex-direction: column; gap: 12px; }
.row { display: grid; grid-template-columns: 170px auto 1fr; align-items: baseline; gap: 14px; }
.lbl { font-size: var(--fs-label); color: var(--ink-2); }
.big { font-size: 38px; font-weight: 600; color: var(--ink); }
.big.hu { color: var(--accent); }
.mid { font-size: 26px; color: var(--ink); }
.tissue { font-size: var(--fs-label); color: var(--ink-2); }
.scale { width: 100%; height: auto; margin-top: 6px; }
.scale .bl { font: 500 12px var(--font-sans); fill: var(--ink-2); text-anchor: middle; }
.scale .tk { font: 500 11px var(--font-mono); fill: var(--ink-3); text-anchor: middle; }
.scale .mk { fill: #ffc400; stroke: #1a1a1a; stroke-width: 1; }
.why { font-size: var(--fs-label); margin: 6px 0 0; }
</style>
