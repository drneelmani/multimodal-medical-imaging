<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStep } from '../../composables/useStep'
import { useBinary } from '../../composables/useBinary'
import { rafThrottle } from '../../composables/raf'
import ctUrl from '../../data/imaging/petct/ct_hu.bin?url'
import suvUrl from '../../data/imaging/petct/suv_x100.bin?url'
import lesion from '../../data/imaging/petct/lesion_edge.png'
import mip from '../../data/imaging/petct/mip_coronal.png'
import meta from '../../data/imaging/petct/meta.json'
import ZoomPane from '../ui/ZoomPane.vue'

// Artifact 26 — PET/CT: two kinds of image from one scanner session, one picture. CT shows anatomy,
// PET shows sugar uptake (SUV, computed from the PET file's tags); fused, the uptake is placed on the anatomy.
// Step 3 adds the expert lesion outline (DICOM SEG). Opacity and hover work freely. clicks: 3
const { step } = useStep(3)
const ct = useBinary(ctUrl)
const suv = useBinary(suvUrl)
const [H, W] = meta.grid
const alpha = ref(0.6)
watch(step, s => { alpha.value = s === 1 ? 1 : 0.6 }, { immediate: true })
const cv = ref<HTMLCanvasElement>()
function hot(t: number): [number, number, number] {
  return [Math.min(255, t * 3 * 255), Math.min(255, Math.max(0, t * 3 - 1) * 255), Math.min(255, Math.max(0, t * 3 - 2) * 255)]
}
function draw() {
  if (!ct.value || !suv.value || !cv.value) return
  const hu = new Int16Array(ct.value), s = new Uint16Array(suv.value)
  const g = cv.value.getContext('2d')!
  const img = g.createImageData(W, H)
  const showCT = step.value !== 1, showPET = step.value >= 1
  for (let i = 0; i < W * H; i++) {
    const c = showCT ? Math.max(0, Math.min(255, ((hu[i] + 160) / 400) * 255)) : 0
    let rgb: [number, number, number] = [c, c, c]
    if (showPET) {
      // Colour only real uptake: transparent below SUV 1.5, fully coloured from SUV 4
      const v = s[i] / 100, t = Math.min(1, v / meta.mip_suv_max_display)
      const h = hot(t), a = alpha.value * Math.min(1, Math.max(0, (v - 1.5) / 2.5))
      rgb = [rgb[0] * (1 - a) + h[0] * a, rgb[1] * (1 - a) + h[1] * a, rgb[2] * (1 - a) + h[2] * a]
    }
    img.data.set([rgb[0], rgb[1], rgb[2], 255], i * 4)
  }
  g.putImageData(img, 0, 0)
}
watch([ct, suv, cv, alpha, step], rafThrottle(draw), { flush: 'post' })
const at = ref<{ x: number, y: number } | null>(null)
const probe = computed(() => {
  if (!ct.value || !suv.value || !at.value) return null
  const i = at.value.y * W + at.value.x
  return { hu: new Int16Array(ct.value)[i], suv: new Uint16Array(suv.value)[i] / 100 }
})
const move = (e: PointerEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); at.value = { x: Math.floor(((e.clientX - r.left) / r.width) * W), y: Math.floor(((e.clientY - r.top) / r.height) * H) } }
// Places on the whole-body image, marked by eye (fractions of width and height): FDG goes where cells
// use a lot of sugar, so brain, heart, kidneys and bladder are dark normally; the tumour is abnormal.
const MARKS = [{ t: 'tumour', x: 0.56, y: 0.245, bad: true }, { t: 'heart', x: 0.47, y: 0.38 }, { t: 'liver', x: 0.36, y: 0.5 }, { t: 'kidney', x: 0.58, y: 0.56 }, { t: 'bladder', x: 0.51, y: 0.84 }]
const CAP = ['CT: anatomy, in Hounsfield units', 'PET: sugar uptake, in SUV', 'Fused: the uptake is placed on the anatomy', 'Expert outline of the tumour (DICOM SEG)']
</script>

<template>
  <div class="pf">
    <div>
      <div class="pic">
        <ZoomPane>
          <div class="probe" @pointermove="move" @pointerleave="at = null">
            <canvas ref="cv" :width="W" :height="H" />
            <img v-if="step >= 3" :src="lesion" alt="" class="les">
          </div>
        </ZoomPane>
      </div>
      <p class="read">{{ CAP[step] }}<template v-if="probe"> · {{ probe.hu }} HU, SUV {{ probe.suv.toFixed(1) }}</template></p>
      <label v-if="step >= 2" class="ctl">PET opacity <input v-model.number="alpha" type="range" min="0" max="1" step="0.05" @keydown.stop></label>
    </div>
    <div class="side">
      <figure>
        <div class="mipbox">
          <img :src="mip" alt="Whole-body PET, front view, darker = more uptake">
          <span class="lvl" :style="{ top: `${meta.mip_slice_frac * 100}%` }" />
          <span v-for="m in MARKS" :key="m.t" class="mk" :class="{ bad: m.bad }" :style="{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }">{{ m.t }}</span>
        </div>
        <figcaption>Whole body, front view: all slices combined into one picture (a maximum-intensity projection), so it stays the same. <span class="yl">Yellow line</span>: the slice on the left. Labels added by us.</figcaption>
      </figure>
      <div class="card rv" :class="{ on: step >= 3 }">
        <p>Tumour SUVmax <strong>{{ meta.lesion.suv_max }}</strong></p>
        <p>Volume <strong>{{ Math.round(meta.lesion.volume_ml) }} ml</strong></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pf { display: grid; grid-template-columns: 330px 1fr; gap: 30px; align-items: center; }
.pic { position: relative; width: 330px; height: 330px; border-radius: var(--radius); overflow: hidden; background: var(--image-mat); }
.probe { position: relative; width: 100%; height: 100%; cursor: crosshair; }
.pic canvas, .les { position: absolute; inset: 0; width: 100%; height: 100%; }
.les { image-rendering: pixelated; }
.read { font-size: 15px; margin: 6px 0 2px; min-height: 20px; }
.ctl { font-size: 15px; }
.side { display: grid; grid-template-columns: 200px 1fr; gap: 18px; align-items: center; }
figure { margin: 0; display: flex; flex-direction: column; gap: 4px; }
.mipbox { position: relative; width: 200px; }
figure img { width: 200px; display: block; border: 1px solid var(--rule); border-radius: 4px; background: #fff; }
.lvl { position: absolute; left: 0; right: 0; height: 2px; background: #ffc400; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35); }
.mk { position: absolute; transform: translate(10px, -50%); font: 600 10.5px/1 var(--font-sans); color: #1d4ed8; background: rgba(255, 255, 255, 0.85); padding: 1px 3px; border-radius: 3px; white-space: nowrap; }
.mk::before { content: ''; position: absolute; left: -10px; top: 50%; width: 8px; height: 1px; background: currentColor; }
.mk.bad { color: #b91c1c; }
.yl { color: #a16207; font-weight: 600; }
figcaption { font-size: 12.5px; color: var(--ink-2); line-height: 1.3; }
.card p { margin: 0 0 6px; font-size: var(--fs-label); }
</style>
