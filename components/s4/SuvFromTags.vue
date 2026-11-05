<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useStep } from '../../composables/useStep'
import { type Dicom, loadDicom, suvFactor } from '../../composables/dicom'
import { drawGrey, pub } from '../../composables/draw'
import meta from '../../data/imaging/petct/meta.json'
import ZoomPane from '../ui/ZoomPane.vue'

// Slide — PET pixels are radioactivity (Bq/ml); the file's own tags turn them into SUV, the number
// clinicians compare. Every value below is read from the real PET file. Hover the image. clicks: 3
const { step } = useStep(3)
const d = shallowRef<Dicom | null>(null)
const cv = ref<HTMLCanvasElement>()
onMounted(async () => { d.value = await loadDicom(pub('dicom/pet-fdg-lung.dcm')) })
const s = computed(() => d.value ? suvFactor(d.value) : null)
watch([d, cv], () => {
  if (!d.value || !cv.value) return
  const v = d.value.frame(0) as Float32Array
  drawGrey(cv.value, v, d.value.cols, d.value.rows, 4 / s.value!.factor, 8 / s.value!.factor, true)
}, { flush: 'post' })
const at = ref<{ x: number, y: number } | null>(null)
const probe = computed(() => {
  if (!d.value || !at.value || !s.value) return null
  const bq = (d.value.frame(0) as Float32Array)[at.value.y * d.value.cols + at.value.x]
  return { bq, suv: bq * s.value.factor }
})
const move = (e: PointerEvent) => {
  if (!d.value) return
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  at.value = { x: Math.floor(((e.clientX - r.left) / r.width) * d.value.cols), y: Math.floor(((e.clientY - r.top) / r.height) * d.value.rows) }
}
const f1 = (v: number) => v.toFixed(1)
// Decay curve from injection to 30 min after the scan: activity = dose × 2^(−t / half-life)
const CW = 300, CH = 92
const curve = computed(() => {
  if (!s.value) return null
  const T = s.value.minutes + 40, dose = s.value.doseMBq
  const px = (t: number) => 28 + (t / T) * (CW - 40), py = (a: number) => 16 + (1 - a / dose) * (CH - 36)
  const pts = Array.from({ length: 41 }, (_, i) => { const t = (i / 40) * T; return `${px(t).toFixed(1)},${py(dose * 2 ** (-t / s.value!.halfLifeMin)).toFixed(1)}` })
  return { d: `M${pts.join(' L')}`, sx: px(s.value.minutes), sy: py(s.value.doseNowMBq), x0: px(0), y0: py(dose), base: py(0) }
})
const hhmm = (t: string) => `${t.slice(0, 2)}:${t.slice(2, 4)}`
</script>

<template>
  <div class="sv">
    <div>
      <div class="zoom"><ZoomPane><canvas ref="cv" class="pet" @pointermove="move" @pointerleave="at = null" /></ZoomPane></div>
      <p class="read">{{ probe ? `${Math.round(probe.bq).toLocaleString()} Bq/ml${step >= 3 ? ` → SUV ${f1(probe.suv)}` : ''}` : 'Point at the image' }}</p>
    </div>
    <div v-if="s" class="side">
      <p class="lbl">Read from the PET file’s tags</p>
      <dl class="tags rv" :class="{ on: step >= 1 }">
        <dt>Units</dt><dd class="mono">{{ d!.str('Units') }} (becquerels per ml)</dd>
        <dt>Tracer</dt><dd>{{ d!.item('RadiopharmaceuticalInformationSequence')?.str('Radiopharmaceutical') }}, {{ f1(s.doseMBq) }} MBq at {{ hhmm(s.start) }}</dd>
        <dt>Scan started</dt><dd>{{ hhmm(d!.str('SeriesTime')!) }}, {{ f1(s.minutes) }} min later</dd>
        <dt>Patient weight</dt><dd>{{ s.weight }} kg</dd>
      </dl>
      <div class="decay rv" :class="{ on: step >= 2 }">
        <svg v-if="curve" :viewBox="`0 0 ${CW} ${CH}`" class="dc" role="img" aria-label="Radioactive decay of the injected tracer between injection and scan">
          <line :x1="curve.x0" :x2="CW - 8" :y1="curve.base" :y2="curve.base" class="ax" />
          <path :d="curve.d" class="cv" />
          <line :x1="curve.sx" :x2="curve.sx" :y1="curve.sy" :y2="curve.base" class="drop" />
          <circle :cx="curve.x0" :cy="curve.y0" r="3.5" class="pt" /><circle :cx="curve.sx" :cy="curve.sy" r="3.5" class="pt now" />
          <text :x="curve.x0" :y="curve.y0 - 7" class="t">{{ f1(s.doseMBq) }} MBq injected</text>
          <text :x="curve.sx + 6" :y="curve.sy - 4" class="t">{{ f1(s.doseNowMBq) }} MBq at scan</text>
          <text :x="curve.sx" :y="CH - 4" class="t c">{{ f1(s.minutes) }} min</text>
          <text :x="curve.x0" :y="CH - 4" class="t c">0</text>
        </svg>
        <p class="step"><strong>Decay:</strong> the tracer is radioactive and loses half its strength every {{ f1(s.halfLifeMin) }} min (its half-life), so only {{ f1(s.doseNowMBq) }} MBq were left when the scan began.</p>
      </div>
      <p class="step rv" :class="{ on: step >= 3 }"><strong>SUV</strong> = Bq/ml × {{ s.weight * 1000 }} g ÷ {{ f1(s.doseNowMBq) }} MBq · tumour SUVmax <strong>{{ meta.lesion.suv_max }}</strong> (whole tumour, 3D)</p>
    </div>
  </div>
</template>

<style scoped>
.sv { display: grid; grid-template-columns: 320px 1fr; gap: 32px; align-items: center; }
/* The PET field of view is 81 cm wide; show the middle 45% so the chest fills the frame */
.zoom { width: 320px; height: 320px; overflow: hidden; border-radius: var(--radius); border: 1px solid var(--rule); background: #fff; }
.pet { width: 711px; height: 711px; display: block; margin: -195px 0 0 -195px; cursor: crosshair; }
.read { font: 500 16px var(--font-mono); margin: 6px 0 0; color: var(--accent); min-height: 22px; }
.lbl { font-size: var(--fs-label); color: var(--ink-2); margin: 0 0 8px; }
.tags { display: grid; grid-template-columns: 130px 1fr; gap: 6px 12px; margin: 0 0 12px; font-size: 16px; }
.tags dt { color: var(--ink-2); }
.tags dd { margin: 0; }
.step { font-size: var(--fs-label); margin: 0 0 10px; }
.decay { display: grid; grid-template-columns: 300px 1fr; gap: 14px; align-items: center; margin-bottom: 8px; }
.decay .step { font-size: 15px; margin: 0; line-height: 1.3; }
.dc { width: 300px; height: auto; }
.dc .ax { stroke: var(--ink-3); stroke-width: 1; }
.dc .cv { fill: none; stroke: var(--accent); stroke-width: 2; }
.dc .drop { stroke: var(--ink-3); stroke-dasharray: 3 3; }
.dc .pt { fill: var(--accent); }
.dc .pt.now { fill: #ffc400; stroke: #1a1a1a; }
.dc .t { font: 500 10.5px var(--font-sans); fill: var(--ink-2); }
.dc .t.c { text-anchor: middle; }
</style>
