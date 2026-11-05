<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStep } from '../../composables/useStep'
import t1 from '../../data/imaging/mri/t1.png'
import t1c from '../../data/imaging/mri/t1_contrast.png'
import t2 from '../../data/imaging/mri/t2.png'
import flair from '../../data/imaging/mri/flair.png'
import ZoomPane from '../ui/ZoomPane.vue'
import outline from '../../data/imaging/mri/tumour_outline.png'
import meta from '../../data/imaging/mri/meta.json'

// Artifact 16 — one brain, four MRI sequences, registered to the same slice. Clicks step through them;
// the wipe slider compares the current sequence with the one before. "Show the tumour" draws an AI
// outline (BAMF AIMI annotations, DICOM SEG on the T1 series) of oedema, enhancing edge and dead core. clicks: 3
const { step } = useStep(3)
const SEQ = [
  { name: 'T1', src: t1, note: 'Anatomy: fat bright, fluid dark. The tumour is hard to see.' },
  { name: 'T1 + contrast', src: t1c, note: 'Leaky vessels and the tumour’s edge light up after the injection (red).' },
  { name: 'T2', src: t2, note: 'Fluid bright: the swelling around the tumour shows (yellow).' },
  { name: 'FLAIR', src: flair, note: 'T2 with normal fluid made dark, so the swelling stands out (yellow).' },
]
const cur = ref(0)
const showT = ref(false)
const R = meta.tumour.regions
const wipe = ref(100)
watch(step, s => { cur.value = s; wipe.value = 100 }, { immediate: true })
const prev = computed(() => SEQ[Math.max(0, cur.value - 1)])
</script>

<template>
  <div class="mr">
    <div class="pic">
      <ZoomPane>
        <img :src="prev.src" alt="" class="under">
        <img :src="SEQ[cur].src" :alt="`${SEQ[cur].name} MRI`" class="over" :style="{ clipPath: `inset(0 ${100 - wipe}% 0 0)` }">
        <img v-if="showT" :src="outline" alt="Tumour outline" class="outl">
      </ZoomPane>
      <span class="lab">{{ SEQ[cur].name }}</span>
    </div>
    <div class="side">
      <div class="seqs">
        <button v-for="(s, i) in SEQ" :key="s.name" class="chip" :aria-pressed="cur === i" @click="cur = i; wipe = 100">{{ s.name }}</button>
      </div>
      <p class="note">{{ SEQ[cur].note }}</p>
      <label v-if="cur > 0" class="ctl">Compare with {{ prev.name }} <input v-model.number="wipe" type="range" min="0" max="100" @keydown.stop></label>
      <div class="tum">
        <button class="chip" :aria-pressed="showT" @click="showT = !showT">{{ showT ? 'Hide' : 'Show' }} where the tumour is</button>
        <p v-if="showT" class="legend">
          <span><i :style="{ background: R.Edema.colour }" />swelling (oedema)</span>
          <span><i :style="{ background: R['Enhancing Lesion'].colour }" />active edge</span>
          <span><i :style="{ background: R.Necrosis.colour }" />dead core</span>
          <span class="muted">AI outline (AIMI), not a radiologist’s</span>
        </p>
      </div>
      <p class="muted small">Same patient, same scan session; each sequence is a separate series in the DICOM study. Image left = patient’s right.</p>
    </div>
  </div>
</template>

<style scoped>
.mr { display: grid; grid-template-columns: 270px 1fr; gap: 40px; align-items: center; }
.pic { position: relative; width: 270px; height: 360px; background: var(--image-mat); border-radius: var(--radius); overflow: hidden; }
.pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.over { transition: opacity var(--dur) var(--ease); }
.outl { image-rendering: pixelated; }
.tum { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.tum .chip { align-self: flex-start; padding: 5px 12px; font-size: 15px; }
.legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 0; font-size: 14px; }
.legend i { display: inline-block; width: 12px; height: 12px; border-radius: 2px; margin-right: 5px; vertical-align: -1px; border: 1px solid #555; }
.lab { position: absolute; left: 10px; top: 8px; color: #ffc400; font-weight: 600; font-size: var(--fs-label); }
.seqs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.note { font-size: var(--fs-label); margin: 0 0 14px; min-height: 50px; }
.small { font-size: 16px; margin-top: 14px; }
</style>
