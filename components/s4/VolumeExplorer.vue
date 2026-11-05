<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStep } from '../../composables/useStep'
import { useBinary } from '../../composables/useBinary'
import { rafThrottle } from '../../composables/raf'
import volUrl from '../../data/imaging/ct/volume_u8.bin?url'
import meta from '../../data/imaging/ct/meta.json'
import dmeta from '../../data/imaging/dicom/meta.json'
import { linkByKey } from '../../data/links'

// Artifact 15 — slices make a volume. Step 0: the stack. Step 1: files must be sorted by position,
// not by name (real file order). Step 2: the same volume cut three ways, linked crosshairs.
// The views can be saved as a PNG and the volume as NIfTI (built in the page). clicks: 2
const { step } = useStep(2)
const buf = useBinary(volUrl)
const [Z, Y, X] = meta.volume.shape_zyx
const pos = ref<[number, number, number]>([...meta.volume.nodule_zyx] as [number, number, number])
const cA = ref<HTMLCanvasElement>(), cC = ref<HTMLCanvasElement>(), cS = ref<HTMLCanvasElement>()
const stackCv = ref<HTMLCanvasElement[]>([])
const stackZ = [20, 40, 60, 80, 100, 115]
function paint(c: HTMLCanvasElement | undefined, w: number, h: number, get: (r: number, k: number) => number) {
  if (!c) return
  const g = c.getContext('2d')!
  const img = g.createImageData(w, h)
  for (let r = 0; r < h; r++) for (let k = 0; k < w; k++) { const v = get(r, k); const i = (r * w + k) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255 }
  g.putImageData(img, 0, 0)
}
function draw() {
  if (!buf.value) return
  const v = new Uint8Array(buf.value)
  const at = (z: number, y: number, x: number) => v[(z * Y + y) * X + x]
  const [z, y, x] = pos.value
  paint(cA.value, X, Y, (r, k) => at(z, r, k))
  paint(cC.value, X, Z, (r, k) => at(Z - 1 - r, y, k))
  paint(cS.value, Y, Z, (r, k) => at(Z - 1 - r, k, x))
  stackCv.value.forEach((c, i) => paint(c, X, Y, (r, k) => at(stackZ[i], r, k)))
}
watch([buf, pos, step, cA], rafThrottle(draw), { deep: true, flush: 'post' })
const files = dmeta.ct_file_order.slice(0, 5)
const sorted = [...dmeta.ct_file_order].sort((a, b) => b.z - a.z).slice(0, 5)
const clickAxial = (e: MouseEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); pos.value = [pos.value[0], Math.floor(((e.clientY - r.top) / r.height) * Y), Math.floor(((e.clientX - r.left) / r.width) * X)] }
const pct = (v: number, n: number) => `${(v / n) * 100}%`

function save(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
// The three current views side by side, each scaled to the same height
function savePng() {
  const cs = [cA.value, cC.value, cS.value].filter(Boolean) as HTMLCanvasElement[]
  const H = 360, ws = cs.map(c => Math.round((c.width / c.height) * H)) // voxels are 2.5 mm cubes, so pixels are square
  const out = document.createElement('canvas')
  out.width = ws.reduce((a, b) => a + b, 0) + 20 * (cs.length - 1)
  out.height = H
  const g = out.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, out.width, H)
  let x = 0
  cs.forEach((c, i) => { g.drawImage(c, x, 0, ws[i], H); x += ws[i] + 20 })
  out.toBlob(b => b && save(b, `lidc-0001-views-z${pos.value[0]}.png`), 'image/png')
}
// NIfTI-1: 348-byte header + 4 bytes, then the 8-bit volume (x fastest). The scale turns 0–255 back
// into approximate Hounsfield units; 2.5 mm voxels; LPS (DICOM) to RAS (NIfTI) flips x and y.
function saveNifti() {
  if (!buf.value) return
  const s = meta.volume.spacing_mm
  const h = new DataView(new ArrayBuffer(352))
  h.setInt32(0, 348, true)
  ;[3, X, Y, Z, 1, 1, 1, 1].forEach((v, i) => h.setInt16(40 + 2 * i, v, true))
  h.setInt16(70, 2, true) // uint8
  h.setInt16(72, 8, true)
  ;[1, s, s, s, 1, 1, 1, 1].forEach((v, i) => h.setFloat32(76 + 4 * i, v, true))
  h.setFloat32(108, 352, true)
  h.setFloat32(112, (meta.volume.hu_hi - meta.volume.hu_lo) / 255, true)
  h.setFloat32(116, meta.volume.hu_lo, true)
  h.setFloat32(124, -1000, true)
  h.setFloat32(128, 600, true)
  h.setUint8(123, 2)
  const desc = 'LIDC-IDRI-0001 CT, 2.5 mm, approx. HU'
  for (let i = 0; i < desc.length; i++) h.setUint8(148 + i, desc.charCodeAt(i))
  h.setInt16(254, 1, true) // sform: scanner coordinates
  ;[[-s, 0, 0, 0], [0, -s, 0, 0], [0, 0, s, 0]].forEach((r, j) => r.forEach((v, i) => h.setFloat32(280 + 16 * j + 4 * i, v, true)))
  ;['n', '+', '1'].forEach((c, i) => h.setUint8(344 + i, c.charCodeAt(0)))
  save(new Blob([h.buffer, buf.value]), 'lidc-0001-ct-2.5mm.nii')
}
const tcia = linkByKey.get('lidc')!.url
</script>

<template>
  <div class="ve">
    <div v-if="step < 2" class="intro">
      <div class="stack">
        <canvas v-for="(z, i) in stackZ" :key="z" :ref="el => { if (el) stackCv[i] = el as HTMLCanvasElement }" :width="X" :height="Y" :style="{ transform: `translate(${i * 22}px, ${-i * 22}px)` }" />
        <p class="cap">{{ meta.slices }} slices, {{ meta.spacing_mm[2] }} mm apart</p>
      </div>
      <div class="order rv" :class="{ on: step >= 1 }">
        <table>
          <thead><tr><th>File name</th><th>Instance</th><th>Height (z, mm)</th></tr></thead>
          <tbody><tr v-for="f in files" :key="f.file"><td class="mono">{{ f.file }}</td><td>{{ f.instance }}</td><td>{{ f.z }}</td></tr></tbody>
        </table>
        <p>File names are not in body order. Sort by the <span class="mono">ImagePositionPatient</span> height instead: {{ sorted[0].z }}, {{ sorted[1].z }}, {{ sorted[2].z }} …</p>
      </div>
    </div>
    <div v-else class="mpr">
      <figure>
        <div class="v" @click="clickAxial"><canvas ref="cA" :width="X" :height="Y" /><span class="h" :style="{ top: pct(pos[1], Y) }" /><span class="vv" :style="{ left: pct(pos[2], X) }" /></div>
        <figcaption>Axial (as scanned)</figcaption>
        <input v-model.number="pos[0]" type="range" :min="0" :max="Z - 1" aria-label="Axial slice" @keydown.stop>
      </figure>
      <figure>
        <div class="v"><canvas ref="cC" :width="X" :height="Z" /><span class="h" :style="{ top: pct(Z - 1 - pos[0], Z) }" /><span class="vv" :style="{ left: pct(pos[2], X) }" /></div>
        <figcaption>Coronal (front view)</figcaption>
        <input v-model.number="pos[1]" type="range" :min="0" :max="Y - 1" aria-label="Coronal slice" @keydown.stop>
      </figure>
      <figure>
        <div class="v"><canvas ref="cS" :width="Y" :height="Z" /><span class="h" :style="{ top: pct(Z - 1 - pos[0], Z) }" /><span class="vv" :style="{ left: pct(pos[1], Y) }" /></div>
        <figcaption>Sagittal (side view)</figcaption>
        <input v-model.number="pos[2]" type="range" :min="0" :max="X - 1" aria-label="Sagittal slice" @keydown.stop>
      </figure>
      <div class="dl">
        <button class="chip" @click="savePng">Download these views (PNG)</button>
        <button class="chip" @click="saveNifti">Download the volume (NIfTI, 2.5 mm)</button>
        <a :href="tcia" target="_blank" rel="noopener">Full CT series (133 DICOM files) on TCIA ↗</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intro { display: grid; grid-template-columns: 330px 1fr; gap: 30px; align-items: center; }
.stack { position: relative; height: 330px; }
.stack canvas { position: absolute; left: 0; top: 120px; width: 170px; height: 170px; border: 1px solid #444; border-radius: 3px; box-shadow: 0 0 0 1px var(--paper); }
.cap { position: absolute; left: 0; bottom: -10px; margin: 0; font-size: var(--fs-label); max-width: 320px; }
.order table { font-size: 16px; margin-bottom: 12px; }
.order p { font-size: var(--fs-label); margin: 0; }
.mpr { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 20px; }
.dl { grid-column: 1 / -1; display: flex; gap: 10px; align-items: center; justify-content: center; font-size: 14px; }
.dl .chip { padding: 4px 11px; font-size: 14px; }
figure { margin: 0; display: flex; flex-direction: column; gap: 6px; align-items: center; }
.v { position: relative; width: 240px; height: 240px; background: var(--image-mat); border-radius: var(--radius); overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: crosshair; }
.v canvas { max-width: 100%; max-height: 100%; width: 100%; height: 100%; object-fit: contain; }
.h, .vv { position: absolute; background: #ffc400; opacity: 0.7; pointer-events: none; }
.h { left: 0; right: 0; height: 1px; }
.vv { top: 0; bottom: 0; width: 1px; }
figcaption { font-size: var(--fs-label); }
figure input { width: 220px; accent-color: var(--accent); }
</style>
