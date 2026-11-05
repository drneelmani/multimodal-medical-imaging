<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStep } from '../../composables/useStep'
import { useBinary } from '../../composables/useBinary'
import huUrl from '../../data/imaging/ct/slice_hu.bin?url'
import meta from '../../data/imaging/dicom/meta.json'
import tagWin from '../../data/imaging/pipeline/tag_window.png'
import pack from '../../data/imaging/dicom_examples/manifest.json'
import good from '../../data/imaging/pipeline/windowed.png'
import ZoomPane from '../ui/ZoomPane.vue'

// Slide 32 — a stored number becomes a real-world unit (Hounsfield) through slope and intercept;
// a display window then turns units into grey. Hover the CT to read real values; the scale strip shows
// where the value sits between air and bone. Zoom with the wheel or the + / − buttons. clicks: 2
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
const what = (hu: number) => hu < -900 ? 'air' : hu < -500 ? 'lung' : hu < -150 ? 'edge of the lung: the pixel mixes air and tissue' : hu < -30 ? 'fat' : hu < 100 ? 'soft tissue or fluid' : hu < 400 ? 'contrast-filled vessel' : 'bone'
// Why the X-ray turns white with its own window tags: the window covers −1400…200, the pixels sit far above
const [wc, ww] = meta.dx_window_tags.map(Number)
const dxPix = (pack.files as any[]).find(f => f.file === 'xray-lidc-0001.dcm')!.pixels
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
    <div class="side">
      <p v-if="probe" class="readout">
        stored <strong class="mono">{{ probe.stored }}</strong>
        <span class="rv" :class="{ on: step >= 1 }"> → × {{ slope }} {{ intercept < 0 ? '−' : '+' }} {{ Math.abs(intercept) }} → <strong class="mono">{{ probe.hu }} HU</strong> <span class="muted">({{ what(probe.hu) }})</span></span>
      </p>
      <svg v-if="step >= 1" viewBox="0 0 500 58" class="scale rv on" role="img" aria-label="Hounsfield scale from air to bone with the current value marked">
        <g v-for="[a, b, l, c] in BANDS" :key="l"><rect :x="SX(a)" y="16" :width="SX(b) - SX(a)" height="16" :fill="c" /><text :x="(SX(a) + SX(b)) / 2" y="48" class="bl">{{ l }}</text></g>
        <text v-for="t in [-1000, 0, 1000]" :key="t" :x="SX(t)" y="11" class="tk">{{ t }}</text>
        <path v-if="probe" :d="`M${SX(probe.hu)} 34 l-6 -10 h12 z`" class="mk" :transform="`translate(0 -18)`" />
      </svg>
      <p class="rv" :class="{ on: step >= 1 }">Why units: the same tissue gives the same number on every CT scanner, so thresholds and models carry over. The file says how: <span class="mono">RescaleSlope {{ slope }}</span>, <span class="mono">RescaleIntercept {{ intercept }}</span></p>
      <div v-if="step >= 2" class="wrong rv on">
        <figure>
          <div class="whitebox">
            <img :src="tagWin" alt="X-ray shown with its own window tags: almost all white">
            <span class="why">Window {{ (wc - ww / 2).toLocaleString() }} to {{ (wc + ww / 2).toLocaleString() }}<br>X-ray pixels {{ Math.round(dxPix.min).toLocaleString() }} to {{ Math.round(dxPix.max).toLocaleString() }}<br>→ nearly all above → white</span>
          </div>
          <figcaption class="bad">Window from the file’s tags: all white</figcaption>
        </figure>
        <figure>
          <img :src="good" alt="The same X-ray with a sensible window">
          <figcaption>A sensible window</figcaption>
        </figure>
        <p>The X-ray’s own window tags (<span class="mono">{{ meta.dx_window_tags.join(' / ') }}</span>) look copied from a CT. Metadata can be wrong.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sd { display: grid; grid-template-columns: 330px 1fr; gap: 36px; align-items: center; }
.pic { position: relative; width: 330px; height: 330px; border-radius: var(--radius); overflow: hidden; }
.probe { position: relative; width: 100%; height: 100%; cursor: crosshair; }
.scale { width: 100%; height: auto; margin: -4px 0 10px; }
.scale .bl { font: 500 12px var(--font-sans); fill: var(--ink-2); text-anchor: middle; }
.scale .tk { font: 500 11px var(--font-mono); fill: var(--ink-3); text-anchor: middle; }
.scale .mk { fill: #ffc400; stroke: #1a1a1a; stroke-width: 1; }
canvas { width: 100%; height: 100%; display: block; border-radius: var(--radius); }
.cross { position: absolute; width: 18px; height: 18px; border: 2px solid #ffc400; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }
.side p { font-size: var(--fs-label); margin: 0 0 14px; }
.readout { font-size: var(--fs-body) !important; }
.readout strong { color: var(--accent); }
.wrong { display: grid; grid-template-columns: 110px 110px 1fr; gap: 10px; align-items: start; margin-top: 12px; }
.wrong figure { margin: 0; display: flex; flex-direction: column; gap: 4px; }
.wrong img { width: 110px; height: 110px; border-radius: 4px; border: 1px solid var(--rule-strong); display: block; }
.whitebox { position: relative; }
.whitebox .why { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 6px; font: 500 10.5px/1.35 var(--font-mono); color: var(--bad); }
.wrong figcaption { font-size: 14px; line-height: 1.2; color: var(--ink-2); }
.wrong figcaption.bad { color: var(--bad); font-weight: 600; }
.wrong p { font-size: 16px !important; margin: 0 !important; }
</style>
